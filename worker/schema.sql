-- PantryOS D1 Database Schema

CREATE TABLE IF NOT EXISTS ingredients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  unit        TEXT NOT NULL CHECK(unit IN ('g', 'ml', 'unit')),
  calories    REAL NOT NULL DEFAULT 0,
  protein     REAL NOT NULL DEFAULT 0,
  carbs       REAL NOT NULL DEFAULT 0,
  fat         REAL NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recipes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT,
  servings     INTEGER NOT NULL DEFAULT 1,
  prep_mins    INTEGER DEFAULT 0,
  cook_mins    INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id     INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  quantity      REAL NOT NULL,
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS meal_plan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start  TEXT NOT NULL,
  day         TEXT NOT NULL CHECK(day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  slot        TEXT NOT NULL CHECK(slot IN ('breakfast','lunch','dinner','snack')),
  recipe_id   INTEGER NOT NULL REFERENCES recipes(id),
  servings    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS inventory (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL UNIQUE REFERENCES ingredients(id),
  quantity      REAL NOT NULL DEFAULT 0,
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start  TEXT NOT NULL,
  generated_at TEXT DEFAULT (datetime('now')),
  status      TEXT DEFAULT 'active' CHECK(status IN ('active','completed'))
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shopping_list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id    INTEGER NOT NULL REFERENCES ingredients(id),
  quantity_needed  REAL NOT NULL,
  quantity_in_stock REAL NOT NULL,
  quantity_to_buy  REAL NOT NULL,
  estimated_cost   REAL,
  checked          INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS spend_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shopping_list_id INTEGER REFERENCES shopping_lists(id),
  amount           REAL NOT NULL,
  store            TEXT,
  date             TEXT DEFAULT (datetime('now')),
  notes            TEXT
);
