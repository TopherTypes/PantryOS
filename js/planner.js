// Meal planner helper functions

async function initMealPlanner() {
  const recipes = await getRecipes();
  const currentWeek = getMonday();
  const entries = await getMealPlan(currentWeek);
  return { recipes, currentWeek, entries };
}

function formatWeekRange(weekStart) {
  const weekDates = getWeekDates(weekStart);
  const mon = weekDates[0];
  const sun = weekDates[6];
  const monFormatted = formatDate(mon.date);
  const sunFormatted = formatDate(sun.date);
  return `${mon.day} ${monFormatted} – ${sun.day} ${sunFormatted}`;
}

async function organizeMealPlan(entries, weekDates, recipes) {
  const grid = [];
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const recipeMap = {};
  recipes.forEach(r => {
    recipeMap[r.id] = r;
  });

  weekDates.forEach((dayData, dayIdx) => {
    grid[dayIdx] = [];
    meals.forEach((meal, mealIdx) => {
      const entry = entries.find(e => e.date === dayData.date && e.mealType === meal);
      if (entry && recipeMap[entry.recipeId]) {
        grid[dayIdx][mealIdx] = {
          ...entry,
          recipeName: recipeMap[entry.recipeId].name
        };
      } else {
        grid[dayIdx][mealIdx] = null;
      }
    });
  });

  return grid;
}

function filterRecipes(recipes, searchTerm) {
  if (!searchTerm) return recipes;
  return recipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
}
