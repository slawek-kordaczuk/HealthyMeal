import type { PreferencesDTO } from "../../../../types/types";

/**
 * Test fixtures for RecipeModificationService tests
 */

export const TEST_USER_ID = "test-user-123";

export const SAMPLE_RECIPE_TEXT = `
Classic Beef Bolognese
Serves: 4-6 people
Prep time: 20 minutes
Cook time: 2 hours

Ingredients:
- 500g ground beef
- 1 large onion, diced
- 2 carrots, diced
- 2 celery stalks, diced
- 4 cloves garlic, minced
- 400g canned tomatoes
- 2 tbsp tomato paste
- 250ml red wine
- 500ml beef stock
- 2 bay leaves
- 1 tsp dried oregano
- 1 tsp dried basil
- Salt and pepper to taste
- 400g spaghetti or tagliatelle
- Fresh Parmesan cheese, grated

Instructions:
1. Heat olive oil in a large, heavy-bottomed pot over medium-high heat
2. Add ground beef and cook until browned, breaking it up with a spoon
3. Add onion, carrots, and celery. Cook until vegetables are softened
4. Add garlic and cook for another minute
5. Stir in tomato paste and cook for 2 minutes
6. Pour in red wine and let it simmer until reduced by half
7. Add canned tomatoes, beef stock, bay leaves, oregano, and basil
8. Season with salt and pepper
9. Bring to a boil, then reduce heat and simmer for 2 hours, stirring occasionally
10. Cook pasta according to package directions
11. Serve sauce over pasta with grated Parmesan cheese
`;

export const VEGETARIAN_PREFERENCES: PreferencesDTO = {
  id: 1,
  userId: TEST_USER_ID,
  diet_type: "vegetarian",
  daily_calorie_requirement: 2000,
  allergies: "nuts",
  food_intolerances: "lactose",
  preferred_cuisines: "Italian, Mediterranean",
  excluded_ingredients: "meat, fish",
  macro_distribution_protein: 20,
  macro_distribution_fats: 35,
  macro_distribution_carbohydrates: 45,
};

export const VEGAN_PREFERENCES: PreferencesDTO = {
  id: 2,
  userId: TEST_USER_ID,
  diet_type: "vegan",
  daily_calorie_requirement: 1800,
  allergies: "soy, nuts",
  food_intolerances: null,
  preferred_cuisines: "Asian, Middle Eastern",
  excluded_ingredients: "meat, dairy, eggs, honey",
  macro_distribution_protein: 25,
  macro_distribution_fats: 30,
  macro_distribution_carbohydrates: 45,
};

export const KETO_PREFERENCES: PreferencesDTO = {
  id: 3,
  userId: TEST_USER_ID,
  diet_type: "ketogenic",
  daily_calorie_requirement: 2200,
  allergies: null,
  food_intolerances: "gluten",
  preferred_cuisines: "American, European",
  excluded_ingredients: "grains, sugar, potatoes",
  macro_distribution_protein: 25,
  macro_distribution_fats: 70,
  macro_distribution_carbohydrates: 5,
};

export const MINIMAL_PREFERENCES: PreferencesDTO = {
  id: 4,
  userId: TEST_USER_ID,
  diet_type: "standard",
  daily_calorie_requirement: null,
  allergies: null,
  food_intolerances: null,
  preferred_cuisines: null,
  excluded_ingredients: null,
  macro_distribution_protein: null,
  macro_distribution_fats: null,
  macro_distribution_carbohydrates: null,
};

export const COMPLEX_ALLERGIES_PREFERENCES: PreferencesDTO = {
  id: 5,
  userId: TEST_USER_ID,
  diet_type: "gluten-free",
  daily_calorie_requirement: 2400,
  allergies: "shellfish, tree nuts, peanuts, eggs",
  food_intolerances: "lactose, fructose",
  preferred_cuisines: "Thai, Indian, Mexican",
  excluded_ingredients: "wheat, barley, rye, oats",
  macro_distribution_protein: 30,
  macro_distribution_fats: 35,
  macro_distribution_carbohydrates: 35,
};

export const MODIFIED_VEGETARIAN_RECIPE = `
Vegetarian Bolognese
Serves: 4-6 people
Prep time: 20 minutes
Cook time: 1.5 hours

Ingredients:
- 500g lentils or mushroom mince (replacing ground beef)
- 1 large onion, diced
- 2 carrots, diced
- 2 celery stalks, diced
- 4 cloves garlic, minced
- 400g canned tomatoes
- 2 tbsp tomato paste
- 250ml vegetable stock (replacing red wine due to dietary preferences)
- 500ml vegetable stock
- 2 bay leaves
- 1 tsp dried oregano
- 1 tsp dried basil
- Salt and pepper to taste
- 400g spaghetti or tagliatelle
- Nutritional yeast (replacing Parmesan cheese due to lactose intolerance)

Instructions:
1. Heat olive oil in a large, heavy-bottomed pot over medium-high heat
2. Add lentils or mushroom mince and cook until heated through
3. Add onion, carrots, and celery. Cook until vegetables are softened
4. Add garlic and cook for another minute
5. Stir in tomato paste and cook for 2 minutes
6. Add vegetable stock gradually
7. Add canned tomatoes, remaining stock, bay leaves, oregano, and basil
8. Season with salt and pepper
9. Bring to a boil, then reduce heat and simmer for 1.5 hours, stirring occasionally
10. Cook pasta according to package directions
11. Serve sauce over pasta with nutritional yeast

Nutritional adjustments made for vegetarian diet and lactose intolerance.
Estimated calories per serving: ~400 (within daily requirement of 2000 calories).
`;

export const EDGE_CASE_RECIPES = {
  VERY_SHORT: "Pasta with salt. Cook pasta, add salt.",
  VERY_LONG: "x".repeat(7500), // Close to 8000 char limit
  WITH_SPECIAL_CHARS: `Recipe with émojis 🍝 and spëcial characters!
    Ingredients: 1 cup of "special" flour & 2 eggs (grade A+)`,
  ONLY_WHITESPACE: "   \n\t\r   \n   ",
  EMPTY: "",
};

export const ERROR_SCENARIOS = {
  PREFERENCES_NOT_FOUND: "User preferences not found. Please set your dietary preferences first.",
  EMPTY_RECIPE: "Recipe text cannot be empty",
  TOO_LONG_RECIPE: "Recipe text is too long. Maximum 8000 characters allowed.",
  AI_SERVICE_ERROR: "AI service unavailable",
  EMPTY_AI_RESPONSE: "AI service returned empty response",
  RATE_LIMIT_ERROR: "Rate limit exceeded",
  AUTH_ERROR: "Invalid API key",
  DATABASE_ERROR: "Database connection failed",
};

export const EXPECTED_ERROR_CODES = {
  UNPROCESSABLE_ENTITY: 422,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};
