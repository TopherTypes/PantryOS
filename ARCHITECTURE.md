# PantryOS Architecture — Browser-First Design

## Overview

PantryOS has been redesigned to work **entirely with browser storage** as the primary data store, with Cloudflare as an **optional sync layer** to be added later in development.

## Storage Architecture

### Primary Storage: IndexedDB

All data is stored locally in the browser using **IndexedDB**, providing:
- **Large capacity** (tens of MB+) compared to localStorage (5-10MB)
- **Structured queries** with indices
- **Asynchronous API** for non-blocking operations
- **Works offline** - no network required for core functionality

### Data Stores

```
├── ingredients           - Recipe ingredient definitions
├── recipes             - Recipe templates
├── recipeIngredients   - Many-to-many ingredient mappings
├── mealPlans           - Weekly meal plan entries
├── inventory           - Current stock levels
├── shoppingLists       - Generated shopping lists
├── shoppingListItems   - Line items for shopping lists
└── spendLog           - Historical spend entries
```

Each store uses auto-generated unique IDs and ISO timestamps for synchronization readiness.

## Data Flow

### Current (Browser-First)
```
User Action → Alpine.js → API module → Storage module → IndexedDB
```

### Future (With Cloudflare Sync)
```
User Action → Alpine.js → API module → {Storage + Cloudflare Worker}
                              ↓
                        Both IndexedDB (local)
                        and D1 (remote sync)
```

## Key Files

| File | Purpose |
|------|---------|
| `js/storage.js` | IndexedDB abstraction layer with all CRUD operations |
| `js/api.js` | Data access wrapper - routes to Storage or Cloudflare |
| `js/utils.js` | Shared utilities for dates, nutrition, currency |
| `index.html` | App shell with navigation and page containers |
| `worker/index.js` | Cloudflare Worker (optional, for future sync) |

## Usage

### Basic Data Operations

```javascript
// All operations are async and work offline
const ingredients = await getIngredients();
const ingredient = await createIngredient({ name: 'Pasta', unit: 'g', calories: 131 });
await updateIngredient(ingredient.id, { calories: 132 });
await deleteIngredient(ingredient.id);

// Shopping lists with items
const list = await createShoppingList({ weekStart: '2024-05-20' });
await addShoppingListItem(list.id, ingredientId, 500, 'g');
```

### Data Persistence

- **Automatic:** All changes are immediately persisted to IndexedDB
- **Reliable:** IndexedDB transactions ensure consistency
- **Offline-first:** Works perfectly without network access

## Future: Cloudflare Integration

When adding Cloudflare Workers for sync/backup/sharing:

1. **Configure** in settings:
   ```javascript
   setWorkerUrl('https://your-worker.workers.dev');
   setApiKey('your-api-key');
   setSyncEnabled(true);
   ```

2. **Sync Strategy** (to be designed):
   - Bidirectional sync with conflict resolution
   - Optional automatic backup
   - Share lists with other users
   - Cloud storage as secondary copy

3. **Zero Breaking Changes:**
   - API functions will transparently use Cloudflare
   - Local storage remains the source of truth
   - Graceful degradation if sync fails

## Development Notes

- **No build step** required - plain HTML + JS
- **No external dependencies** except Tailwind CDN and Alpine.js
- **Offline-capable** from day one
- **Scalable storage** - IndexedDB can handle years of data
- **Easy testing** - no mock servers needed, use real browser storage

## Phase Roadmap

**Phase 0** - Foundation (Current)
- ✅ Browser storage infrastructure
- ✅ CRUD operations for all entities
- ⏳ UI implementation begins

**Phase 1** - Meal Planning
- Meal planner grid and navigation
- Recipe assignment to dates

**Phase 2** - Inventory
- Stock tracking interface
- Quick adjustments

**Phase 3** - Shopping Lists
- Automatic list generation
- Checklist interactions

**Phase 4** - Nutrition
- Nutrition dashboard
- Daily/weekly summaries

**Phase 5** - Spend Tracking
- Spend entry interface
- Historical trends

**Phase ∞** - Cloudflare Sync (Optional)
- Remote backup
- Multi-device sync
- User account support
