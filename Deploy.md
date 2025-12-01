# Deployment Guide

This repository is configured for automated deployment to Fly.io and data synchronization via GitHub Actions.

## 1. Turso Database Setup

The application uses Turso (LibSQL) for the database.

1.  **Get Credentials**: Obtain your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from the Turso dashboard.
2.  **Add Secrets to GitHub**:
    - Go to **Settings** > **Secrets and variables** > **Actions**.
    - Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

## 2. Fly.io Deployment

The application is deployed to Fly.io using the workflow defined in `.github/workflows/deploy.yml`.

### Initial Setup (One-time)
1.  **Install flyctl**: [Installation Guide](https://fly.io/docs/hands-on/install-flyctl/)
2.  **Login**: `fly auth login`
3.  **Initialize App**:
    ```bash
    fly launch --no-deploy
    ```
    - Follow the prompts. Do not set up Postgres/Redis.
    - This generates `fly.toml`.
4.  **Set Secrets**:
    ```bash
    fly secrets set TURSO_DATABASE_URL=libsql://your-db.turso.io TURSO_AUTH_TOKEN=your-token
    ```
5.  **Create Deploy Token**:
    ```bash
    fly tokens create deploy
    ```
    - Copy the token.
6.  **Add Token to GitHub**:
    - Go to **Settings** > **Secrets and variables** > **Actions**.
    - Add `FLY_API_TOKEN` with the value of the deploy token.

### Deployment
- **Automated**: Push to the `main` branch. The **Fly Deploy** action will build and deploy the app.
- **Manual**: Run `fly deploy` locally.

## 3. Data Synchronization

Data sync is now triggered via an API endpoint (`POST /api/webhooks/provider-data-updates`) secured by a secret key.

### Setup `CRON_SECRET`

1.  **Generate a Secret**:
    Run this command in your terminal (Linux/Mac) to generate a secure random key:
    ```bash
    openssl rand -hex 32
    ```
2.  **Set Secret in Fly.io**:
    ```bash
    fly secrets set CRON_SECRET=your_generated_secret_here
    ```

### Triggering Sync

-   **Manual Trigger (API)**:
    ```bash
    curl -X POST https://your-app-name.fly.dev/api/webhooks/provider-data-updates \
      -H "Authorization: Bearer your_generated_secret_here"
    ```
-   **Manual Trigger (Console)**:
    SSH into your Fly app and run the script directly:
    ```bash
    fly ssh console
    npm run start:sync
    ```
