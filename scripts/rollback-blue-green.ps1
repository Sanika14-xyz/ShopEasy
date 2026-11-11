$ErrorActionPreference = 'Stop'

$context = kubectl config current-context
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read the current kubectl context.'
}
if ($context.Trim() -ne 'docker-desktop') {
    throw "This demo is local-only. Switch kubectl to docker-desktop; current context is '$($context.Trim())'."
}

$namespace = 'shopeasy-release'
$activeColor = kubectl get service api -n $namespace -o 'jsonpath={.spec.selector.color}'
if ($LASTEXITCODE -ne 0 -or $activeColor -notin @('blue', 'green')) {
    throw 'Could not determine which release currently receives traffic.'
}
$rollbackColor = if ($activeColor -eq 'blue') { 'green' } else { 'blue' }

foreach ($component in @('api', 'web')) {
    kubectl scale "deployment/$component-$rollbackColor" --replicas=1 -n $namespace
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start the $rollbackColor $component deployment."
    }
    kubectl rollout status "deployment/$component-$rollbackColor" -n $namespace --timeout=180s
    if ($LASTEXITCODE -ne 0) {
        throw "The $rollbackColor $component deployment did not become ready; traffic remains on $activeColor."
    }
}

$apiSelector = '{"spec":{"selector":{"app":"api","color":"' + $rollbackColor + '"}}}'
$webSelector = '{"spec":{"selector":{"app":"web","color":"' + $rollbackColor + '"}}}'
kubectl patch service api -n $namespace --type=merge -p $apiSelector
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to switch the API service; traffic remains on the current release.'
}
kubectl patch service web -n $namespace --type=merge -p $webSelector
if ($LASTEXITCODE -ne 0) {
    $restoreSelector = '{"spec":{"selector":{"app":"api","color":"' + $activeColor + '"}}}'
    kubectl patch service api -n $namespace --type=merge -p $restoreSelector | Out-Null
    throw 'Failed to switch the web service; the API service was restored to its prior color.'
}

foreach ($component in @('api', 'web')) {
    kubectl scale "deployment/$component-$activeColor" --replicas=0 -n $namespace
}
Write-Host "Rollback succeeded. Traffic is now served by the $rollbackColor deployment."
