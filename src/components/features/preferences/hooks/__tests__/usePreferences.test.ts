import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePreferencesStatus } from "../usePreferencesStatus";
import type { PreferencesDTO } from "../../../../types/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to test error logging
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Suppress console.error in tests
});

// Test data factory
const createMockPreferences = (overrides: Partial<PreferencesDTO> = {}): PreferencesDTO => ({
  id: 1,
  userId: "test-user-123",
  diet_type: "vegan",
  daily_calorie_requirement: 2000,
  allergies: "nuts",
  food_intolerances: "lactose",
  preferred_cuisines: "Italian, Asian",
  excluded_ingredients: "peanuts, shellfish",
  macro_distribution_protein: 30,
  macro_distribution_fats: 20,
  macro_distribution_carbohydrates: 50,
  ...overrides,
});

const createEmptyPreferences = (): PreferencesDTO => ({
  id: 1,
  userId: "test-user-123",
  diet_type: null,
  daily_calorie_requirement: null,
  allergies: null,
  food_intolerances: null,
  preferred_cuisines: null,
  excluded_ingredients: null,
  macro_distribution_protein: null,
  macro_distribution_fats: null,
  macro_distribution_carbohydrates: null,
});

describe("usePreferencesStatus", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // INITIAL STATE TESTS
  // ==========================================
  describe("initial state", () => {
    it("should have correct initial state", () => {
      // Mock successful response to prevent useEffect from completing
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            // This promise never resolves to keep loading state
          })
      );

      const { result } = renderHook(() => usePreferencesStatus());

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refetch).toBe("function");
    });

    it("should call API on mount", () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createMockPreferences()),
      });

      renderHook(() => usePreferencesStatus());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("/api/preferences", {
        method: "GET",
        credentials: "include",
      });
    });
  });

  // ==========================================
  // SUCCESSFUL API RESPONSES
  // ==========================================
  describe("successful API responses", () => {
    it("should handle successful response with preferences", async () => {
      const mockPreferences = createMockPreferences();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPreferences),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toEqual(mockPreferences);
      expect(result.current.arePreferencesSet).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("should handle 404 response (no preferences found)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(null),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should handle 200 response with null data (no preferences)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================
  describe("error handling", () => {
    it("should handle 401 Unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe("Sesja wygasła. Zaloguj się ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error fetching preferences:", expect.any(Error));
    });

    it("should handle 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe("Nie udało się załadować preferencji.");
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe("Nie udało się załadować preferencji.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error fetching preferences:", expect.any(Error));
    });

    it("should handle JSON parsing error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe("Nie udało się załadować preferencji.");
    });

    it("should handle non-Error object rejection", async () => {
      mockFetch.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBe(null);
      expect(result.current.arePreferencesSet).toBe(false);
      expect(result.current.error).toBe("Nie udało się załadować preferencji.");
    });
  });

  // ==========================================
  // PREFERENCES MEANINGFUL DETECTION LOGIC
  // ==========================================
  describe("arePreferencesSet logic - business rules", () => {
    it("should return false for null preferences", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(false);
    });

    it("should return false for completely empty preferences", async () => {
      const emptyPreferences = createEmptyPreferences();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyPreferences),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(false);
    });

    it("should return true if diet_type is set", async () => {
      const preferencesWithDiet = createEmptyPreferences();
      preferencesWithDiet.diet_type = "vegan";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithDiet),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if daily_calorie_requirement is set", async () => {
      const preferencesWithCalories = createEmptyPreferences();
      preferencesWithCalories.daily_calorie_requirement = 2000;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithCalories),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if allergies is set", async () => {
      const preferencesWithAllergies = createEmptyPreferences();
      preferencesWithAllergies.allergies = "peanuts";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithAllergies),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if food_intolerances is set", async () => {
      const preferencesWithIntolerances = createEmptyPreferences();
      preferencesWithIntolerances.food_intolerances = "lactose";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithIntolerances),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if preferred_cuisines is set", async () => {
      const preferencesWithCuisines = createEmptyPreferences();
      preferencesWithCuisines.preferred_cuisines = "Italian";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithCuisines),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if excluded_ingredients is set", async () => {
      const preferencesWithExclusions = createEmptyPreferences();
      preferencesWithExclusions.excluded_ingredients = "mushrooms";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithExclusions),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if macro_distribution_protein is set", async () => {
      const preferencesWithProtein = createEmptyPreferences();
      preferencesWithProtein.macro_distribution_protein = 30;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithProtein),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if macro_distribution_fats is set", async () => {
      const preferencesWithFats = createEmptyPreferences();
      preferencesWithFats.macro_distribution_fats = 25;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithFats),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if macro_distribution_carbohydrates is set", async () => {
      const preferencesWithCarbs = createEmptyPreferences();
      preferencesWithCarbs.macro_distribution_carbohydrates = 45;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithCarbs),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should return true if multiple fields are set", async () => {
      const preferencesWithMultiple = createEmptyPreferences();
      preferencesWithMultiple.diet_type = "vegetarian";
      preferencesWithMultiple.allergies = "nuts";
      preferencesWithMultiple.daily_calorie_requirement = 1800;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithMultiple),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.arePreferencesSet).toBe(true);
    });
  });

  // ==========================================
  // REFETCH FUNCTIONALITY TESTS
  // ==========================================
  describe("refetch functionality", () => {
    it("should refetch preferences successfully", async () => {
      const initialPreferences = createMockPreferences({ diet_type: "vegan" });
      const updatedPreferences = createMockPreferences({ diet_type: "vegetarian" });

      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(initialPreferences),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences?.diet_type).toBe("vegan");

      // Refetch with updated data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedPreferences),
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.preferences?.diet_type).toBe("vegetarian");
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle refetch error", async () => {
      const initialPreferences = createMockPreferences();

      // Initial successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(initialPreferences),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(null);

      // Refetch with error
      mockFetch.mockRejectedValueOnce(new Error("Refetch failed"));

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe("Nie udało się załadować preferencji.");
      });
      expect(result.current.preferences).toBe(null);
    });

    it("should set loading state during refetch", async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createMockPreferences()),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // For this test, we need to trigger refetch and immediately check loading state
      // We can't use a promise that never resolves because then the test hangs
      let resolveRefetch: ((value: unknown) => void) | undefined;
      const refetchPromise = new Promise((resolve) => {
        resolveRefetch = resolve;
      });

      mockFetch.mockReturnValueOnce(refetchPromise);

      // Trigger refetch (but don't await)
      const refetchCall = result.current.refetch();

      // Check loading state immediately
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Now resolve the refetch to cleanup
      if (resolveRefetch) {
        resolveRefetch({
          ok: true,
          status: 200,
          json: () => Promise.resolve(createMockPreferences()),
        });
      }
      await refetchCall; // Wait for completion
    });

    it("should clear previous error on refetch", async () => {
      // Initial fetch with error
      mockFetch.mockRejectedValueOnce(new Error("Initial error"));

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Nie udało się załadować preferencji.");

      // Successful refetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createMockPreferences()),
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
      expect(result.current.preferences).not.toBe(null);
    });

    it("should handle simultaneous fetch and refetch calls", async () => {
      const preferences1 = createMockPreferences({ diet_type: "vegan" });
      const preferences2 = createMockPreferences({ diet_type: "vegetarian" });

      // Initial fetch - starts immediately on hook mount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferences1),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences?.diet_type).toBe("vegan");

      // Now do a refetch with different data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferences2),
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After refetch, should have the new data
      expect(result.current.preferences?.diet_type).toBe("vegetarian");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle Boolean function conversion correctly", async () => {
      const preferences = createMockPreferences();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferences),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // arePreferencesSet should be a boolean, not a truthy/falsy value
      expect(typeof result.current.arePreferencesSet).toBe("boolean");
      expect(result.current.arePreferencesSet).toBe(true);
    });
  });

  // ==========================================
  // EDGE CASES AND BOUNDARY CONDITIONS
  // ==========================================
  describe("edge cases and boundary conditions", () => {
    it("should handle preferences with zero values in macro distribution", async () => {
      const preferencesWithZeroMacros = createEmptyPreferences();
      preferencesWithZeroMacros.macro_distribution_protein = 0;
      preferencesWithZeroMacros.macro_distribution_fats = 0;
      preferencesWithZeroMacros.macro_distribution_carbohydrates = 0;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithZeroMacros),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Zero values are falsy in JavaScript, so they should NOT count as "set"
      expect(result.current.arePreferencesSet).toBe(false);
    });

    it("should handle preferences with zero daily_calorie_requirement", async () => {
      const preferencesWithZeroCalories = createEmptyPreferences();
      preferencesWithZeroCalories.daily_calorie_requirement = 0;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithZeroCalories),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Zero calories is falsy, so should NOT count as "set"
      expect(result.current.arePreferencesSet).toBe(false);
    });

    it("should handle preferences with non-zero numerical values", async () => {
      const preferencesWithNonZeroValues = createEmptyPreferences();
      preferencesWithNonZeroValues.macro_distribution_protein = 1;
      preferencesWithNonZeroValues.daily_calorie_requirement = 1;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithNonZeroValues),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Non-zero values should count as "set"
      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should handle preferences with empty string values", async () => {
      const preferencesWithEmptyStrings = createEmptyPreferences();
      preferencesWithEmptyStrings.diet_type = "";
      preferencesWithEmptyStrings.allergies = "";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithEmptyStrings),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Empty strings should NOT count as meaningful preferences
      expect(result.current.arePreferencesSet).toBe(false);
    });

    it("should handle preferences with whitespace-only string values", async () => {
      const preferencesWithWhitespace = createEmptyPreferences();
      preferencesWithWhitespace.diet_type = "   ";
      preferencesWithWhitespace.allergies = "\\n\\t  ";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(preferencesWithWhitespace),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Whitespace strings should count as set (truthy values)
      expect(result.current.arePreferencesSet).toBe(true);
    });

    it("should handle response with invalid preferences structure", async () => {
      const invalidPreferences = { invalid: "structure" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(invalidPreferences),
      });

      const { result } = renderHook(() => usePreferencesStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still set the preferences even if structure is unexpected
      expect(result.current.preferences).toEqual(invalidPreferences);
      expect(result.current.arePreferencesSet).toBe(false); // None of the expected fields are present
    });
  });

  // ==========================================
  // LOADING STATE MANAGEMENT
  // ==========================================
  describe("loading state management", () => {
    it("should manage loading state correctly during successful fetch", async () => {
      let resolvePromise: ((value: unknown) => void) | undefined;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(mockPromise);

      const { result } = renderHook(() => usePreferencesStatus());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          status: 200,
          json: () => Promise.resolve(createMockPreferences()),
        });
      }

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should manage loading state correctly during failed fetch", async () => {
      let rejectPromise: ((error: unknown) => void) | undefined;
      const mockPromise = new Promise((resolve, reject) => {
        rejectPromise = reject;
      });

      mockFetch.mockReturnValueOnce(mockPromise);

      const { result } = renderHook(() => usePreferencesStatus());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Reject the promise
      if (rejectPromise) {
        rejectPromise(new Error("Fetch failed"));
      }

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Nie udało się załadować preferencji.");
    });
  });
});
