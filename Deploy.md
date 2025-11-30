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

Data sync is handled by the workflow in `.github/workflows/sync-data.yml`.

- **Schedule**: Runs daily at midnight (UTC).
- **Manual Trigger**: You can manually trigger this workflow from the **Actions** tab in GitHub.
- **Secrets**: Requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (same as above).
