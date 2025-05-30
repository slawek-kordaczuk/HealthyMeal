import { useState, useEffect, useCallback } from "react";
import type { RecipeDTO, GetRecipesResponse, PaginationMetadata } from "../../types/types";
import type { RecipeFiltersViewModel } from "../../types/viewModels";

interface UseRecipesReturn {
  recipes: RecipeDTO[];
  pagination: PaginationMetadata | null;
  isLoading: boolean;
  error: string | null;
  filters: RecipeFiltersViewModel;
  setFilters: (filters: RecipeFiltersViewModel) => void;
  setSearchTerm: (searchTerm: string) => void;
  setPage: (page: number) => void;
  refreshRecipes: () => Promise<void>;
}

export function useRecipes(): UseRecipesReturn {
  const [recipes, setRecipes] = useState<RecipeDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RecipeFiltersViewModel>({
    searchTerm: "",
    sortBy: "created_at",
    order: "desc",
    page: 1,
    limit: 10,
  });

  const fetchRecipes = useCallback(async (currentFilters: RecipeFiltersViewModel) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (currentFilters.page) queryParams.append("page", currentFilters.page.toString());
      if (currentFilters.limit) queryParams.append("limit", currentFilters.limit.toString());
      if (currentFilters.sortBy) queryParams.append("sortBy", currentFilters.sortBy);
      if (currentFilters.order) queryParams.append("order", currentFilters.order);
      if (currentFilters.searchTerm) queryParams.append("searchTerm", currentFilters.searchTerm);

      const response = await fetch(`/api/recipes?${queryParams.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła, zaloguj się ponownie.");
        }
        throw new Error("Nie udało się załadować przepisów.");
      }

      const data: GetRecipesResponse = await response.json();
      setRecipes(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      setError(errorMessage);
      setRecipes([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setFilters = useCallback((newFilters: RecipeFiltersViewModel) => {
    setFiltersState(newFilters);
  }, []);

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFiltersState((prev) => ({ ...prev, searchTerm, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const refreshRecipes = useCallback(async () => {
    await fetchRecipes(filters);
  }, [fetchRecipes, filters]);

  // Fetch recipes when filters change
  useEffect(() => {
    fetchRecipes(filters);
  }, [fetchRecipes, filters]);

  return {
    recipes,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    setSearchTerm,
    setPage,
    refreshRecipes,
  };
}
