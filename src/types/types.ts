/**
 * DTO and Command Model definitions for the HealthyMeal API.
 *
 * These types represent the data structures exchanged via the API endpoints,
 * and they are derived from the underlying database models defined in
 * src/db/database.types.ts.
 *
 * Note:
 * - For Preferences, we map the DB field `user_id` to the DTO field `userId`.
 * - For Recipe, only the subset of fields required by the API are included.
 * - Command models (for create/update operations) use Partial or Omit as needed.
 */

import type { Json } from "../db/database.types";

/* -------------------------------- Preferences -------------------------------- */

/**
 * PreferencesDTO represents the dietary preferences for a user,
 * as returned by GET /api/preferences.
 */
export interface PreferencesDTO {
  id: number;
  userId: string; // mapped from the database field "user_id"
  diet_type: string | null;
  daily_calorie_requirement: number | null;
  allergies: string | null;
  food_intolerances: string | null;
  preferred_cuisines: string | null;
  excluded_ingredients: string | null;
  macro_distribution_protein: number | null;
  macro_distribution_fats: number | null;
  macro_distribution_carbohydrates: number | null;
}

/**
 * PreferencesCommandDTO is used as the payload for creating or updating
 * user preferences via POST /api/preferences. The id is optional since it
 * is not provided on creation.
 */
export type PreferencesCommandDTO = Omit<PreferencesDTO, "id"> & { id?: number };

/* ---------------------------------- Recipes ---------------------------------- */

export type Source = "manual" | "AI";

export interface RecipeDTO {
  id: number;
  name: string;
  rating: number;
  source: Source;
  recipe: Json;
  created_at: string;
  updated_at?: string;
}

export type SortBy = "name" | "created_at" | "rating";
export type Order = "asc" | "desc";

export interface GetRecipesQuery {
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  order?: Order;
  searchTerm?: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetRecipesResponse {
  data: RecipeDTO[];
  pagination: PaginationMetadata;
}

/**
 * CreateRecipeCommand is used to create a new recipe via POST /api/recipes.
 * - 'rating' should be validated to be between 1 and 10.
 * - 'recipe' content must adhere to length constraints (100-10000 characters).
 */
export interface CreateRecipeCommand {
  name: string;
  rating?: number;
  source: Source;
  recipe: Json;
}

/**
 * UpdateRecipeCommand represents the payload for updating an existing recipe
 * via PUT /api/recipes/{recipeId}. Fields are optional to allow partial updates.
 */
export interface UpdateRecipeCommand {
  name?: string;
  rating?: number;
  recipe?: Json;
}

/**
 * RecipeFormValues represents the form data structure for recipe forms.
 * This is typically inferred from Zod schema validation.
 */
export interface RecipeFormValues {
  name: string;
  rating?: string;
  recipeContent: string;
}

/* --------------------------- Recipe AI Modification --------------------------- */

/**
 * RecipeModificationCommand is used to request an AI-based modification
 * for a recipe via POST /api/recipes/modify.
 * - 'recipe_text' must be validated to be between 100 and 10000 characters.
 */
export interface RecipeModificationCommand {
  recipe_text: string;
}

/**
 * RecipeModificationResponseDTO represents the response from the AI modification
 * endpoint (POST /api/recipes/modify), which returns the modified recipe text.
 */
export interface RecipeModificationResponseDTO {
  modified_recipe: string;
}

/* ------------------------- Recipe Modification History ------------------------ */

/**
 * RecipeModificationHistoryDTO represents an entry in the recipe modification
 * history, as returned by GET /api/recipes/{recipeId}/modifications.
 */
export interface RecipeModificationHistoryDTO {
  id: number;
  recipe_id: number;
  original_recipe: Json;
  modified_recipe: Json;
  timestamp: string;
}

/* ---------------------------- Recipe Statistics DTO --------------------------- */

/**
 * RecipeStatisticsDTO represents analytics for a recipe, including search and modification counts.
 */
export interface RecipeStatisticsDTO {
  recipe_id: number;
  search_count: number;
  modification_count: number;
  last_updated: string;
}

/* ----------------------- Recipe Modification Error DTOs ----------------------- */

/**
 * RecipeModificationErrorDTO represents an AI modification error log,
 * as returned by GET /api/modification-errors.
 */
export interface RecipeModificationErrorDTO {
  id: number;
  ai_model: string;
  recipe_text: string;
  error_code: number | null;
  error_description: string | null;
  timestamp: string;
}

/**
 * RecipeModificationErrorCommand is used to log a new AI modification error
 * via POST /api/modification-errors.
 */
export interface RecipeModificationErrorCommand {
  recipe_text: string;
  error_code: number | null;
  error_description: string | null;
}

/* -------------------------------- Navigation -------------------------------- */

/**
 * NavigationLinkItem represents a single navigation link in the menu.
 */
export interface NavigationLinkItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}
