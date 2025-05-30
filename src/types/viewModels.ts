import type { SortBy, Order } from "./types";

/**
 * EditRecipeFormViewModel - stan formularza ręcznej edycji w EditRecipeModal
 */
export interface EditRecipeFormViewModel {
  name: string;
  rating: number | string; // string dla input, konwersja do number
  recipeContent: string; // Tekstowa zawartość przepisu
}

/**
 * AiModificationStateViewModel - stan trybu modyfikacji AI w EditRecipeModal
 */
export interface AiModificationStateViewModel {
  originalRecipeText: string;
  suggestedRecipeText: string | null;
  isLoadingAiSuggestion: boolean;
  aiError: string | null; // Komunikat błędu od AI
  showMissingPreferencesWarning: boolean; // Czy pokazać ostrzeżenie o braku preferencji
}

/**
 * RecipeFiltersViewModel - stan filtrów i wyszukiwania w RecipeListContainer
 */
export interface RecipeFiltersViewModel {
  searchTerm: string;
  sortBy: SortBy; // 'name' | 'created_at' | 'rating'
  order: Order; // 'asc' | 'desc'
  page: number;
  limit: number;
  // Opcjonalnie: source: Source | 'all';
}
