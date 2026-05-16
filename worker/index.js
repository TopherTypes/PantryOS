export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Auth middleware
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.API_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route dispatcher
    try {
      if (path.startsWith('/ingredients')) {
        return handleIngredients(request, env, path, method);
      } else if (path.startsWith('/recipes')) {
        return handleRecipes(request, env, path, method);
      } else if (path.startsWith('/meal-plan')) {
        return handleMealPlan(request, env, path, method);
      } else if (path.startsWith('/inventory')) {
        return handleInventory(request, env, path, method);
      } else if (path.startsWith('/shopping-lists')) {
        return handleShoppingLists(request, env, path, method);
      } else if (path.startsWith('/nutrition')) {
        return handleNutrition(request, env, path, method);
      } else if (path.startsWith('/spend')) {
        return handleSpend(request, env, path, method);
      } else {
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Route handlers (stubs for Phase 0)

async function handleIngredients(request, env, path, method) {
  const { DB } = env;
  const segments = path.split('/').filter(Boolean);
  const id = segments[1];

  if (method === 'GET') {
    if (id) {
      const ingredient = await DB.prepare('SELECT * FROM ingredients WHERE id = ?').bind(id).first();
      return jsonResponse(ingredient || { error: 'Not Found' }, ingredient ? 200 : 404);
    } else {
      const ingredients = await DB.prepare('SELECT * FROM ingredients ORDER BY name').all();
      return jsonResponse(ingredients.results || []);
    }
  } else if (method === 'POST') {
    const body = await request.json();
    const { name, unit, calories, protein, carbs, fat } = body;
    if (!name || !unit) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }
    const result = await DB.prepare(
      'INSERT INTO ingredients (name, unit, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, unit, calories || 0, protein || 0, carbs || 0, fat || 0).run();
    return jsonResponse({ id: result.meta.last_row_id, name, unit }, 201);
  } else if (method === 'PUT' && id) {
    const body = await request.json();
    const { name, unit, calories, protein, carbs, fat } = body;
    await DB.prepare(
      'UPDATE ingredients SET name = ?, unit = ?, calories = ?, protein = ?, carbs = ?, fat = ? WHERE id = ?'
    ).bind(name, unit, calories, protein, carbs, fat, id).run();
    return jsonResponse({ success: true });
  } else if (method === 'DELETE' && id) {
    await DB.prepare('DELETE FROM ingredients WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Method Not Allowed' }, 405);
}

async function handleRecipes(request, env, path, method) {
  return jsonResponse({ error: 'Not Implemented' }, 501);
}

async function handleMealPlan(request, env, path, method) {
  return jsonResponse({ error: 'Not Implemented' }, 501);
}

async function handleInventory(request, env, path, method) {
  return jsonResponse({ error: 'Not Implemented' }, 501);
}

async function handleShoppingLists(request, env, path, method) {
  return jsonResponse({ error: 'Not Implemented' }, 501);
}

async function handleNutrition(request, env, path, method) {
  return jsonResponse({ error: 'Not Implemented' }, 501);
}

async function handleSpend(request, env, path, method) {
  return jsonResponse({ error: 'Not Implemented' }, 501);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
