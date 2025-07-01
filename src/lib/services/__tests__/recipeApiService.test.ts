import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateRecipe,
  modifyRecipeWithAI,
  PreferencesRequiredError,
  AuthenticationError,
  RecipeApiError,
} from "../recipeApiService";
import type { UpdateRecipeCommand, RecipeModificationResponseDTO } from "../../../types/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("RecipeApiService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("updateRecipe", () => {
    const mockUpdateData: UpdateRecipeCommand = {
      name: "Test Recipe",
      rating: 5,
      recipe: { instructions: "Test instructions" },
    };

    it("should successfully update recipe", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

      await expect(updateRecipe(1, mockUpdateData)).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith("/api/recipes/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, ...mockUpdateData }),
      });
    });

    it("should throw AuthenticationError for 401 status", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

      await expect(updateRecipe(1, mockUpdateData)).rejects.toThrow(AuthenticationError);
    });

    it("should throw RecipeApiError for other HTTP errors", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Server error"),
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      await expect(updateRecipe(1, mockUpdateData)).rejects.toThrow(RecipeApiError);
    });

    it("should handle network errors", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      await expect(updateRecipe(1, mockUpdateData)).rejects.toThrow(RecipeApiError);
    });
  });

  describe("modifyRecipeWithAI", () => {
    const mockRecipeText = "Test recipe content for AI modification";

    it("should successfully modify recipe with AI", async () => {
      const mockResponseData: RecipeModificationResponseDTO = {
        modified_recipe: "Modified recipe content",
      };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponseData),
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await modifyRecipeWithAI(mockRecipeText);

      expect(result).toBe("Modified recipe content");
      expect(fetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_text: mockRecipeText }),
      });
    });

    it("should throw PreferencesRequiredError for 422 status", async () => {
      const mockResponse = {
        ok: false,
        status: 422,
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

      await expect(modifyRecipeWithAI(mockRecipeText)).rejects.toThrow(PreferencesRequiredError);
    });

    it("should throw AuthenticationError for 401 status", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

      await expect(modifyRecipeWithAI(mockRecipeText)).rejects.toThrow(AuthenticationError);
    });
  });
});
