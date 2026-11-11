pipeline {
  agent {
    label 'windows-docker'
  }

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  triggers {
    pollSCM('H/5 * * * *')
  }

  environment {
    SHOPEASY_COMPOSE_PROJECT = "shopeasy-jenkins-${BUILD_NUMBER}"
    SHOPEASY_IMAGE_TAG = "jenkins-${BUILD_NUMBER}"
    SHOPEASY_WEB_PORT = '18080'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Check build tools') {
      steps {
        powershell '''
          $ErrorActionPreference = 'Stop'
          foreach ($name in @('git', 'node', 'npm', 'docker')) {
            if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
              throw "Required build tool '$name' was not found on the Jenkins agent PATH."
            }
          }
          node --version
          npm --version
          git --version
          docker compose version
          if ($LASTEXITCODE -ne 0) {
            throw 'Docker Compose is not available on the Jenkins agent.'
          }
          docker info *> $null
          if ($LASTEXITCODE -ne 0) {
            throw 'The Jenkins agent cannot connect to the Docker Desktop engine.'
          }
        '''
      }
    }

    stage('Install, test, and build') {
      steps {
        powershell '''
          $ErrorActionPreference = 'Stop'
          npm ci
          if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
          npm test
          if ($LASTEXITCODE -ne 0) { throw 'The API tests failed.' }
          npm run build
          if ($LASTEXITCODE -ne 0) { throw 'The web production build failed.' }
        '''
      }
    }

    stage('Build Docker images and test the app') {
      steps {
        powershell '''
          $ErrorActionPreference = 'Stop'
          $composeArgs = @(
            'compose',
            '-p', $env:SHOPEASY_COMPOSE_PROJECT,
            '-f', 'docker-compose.yml',
            '-f', 'docker-compose.ci.yml',
            '-f', 'docker-compose.jenkins.yml'
          )
          try {
            & docker @composeArgs up --build --detach --wait --wait-timeout 180
            if ($LASTEXITCODE -ne 0) { throw 'The application containers did not become healthy.' }

            & docker @composeArgs exec --no-TTY api npm run seed --workspace=@shopeasy/api
            if ($LASTEXITCODE -ne 0) { throw 'The sample catalog could not be seeded.' }

            $env:SHOPEASY_BASE_URL = "http://localhost:$env:SHOPEASY_WEB_PORT"
            npm run test:e2e
            if ($LASTEXITCODE -ne 0) { throw 'The Selenium shopping-flow test failed.' }
          } finally {
            & docker @composeArgs down
            if ($LASTEXITCODE -ne 0) {
              Write-Warning 'Compose cleanup did not complete; stop the shopeasy-jenkins project in Docker Desktop.'
            }
          }
        '''
      }
    }
  }
}
