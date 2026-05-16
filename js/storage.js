// Browser storage abstraction layer using IndexedDB
// All data operations go through this module

const DB_NAME = 'PantryOS';
const DB_VERSION = 1;

const STORES = {
  ingredients: 'ingredients',
  recipes: 'recipes',
  recipeIngredients: 'recipeIngredients',
  mealPlans: 'mealPlans',
  inventory: 'inventory',
  shoppingLists: 'shoppingLists',
  shoppingListItems: 'shoppingListItems',
  spendLog: 'spendLog'
};

let db = null;

async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Ingredients store
      if (!database.objectStoreNames.contains(STORES.ingredients)) {
        const ingredientsStore = database.createObjectStore(STORES.ingredients, { keyPath: 'id' });
        ingredientsStore.createIndex('name', 'name', { unique: false });
      }

      // Recipes store
      if (!database.objectStoreNames.contains(STORES.recipes)) {
        const recipesStore = database.createObjectStore(STORES.recipes, { keyPath: 'id' });
        recipesStore.createIndex('name', 'name', { unique: false });
      }

      // Recipe Ingredients (many-to-many)
      if (!database.objectStoreNames.contains(STORES.recipeIngredients)) {
        const riStore = database.createObjectStore(STORES.recipeIngredients, { keyPath: 'id' });
        riStore.createIndex('recipeId', 'recipeId', { unique: false });
        riStore.createIndex('ingredientId', 'ingredientId', { unique: false });
      }

      // Meal Plans
      if (!database.objectStoreNames.contains(STORES.mealPlans)) {
        const mpStore = database.createObjectStore(STORES.mealPlans, { keyPath: 'id' });
        mpStore.createIndex('weekStart', 'weekStart', { unique: false });
        mpStore.createIndex('date', 'date', { unique: false });
      }

      // Inventory
      if (!database.objectStoreNames.contains(STORES.inventory)) {
        const inventoryStore = database.createObjectStore(STORES.inventory, { keyPath: 'ingredientId' });
        inventoryStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Shopping Lists
      if (!database.objectStoreNames.contains(STORES.shoppingLists)) {
        const slStore = database.createObjectStore(STORES.shoppingLists, { keyPath: 'id' });
        slStore.createIndex('weekStart', 'weekStart', { unique: false });
        slStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Shopping List Items
      if (!database.objectStoreNames.contains(STORES.shoppingListItems)) {
        const sliStore = database.createObjectStore(STORES.shoppingListItems, { keyPath: 'id' });
        sliStore.createIndex('listId', 'listId', { unique: false });
        sliStore.createIndex('ingredientId', 'ingredientId', { unique: false });
      }

      // Spend Log
      if (!database.objectStoreNames.contains(STORES.spendLog)) {
        const spendStore = database.createObjectStore(STORES.spendLog, { keyPath: 'id' });
        spendStore.createIndex('date', 'date', { unique: false });
        spendStore.createIndex('listId', 'listId', { unique: false });
      }
    };
  });
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function withTransaction(storeNames, mode = 'readonly', callback) {
  const database = await initDB();
  const transaction = database.transaction(storeNames, mode);
  return callback(transaction);
}

// Ingredients
async function getIngredients() {
  return withTransaction([STORES.ingredients], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.ingredients).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function getIngredient(id) {
  return withTransaction([STORES.ingredients], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.ingredients).get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  });
}

async function createIngredient(data) {
  const id = generateId();
  const ingredient = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await withTransaction([STORES.ingredients], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.ingredients).add(ingredient);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return ingredient;
}

async function updateIngredient(id, data) {
  const ingredient = await getIngredient(id);
  if (!ingredient) throw new Error('Ingredient not found');

  const updated = {
    ...ingredient,
    ...data,
    updatedAt: new Date().toISOString()
  };

  await withTransaction([STORES.ingredients], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.ingredients).put(updated);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return updated;
}

async function deleteIngredient(id) {
  await withTransaction([STORES.ingredients], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.ingredients).delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

// Recipes
async function getRecipes() {
  return withTransaction([STORES.recipes], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipes).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function getRecipe(id) {
  return withTransaction([STORES.recipes], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipes).get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  });
}

async function createRecipe(data) {
  const id = generateId();
  const recipe = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await withTransaction([STORES.recipes], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipes).add(recipe);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return recipe;
}

async function updateRecipe(id, data) {
  const recipe = await getRecipe(id);
  if (!recipe) throw new Error('Recipe not found');

  const updated = {
    ...recipe,
    ...data,
    updatedAt: new Date().toISOString()
  };

  await withTransaction([STORES.recipes], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipes).put(updated);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return updated;
}

async function deleteRecipe(id) {
  await withTransaction([STORES.recipes], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipes).delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

// Recipe Ingredients
async function getRecipeIngredients(recipeId) {
  return withTransaction([STORES.recipeIngredients], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const index = transaction.objectStore(STORES.recipeIngredients).index('recipeId');
      const request = index.getAll(recipeId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function addRecipeIngredient(recipeId, ingredientId, quantity, unit) {
  const id = generateId();
  const item = {
    id,
    recipeId,
    ingredientId,
    quantity,
    unit,
    createdAt: new Date().toISOString()
  };

  await withTransaction([STORES.recipeIngredients], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipeIngredients).add(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return item;
}

async function removeRecipeIngredient(id) {
  await withTransaction([STORES.recipeIngredients], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.recipeIngredients).delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

// Meal Plans
async function getMealPlan(weekStart) {
  return withTransaction([STORES.mealPlans], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const index = transaction.objectStore(STORES.mealPlans).index('weekStart');
      const request = index.getAll(weekStart);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function addMealPlanEntry(data) {
  const id = generateId();
  const entry = {
    id,
    ...data,
    createdAt: new Date().toISOString()
  };

  await withTransaction([STORES.mealPlans], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.mealPlans).add(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return entry;
}

async function removeMealPlanEntry(id) {
  await withTransaction([STORES.mealPlans], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.mealPlans).delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

// Inventory
async function getInventory() {
  return withTransaction([STORES.inventory], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.inventory).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function getInventoryItem(ingredientId) {
  return withTransaction([STORES.inventory], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.inventory).get(ingredientId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  });
}

async function updateInventory(ingredientId, quantity) {
  const current = await getInventoryItem(ingredientId);
  const item = {
    ingredientId,
    quantity,
    updatedAt: new Date().toISOString()
  };

  await withTransaction([STORES.inventory], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.inventory).put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return item;
}

async function bulkUpdateInventory(items) {
  await withTransaction([STORES.inventory], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      items.forEach(item => {
        item.updatedAt = new Date().toISOString();
        transaction.objectStore(STORES.inventory).put(item);
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  });
}

// Shopping Lists
async function getShoppingLists() {
  return withTransaction([STORES.shoppingLists], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.shoppingLists).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function getShoppingList(id) {
  return withTransaction([STORES.shoppingLists], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.shoppingLists).get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  });
}

async function createShoppingList(data) {
  const id = generateId();
  const list = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completed: false
  };

  await withTransaction([STORES.shoppingLists], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.shoppingLists).add(list);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return list;
}

async function updateShoppingList(id, data) {
  const list = await getShoppingList(id);
  if (!list) throw new Error('Shopping list not found');

  const updated = {
    ...list,
    ...data,
    updatedAt: new Date().toISOString()
  };

  await withTransaction([STORES.shoppingLists], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.shoppingLists).put(updated);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return updated;
}

// Shopping List Items
async function getShoppingListItems(listId) {
  return withTransaction([STORES.shoppingListItems], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const index = transaction.objectStore(STORES.shoppingListItems).index('listId');
      const request = index.getAll(listId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function addShoppingListItem(listId, ingredientId, quantity, unit) {
  const id = generateId();
  const item = {
    id,
    listId,
    ingredientId,
    quantity,
    unit,
    purchased: false,
    createdAt: new Date().toISOString()
  };

  await withTransaction([STORES.shoppingListItems], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.shoppingListItems).add(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return item;
}

async function updateShoppingListItem(id, data) {
  return withTransaction([STORES.shoppingListItems], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const getRequest = transaction.objectStore(STORES.shoppingListItems).get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) reject(new Error('Item not found'));

        const updated = {
          ...item,
          ...data,
          updatedAt: new Date().toISOString()
        };

        const putRequest = transaction.objectStore(STORES.shoppingListItems).put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  });
}

async function removeShoppingListItem(id) {
  await withTransaction([STORES.shoppingListItems], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.shoppingListItems).delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

// Spend Log
async function getSpendLog() {
  return withTransaction([STORES.spendLog], 'readonly', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.spendLog).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  });
}

async function createSpendEntry(data) {
  const id = generateId();
  const entry = {
    id,
    ...data,
    createdAt: new Date().toISOString()
  };

  await withTransaction([STORES.spendLog], 'readwrite', (transaction) => {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(STORES.spendLog).add(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  return entry;
}

async function getSpendSummary() {
  const entries = await getSpendLog();
  if (entries.length === 0) {
    return {
      total: 0,
      byWeek: {},
      average: 0
    };
  }

  let total = 0;
  const byWeek = {};

  entries.forEach(entry => {
    const amount = entry.amount || 0;
    total += amount;

    const date = new Date(entry.date);
    const weekStart = getMonday(date);
    byWeek[weekStart] = (byWeek[weekStart] || 0) + amount;
  });

  return {
    total,
    byWeek,
    average: total / entries.length
  };
}

// Export all functions
const Storage = {
  initDB,
  // Ingredients
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  // Recipes
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  // Recipe Ingredients
  getRecipeIngredients,
  addRecipeIngredient,
  removeRecipeIngredient,
  // Meal Plans
  getMealPlan,
  addMealPlanEntry,
  removeMealPlanEntry,
  // Inventory
  getInventory,
  getInventoryItem,
  updateInventory,
  bulkUpdateInventory,
  // Shopping Lists
  getShoppingLists,
  getShoppingList,
  createShoppingList,
  updateShoppingList,
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  removeShoppingListItem,
  // Spend
  getSpendLog,
  createSpendEntry,
  getSpendSummary
};
