import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAiRecipeModification } from "../useAiRecipeModification";
import type { RecipeModificationResponseDTO } from "../../../types/types";

// Mock data factories
const createMockApiResponse = (overrides?: Partial<RecipeModificationResponseDTO>): RecipeModificationResponseDTO => ({
  modified_recipe: "This is a modified recipe with improved instructions and healthier ingredients.",
  ...overrides,
});

const createValidRecipeText = (length = 150): string => {
  const baseText = "Cook pasta in salted water. Add olive oil and garlic. Season with salt and pepper. ";
  return baseText.repeat(Math.ceil(length / baseText.length)).substring(0, length);
};

interface MockFetchResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<RecipeModificationResponseDTO>;
}

describe("useAiRecipeModification", () => {
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
      const { result } = renderHook(() => useAiRecipeModification());

      expect(result.current.aiState).toEqual({
        originalRecipeText: "",
        suggestedRecipeText: null,
        isLoadingAiSuggestion: false,
        aiError: null,
        showMissingPreferencesWarning: false,
      });
    });

    it("should provide all expected methods", () => {
      const { result } = renderHook(() => useAiRecipeModification());

      expect(typeof result.current.generateSuggestion).toBe("function");
      expect(typeof result.current.approveSuggestion).toBe("function");
      expect(typeof result.current.rejectSuggestion).toBe("function");
      expect(typeof result.current.resetAiState).toBe("function");
    });
  });

  describe("Reset AI State", () => {
    it("should reset state with provided original text", () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const originalText = "Original recipe text for testing";

      act(() => {
        result.current.resetAiState(originalText);
      });

      expect(result.current.aiState).toEqual({
        originalRecipeText: originalText,
        suggestedRecipeText: null,
        isLoadingAiSuggestion: false,
        aiError: null,
        showMissingPreferencesWarning: false,
      });
    });

    it("should clear previous AI state when reset", () => {
      const { result } = renderHook(() => useAiRecipeModification());

      // First set some state
      act(() => {
        result.current.resetAiState("Initial text");
      });

      // Simulate having some AI state (this would normally come from generateSuggestion)
      // We'll test this through the reject method which clears state
      act(() => {
        result.current.rejectSuggestion();
      });

      // Reset with new text
      act(() => {
        result.current.resetAiState("New original text");
      });

      expect(result.current.aiState.originalRecipeText).toBe("New original text");
      expect(result.current.aiState.suggestedRecipeText).toBeNull();
    });
  });

  describe("Input Validation", () => {
    it("should validate minimum recipe text length (100 characters)", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const shortText = "Short recipe text.";

      await act(async () => {
        await result.current.generateSuggestion(shortText);
      });

      expect(result.current.aiState.aiError).toBe("Tekst przepisu musi mieć co najmniej 100 znaków.");
      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
    });

    it("should validate maximum recipe text length (10000 characters)", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const longText = "a".repeat(10001);

      await act(async () => {
        await result.current.generateSuggestion(longText);
      });

      expect(result.current.aiState.aiError).toBe("Tekst przepisu nie może być dłuższy niż 10000 znaków.");
      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
    });

    it("should accept text at exactly 100 characters", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(100);
      const mockResponse = createMockApiResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_text: validText }),
      });
    });

    it("should accept text at exactly 10000 characters", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(10000);
      const mockResponse = createMockApiResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_text: validText }),
      });
    });

    it("should clear previous errors when validation passes", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      // First trigger validation error
      await act(async () => {
        await result.current.generateSuggestion("short");
      });

      expect(result.current.aiState.aiError).toBeTruthy();

      // Then provide valid input
      const validText = createValidRecipeText(150);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toBeNull();
    });
  });

  describe("Loading State Management", () => {
    it("should set loading state during API call", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      const validText = createValidRecipeText(150);

      // Start the API call
      act(() => {
        result.current.generateSuggestion(validText);
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);
      });

      // Resolve the promise
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      // Should stop loading
      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      });
    });

    it("should clear error and suggestion when starting new request", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      // First simulate having an error
      await act(async () => {
        await result.current.generateSuggestion("short text");
      });

      expect(result.current.aiState.aiError).toBeTruthy();

      // Start new valid request
      const validText = createValidRecipeText(150);
      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      act(() => {
        result.current.generateSuggestion(validText);
      });

      // Should clear previous error immediately when starting
      await waitFor(() => {
        expect(result.current.aiState.aiError).toBeNull();
        expect(result.current.aiState.suggestedRecipeText).toBeNull();
        expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);
      });

      // Complete the request
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      });
    });
  });

  describe("Successful AI Suggestion", () => {
    it("should handle successful API response", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(200);
      const mockResponse = createMockApiResponse({
        modified_recipe: "Improved recipe with better instructions and healthier ingredients.",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState).toEqual({
        originalRecipeText: "",
        suggestedRecipeText: "Improved recipe with better instructions and healthier ingredients.",
        isLoadingAiSuggestion: false,
        aiError: null,
        showMissingPreferencesWarning: false,
      });
    });

    it("should make correct API call", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(300);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe_text: validText,
        }),
      });
    });

    it("should handle empty suggestion response", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      const mockResponse = createMockApiResponse({
        modified_recipe: "",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.suggestedRecipeText).toBe("");
      expect(result.current.aiState.aiError).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle 422 error (missing preferences)", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState).toEqual({
        originalRecipeText: "",
        suggestedRecipeText: null,
        isLoadingAiSuggestion: false,
        aiError: null,
        showMissingPreferencesWarning: true,
      });
    });

    it("should handle 401 error (session expired)", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toBe("Sesja wygasła, zaloguj się ponownie");
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
    });

    it("should handle generic HTTP errors", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error"),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toContain("AI modification failed");
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toContain("Network connection failed");
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
    });

    it("should handle JSON parsing errors", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON response")),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toContain("Invalid JSON response");
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
    });

    it("should handle unknown error types", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      mockFetch.mockRejectedValueOnce("String error");

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toContain("Network error during AI modification");
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
    });

    it("should clear previous successful state on error", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);

      // First successful call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.suggestedRecipeText).toBeTruthy();

      // Second call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error"),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.aiError).toBeTruthy();
    });
  });

  describe("Suggestion Approval", () => {
    it("should return suggested text when approved", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      const mockResponse = createMockApiResponse({
        modified_recipe: "Approved suggestion text",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      const approvedText = result.current.approveSuggestion();
      expect(approvedText).toBe("Approved suggestion text");
    });

    it("should return null when no suggestion exists", () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const approvedText = result.current.approveSuggestion();
      expect(approvedText).toBeNull();
    });

    it("should return null after suggestion is rejected", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      // Reject the suggestion
      act(() => {
        result.current.rejectSuggestion();
      });

      const approvedText = result.current.approveSuggestion();
      expect(approvedText).toBeNull();
    });
  });

  describe("Suggestion Rejection", () => {
    it("should clear suggestion and errors when rejected", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.suggestedRecipeText).toBeTruthy();

      act(() => {
        result.current.rejectSuggestion();
      });

      expect(result.current.aiState.suggestedRecipeText).toBeNull();
      expect(result.current.aiState.aiError).toBeNull();
      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
    });

    it("should preserve loading state when rejecting during active request", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      // Start request
      act(() => {
        result.current.generateSuggestion(validText);
      });

      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);
      });

      // Reject during loading
      act(() => {
        result.current.rejectSuggestion();
      });

      // Loading state should be preserved
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);
      expect(result.current.aiState.suggestedRecipeText).toBeNull();

      // Complete the request
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      });
    });
  });

  describe("Edge Cases and Race Conditions", () => {
    it("should handle multiple rapid generateSuggestion calls", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText1 = createValidRecipeText(150);
      const validText2 = createValidRecipeText(200);
      const validText3 = createValidRecipeText(250);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse({ modified_recipe: "Final result" })),
      });

      await act(async () => {
        // Fire multiple requests rapidly
        result.current.generateSuggestion(validText1);
        result.current.generateSuggestion(validText2);
        await result.current.generateSuggestion(validText3);
      });

      // Should have the result from the last request
      expect(result.current.aiState.suggestedRecipeText).toBe("Final result");
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
    });

    it("should handle validation error during loading state", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      // Start valid request
      act(() => {
        result.current.generateSuggestion(validText);
      });

      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);
      });

      // Make invalid request while first is loading
      await act(async () => {
        await result.current.generateSuggestion("short");
      });

      // Should show validation error but validation doesn't clear loading state
      expect(result.current.aiState.aiError).toBe("Tekst przepisu musi mieć co najmniej 100 znaków.");
      // Loading state remains true because validation doesn't modify it
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);

      // Complete the first request (should still complete)
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse()),
      });

      // Wait for the promise to complete and loading to finish
      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
      });

      // The API response should have cleared the validation error
      expect(result.current.aiState.aiError).toBeNull();
      expect(result.current.aiState.suggestedRecipeText).toBeTruthy();
    });

    it("should handle resetAiState during loading", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(150);
      let resolvePromise!: (value: MockFetchResponse) => void;
      const delayedPromise = new Promise<MockFetchResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(delayedPromise);

      // Start request
      act(() => {
        result.current.generateSuggestion(validText);
      });

      await waitFor(() => {
        expect(result.current.aiState.isLoadingAiSuggestion).toBe(true);
      });

      // Reset during loading - this immediately sets new state
      act(() => {
        result.current.resetAiState("New original text");
      });

      expect(result.current.aiState).toEqual({
        originalRecipeText: "New original text",
        suggestedRecipeText: null,
        isLoadingAiSuggestion: false,
        aiError: null,
        showMissingPreferencesWarning: false,
      });

      // Complete the request - this will still update the state because the promise resolves
      await act(async () => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve(createMockApiResponse()),
        });
      });

      // The background promise completion will have updated the state
      expect(result.current.aiState.originalRecipeText).toBe("New original text");
      // The suggestion will be set by the completing API call
      expect(result.current.aiState.suggestedRecipeText).toBeTruthy();
      expect(result.current.aiState.isLoadingAiSuggestion).toBe(false);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle complete AI modification workflow", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const originalText = "Original recipe text for modification";

      // 1. Initialize with original text
      act(() => {
        result.current.resetAiState(originalText);
      });

      expect(result.current.aiState.originalRecipeText).toBe(originalText);

      // 2. User tries short text first (validation error)
      await act(async () => {
        await result.current.generateSuggestion("Short recipe");
      });

      expect(result.current.aiState.aiError).toBeTruthy();

      // 3. User provides valid text
      const validText = createValidRecipeText(500);
      const mockResponse = createMockApiResponse({
        modified_recipe: "AI improved recipe with better nutrition and clearer instructions.",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.aiError).toBeNull();
      expect(result.current.aiState.suggestedRecipeText).toBeTruthy();

      // 4. User approves suggestion
      const approvedText = result.current.approveSuggestion();
      expect(approvedText).toBe("AI improved recipe with better nutrition and clearer instructions.");

      // 5. State should still contain suggestion until reset
      expect(result.current.aiState.suggestedRecipeText).toBeTruthy();
    });

    it("should handle rejection and retry workflow", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(300);

      // 1. First suggestion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse({ modified_recipe: "First suggestion" })),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.suggestedRecipeText).toBe("First suggestion");

      // 2. User rejects
      act(() => {
        result.current.rejectSuggestion();
      });

      expect(result.current.aiState.suggestedRecipeText).toBeNull();

      // 3. User tries again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse({ modified_recipe: "Second suggestion" })),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.suggestedRecipeText).toBe("Second suggestion");

      // 4. User approves second suggestion
      const approvedText = result.current.approveSuggestion();
      expect(approvedText).toBe("Second suggestion");
    });

    it("should handle missing preferences workflow", async () => {
      const { result } = renderHook(() => useAiRecipeModification());

      const validText = createValidRecipeText(200);

      // 1. API returns 422 (missing preferences)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.showMissingPreferencesWarning).toBe(true);
      expect(result.current.aiState.aiError).toBeNull();
      expect(result.current.aiState.suggestedRecipeText).toBeNull();

      // 2. User sets preferences and tries again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse({ modified_recipe: "Success after preferences set" })),
      });

      await act(async () => {
        await result.current.generateSuggestion(validText);
      });

      expect(result.current.aiState.showMissingPreferencesWarning).toBe(false);
      expect(result.current.aiState.suggestedRecipeText).toBe("Success after preferences set");
    });
  });

  describe("TypeScript Type Safety", () => {
    it("should maintain correct types for all return values", () => {
      const { result } = renderHook(() => useAiRecipeModification());

      // Type checking (these will fail compilation if types are wrong)
      expect(typeof result.current.aiState).toBe("object");
      expect(typeof result.current.generateSuggestion).toBe("function");
      expect(typeof result.current.approveSuggestion).toBe("function");
      expect(typeof result.current.rejectSuggestion).toBe("function");
      expect(typeof result.current.resetAiState).toBe("function");

      // Test aiState structure
      expect(typeof result.current.aiState.originalRecipeText).toBe("string");
      expect(typeof result.current.aiState.isLoadingAiSuggestion).toBe("boolean");
      expect(typeof result.current.aiState.showMissingPreferencesWarning).toBe("boolean");

      // Test return type of approveSuggestion
      const approvedText = result.current.approveSuggestion();
      expect(approvedText === null || typeof approvedText === "string").toBe(true);
    });
  });
});
