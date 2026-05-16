// Shared utility functions

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekDates(weekStart) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [];
  const start = new Date(weekStart + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push({
      day: days[i],
      date: d.toISOString().split('T')[0]
    });
  }
  return dates;
}

function formatNutrition(nutrition) {
  return {
    calories: Math.round(nutrition.calories || 0),
    protein: (nutrition.protein || 0).toFixed(1),
    carbs: (nutrition.carbs || 0).toFixed(1),
    fat: (nutrition.fat || 0).toFixed(1)
  };
}

function calculateNutritionForRecipe(ingredients, servings = 1) {
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  ingredients.forEach(item => {
    const ingredient = item.ingredient;
    const quantity = item.quantity;

    if (ingredient.unit === 'unit') {
      totals.calories += ingredient.calories * quantity;
      totals.protein += ingredient.protein * quantity;
      totals.carbs += ingredient.carbs * quantity;
      totals.fat += ingredient.fat * quantity;
    } else {
      totals.calories += (ingredient.calories / 100) * quantity;
      totals.protein += (ingredient.protein / 100) * quantity;
      totals.carbs += (ingredient.carbs / 100) * quantity;
      totals.fat += (ingredient.fat / 100) * quantity;
    }
  });

  return {
    calories: totals.calories / servings,
    protein: totals.protein / servings,
    carbs: totals.carbs / servings,
    fat: totals.fat / servings
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}
