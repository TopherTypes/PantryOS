// API module — abstracts storage operations
// Primary: Browser storage (IndexedDB) — always available, no network required
// Future: Cloudflare Workers for sync/backup/sharing (optional, phase TBD)

let SYNC_ENABLED = localStorage.getItem('sync_enabled') === 'true';
let WORKER_URL = localStorage.getItem('worker_url');
let API_KEY = localStorage.getItem('api_key');

function setSyncEnabled(enabled) {
  SYNC_ENABLED = enabled;
  localStorage.setItem('sync_enabled', enabled ? 'true' : 'false');
}

function setWorkerUrl(url) {
  WORKER_URL = url;
  localStorage.setItem('worker_url', url);
}

function setApiKey(key) {
  API_KEY = key;
  localStorage.setItem('api_key', key);
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };
}

async function request(method, path, body = null) {
  if (!SYNC_ENABLED || !WORKER_URL || !API_KEY) {
    throw new Error('Cloudflare sync not configured');
  }

  const url = `${WORKER_URL}${path}`;
  const options = {
    method,
    headers: headers()
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

// Ingredients
async function getIngredients() {
  return Storage.getIngredients();
}

async function getIngredient(id) {
  return Storage.getIngredient(id);
}

async function createIngredient(data) {
  return Storage.createIngredient(data);
}

async function updateIngredient(id, data) {
  return Storage.updateIngredient(id, data);
}

async function deleteIngredient(id) {
  return Storage.deleteIngredient(id);
}

// Recipes
async function getRecipes() {
  return Storage.getRecipes();
}

async function getRecipe(id) {
  return Storage.getRecipe(id);
}

async function createRecipe(data) {
  return Storage.createRecipe(data);
}

async function updateRecipe(id, data) {
  return Storage.updateRecipe(id, data);
}

async function deleteRecipe(id) {
  return Storage.deleteRecipe(id);
}

async function getRecipeIngredients(recipeId) {
  return Storage.getRecipeIngredients(recipeId);
}

async function addRecipeIngredient(recipeId, ingredientId, quantity, unit) {
  return Storage.addRecipeIngredient(recipeId, ingredientId, quantity, unit);
}

async function removeRecipeIngredient(id) {
  return Storage.removeRecipeIngredient(id);
}

// Meal Plan
async function getMealPlan(weekStart) {
  return Storage.getMealPlan(weekStart);
}

async function addMealPlanEntry(data) {
  return Storage.addMealPlanEntry(data);
}

async function removeMealPlanEntry(id) {
  return Storage.removeMealPlanEntry(id);
}

// Inventory
async function getInventory() {
  return Storage.getInventory();
}

async function updateInventory(ingredientId, quantity) {
  return Storage.updateInventory(ingredientId, quantity);
}

async function bulkUpdateInventory(items) {
  return Storage.bulkUpdateInventory(items);
}

// Shopping Lists
async function getShoppingLists() {
  return Storage.getShoppingLists();
}

async function getShoppingList(id) {
  return Storage.getShoppingList(id);
}

async function createShoppingList(data) {
  return Storage.createShoppingList(data);
}

async function updateShoppingList(id, data) {
  return Storage.updateShoppingList(id, data);
}

async function getShoppingListItems(listId) {
  return Storage.getShoppingListItems(listId);
}

async function addShoppingListItem(listId, ingredientId, quantity, unit) {
  return Storage.addShoppingListItem(listId, ingredientId, quantity, unit);
}

async function updateShoppingListItem(itemId, data) {
  return Storage.updateShoppingListItem(itemId, data);
}

async function removeShoppingListItem(itemId) {
  return Storage.removeShoppingListItem(itemId);
}

// Spend
async function getSpendLog() {
  return Storage.getSpendLog();
}

async function createSpendEntry(data) {
  return Storage.createSpendEntry(data);
}

async function getSpendSummary() {
  return Storage.getSpendSummary();
}
