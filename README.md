# SwipeGiftCard

SwipeGiftCard is a Progressive Web App (PWA) designed to help users explore and manage gift cards from various providers (TCN, Ultimate). It features an offline-first architecture, data synchronization, and a modern, responsive UI.

## Features

- **Offline-First**: Built with TanStack DB and LocalStorage to work without an internet connection (Service Worker included).
- **Data Sync**: Two-tier sync architecture:
    - **Server Sync**: Fetches data from providers (TCN, Ultimate) via API webhook.
    - **Client Sync**: Synchronizes server database to local device for offline access.
- **Multi-Source Support**: Aggregates cards from TCN and Ultimate, handling brand normalization.
- **Modern UI**: Clean, grid-based layout with Dark Mode support (Tailwind CSS v4).

## Setup Instructions

Follow these steps to set up the project locally.

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Local Database
This command initializes the local SQLite database, pushes the schema, and runs the sync script.
```bash
npm run db:setup
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Code Structure

- **`src/routes/`**: Application pages and API endpoints.
  - **`api/sync/`**: Endpoint for serving data to the client (Server -> Client).
  - **`api/webhooks/provider-data-updates/`**: Secure endpoint for triggering provider sync (Provider -> Server).
  - **`brand/[brandName]/`**: Dynamic route for brand details.
  - **`cards/`**: List of all gift cards.
  - **`sync/`**: Client-side data synchronization page.
- **`src/lib/`**: Shared utilities and components.
  - **`client-db.ts`**: Client-side TanStack DB configuration.
  - **`db/`**: Server-side Drizzle ORM configuration and schema.
  - **`sync/`**: Core sync logic (`fetchers.ts`, `db-ops.ts`).
- **`scripts/`**: Utility scripts.
  - **`sync-data-v2.ts`**: Main script to orchestrate provider data synchronization.
- **`data/`**: Raw data files (e.g., `tcn.json`).

## Deployment

For deployment instructions, including setting up secrets and deploying to Fly.io, please refer to [DEPLOY.md](./DEPLOY.md).
