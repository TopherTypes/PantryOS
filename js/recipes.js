// Recipe helper functions
async function getRecipesWithIngredients() {
  try {
    const recipes = await Api.getRecipes();
    const ingredients = await Api.getIngredients();

    const ingredientMap = {};
    ingredients.forEach(ing => {
      ingredientMap[ing.id] = ing;
    });

    const recipeDetails = await Promise.all(
      recipes.map(async (recipe) => {
        const recipeIngredients = await Api.getRecipeIngredients(recipe.id);
        return {
          ...recipe,
          ingredients: recipeIngredients.map(ri => ({
            ...ri,
            ingredientName: ingredientMap[ri.ingredientId]?.name || 'Unknown'
          }))
        };
      })
    );

    return recipeDetails;
  } catch (error) {
    console.error('Failed to get recipes with ingredients:', error);
    throw error;
  }
}

function filterRecipes(recipes, searchTerm) {
  if (!searchTerm) return recipes;
  const term = searchTerm.toLowerCase();
  return recipes.filter(recipe => recipe.name.toLowerCase().includes(term));
}

function calculateRecipeNutrition(recipeIngredients) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  recipeIngredients.forEach(ri => {
    const ing = ri; // Assume ingredient data is included
    if (ing.calories) calories += (ing.calories * ri.quantity) / 100;
    if (ing.protein) protein += (ing.protein * ri.quantity) / 100;
    if (ing.carbs) carbs += (ing.carbs * ri.quantity) / 100;
    if (ing.fat) fat += (ing.fat * ri.quantity) / 100;
  });

  return {
    calories: Math.round(calories),
    protein: protein.toFixed(1),
    carbs: carbs.toFixed(1),
    fat: fat.toFixed(1)
  };
}

async function createRecipeWithIngredients(recipeData, ingredientsData) {
  try {
    const recipe = await Api.createRecipe(recipeData);

    for (const ing of ingredientsData) {
      await Api.addRecipeIngredient(recipe.id, ing.ingredientId, ing.quantity, ing.unit);
    }

    return recipe;
  } catch (error) {
    console.error('Failed to create recipe with ingredients:', error);
    throw error;
  }
}

async function updateRecipeWithIngredients(recipeId, recipeData, ingredientsData) {
  try {
    await Api.updateRecipe(recipeId, recipeData);

    // Remove old ingredients
    const oldIngredients = await Api.getRecipeIngredients(recipeId);
    for (const ing of oldIngredients) {
      await Api.removeRecipeIngredient(ing.id);
    }

    // Add new ingredients
    for (const ing of ingredientsData) {
      await Api.addRecipeIngredient(recipeId, ing.ingredientId, ing.quantity, ing.unit);
    }
  } catch (error) {
    console.error('Failed to update recipe with ingredients:', error);
    throw error;
  }
}

function formatServings(servings) {
  return servings || 1;
}

function formatPrepTime(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
