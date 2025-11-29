# Deployment Guide

This guide covers how to configure secrets, set up GitHub Actions for data synchronization, and deploy the application to Fly.io.

## 1. Turso Configuration

The application requires the following environment variables to connect to your Turso database.

### Required Secrets
- `TURSO_DATABASE_URL`: The connection URL for your Turso database (e.g., `libsql://your-db-name.turso.io`).
- `TURSO_AUTH_TOKEN`: The authentication token for your Turso database.

### Setting up Secrets in GitHub
1. Go to your GitHub repository.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

---

## 2. GitHub Actions: Data Sync

To automatically sync data from TCN and Ultimate to your Turso database, you can use a GitHub Action.

### Create Workflow File
Create a file at `.github/workflows/sync-data.yml`:

```yaml
name: Sync Data to Turso

on:
  schedule:
    - cron: '0 0 * * *' # Run daily at midnight
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Sync Script
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
        run: npx tsx scripts/sync-data.ts
```

---

## 3. Deploy to Fly.io

This section describes how to deploy the SvelteKit application to Fly.io.

### Prerequisites
- Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
- Sign up/login to Fly.io (`fly auth login`).

### Initial Setup
1. Initialize the app:
   ```bash
   fly launch
   ```
   - Choose a name (e.g., `swipegiftcard`).
   - Choose a region.
   - **Do not** set up a Postgres or Redis database (we use Turso).

2. This will generate a `fly.toml` file. Ensure it looks something like this:

   ```toml
   app = "swipegiftcard"
   primary_region = "syd"

   [build]
     [build.args]
       NODE_VERSION = "20"

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[vm]]
     size = "shared-cpu-1x"
   ```

### Setting Secrets in Fly.io
You need to set the Turso secrets in Fly.io so the app can connect to the database at runtime.

```bash
fly secrets set TURSO_DATABASE_URL=libsql://your-db.turso.io TURSO_AUTH_TOKEN=your-token
```

### GitHub Actions: Deploy to Fly.io
To automate deployment on push to `main`, create a file at `.github/workflows/deploy.yml`.

**Note**: You need to get a Fly API Token (`fly tokens create deploy`) and add it as a GitHub Secret named `FLY_API_TOKEN`.

```yaml
name: Fly Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Deploy app
    runs-on: ubuntu-latest
    concurrency: deploy-group    # optional: ensure only one action runs at a time
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Dockerfile
Since we are using SvelteKit with Node adapter, Fly.io should automatically detect it. However, creating a `Dockerfile` ensures consistency.

```dockerfile
# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.10.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "build" ]
```
