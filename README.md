# SwipeGiftCard

SwipeGiftCard is a Progressive Web App (PWA) designed to help users explore and manage gift cards from various providers (TCN, Ultimate). It features an offline-first architecture, data synchronization, and a modern, responsive UI.

## Features

- **Offline-First**: Built with TanStack DB and LocalStorage to work without an internet connection.
- **Data Sync**: Synchronize gift card data from the server to your local device.
- **Multi-Source Support**: Aggregates cards from TCN and Ultimate, handling brand normalization.
- **Modern UI**: Clean, grid-based layout with Dark Mode support (Tailwind CSS v4).

## Setup Instructions

Follow these steps to set up the project locally.

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Local Database
This command initializes the local SQLite database, pushes the schema, and loads the initial data from `data/tcn.json`.
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
  - **`api/sync/`**: Endpoint for serving data to the client.
  - **`brand/[brandName]/`**: Dynamic route for brand details.
  - **`cards/`**: List of all gift cards.
  - **`sync/`**: Client-side data synchronization page.
- **`src/lib/`**: Shared utilities and components.
  - **`client-db.ts`**: Client-side TanStack DB configuration.
  - **`db/`**: Server-side Drizzle ORM configuration and schema.
- **`scripts/`**: Utility scripts.
  - **`sync-data.ts`**: Script to parse raw data and populate the server-side database.
- **`data/`**: Raw data files (e.g., `tcn.json`).

## Deployment

For deployment instructions, including setting up secrets and deploying to Fly.io, please refer to [DEPLOY.md](./DEPLOY.md).
