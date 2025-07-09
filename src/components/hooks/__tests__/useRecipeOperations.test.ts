import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecipeOperations } from "../useRecipeOperations";
import type { RecipeFormValues, RecipeDTO } from "../../../types/types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockRecipeFormValues: RecipeFormValues = {
  name: "Test Recipe",
  rating: "5",
  recipeContent: "Test recipe instructions with sufficient length to pass validation requirements",
};

const mockRecipeResponse: RecipeDTO = {
  id: 1,
  name: "Test Recipe",
  rating: 5,
  source: "manual",
  recipe: { instructions: "Test recipe instructions" },
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

describe("useRecipeOperations", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useRecipeOperations());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.successMessage).toBe(null);
      expect(result.current.aiState).toEqual({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });
  });

  describe("createRecipe", () => {
    it("should create recipe successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRecipeResponse),
      });

      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const createdRecipe = await result.current.createRecipe(mockRecipeFormValues, "manual", "user123");
        expect(createdRecipe).toEqual(mockRecipeResponse);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.successMessage).toBe('Przepis "Test Recipe" został pomyślnie zapisany!');
      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "manual",
          recipe: { instructions: mockRecipeFormValues.recipeContent },
        }),
      });
    });

    it("should handle 409 conflict error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const createdRecipe = await result.current.createRecipe(mockRecipeFormValues, "manual", "user123");
        expect(createdRecipe).toBe(null);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Przepis o tej nazwie już istnieje.");
      expect(result.current.successMessage).toBe(null);
    });

    it("should handle 401 unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const createdRecipe = await result.current.createRecipe(mockRecipeFormValues, "manual", "user123");
        expect(createdRecipe).toBe(null);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Sesja wygasła. Zaloguj się ponownie.");
      expect(result.current.successMessage).toBe(null);
    });

    it("should return null when userId is not provided", async () => {
      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const createdRecipe = await result.current.createRecipe(mockRecipeFormValues, "manual", "");
        expect(createdRecipe).toBe(null);
      });

      expect(result.current.error).toBe("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("modifyWithAI", () => {
    it("should return needsPreferences when preferences are not set", async () => {
      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const modifyResult = await result.current.modifyWithAI(
          mockRecipeFormValues,
          "user123",
          false // arePreferencesSet = false
        );
        expect(modifyResult).toEqual({ success: false, needsPreferences: true });
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should modify recipe with AI successfully", async () => {
      const mockAIResponse = {
        modified_recipe: "AI modified recipe instructions",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAIResponse),
      });

      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const modifyResult = await result.current.modifyWithAI(
          mockRecipeFormValues,
          "user123",
          true // arePreferencesSet = true
        );
        expect(modifyResult).toEqual({ success: true, needsPreferences: false });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.aiState.isAIFlowActive).toBe(true);
      expect(result.current.aiState.originalContentForAI).toBe(mockRecipeFormValues.recipeContent);
      expect(result.current.aiState.aiModifiedContent).toBe("AI modified recipe instructions");
      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipe_text: mockRecipeFormValues.recipeContent,
        }),
      });
    });

    it("should handle AI modification errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "AI service unavailable" }),
      });

      const { result } = renderHook(() => useRecipeOperations());

      await act(async () => {
        const modifyResult = await result.current.modifyWithAI(mockRecipeFormValues, "user123", true);
        expect(modifyResult).toEqual({ success: false, needsPreferences: false });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe("Nie udało się zmodyfikować przepisu.");
      expect(result.current.aiState.isAIFlowActive).toBe(false);
    });
  });

  describe("State Management", () => {
    it("should clear messages correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      const { result } = renderHook(() => useRecipeOperations());

      // Create an error first
      await act(async () => {
        await result.current.createRecipe(mockRecipeFormValues, "manual", "user123");
      });

      expect(result.current.error).toBeTruthy();

      // Clear messages
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.successMessage).toBe(null);
    });

    it("should reject AI changes correctly", async () => {
      // First, set up AI state by calling modifyWithAI
      const mockAIResponse = {
        modified_recipe: "AI modified recipe instructions",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAIResponse),
      });

      const { result } = renderHook(() => useRecipeOperations());

      // First, create AI state
      await act(async () => {
        await result.current.modifyWithAI(mockRecipeFormValues, "user123", true);
      });

      // Verify AI state is active
      expect(result.current.aiState.isAIFlowActive).toBe(true);
      expect(result.current.aiState.originalContentForAI).toBe(mockRecipeFormValues.recipeContent);
      expect(result.current.aiState.aiModifiedContent).toBe("AI modified recipe instructions");

      // Now reject changes
      act(() => {
        result.current.rejectAIChanges();
      });

      expect(result.current.aiState).toEqual({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });

    it("should initialize with default state values", () => {
      const { result } = renderHook(() => useRecipeOperations());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.successMessage).toBe(null);
      expect(result.current.aiState).toEqual({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });
  });
});
