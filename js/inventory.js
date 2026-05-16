// Inventory helper functions
async function initializeInventory() {
  try {
    const ingredients = await Api.getIngredients();
    const currentInventory = await Api.getInventory();
    const inventoryIds = new Set(currentInventory.map(i => i.ingredientId));

    const newItems = ingredients
      .filter(ing => !inventoryIds.has(ing.id))
      .map(ing => ({
        ingredientId: ing.id,
        quantity: 0,
        updatedAt: new Date().toISOString()
      }));

    if (newItems.length > 0) {
      await Api.bulkUpdateInventory(newItems);
    }

    return await Api.getInventory();
  } catch (error) {
    console.error('Failed to initialize inventory:', error);
    throw error;
  }
}

function getInventoryWithDetails(inventoryItems, ingredients) {
  const ingredientMap = {};
  ingredients.forEach(ing => {
    ingredientMap[ing.id] = ing;
  });

  return inventoryItems.map(item => {
    const ingredient = ingredientMap[item.ingredientId];
    return {
      ...item,
      name: ingredient?.name || 'Unknown',
      unit: ingredient?.unit || 'unit',
      calories: ingredient?.calories || 0,
      protein: ingredient?.protein || 0,
      carbs: ingredient?.carbs || 0,
      fat: ingredient?.fat || 0
    };
  });
}

function filterInventoryBySearch(items, searchTerm) {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter(item => item.name.toLowerCase().includes(term));
}

function sortInventory(items, sortBy = 'name') {
  const sorted = [...items];

  if (sortBy === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'quantity') {
    sorted.sort((a, b) => b.quantity - a.quantity);
  } else if (sortBy === 'updated') {
    sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return sorted;
}

function formatLastUpdated(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB');
}
