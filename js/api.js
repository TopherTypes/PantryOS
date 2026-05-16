// API module — all fetch calls to Cloudflare Worker
// Set WORKER_URL before using these functions

let WORKER_URL = localStorage.getItem('worker_url') || 'https://your-worker.workers.dev';
let API_KEY = localStorage.getItem('api_key');

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
  return request('GET', '/ingredients');
}

async function getIngredient(id) {
  return request('GET', `/ingredients/${id}`);
}

async function createIngredient(data) {
  return request('POST', '/ingredients', data);
}

async function updateIngredient(id, data) {
  return request('PUT', `/ingredients/${id}`, data);
}

async function deleteIngredient(id) {
  return request('DELETE', `/ingredients/${id}`);
}

// Recipes
async function getRecipes() {
  return request('GET', '/recipes');
}

async function getRecipe(id) {
  return request('GET', `/recipes/${id}`);
}

async function createRecipe(data) {
  return request('POST', '/recipes', data);
}

async function updateRecipe(id, data) {
  return request('PUT', `/recipes/${id}`, data);
}

async function deleteRecipe(id) {
  return request('DELETE', `/recipes/${id}`);
}

// Meal Plan
async function getMealPlan(weekStart) {
  return request('GET', `/meal-plan?week=${weekStart}`);
}

async function addMealPlanEntry(data) {
  return request('POST', '/meal-plan', data);
}

async function removeMealPlanEntry(id) {
  return request('DELETE', `/meal-plan/${id}`);
}

// Inventory
async function getInventory() {
  return request('GET', '/inventory');
}

async function updateInventory(ingredientId, quantity) {
  return request('PUT', `/inventory/${ingredientId}`, { quantity });
}

async function bulkUpdateInventory(items) {
  return request('POST', '/inventory/bulk', { items });
}

// Shopping Lists
async function getShoppingLists() {
  return request('GET', '/shopping-lists');
}

async function getShoppingList(id) {
  return request('GET', `/shopping-lists/${id}`);
}

async function generateShoppingList(weekStart) {
  return request('POST', '/shopping-lists/generate', { week_start: weekStart });
}

async function updateShoppingListItem(listId, itemId, data) {
  return request('PUT', `/shopping-lists/${listId}/items/${itemId}`, data);
}

async function completeShoppingList(listId) {
  return request('PUT', `/shopping-lists/${listId}/complete`, {});
}

// Nutrition
async function getMealPlanNutrition(weekStart) {
  return request('GET', `/nutrition/meal-plan?week=${weekStart}`);
}

async function getRecipeNutrition(recipeId) {
  return request('GET', `/nutrition/recipe/${recipeId}`);
}

// Spend
async function getSpendLog() {
  return request('GET', '/spend');
}

async function createSpendEntry(data) {
  return request('POST', '/spend', data);
}

async function getSpendSummary() {
  return request('GET', '/spend/summary');
}
