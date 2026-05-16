export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };

    // Handle preflight requests FIRST, before auth
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Auth middleware (now comes after OPTIONS)
    const apiKey = request.headers.get('X-API-Key');
    console.log('API Key received:', apiKey);
    console.log('API Secret in env:', env.API_SECRET ? 'SET' : 'NOT SET');
    if (!apiKey || apiKey !== env.API_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route dispatcher
    try {
      if (path.startsWith('/ingredients')) {
        return handleIngredients(request, env, path, method, corsHeaders);
      } else if (path.startsWith('/recipes')) {
        return handleRecipes(request, env, path, method, corsHeaders);
      } else if (path.startsWith('/meal-plan')) {
        return handleMealPlan(request, env, path, method, corsHeaders);
      } else if (path.startsWith('/inventory')) {
        return handleInventory(request, env, path, method, corsHeaders);
      } else if (path.startsWith('/shopping-lists')) {
        return handleShoppingLists(request, env, path, method, corsHeaders);
      } else if (path.startsWith('/nutrition')) {
        return handleNutrition(request, env, path, method, corsHeaders);
      } else if (path.startsWith('/spend')) {
        return handleSpend(request, env, path, method, corsHeaders);
      } else {
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Route handlers (stubs for Phase 0)

async function handleIngredients(request, env, path, method, corsHeaders) {
  const { DB } = env;
  const segments = path.split('/').filter(Boolean);
  const id = segments[1];

  if (method === 'GET') {
    if (id) {
      const ingredient = await DB.prepare('SELECT * FROM ingredients WHERE id = ?').bind(id).first();
      return jsonResponse(ingredient || { error: 'Not Found' }, ingredient ? 200 : 404, corsHeaders);
    } else {
      const ingredients = await DB.prepare('SELECT * FROM ingredients ORDER BY name').all();
      return jsonResponse(ingredients.results || [], 200, corsHeaders);
    }
  } else if (method === 'POST') {
    const body = await request.json();
    const { name, unit, calories, protein, carbs, fat } = body;
    if (!name || !unit) {
      return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
    }
    const result = await DB.prepare(
      'INSERT INTO ingredients (name, unit, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, unit, calories || 0, protein || 0, carbs || 0, fat || 0).run();
    return jsonResponse({ id: result.meta.last_row_id, name, unit }, 201, corsHeaders);
  } else if (method === 'PUT' && id) {
    const body = await request.json();
    const { name, unit, calories, protein, carbs, fat } = body;
    await DB.prepare(
      'UPDATE ingredients SET name = ?, unit = ?, calories = ?, protein = ?, carbs = ?, fat = ? WHERE id = ?'
    ).bind(name, unit, calories, protein, carbs, fat, id).run();
    return jsonResponse({ success: true }, 200, corsHeaders);
  } else if (method === 'DELETE' && id) {
    await DB.prepare('DELETE FROM ingredients WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true }, 200, corsHeaders);
  }

  return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
}

async function handleRecipes(request, env, path, method, corsHeaders) {
  const { DB } = env;
  const segments = path.split('/').filter(Boolean);
  const recipeId = segments[1];
  const ingredientId = segments[3];

  if (method === 'GET') {
    if (recipeId && segments[2] === 'ingredients') {
      // GET /recipes/:id/ingredients
      const ingredients = await DB.prepare(`
        SELECT ri.id, ri.recipe_id, ri.ingredient_id, ri.quantity, ri.notes,
               i.name, i.unit, i.calories, i.protein, i.carbs, i.fat
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?
        ORDER BY i.name
      `).bind(recipeId).all();
      return jsonResponse(ingredients.results || [], 200, corsHeaders);
    } else if (recipeId) {
      // GET /recipes/:id
      const recipe = await DB.prepare('SELECT * FROM recipes WHERE id = ?').bind(recipeId).first();
      return jsonResponse(recipe || { error: 'Not Found' }, recipe ? 200 : 404, corsHeaders);
    } else {
      // GET /recipes
      const recipes = await DB.prepare('SELECT * FROM recipes ORDER BY name').all();
      return jsonResponse(recipes.results || [], 200, corsHeaders);
    }
  } else if (method === 'POST') {
    if (recipeId && segments[2] === 'ingredients') {
      // POST /recipes/:id/ingredients
      const body = await request.json();
      const { ingredient_id, quantity, notes } = body;
      if (!ingredient_id || quantity === undefined) {
        return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
      }
      const result = await DB.prepare(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, notes) VALUES (?, ?, ?, ?)'
      ).bind(recipeId, ingredient_id, quantity, notes || null).run();
      return jsonResponse({ id: result.meta.last_row_id, recipe_id: recipeId, ingredient_id, quantity }, 201, corsHeaders);
    } else {
      // POST /recipes
      const body = await request.json();
      const { name, description, servings, prep_mins, cook_mins } = body;
      if (!name) {
        return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
      }
      const result = await DB.prepare(
        'INSERT INTO recipes (name, description, servings, prep_mins, cook_mins) VALUES (?, ?, ?, ?, ?)'
      ).bind(name, description || null, servings || 1, prep_mins || 0, cook_mins || 0).run();
      return jsonResponse({ id: result.meta.last_row_id, name }, 201, corsHeaders);
    }
  } else if (method === 'PUT') {
    if (recipeId) {
      // PUT /recipes/:id
      const body = await request.json();
      const { name, description, servings, prep_mins, cook_mins } = body;
      await DB.prepare(
        'UPDATE recipes SET name = ?, description = ?, servings = ?, prep_mins = ?, cook_mins = ? WHERE id = ?'
      ).bind(name, description, servings, prep_mins, cook_mins, recipeId).run();
      return jsonResponse({ success: true }, 200, corsHeaders);
    }
  } else if (method === 'DELETE') {
    if (recipeId && segments[2] === 'ingredients' && ingredientId) {
      // DELETE /recipes/:id/ingredients/:ingredient_id
      await DB.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ? AND ingredient_id = ?')
        .bind(recipeId, ingredientId).run();
      return jsonResponse({ success: true }, 200, corsHeaders);
    } else if (recipeId) {
      // DELETE /recipes/:id - cascade to recipe_ingredients handled by schema ON DELETE CASCADE
      await DB.prepare('DELETE FROM recipes WHERE id = ?').bind(recipeId).run();
      return jsonResponse({ success: true }, 200, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
}

async function handleMealPlan(request, env, path, method, corsHeaders) {
  return jsonResponse({ error: 'Not Implemented' }, 501, corsHeaders);
}

async function handleInventory(request, env, path, method, corsHeaders) {
  return jsonResponse({ error: 'Not Implemented' }, 501, corsHeaders);
}

async function handleShoppingLists(request, env, path, method, corsHeaders) {
  return jsonResponse({ error: 'Not Implemented' }, 501, corsHeaders);
}

async function handleNutrition(request, env, path, method, corsHeaders) {
  return jsonResponse({ error: 'Not Implemented' }, 501, corsHeaders);
}

async function handleSpend(request, env, path, method, corsHeaders) {
  return jsonResponse({ error: 'Not Implemented' }, 501, corsHeaders);
}

function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
