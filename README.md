# ShopEasy DevOps Case Study

A small MERN-style e-commerce demo for practicing version control, automated tests, CI, containerization, and deployment. The catalog is stored in MongoDB; the React page displays products and provides a browser-only demo cart (no checkout or payments).

## What is included

- React + Vite storefront with a separate welcome page and searchable catalog, product details, cart, About, Contact, and FAQ pages; Express + MongoDB API
- Jest/Supertest API tests that do not need a running database; Prometheus request metrics at `/api/metrics`
- Dockerfiles and Docker Compose for the app and MongoDB
- Jenkins pipeline for local Windows-agent CI using Docker Desktop
- Local Prometheus and Grafana monitoring with a preconfigured ShopEasy dashboard
- GitHub Actions workflow for pull requests and pushes to `main`; its browser-test stack pins MongoDB 7 for compatibility with the hosted runner kernel, without changing the local or Kubernetes database
- Selenium browser test in CI that searches the catalog and adds a product to the bag
- Optional SonarQube Cloud analysis when its GitHub secrets are configured

## Step 1: Install the tools on Windows

Install Node.js 22 LTS, Git, and Docker Desktop. Start Docker Desktop and wait for it to say that the engine is running. In PowerShell, check:

```powershell
node --version
npm --version
git --version
docker --version
docker compose version
```

Docker Desktop is required for the full local deployment because it supplies MongoDB as well as the app containers.

## Step 2: Install and verify the project

Open PowerShell in this project folder:

```powershell
npm ci
npm test
npm run build
```

The tests and frontend build can run without Docker or MongoDB.

## Step 3: Run the complete app

Build and start the three containers:

```powershell
docker compose up --build
```

Compose starts MongoDB, waits for its health check, then starts the API and storefront. The first run downloads container images and can take a few minutes. Keep this PowerShell window open. In a second PowerShell window, seed the sample catalog:

```powershell
docker compose exec api npm run seed --workspace=@shopeasy/api
```

Then open <http://localhost:8080> and refresh the page to see the 54 sample products. Seeding adds or updates these sample products by name and keeps other catalog items.

To stop the app, press `Ctrl+C`, then run:

```powershell
docker compose down
```

To also delete the local MongoDB data and start fresh, use `docker compose down -v`.

### Optional: add local monitoring to Docker Compose

Start the app together with Prometheus and Grafana (no cloud account required):

```powershell
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up --build --detach --wait --wait-timeout 180
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml exec api npm run seed --workspace=@shopeasy/api
```

Open the storefront at <http://localhost:8080>, Prometheus at <http://localhost:9090/targets>, and Grafana at <http://localhost:3000>. Sign in to Grafana with `admin` / `admin` and set a new password if prompted. The **ShopEasy API** dashboard shows request rate, 95th-percentile latency, server errors, and API process memory. Browse or search products to generate traffic. Prometheus evaluates a `ShopEasyAPIHighServerErrorRate` alert when the API returns more than 6 server errors per minute for at least 1 minute; view its state at <http://localhost:9090/alerts>. By default, the alert is visible in Prometheus only. To deliver alerts to Slack:

1. Follow Slack's [Incoming Webhooks setup](https://api.slack.com/messaging/webhooks) to create a webhook for the channel where you want notifications.
2. Save the webhook URL in a local secret file. Replace the placeholder with your actual URL; never paste the URL into chat or commit it. The `.secrets` folder is ignored by Git.

   ```powershell
   New-Item -ItemType Directory -Force .secrets | Out-Null
   $webhook = Read-Host "Paste the Slack webhook URL" -AsSecureString
   $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($webhook)
   try {
       $plainText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
       [IO.File]::WriteAllText((Join-Path $PWD ".secrets\slack_webhook_url"), $plainText)
   } finally {
       [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
       $webhook.Dispose()
       $plainText = $null
   }
   ```

3. Start the optional Alertmanager service alongside the monitoring stack:

   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.monitoring.yml -f docker-compose.slack.yml up --detach --wait --wait-timeout 180
   ```

Open Alertmanager at <http://localhost:9093> to check its status. Prometheus sends firing and resolved notifications to the Slack channel selected when you created the webhook. Monitoring ports are bound to your own computer only.

### Optional: collect local app logs with ELK

The ELK stack is a resource-intensive local demo. Keep Docker Desktop's memory limit in mind; do not run it alongside local Kubernetes, and stop Prometheus/Grafana first if Docker Desktop runs low on memory. Filebeat needs access to the local Docker socket to discover only ShopEasy API and web logs; use this only with your own trusted development Docker daemon, never on a shared or production host. It indexes those logs locally in Elasticsearch:

```powershell
docker compose -f docker-compose.yml -f docker-compose.logging.yml --profile logging up -d
```

Open Kibana at <http://localhost:5601>. In **Stack Management → Data Views**, create a data view named `shopeasy-*` and choose `@timestamp` as its time field, then open **Discover**. Browse the storefront and API to generate logs. Elasticsearch is only bound to localhost and has security disabled for this local-only demo; do not expose these ports to the internet.

Stop the ELK containers without deleting indexed data:

```powershell
docker compose -f docker-compose.yml -f docker-compose.logging.yml --profile logging down
```

The Elasticsearch index is stored in its own named volume. Do not add `-v` to the command above: that would also delete the ShopEasy MongoDB data and other Compose volumes.

Stop the stack without deleting its stored data:

```powershell
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down
```

If you started the optional Slack integration, include its Compose file when stopping the stack:

```powershell
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml -f docker-compose.slack.yml down
```

## Step 4: Try Kubernetes locally (no cloud account or charges)

The `k8s` folder contains a local Kubernetes deployment for Docker Desktop. It runs MongoDB, the API, the storefront, and a one-time job that seeds the 54 sample products. This is a learning setup, not a production security configuration.

1. In Docker Desktop, open **Settings → Kubernetes** and enable Kubernetes. Wait until the Kubernetes engine reports that it is running.
2. In PowerShell, check that Docker Desktop is the selected cluster:

   ```powershell
   kubectl config get-contexts
   kubectl config use-context docker-desktop
   kubectl get nodes
   ```

3. Stop the Compose containers temporarily so the local Kubernetes demo has enough resources. This keeps the Compose database volume; it does not delete it:

   ```powershell
   docker compose stop
   ```

4. Build the local images and apply the Kubernetes configuration:

   ```powershell
   docker compose build api web
   kubectl apply -k k8s/
   kubectl rollout status deployment/mongo -n shopeasy --timeout=180s
   kubectl rollout status deployment/api -n shopeasy --timeout=180s
   kubectl rollout status deployment/web -n shopeasy --timeout=180s
   kubectl wait --for=condition=complete job/seed-products -n shopeasy --timeout=180s
   ```

5. Open another PowerShell terminal and forward the storefront to your computer:

   ```powershell
   kubectl port-forward service/web 8081:80 -n shopeasy
   ```

   Keep that terminal open and visit <http://localhost:8081>. To return to the Docker Compose app later, stop the port-forward with `Ctrl+C`, then run `docker compose start` and visit <http://localhost:8080>.

   To run the Selenium shopping-flow test against Kubernetes, open another terminal while the port-forward is running:

   ```powershell
   $env:SHOPEASY_BASE_URL = "http://localhost:8081"
   npm run test:e2e
   ```

   Chrome must be installed. The first run may take longer while Selenium downloads the matching ChromeDriver.

### Demonstrate a local blue-green release

This blue-green demo is guarded to run only against Docker Desktop Kubernetes. It reuses the MongoDB deployment and persistent volume in the `shopeasy` namespace, deploys the candidate version to the inactive color, runs the Selenium shopping-flow test against a preview service, and switches production-style service selectors only after the test passes. The previous color's immutable image tags are kept for rollback. It does not create cloud resources.

1. Stop the Docker Compose app to free resources without deleting its MongoDB volume:

   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down
   ```

2. Ensure Docker Desktop Kubernetes is running, the `docker-desktop` context is selected, and the base Kubernetes manifests and sample product seed job have already been applied.
3. Run the release script from the repository root:

   ```powershell
   .\scripts\deploy-blue-green.ps1
   ```

   The script builds and tags the current images, starts MongoDB, deploys the inactive color, checks health, runs Selenium against the preview, and switches traffic only on success. It scales down the previous color after the switch to conserve local resources.

4. To view the local release, forward the active web service:

   ```powershell
   kubectl port-forward service/web 8082:80 -n shopeasy-release
   ```

   Then open <http://localhost:8082>. To switch back to the previous color:

   ```powershell
   .\scripts\rollback-blue-green.ps1
   ```

This is a local demonstration, not an EKS deployment or a protected production release. The GitHub production approval gate and EKS staging pipeline still require an existing cluster, AWS identity configuration, and an approved budget.

### Add Prometheus and Grafana to local Kubernetes

The Kubernetes manifests also deploy Prometheus and Grafana in the `shopeasy` namespace. They use internal cluster services; access their web pages with local port forwarding:

1. Apply the updated manifests and wait for the monitoring pods:

   ```powershell
   kubectl apply -k k8s/
   kubectl rollout status deployment/prometheus -n shopeasy --timeout=180s
   kubectl rollout status deployment/alertmanager -n shopeasy --timeout=180s
   kubectl rollout status deployment/grafana -n shopeasy --timeout=180s
   kubectl get pods -n shopeasy
   ```

2. In separate PowerShell terminals, forward the dashboards:

   ```powershell
   kubectl port-forward service/prometheus 9090:9090 -n shopeasy
   ```

   ```powershell
   kubectl port-forward service/grafana 3000:3000 -n shopeasy
   ```

3. Open Prometheus at <http://localhost:9090/targets> and confirm `shopeasy-api` is **UP**. Open Grafana at <http://localhost:3000>, sign in with `admin` / `admin`, and open the **ShopEasy API** dashboard. Browse or search the storefront to generate request metrics. Slack notifications are currently supported by the optional Docker Compose setup above. Press `Ctrl+C` in each port-forward terminal when finished.

The monitoring data in this local Kubernetes setup is temporary and resets if its pods are recreated. Prometheus and Grafana use additional computer memory, so avoid running the Compose and Kubernetes stacks together on a low-memory computer.

Use `kubectl get pods,services -n shopeasy` to see the running resources. To stop the local Kubernetes demo and remove its namespace and database volume, run `kubectl delete namespace shopeasy`. This does not affect the separate Docker Compose database.

If you rebuild the API image and want to run the seed job again, delete the completed job first, then re-apply it:

```powershell
kubectl delete job seed-products -n shopeasy
kubectl apply -k k8s/
kubectl wait --for=condition=complete job/seed-products -n shopeasy --timeout=180s
```

## Step 5: Push this project to GitHub and watch CI

This project is connected to `https://github.com/Sanika14-xyz/ShopEasy.git`. Its GitHub repository already had an initial README commit, so the two histories must be merged once. After resolving that merge, push the combined project:

```powershell
git add README.md
git commit -m "Merge GitHub README history"
git push -u origin main
```

GitHub Actions runs the tests and frontend build on the push. You can then create a feature branch, make a small change, push it, and open a pull request to see the same checks run before merging.

## CI/CD learning map

1. **Version control:** use a feature branch and pull request so changes are reviewed before they reach `main`.
2. **Continuous integration:** `.github/workflows/ci.yml` runs on GitHub Actions. The root `Jenkinsfile` provides the same local build/test workflow using a Windows Jenkins agent with Docker Desktop. Both run API tests, build the storefront, build isolated Docker images, start a fresh test stack, seed the catalog, and run the Selenium shopping-flow test. These are automated tests against a local test stack, not a staging-cluster test.
3. **Quality analysis:** connect a SonarQube Cloud project, update `sonar-project.properties` with your organization and project key, add the repository variable `SONAR_ENABLED` with value `true`, and add `SONAR_TOKEN` and `SONAR_HOST_URL` as repository Actions secrets.
4. **Containerization and registry:** `api/Dockerfile`, `web/Dockerfile`, and `docker-compose.yml` package and run the app consistently. After CI passes on a push to `main`, the workflow publishes API and web images to GitHub Container Registry (GHCR), tagged `latest` and with the commit SHA. GHCR login uses the automatically provided `GITHUB_TOKEN`; no registry password is committed.
5. **Current deployment:** Docker Compose starts the app locally. This is a live local demo, not yet a public website or an EKS deployment.
6. **Remaining cloud case-study milestones:** deploy the published image to staging Kubernetes; add Selenium browser tests against staging; require approval before production; and demonstrate blue-green rollout. These require an existing Kubernetes cluster and protected GitHub environments; EKS can incur ongoing charges, so do not create cloud resources without your teacher's approval and a budget. Do not commit cloud credentials; use GitHub Actions secrets and scoped cloud identity.

### Set up the Jenkins pipeline

The root `Jenkinsfile` is designed for a Windows Jenkins agent that can run Docker Desktop. Jenkins and GitHub Actions remain separate CI examples: Jenkins polls the configured branch every five minutes, while GitHub Actions runs on pushes and pull requests and publishes images to GHCR after merges to `main`.

1. Install Jenkins LTS on your computer and install the **Pipeline**, **Git**, and **PowerShell** plugins. Use the Java version required by the Jenkins installer.
2. Make a Windows agent available with the label `windows-docker`. Install Git, Node.js 22, npm, Docker Desktop with Docker Compose, and Chrome on that agent. Run the agent under a Windows account that can access the local Docker Desktop engine. Do not expose Jenkins or its build agent to the public internet for this classroom demo.
3. In Jenkins, select **New Item → Pipeline**. Under **Pipeline**, choose **Pipeline script from SCM**, select **Git**, and enter:
   - Repository URL: `https://github.com/Sanika14-xyz/ShopEasy.git`
   - Branch specifier: `*/main`
   - Script path: `Jenkinsfile`
4. Save the job and select **Build Now**. The first run may take time to download Docker images and Selenium's matching ChromeDriver. Jenkins uses a unique project name, build-specific image tags, and port `18080`; it does not stop or reuse the normal ShopEasy Compose stack.
5. Review the stages in **Console Output**: checkout, tool checks, API tests, web build, Docker image build, catalog seed, and Selenium shopping-flow test.

The Jenkins pipeline builds images locally only. GHCR publishing stays in GitHub Actions; Docker Hub/ECR credentials and cloud deployment are not configured in Jenkins.

### What to demonstrate

1. Make a small change on a feature branch, push it, and open a pull request.
2. Show the Jenkins Pipeline job configured in the setup section above. Jenkins checks the repository every five minutes and uses isolated Compose resources and port `18080`.
3. Show the Jenkins build as well as GitHub Actions running API tests, building the frontend and Docker images, and passing the Selenium shopping-flow test. Jenkins builds build-number-tagged local images; it does not push to a registry or deploy to the cloud.
4. Merge the pull request to `main`, then show the GitHub Actions workflow publishing the API and web container images in the repository's **Packages** tab. To make GitHub block merging when a check fails, enable branch protection for `main` and require the workflow checks.
5. Run the application locally with Docker Compose and show the storefront.
6. Show the Prometheus alert and Grafana dashboard, then optionally collect application logs through the local ELK setup and route alert notifications to Slack.
7. Explain that automated checks catch errors earlier, while image publishing makes the tested version ready for a later staging deployment.

The GitHub workflow runs only after this folder is pushed to a GitHub repository. To view or download GHCR images, sign in to GitHub and open the repository's **Packages** tab. Package visibility and access are controlled in GitHub's package settings.

The Search page matches product names, categories, and descriptions. If a search has no matches, shoppers can use the Contact page to ask about the item; the request is prefilled in the demo form. The cart supports quantity updates and item removal, but is currently held in browser memory and clears on refresh. The contact form is a UI demo and does not send or store messages. The local Docker Compose deployment is the first safe, repeatable deployment target. Prometheus/Grafana, optional local ELK logging, and Slack notification wiring are available without cloud infrastructure; Slack still requires a private Incoming Webhook. EKS deployment and staging tests remain optional follow-up milestones until a cluster and budget are approved.
