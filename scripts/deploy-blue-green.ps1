$ErrorActionPreference = 'Stop'

$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repositoryRoot

$context = kubectl config current-context
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the current kubectl context.'
}
if ($context.Trim() -ne 'docker-desktop') {
    throw "This demo is local-only. Switch kubectl to docker-desktop; current context is '$($context.Trim())'."
}

$namespace = 'shopeasy-release'
$mongoNamespace = 'shopeasy'

docker compose build api web
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to build the ShopEasy API and web images.'
}

$gitRevision = git rev-parse --short HEAD
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to determine the source revision for the release image tags.'
}
$releaseTag = "$($gitRevision.Trim())-$(Get-Date -Format 'yyyyMMddHHmmss')"
docker tag shopeasy-api:latest "shopeasy-api:$releaseTag"
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to create an immutable API image tag.'
}
docker tag shopeasy-web:latest "shopeasy-web:$releaseTag"
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to create an immutable web image tag.'
}

$mongo = kubectl get deployment mongo -n $mongoNamespace -o name
if ($LASTEXITCODE -ne 0 -or -not $mongo) {
    throw "MongoDB deployment was not found in namespace '$mongoNamespace'. Apply the base Kubernetes manifests first."
}

kubectl scale deployment/mongo --replicas=1 -n $mongoNamespace
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to start the local MongoDB deployment.'
}
kubectl rollout status deployment/mongo -n $mongoNamespace --timeout=180s
if ($LASTEXITCODE -ne 0) {
    throw 'MongoDB did not become ready.'
}

kubectl get service api -n $namespace -o name *> $null
if ($LASTEXITCODE -ne 0) {
    kubectl apply -k k8s/blue-green/
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to apply the local blue-green Kubernetes manifests.'
    }
}

foreach ($deployment in @('api', 'web')) {
    kubectl get deployment $deployment -n $mongoNamespace -o name *> $null
    if ($LASTEXITCODE -eq 0) {
        kubectl scale "deployment/$deployment" --replicas=0 -n $mongoNamespace
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to scale down the default Kubernetes $deployment deployment."
        }
    }
}

$activeColor = kubectl get service api -n $namespace -o 'jsonpath={.spec.selector.color}'
if ($LASTEXITCODE -ne 0 -or $activeColor -notin @('blue', 'green')) {
    throw 'Could not determine whether blue or green currently receives traffic.'
}
$targetColor = if ($activeColor -eq 'blue') { 'green' } else { 'blue' }

kubectl set image "deployment/api-$targetColor" "api=shopeasy-api:$releaseTag" -n $namespace
if ($LASTEXITCODE -ne 0) {
    throw "Failed to update the $targetColor API deployment."
}
kubectl scale "deployment/api-$targetColor" --replicas=1 -n $namespace
if ($LASTEXITCODE -ne 0) {
    throw "Failed to start the $targetColor API deployment."
}
kubectl rollout status "deployment/api-$targetColor" -n $namespace --timeout=180s
if ($LASTEXITCODE -ne 0) {
    throw "The $targetColor API deployment did not become ready; existing traffic remains on $activeColor."
}

kubectl set image "deployment/web-$targetColor" "web=shopeasy-web:$releaseTag" -n $namespace
if ($LASTEXITCODE -ne 0) {
    throw "Failed to update the $targetColor web deployment."
}
kubectl scale "deployment/web-$targetColor" --replicas=1 -n $namespace
if ($LASTEXITCODE -ne 0) {
    throw "Failed to start the $targetColor web deployment."
}
kubectl rollout status "deployment/web-$targetColor" -n $namespace --timeout=180s
if ($LASTEXITCODE -ne 0) {
    throw "The $targetColor web deployment did not become ready; existing traffic remains on $activeColor."
}

$previewSelector = '{"spec":{"selector":{"app":"web","color":"' + $targetColor + '"}}}'
kubectl patch service web-preview -n $namespace --type=merge -p $previewSelector
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to point the preview service at the candidate release.'
}

$portForward = Start-Process -FilePath 'kubectl' -ArgumentList @(
    'port-forward',
    'service/web-preview',
    '8082:80',
    '--address=127.0.0.1',
    '-n',
    $namespace
) -PassThru -WindowStyle Hidden
$previousBaseUrl = $env:SHOPEASY_BASE_URL

try {
    $previewReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($portForward.HasExited) {
            throw 'The preview port-forward stopped unexpectedly.'
        }
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8082/api/health' -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $previewReady = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if (-not $previewReady) {
        throw 'The candidate release did not respond to its health check; existing traffic remains unchanged.'
    }

    $env:SHOPEASY_BASE_URL = 'http://127.0.0.1:8082'
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) {
        throw "The Selenium test failed; existing traffic remains on $activeColor."
    }
} finally {
    if ($null -eq $previousBaseUrl) {
        Remove-Item Env:\SHOPEASY_BASE_URL -ErrorAction SilentlyContinue
    } else {
        $env:SHOPEASY_BASE_URL = $previousBaseUrl
    }
    if (-not $portForward.HasExited) {
        Stop-Process -Id $portForward.Id -Force
    }
}

$apiSelector = '{"spec":{"selector":{"app":"api","color":"' + $targetColor + '"}}}'
$webSelector = '{"spec":{"selector":{"app":"web","color":"' + $targetColor + '"}}}'
kubectl patch service api -n $namespace --type=merge -p $apiSelector
if ($LASTEXITCODE -ne 0) {
    throw 'The candidate passed its tests, but switching the API service failed. Existing API traffic remains unchanged.'
}
kubectl patch service web -n $namespace --type=merge -p $webSelector
if ($LASTEXITCODE -ne 0) {
    $rollbackSelector = '{"spec":{"selector":{"app":"api","color":"' + $activeColor + '"}}}'
    kubectl patch service api -n $namespace --type=merge -p $rollbackSelector | Out-Null
    throw 'Switching the web service failed; the API service was switched back to the previous color.'
}

kubectl scale "deployment/api-$activeColor" --replicas=0 -n $namespace
kubectl scale "deployment/web-$activeColor" --replicas=0 -n $namespace
Write-Host "Release succeeded. Traffic is now served by the $targetColor deployment."
