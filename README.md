# PantryOS — Meal Planner

A single-user meal planning, inventory management, shopping list generation, and spend tracking app.

## Architecture

- **Frontend:** HTML + CSS + Alpine.js (no build step)
- **Hosting:** GitHub Pages
- **Backend API:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** Single-user static API key

See `SPEC.md` for the complete product specification and phase roadmap.

## Setup Instructions

### 1. Cloudflare Worker Setup

#### Create the Worker
```bash
npm install -g wrangler
wrangler login
wrangler init pantryos-worker
```

#### Configure `wrangler.toml`
```toml
name = "pantryos-worker"
main = "worker/index.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { API_SECRET = "your-secret-key-here" }

[[d1_databases]]
binding = "DB"
database_name = "pantryos"
database_id = "your-db-id"
```

#### Create D1 Database
```bash
wrangler d1 create pantryos
```

This will output your database ID — add it to `wrangler.toml`.

#### Apply Schema
```bash
wrangler d1 execute pantryos --file=worker/schema.sql --remote
```

#### Deploy Worker
```bash
wrangler deploy --env production
```

Copy your worker URL (e.g., `https://pantryos-worker.your-account.workers.dev`) — you'll use this on the frontend.

### 2. GitHub Pages Setup

1. Ensure `main` branch exists and contains this repository
2. In GitHub repo settings → Pages:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (root directory)
   - **Save**

The app will be live at `https://your-username.github.io/pantryos` (or your custom domain).

### 3. Frontend Configuration

When you visit the app, you'll see a setup screen asking for your API secret. This is the `API_SECRET` you set in the Cloudflare Worker environment.

You can also set the Worker URL in the settings menu if it's different from the default.

## Development

### Local Testing

1. **Worker locally:**
   ```bash
   cd worker
   wrangler dev
   ```
   This runs the Worker on `http://localhost:8787`.

2. **Frontend locally:**
   ```bash
   python -m http.server 8000
   ```
   Visit `http://localhost:8000` and configure the Worker URL to `http://localhost:8787`.

3. **Update D1 schema during development:**
   ```bash
   wrangler d1 execute pantryos --file=worker/schema.sql --local
   ```

### Project Structure
- `index.html` — App shell with navigation
- `pages/` — Feature pages (future)
- `css/app.css` — Custom styles
- `js/api.js` — All API calls to the Worker
- `js/utils.js` — Shared utilities
- `worker/` — Cloudflare Worker code
  - `index.js` — Route handlers
  - `schema.sql` — D1 database schema

## Phases

**Phase 0** — Foundation (MVP)
- D1 schema ✓
- Worker scaffolded ✓
- GitHub Pages live ✓
- Ingredients CRUD (API only)

**Phase 1** — Meal Planning
- Weekly meal plan grid
- Recipe assignment
- Week navigation

**Phase 2** — Inventory
- Stock tracking
- Quick adjustments

**Phase 3** — Shopping Lists
- List generation
- Checklist view
- Spend logging

**Phase 4** — Nutrition
- Nutrition dashboard
- Daily/weekly totals

**Phase 5** — Spend Tracking
- Historical trends
- Cost per meal

See `SPEC.md` for full details.

## API Reference

All endpoints require `X-API-Key` header with your API secret.

Base URL: `https://your-worker.workers.dev`

### Ingredients
- `GET /ingredients` — List all
- `POST /ingredients` — Create
- `PUT /ingredients/:id` — Update
- `DELETE /ingredients/:id` — Delete

### Recipes, Meal Plan, Inventory, Shopping Lists, Nutrition, Spend
See `SPEC.md` for full endpoint reference.

## Environment Variables

**Cloudflare Worker** (`wrangler.toml`):
- `API_SECRET` — Static key for API authentication

**Frontend** (localStorage):
- `api_key` — API secret (entered on setup screen)
- `worker_url` — Worker URL (configurable in settings)

## Contributing

This is an MVP build. See `SPEC.md` for the development roadmap and conventions.
