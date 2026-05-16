# PantryOS — Meal Planner Spec

> Single-user meal planning, inventory management, shopping list generation, spend tracking, and nutrition calculation.
> Ground truth document for iterative Claude Code development.

---

## Guiding Principles

- **Meal plan is the centre of the universe.** Everything else — inventory, shopping, nutrition — serves it.
- **No build step, ever.** All libraries via CDN. Merge to main = deployed.
- **Mobile for doing, desktop for planning.** Responsive layouts, not separate apps.
- **Friction once, smooth forever.** Manual data entry upfront pays off in automation later.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Raw HTML + CSS + JS | No frameworks, no bundler |
| Reactivity | Alpine.js (CDN) | State and DOM binding without build |
| Styling | Tailwind Play CDN | Utility classes, responsive breakpoints |
| Hosting | GitHub Pages | Merge to `main` = deploy |
| API | Cloudflare Workers | REST endpoints, JWT auth |
| Database | Cloudflare D1 | SQLite-compatible relational DB |
| Auth | Single-user token | Static secret header on all API calls |

### Auth Pattern

A single `API_SECRET` environment variable set in the Cloudflare Worker. The frontend sends this as a header with every request:

```
X-API-Key: <secret>
```

No login screen. Secret stored in browser `localStorage` on first visit, entered once via a simple setup screen.

---

## File Structure

```
/
├── index.html              # App shell, navigation
├── pages/
│   ├── planner.html        # Weekly meal plan (desktop-primary)
│   ├── recipes.html        # Recipe library CRUD
│   ├── ingredients.html    # Ingredient library CRUD
│   ├── inventory.html      # Current kitchen stock (mobile-primary)
│   ├── shopping.html       # Generated shopping list (mobile-primary)
│   ├── nutrition.html      # Nutrition dashboard
│   └── spend.html          # Spend tracking dashboard
├── css/
│   └── app.css             # Custom styles beyond Tailwind
├── js/
│   ├── api.js              # All fetch calls to Workers API
│   ├── planner.js          # Meal plan logic
│   ├── shopping.js         # Shopping list generation (diff logic)
│   ├── nutrition.js        # Nutrition rollup calculations
│   └── utils.js            # Shared helpers
└── worker/
    ├── index.js            # Cloudflare Worker entry point
    └── schema.sql          # D1 database schema
```

---

## Data Model

### `ingredients`
The atomic unit. Nutritional values per 100g (or per unit for countable items).

```sql
CREATE TABLE ingredients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  unit        TEXT NOT NULL CHECK(unit IN ('g', 'ml', 'unit')),
  calories    REAL NOT NULL DEFAULT 0,  -- per 100g or per unit
  protein     REAL NOT NULL DEFAULT 0,
  carbs       REAL NOT NULL DEFAULT 0,
  fat         REAL NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);
```

### `recipes`
A named dish with metadata.

```sql
CREATE TABLE recipes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT,
  servings     INTEGER NOT NULL DEFAULT 1,
  prep_mins    INTEGER DEFAULT 0,
  cook_mins    INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);
```

### `recipe_ingredients`
Join table: what and how much of each ingredient a recipe needs.

```sql
CREATE TABLE recipe_ingredients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id     INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  quantity      REAL NOT NULL,  -- in ingredient's native unit
  notes         TEXT            -- e.g. "finely chopped"
);
```

### `meal_plan`
Assigns a recipe to a specific day and meal slot in a given week.

```sql
CREATE TABLE meal_plan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start  TEXT NOT NULL,  -- ISO date of Monday, e.g. "2026-05-18"
  day         TEXT NOT NULL CHECK(day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  slot        TEXT NOT NULL CHECK(slot IN ('breakfast','lunch','dinner','snack')),
  recipe_id   INTEGER NOT NULL REFERENCES recipes(id),
  servings    INTEGER NOT NULL DEFAULT 1
);
```

### `inventory`
Current stock of each ingredient.

```sql
CREATE TABLE inventory (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL UNIQUE REFERENCES ingredients(id),
  quantity      REAL NOT NULL DEFAULT 0,
  updated_at    TEXT DEFAULT (datetime('now'))
);
```

### `shopping_lists`
A generated shopping list tied to a specific week.

```sql
CREATE TABLE shopping_lists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start  TEXT NOT NULL,
  generated_at TEXT DEFAULT (datetime('now')),
  status      TEXT DEFAULT 'active' CHECK(status IN ('active','completed'))
);
```

### `shopping_list_items`
Individual line items on a shopping list.

```sql
CREATE TABLE shopping_list_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shopping_list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id    INTEGER NOT NULL REFERENCES ingredients(id),
  quantity_needed  REAL NOT NULL,   -- from meal plan total
  quantity_in_stock REAL NOT NULL,  -- from inventory at generation time
  quantity_to_buy  REAL NOT NULL,   -- needed - in_stock (floored at 0)
  estimated_cost   REAL,            -- optional, entered manually
  checked          INTEGER DEFAULT 0  -- 0 = unchecked, 1 = checked in-store
);
```

### `spend_log`
Records actual spend when a shopping list is completed.

```sql
CREATE TABLE spend_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shopping_list_id INTEGER REFERENCES shopping_lists(id),
  amount           REAL NOT NULL,
  store            TEXT,
  date             TEXT DEFAULT (datetime('now')),
  notes            TEXT
);
```

---

## API Endpoints (Cloudflare Worker)

All requests require `X-API-Key` header. Base URL: `https://<your-worker>.workers.dev`

### Ingredients
| Method | Path | Description |
|---|---|---|
| GET | `/ingredients` | List all ingredients |
| POST | `/ingredients` | Create ingredient |
| PUT | `/ingredients/:id` | Update ingredient |
| DELETE | `/ingredients/:id` | Delete ingredient |

### Recipes
| Method | Path | Description |
|---|---|---|
| GET | `/recipes` | List all recipes (with ingredients joined) |
| GET | `/recipes/:id` | Single recipe with full ingredient detail |
| POST | `/recipes` | Create recipe (with ingredients array) |
| PUT | `/recipes/:id` | Update recipe and ingredients |
| DELETE | `/recipes/:id` | Delete recipe |

### Meal Plan
| Method | Path | Description |
|---|---|---|
| GET | `/meal-plan?week=2026-05-18` | Get full week plan |
| POST | `/meal-plan` | Add a meal to a slot |
| DELETE | `/meal-plan/:id` | Remove a meal from a slot |

### Inventory
| Method | Path | Description |
|---|---|---|
| GET | `/inventory` | List all inventory items |
| PUT | `/inventory/:ingredient_id` | Set quantity for an ingredient |
| POST | `/inventory/bulk` | Update multiple items at once |

### Shopping Lists
| Method | Path | Description |
|---|---|---|
| GET | `/shopping-lists` | List all shopping lists |
| POST | `/shopping-lists/generate` | Generate list from meal plan + inventory diff for a week |
| GET | `/shopping-lists/:id` | Get list with all items |
| PUT | `/shopping-lists/:id/items/:item_id` | Toggle checked / update quantity |
| PUT | `/shopping-lists/:id/complete` | Mark list complete, trigger spend log prompt |

### Spend
| Method | Path | Description |
|---|---|---|
| GET | `/spend` | All spend log entries |
| POST | `/spend` | Log a spend entry |
| GET | `/spend/summary` | Weekly/monthly totals |

### Nutrition
> Calculated server-side from recipe_ingredients × ingredient macros.

| Method | Path | Description |
|---|---|---|
| GET | `/nutrition/meal-plan?week=2026-05-18` | Full week nutrition breakdown |
| GET | `/nutrition/recipe/:id` | Per-recipe nutrition |

---

## Shopping List Generation Logic

When `POST /shopping-lists/generate` is called for a given week:

1. Pull all `meal_plan` entries for the week
2. For each entry, pull `recipe_ingredients` × `servings`
3. Aggregate total quantity needed per ingredient across the whole week
4. Pull current `inventory` quantities
5. For each ingredient: `to_buy = max(0, needed - in_stock)`
6. Write results to `shopping_list_items`
7. Return the generated list

This is the core value of the app. The diff logic lives server-side in the Worker.

---

## Nutrition Calculation Logic

For a recipe:
- Per ingredient: `(quantity / 100) × nutrient_per_100g` (for g/ml units)
- For `unit` ingredients: `quantity × nutrient_per_unit`
- Sum across all ingredients = recipe totals
- Divide by `servings` = per serving

For a day: sum all recipe nutrition values for that day's meal plan entries (× servings).
For a week: sum all days.

All calculated server-side at the `/nutrition` endpoints. No client-side nutrition logic.

---

## Phase Roadmap

### Phase 0 — Foundation ✦ MVP Start
**Goal:** Data in, data retrievable. Nothing breaks.

- D1 schema applied
- Worker scaffolded with auth middleware
- GitHub Pages serving a single `index.html` with navigation shell
- `/ingredients` CRUD (desktop form + list view)
- `/recipes` CRUD including ingredient association
- Basic mobile-responsive layout

**Done when:** You can create an ingredient, build a recipe from it, and retrieve both via the API.

---

### Phase 1 — Meal Planning
**Goal:** Assign recipes to a week. See the plan.

- Weekly planner view (desktop-primary)
  - 7-column grid, 4 meal slots per day
  - Assign recipe to any slot
  - Remove / reassign meals
- Mobile view: vertical day-by-day list
- Week navigation (previous / next week)

**Done when:** You can plan a full week of meals and navigate between weeks.

---

### Phase 2 — Inventory
**Goal:** Track what's in the kitchen.

- Ingredient inventory list (mobile-primary)
  - Current quantity per ingredient
  - Quick increment/decrement controls
  - Bulk update on restock
- Desktop: full table with edit-in-place

**Done when:** You can update stock levels from your phone.

---

### Phase 3 — Shopping List
**Goal:** Generate what to buy, check it off in-store.

- Generate shopping list for a given week
- Mobile-optimised checklist view
  - Large tap targets
  - Swipe/tap to check off items
  - Quantities and estimated costs
- Mark list complete → prompt for actual spend entry

**Done when:** You can generate a list and use it in Lidl.

---

### Phase 4 — Nutrition
**Goal:** Know what you're eating.

- Per-recipe nutrition card (calories, protein, carbs, fat)
- Daily totals on planner view
- Weekly nutrition summary page
- Visual indicators against targets (configurable daily calorie/macro targets)

**Done when:** Weekly plan shows total calories and macros at a glance.

---

### Phase 5 — Spend Tracking
**Goal:** Know what you're spending.

- Spend log entries linked to shopping lists
- Weekly spend total
- Monthly spend dashboard
- Cost per meal calculation (total spend ÷ meals in plan)
- Historical spend chart

**Done when:** You can see spend trends over time and cost per meal.

---

### Phase 6+ — Future Enhancements (Backlog)
- Open Food Facts API integration for ingredient nutrition autofill
- Barcode scanning for inventory updates (mobile camera)
- Recipe scaling (adjust servings dynamically)
- Meal plan templates (save and reuse a week)
- Export shopping list to plain text / share link

---

## Responsive Layout Strategy

### Breakpoints (Tailwind defaults)
- `< 768px` — mobile layout (shopping, inventory, day-view planner)
- `≥ 768px` — desktop layout (full week planner, recipe editor, dashboards)

### Navigation
- **Mobile:** bottom tab bar (5 icons: Plan, Recipes, Inventory, Shop, Track)
- **Desktop:** left sidebar with full labels

### Primary screen ownership
| Screen | Primary device |
|---|---|
| Weekly planner | Desktop |
| Recipe editor | Desktop |
| Ingredient library | Desktop |
| Nutrition dashboard | Desktop |
| Inventory | Mobile |
| Shopping list | Mobile |
| Spend logging | Mobile |

---

## Development Conventions (for Claude Code)

- All API calls centralised in `js/api.js` — no fetch calls elsewhere
- `api.js` exports named async functions: `getRecipes()`, `createIngredient(data)`, etc.
- Worker routes follow REST conventions strictly — no custom verbs
- D1 queries use prepared statements only — no string interpolation
- Errors return `{ error: "message" }` with appropriate HTTP status
- All dates stored as ISO strings (`YYYY-MM-DD`)
- Week always anchored to Monday (`week_start`)
- No soft deletes — hard deletes only (CASCADE handles orphans)

---

## First Commit Checklist

- [ ] `SPEC.md` (this file) in repo root
- [ ] `worker/schema.sql` with all table definitions
- [ ] `worker/index.js` scaffolded with auth middleware and empty route handlers
- [ ] `index.html` with navigation shell (links only, no content yet)
- [ ] GitHub Pages enabled on `main` branch
- [ ] Cloudflare Worker deployed with D1 binding
- [ ] `README.md` with setup instructions (Worker env vars, D1 setup, Pages config)
