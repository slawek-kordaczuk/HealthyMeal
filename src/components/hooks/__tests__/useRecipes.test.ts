import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRecipes } from "../useRecipes";
import type { RecipeDTO, GetRecipesResponse, PaginationMetadata } from "../../../types/types";
import type { RecipeFiltersViewModel } from "../../../types/viewModels";

// Mock data factories
const createMockRecipe = (overrides?: Partial<RecipeDTO>): RecipeDTO => ({
  id: 1,
  name: "Test Recipe",
  rating: 5,
  source: "manual",
  recipe: { instructions: "Test instructions" },
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const createMockPagination = (overrides?: Partial<PaginationMetadata>): PaginationMetadata => ({
  page: 1,
  limit: 10,
  total: 25,
  totalPages: 3,
  ...overrides,
});

const createMockResponse = (
  recipes: RecipeDTO[] = [createMockRecipe()],
  pagination?: PaginationMetadata
): GetRecipesResponse => ({
  data: recipes,
  pagination: pagination || createMockPagination(),
});

interface MockFetchResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<GetRecipesResponse>;
}

describe("useRecipes", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      expect(result.current.recipes).toEqual([]);
      expect(result.current.pagination).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual({
        searchTerm: "",
        sortBy: "created_at",
        order: "desc",
        page: 1,
        limit: 10,
      });
    });

    it("should start loading immediately on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      renderHook(() => useRecipes());

      // Check that fetchRecipes was called on mount
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/recipes?page=1&limit=10&sortBy=created_at&order=desc");
      });
    });
  });

  describe("Filter Management", () => {
    it("should update filters completely with setFilters", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      const newFilters: RecipeFiltersViewModel = {
        searchTerm: "new search",
        sortBy: "name",
        order: "asc",
        page: 2,
        limit: 20,
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it("should reset page to 1 when search term changes", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // First set page to 3
      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.filters.page).toBe(3);

      // Then change search term - should reset page to 1
      act(() => {
        result.current.setSearchTerm("new search");
      });

      expect(result.current.filters.searchTerm).toBe("new search");
      expect(result.current.filters.page).toBe(1);
    });

    it("should update only page when using setPage", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      const originalFilters = { ...result.current.filters };

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.filters).toEqual({
        ...originalFilters,
        page: 5,
      });
    });

    it("should preserve other filters when changing search term", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // Set some initial filters
      act(() => {
        result.current.setFilters({
          searchTerm: "",
          sortBy: "rating",
          order: "asc",
          page: 2,
          limit: 20,
        });
      });

      // Change search term
      act(() => {
        result.current.setSearchTerm("pasta");
      });

      expect(result.current.filters).toEqual({
        searchTerm: "pasta",
        sortBy: "rating",
        order: "asc",
        page: 1, // Reset to 1
        limit: 20,
      });
    });
  });

  describe("API Query Parameters", () => {
    it("should build correct query parameters for all filters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      act(() => {
        result.current.setFilters({
          searchTerm: "pasta bolognese",
          sortBy: "rating",
          order: "asc",
          page: 3,
          limit: 25,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/recipes?page=3&limit=25&sortBy=rating&order=asc&searchTerm=pasta+bolognese"
        );
      });
    });

    it("should omit empty search term from query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      act(() => {
        result.current.setFilters({
          searchTerm: "",
          sortBy: "name",
          order: "desc",
          page: 1,
          limit: 10,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith("/api/recipes?page=1&limit=10&sortBy=name&order=desc");
      });
    });

    it("should handle special characters in search term", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      act(() => {
        result.current.setSearchTerm("recipe with & symbols %");
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/recipes?page=1&limit=10&sortBy=created_at&order=desc&searchTerm=recipe+with+%26+symbols+%25"
        );
      });
    });
  });

  describe("Successful Data Fetching", () => {
    it("should update state correctly on successful API response", async () => {
      const mockRecipes = [
        createMockRecipe({ id: 1, name: "Recipe 1" }),
        createMockRecipe({ id: 2, name: "Recipe 2" }),
      ];
      const mockPagination = createMockPagination({ total: 15, totalPages: 2 });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(mockRecipes, mockPagination)),
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.recipes).toEqual(mockRecipes);
        expect(result.current.pagination).toEqual(mockPagination);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should handle empty recipes response", async () => {
      const emptyResponse = createMockResponse([], createMockPagination({ total: 0, totalPages: 0 }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toEqual(emptyResponse.pagination);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("should manage loading state correctly", async () => {
      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      const { result } = renderHook(() => useRecipes());

      // Should be loading initially
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the promise
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      // Should stop loading after resolution
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 401 authentication error with specific message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toBe("Sesja wygasła, zaloguj się ponownie.");
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle generic HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toBe("Nie udało się załadować przepisów.");
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle JSON parsing errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toBe("Invalid JSON");
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle unknown error types", async () => {
      mockFetch.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toBe("Wystąpił nieoczekiwany błąd.");
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should clear previous error on successful retry", async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.error).toBe("Nie udało się załadować przepisów.");
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should refresh data with current filters", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // Set some filters
      act(() => {
        result.current.setFilters({
          searchTerm: "pasta",
          sortBy: "rating",
          order: "asc",
          page: 2,
          limit: 20,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/recipes?page=2&limit=20&sortBy=rating&order=asc&searchTerm=pasta"
        );
      });

      // Clear mock calls to test refresh
      mockFetch.mockClear();

      // Call refresh
      await act(async () => {
        await result.current.refreshRecipes();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes?page=2&limit=20&sortBy=rating&order=asc&searchTerm=pasta");
    });

    it("should handle refresh errors gracefully", async () => {
      // Initial successful load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        expect(result.current.recipes.length).toBeGreaterThan(0);
      });

      // Refresh fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        await result.current.refreshRecipes();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Nie udało się załadować przepisów.");
        expect(result.current.recipes).toEqual([]);
        expect(result.current.pagination).toBeNull();
      });
    });
  });

  describe("Effect Triggers", () => {
    it("should fetch recipes when filters change", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // Wait for initial fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Change filters - should trigger new fetch
      act(() => {
        result.current.setSearchTerm("new search");
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/recipes?page=1&limit=10&sortBy=created_at&order=desc&searchTerm=new+search"
        );
      });
    });

    it("should not fetch if hook is unmounted during fetch", async () => {
      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      const { unmount } = renderHook(() => useRecipes());

      // Unmount before promise resolves
      unmount();

      // Resolve promise after unmount
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      // Should not cause any state updates or errors
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid filter changes", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // Rapid filter changes
      act(() => {
        result.current.setSearchTerm("search1");
        result.current.setSearchTerm("search2");
        result.current.setSearchTerm("search3");
      });

      await waitFor(() => {
        expect(result.current.filters.searchTerm).toBe("search3");
      });
    });

    it("should handle malformed API response gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalidData: true }),
      });

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => {
        // Should handle gracefully without crashing
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle boundary values for pagination", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // Test page 1 (since 0 would be filtered out as falsy)
      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith("/api/recipes?page=1&limit=10&sortBy=created_at&order=desc");
      });

      // Test very high page number
      act(() => {
        result.current.setPage(999999);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith("/api/recipes?page=999999&limit=10&sortBy=created_at&order=desc");
      });
    });
  });

  describe("TypeScript Type Safety", () => {
    it("should maintain correct types for all return values", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse()),
      });

      const { result } = renderHook(() => useRecipes());

      // Type checking (these will fail compilation if types are wrong)
      expect(typeof result.current.recipes).toBe("object");
      expect(Array.isArray(result.current.recipes)).toBe(true);
      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.setSearchTerm).toBe("function");
      expect(typeof result.current.setPage).toBe("function");
      expect(typeof result.current.refreshRecipes).toBe("function");
    });
  });
});
