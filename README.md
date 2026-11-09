# ShopEasy DevOps Case Study

A small MERN-style e-commerce demo for practicing version control, automated tests, CI, containerization, and deployment. The catalog is stored in MongoDB; the React page displays products and provides a browser-only demo cart (no checkout or payments).

## What is included

- React + Vite storefront with a separate welcome page and searchable catalog, product details, cart, About, Contact, and FAQ pages; Express + MongoDB API
- Jest/Supertest API tests that do not need a running database
- Dockerfiles and Docker Compose for the app and MongoDB
- GitHub Actions workflow for pull requests and pushes to `main`
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
2. **Continuous integration:** `.github/workflows/ci.yml` installs from the lockfile, runs API tests, builds the storefront, then starts the Docker Compose app and runs a Selenium browser test on pushes and pull requests. The browser test checks searching for a product and adding it to the bag. This is an automated integration test against a fresh local container stack; it is not yet a staging-cluster test.
3. **Quality analysis:** connect a SonarQube Cloud project, update `sonar-project.properties` with your organization and project key, add the repository variable `SONAR_ENABLED` with value `true`, and add `SONAR_TOKEN` and `SONAR_HOST_URL` as repository Actions secrets.
4. **Containerization and registry:** `api/Dockerfile`, `web/Dockerfile`, and `docker-compose.yml` package and run the app consistently. After CI passes on a push to `main`, the workflow publishes API and web images to GitHub Container Registry (GHCR), tagged `latest` and with the commit SHA. GHCR login uses the automatically provided `GITHUB_TOKEN`; no registry password is committed.
5. **Current deployment:** Docker Compose starts the app locally. This is a live local demo, not yet a public website or an EKS deployment.
6. **Next case-study milestones:** deploy the published image to staging Kubernetes; add Selenium browser tests against staging; require approval before production; demonstrate blue-green rollout; then add monitoring/logging/Slack alerts. EKS and these extra services can incur costs, so set them up only with your teacher's approval and a budget. Do not commit cloud credentials; use GitHub Actions secrets and scoped cloud identity.

### What to demonstrate

1. Make a small change on a feature branch, push it, and open a pull request.
2. Show that GitHub Actions runs API tests, builds the frontend, and runs the Selenium shopping-flow test. To make GitHub block merging when a check fails, enable branch protection for `main` and require the workflow checks.
3. Merge the pull request to `main`, then show the workflow publishing the API and web container images in the repository's **Packages** tab.
4. Run the application locally with Docker Compose and show the storefront.
5. Explain that automated checks catch errors earlier, while image publishing makes the tested version ready for a later staging deployment.

The GitHub workflow runs only after this folder is pushed to a GitHub repository. To view or download GHCR images, sign in to GitHub and open the repository's **Packages** tab. Package visibility and access are controlled in GitHub's package settings.

The Search page matches product names, categories, and descriptions. If a search has no matches, shoppers can use the Contact page to ask about the item; the request is prefilled in the demo form. The cart supports quantity updates and item removal, but is currently held in browser memory and clears on refresh. The contact form is a UI demo and does not send or store messages. The local Docker Compose deployment is the first safe, repeatable deployment target. EKS, Selenium, Prometheus/Grafana, ELK, and Slack require extra cloud accounts or services and are intentionally follow-up milestones rather than hidden prerequisites.
