# GitHub Copilot Instructions

This file provides context about the project to help GitHub Copilot generate more accurate and relevant code.

## Project Overview

- **Name**: swipegiftcard
- **Type**: SvelteKit Web Application
- **Language**: TypeScript
- **Package Manager**: npm (Version 11.6.1)

## Tech Stack

- **Framework**: SvelteKit (v2)
- **UI Library**: Svelte (v5) - *Prefer Svelte 5 syntax (Runes) where applicable.*
- **Styling**: Tailwind CSS (v4)
- **Build Tool**: Vite (v7)
- **Database**:
  - Drizzle ORM
  - SQLite (Better SQLite3 / LibSQL)
- **Runtime**: Node.js (via `@sveltejs/adapter-node`)

## Key Conventions

- **Svelte 5**: Use Runes (`$state`, `$derived`, `$effect`, etc.) for reactivity.
- **Tailwind v4**: Use the new v4 configuration and features.
- **TypeScript**: Ensure strict type safety.
- **Imports**: Use `$lib` alias for imports from `src/lib`.

## Deployment

- **Platform**: Fly.io
- **Configuration**: `fly.toml`
- **Containerization**: Docker (via `@flydotio/dockerfile`)

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run check`: Run svelte-check
- `npm run db:push`: Push database schema changes
- `npm run db:sync`: Sync database data
