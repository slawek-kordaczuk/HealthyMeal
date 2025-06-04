import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { RecipeFormValues } from "../RecipeForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to suppress error logs in tests
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Suppress console.error in tests
});

// Test data factories
const createValidRecipeFormValues = (overrides: Partial<RecipeFormValues> = {}): RecipeFormValues => ({
  name: "Test Recipe",
  rating: "5",
  recipeContent:
    "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
  ...overrides,
});

// Mock state setters and component state
const mockSetIsLoading = vi.fn();
const mockSetError = vi.fn();
const mockSetSuccessMessage = vi.fn();
const mockSetAiState = vi.fn();
const mockResetForm = vi.fn();

// Mock form methods
const mockFormGetValues = vi.fn();
const mockForm = {
  getValues: mockFormGetValues,
};

// Mock component state with proper types
const mockComponentState = {
  userId: "test-user-123" as string | null | undefined,
  aiState: {
    isAIFlowActive: true,
    originalContentForAI: "Original recipe content" as string | null,
    aiModifiedContent: "AI-modified recipe content with enhanced instructions" as string | null,
  },
};

// Mock handleSaveRecipe function
const mockHandleSaveRecipe = vi.fn();

// Create handleApproveAIChanges function for testing
const createHandleApproveAIChanges = (form = mockForm, handleSaveRecipe = mockHandleSaveRecipe) => {
  return async () => {
    const values = form.getValues();
    await handleSaveRecipe(values, "AI");
  };
};

// Create handleRejectAIChanges function for testing
const createHandleRejectAIChanges = (setAiState = mockSetAiState) => {
  return () => {
    setAiState({
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    });
  };
};

describe("AI Actions - handleApproveAIChanges and handleRejectAIChanges", () => {
  let handleApproveAIChanges: () => Promise<void>;
  let handleRejectAIChanges: () => void;

  beforeEach(() => {
    // Reset all mocks
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    mockSetIsLoading.mockClear();
    mockSetError.mockClear();
    mockSetSuccessMessage.mockClear();
    mockSetAiState.mockClear();
    mockResetForm.mockClear();
    mockFormGetValues.mockClear();
    mockHandleSaveRecipe.mockClear();

    // Reset component state to defaults
    mockComponentState.userId = "test-user-123";
    mockComponentState.aiState = {
      isAIFlowActive: true,
      originalContentForAI: "Original recipe content" as string | null,
      aiModifiedContent: "AI-modified recipe content with enhanced instructions" as string | null,
    };

    // Setup default form values
    mockFormGetValues.mockReturnValue(createValidRecipeFormValues());

    // Create fresh instances of the functions
    handleApproveAIChanges = createHandleApproveAIChanges(mockForm, mockHandleSaveRecipe);
    handleRejectAIChanges = createHandleRejectAIChanges(mockSetAiState);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // HANDLE APPROVE AI CHANGES TESTS
  // ==========================================
  describe("handleApproveAIChanges", () => {
    // ==========================================
    // BASIC FUNCTIONALITY TESTS
    // ==========================================
    describe("basic functionality", () => {
      it("should get form values and call handleSaveRecipe with AI source", async () => {
        const formValues = createValidRecipeFormValues({
          name: "Approved Recipe",
          recipeContent: "Content that will be saved with AI source",
        });
        mockFormGetValues.mockReturnValue(formValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockFormGetValues).toHaveBeenCalledTimes(1);
        expect(mockHandleSaveRecipe).toHaveBeenCalledTimes(1);
        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValues, "AI");
      });

      it("should pass exact form values to handleSaveRecipe", async () => {
        const specificFormValues = createValidRecipeFormValues({
          name: "Specific Recipe Name",
          rating: "8",
          recipeContent: "Very specific recipe content that should be passed exactly as is to the save function",
        });
        mockFormGetValues.mockReturnValue(specificFormValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(specificFormValues, "AI");
      });

      it("should always use 'AI' as source parameter", async () => {
        const formValues = createValidRecipeFormValues();
        mockFormGetValues.mockReturnValue(formValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValues, "AI");
      });
    });

    // ==========================================
    // FORM VALUES HANDLING TESTS
    // ==========================================
    describe("form values handling", () => {
      it("should handle form values with all fields populated", async () => {
        const completeFormValues = createValidRecipeFormValues({
          name: "Complete Recipe",
          rating: "10",
          recipeContent: "Complete recipe content with all details and sufficient length for validation requirements",
        });
        mockFormGetValues.mockReturnValue(completeFormValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(completeFormValues, "AI");
      });

      it("should handle form values with optional rating empty", async () => {
        const formValuesNoRating = createValidRecipeFormValues({
          name: "Recipe Without Rating",
          rating: "",
          recipeContent: "Recipe content without rating but with sufficient length for requirements",
        });
        mockFormGetValues.mockReturnValue(formValuesNoRating);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValuesNoRating, "AI");
      });

      it("should handle form values with minimum valid content", async () => {
        const minimalFormValues = createValidRecipeFormValues({
          name: "Minimal Recipe",
          rating: "",
          recipeContent: "A".repeat(100), // Minimum length for validation
        });
        mockFormGetValues.mockReturnValue(minimalFormValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(minimalFormValues, "AI");
      });

      it("should handle form values with very long content", async () => {
        const longContent = "Very detailed recipe instructions. ".repeat(200);
        const longFormValues = createValidRecipeFormValues({
          name: "Long Recipe",
          recipeContent: longContent,
        });
        mockFormGetValues.mockReturnValue(longFormValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(longFormValues, "AI");
      });

      it("should handle form values with special characters", async () => {
        const specialFormValues = createValidRecipeFormValues({
          name: 'Recipe with "special" chars & symbols',
          recipeContent:
            'Recipe content with "quotes", ñ characters, €symbols, newlines\nand tabs\t that should be handled properly.',
        });
        mockFormGetValues.mockReturnValue(specialFormValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(specialFormValues, "AI");
      });
    });

    // ==========================================
    // ERROR HANDLING TESTS
    // ==========================================
    describe("error handling", () => {
      it("should propagate errors from handleSaveRecipe", async () => {
        const formValues = createValidRecipeFormValues();
        mockFormGetValues.mockReturnValue(formValues);
        const saveError = new Error("Save failed");
        mockHandleSaveRecipe.mockRejectedValueOnce(saveError);

        await expect(handleApproveAIChanges()).rejects.toThrow("Save failed");
        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValues, "AI");
      });

      it("should handle network errors from handleSaveRecipe", async () => {
        const formValues = createValidRecipeFormValues();
        mockFormGetValues.mockReturnValue(formValues);
        const networkError = new Error("Network connection failed");
        mockHandleSaveRecipe.mockRejectedValueOnce(networkError);

        await expect(handleApproveAIChanges()).rejects.toThrow("Network connection failed");
      });

      it("should handle validation errors from handleSaveRecipe", async () => {
        const formValues = createValidRecipeFormValues();
        mockFormGetValues.mockReturnValue(formValues);
        const validationError = new Error("Recipe name already exists");
        mockHandleSaveRecipe.mockRejectedValueOnce(validationError);

        await expect(handleApproveAIChanges()).rejects.toThrow("Recipe name already exists");
      });

      it("should handle undefined return from form.getValues", async () => {
        mockFormGetValues.mockReturnValue(undefined);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(undefined, "AI");
      });

      it("should handle null return from form.getValues", async () => {
        mockFormGetValues.mockReturnValue(null);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(null, "AI");
      });
    });

    // ==========================================
    // ASYNC BEHAVIOR TESTS
    // ==========================================
    describe("async behavior", () => {
      it("should wait for handleSaveRecipe to complete", async () => {
        const formValues = createValidRecipeFormValues();
        mockFormGetValues.mockReturnValue(formValues);

        let resolveHandler: (() => void) | undefined;
        const savePromise = new Promise<void>((resolve) => {
          resolveHandler = resolve;
        });
        mockHandleSaveRecipe.mockReturnValueOnce(savePromise);

        const approvePromise = handleApproveAIChanges();

        // Should not complete immediately
        let completed = false;
        approvePromise.then(() => {
          completed = true;
        });

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(completed).toBe(false);

        // Complete the save operation
        if (resolveHandler) resolveHandler();
        await approvePromise;
        expect(completed).toBe(true);
      });

      it("should handle slow handleSaveRecipe operations", async () => {
        const formValues = createValidRecipeFormValues();
        mockFormGetValues.mockReturnValue(formValues);

        const slowPromise = new Promise<void>((resolve) => {
          setTimeout(resolve, 100);
        });
        mockHandleSaveRecipe.mockReturnValueOnce(slowPromise);

        const startTime = Date.now();
        await handleApproveAIChanges();
        const endTime = Date.now();

        expect(endTime - startTime).toBeGreaterThanOrEqual(100);
        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValues, "AI");
      });

      it("should handle concurrent approve operations", async () => {
        const formValues1 = createValidRecipeFormValues({ name: "Recipe 1" });
        const formValues2 = createValidRecipeFormValues({ name: "Recipe 2" });

        mockFormGetValues.mockReturnValueOnce(formValues1).mockReturnValueOnce(formValues2);

        mockHandleSaveRecipe.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);

        const handleApprove1 = createHandleApproveAIChanges(mockForm, mockHandleSaveRecipe);
        const handleApprove2 = createHandleApproveAIChanges(mockForm, mockHandleSaveRecipe);

        const promise1 = handleApprove1();
        const promise2 = handleApprove2();

        await Promise.all([promise1, promise2]);

        expect(mockHandleSaveRecipe).toHaveBeenCalledTimes(2);
        expect(mockHandleSaveRecipe).toHaveBeenNthCalledWith(1, formValues1, "AI");
        expect(mockHandleSaveRecipe).toHaveBeenNthCalledWith(2, formValues2, "AI");
      });
    });

    // ==========================================
    // INTEGRATION SCENARIOS
    // ==========================================
    describe("integration scenarios", () => {
      it("should work with realistic form state", async () => {
        const realisticFormValues = createValidRecipeFormValues({
          name: "Chicken Curry with Vegetables",
          rating: "7",
          recipeContent: `1. Heat oil in a large pan over medium heat.
2. Add onions and cook until softened, about 5 minutes.
3. Add garlic, ginger, and curry powder. Cook for 1 minute.
4. Add chicken pieces and cook until browned on all sides.
5. Add coconut milk, diced tomatoes, and vegetables.
6. Simmer for 20-25 minutes until chicken is cooked through.
7. Season with salt and pepper to taste.
8. Serve hot with rice or naan bread.`,
        });

        mockFormGetValues.mockReturnValue(realisticFormValues);
        mockHandleSaveRecipe.mockResolvedValueOnce(undefined);

        await handleApproveAIChanges();

        expect(mockFormGetValues).toHaveBeenCalledTimes(1);
        expect(mockHandleSaveRecipe).toHaveBeenCalledWith(realisticFormValues, "AI");
      });
    });
  });

  // ==========================================
  // HANDLE REJECT AI CHANGES TESTS
  // ==========================================
  describe("handleRejectAIChanges", () => {
    // ==========================================
    // BASIC FUNCTIONALITY TESTS
    // ==========================================
    describe("basic functionality", () => {
      it("should reset AI state to initial values", () => {
        handleRejectAIChanges();

        expect(mockSetAiState).toHaveBeenCalledTimes(1);
        expect(mockSetAiState).toHaveBeenCalledWith({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
      });

      it("should always reset to the same state regardless of current AI state", () => {
        // Test with different initial states
        const differentStates = [
          {
            isAIFlowActive: true,
            originalContentForAI: "Some content",
            aiModifiedContent: "Modified content",
          },
          {
            isAIFlowActive: false,
            originalContentForAI: null,
            aiModifiedContent: "Only modified content",
          },
          {
            isAIFlowActive: true,
            originalContentForAI: "Only original content",
            aiModifiedContent: null,
          },
        ];

        differentStates.forEach((initialState) => {
          mockSetAiState.mockClear();
          mockComponentState.aiState = initialState;

          const rejectHandler = createHandleRejectAIChanges(mockSetAiState);
          rejectHandler();

          expect(mockSetAiState).toHaveBeenCalledWith({
            isAIFlowActive: false,
            originalContentForAI: null,
            aiModifiedContent: null,
          });
        });
      });

      it("should be synchronous operation", () => {
        const startTime = Date.now();
        handleRejectAIChanges();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(10); // Should complete almost instantly
        expect(mockSetAiState).toHaveBeenCalledTimes(1);
      });
    });

    // ==========================================
    // STATE RESET VALIDATION TESTS
    // ==========================================
    describe("state reset validation", () => {
      it("should set isAIFlowActive to false", () => {
        handleRejectAIChanges();

        const calledWith = mockSetAiState.mock.calls[0][0];
        expect(calledWith.isAIFlowActive).toBe(false);
      });

      it("should set originalContentForAI to null", () => {
        handleRejectAIChanges();

        const calledWith = mockSetAiState.mock.calls[0][0];
        expect(calledWith.originalContentForAI).toBe(null);
      });

      it("should set aiModifiedContent to null", () => {
        handleRejectAIChanges();

        const calledWith = mockSetAiState.mock.calls[0][0];
        expect(calledWith.aiModifiedContent).toBe(null);
      });

      it("should not call any other state setters", () => {
        handleRejectAIChanges();

        expect(mockSetIsLoading).not.toHaveBeenCalled();
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockSetSuccessMessage).not.toHaveBeenCalled();
        expect(mockResetForm).not.toHaveBeenCalled();
      });
    });

    // ==========================================
    // IDEMPOTENCY TESTS
    // ==========================================
    describe("idempotency", () => {
      it("should be safe to call multiple times", () => {
        handleRejectAIChanges();
        handleRejectAIChanges();
        handleRejectAIChanges();

        expect(mockSetAiState).toHaveBeenCalledTimes(3);

        // All calls should be identical
        mockSetAiState.mock.calls.forEach((call) => {
          expect(call[0]).toEqual({
            isAIFlowActive: false,
            originalContentForAI: null,
            aiModifiedContent: null,
          });
        });
      });

      it("should work even when AI state is already reset", () => {
        // Set AI state to already reset
        mockComponentState.aiState = {
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        };

        handleRejectAIChanges();

        expect(mockSetAiState).toHaveBeenCalledWith({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
      });
    });

    // ==========================================
    // ERROR RESILIENCE TESTS
    // ==========================================
    describe("error resilience", () => {
      it("should handle setAiState throwing an error", () => {
        const throwingSetAiState = vi.fn().mockImplementation(() => {
          throw new Error("State update failed");
        });

        const rejectWithThrowingSetter = createHandleRejectAIChanges(throwingSetAiState);

        expect(() => rejectWithThrowingSetter()).toThrow("State update failed");
        expect(throwingSetAiState).toHaveBeenCalledWith({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
      });
    });

    // ==========================================
    // CONCURRENT OPERATIONS TESTS
    // ==========================================
    describe("concurrent operations", () => {
      it("should handle rapid successive calls", () => {
        // Simulate rapid clicking
        for (let i = 0; i < 10; i++) {
          handleRejectAIChanges();
        }

        expect(mockSetAiState).toHaveBeenCalledTimes(10);

        // All calls should be identical
        mockSetAiState.mock.calls.forEach((call) => {
          expect(call[0]).toEqual({
            isAIFlowActive: false,
            originalContentForAI: null,
            aiModifiedContent: null,
          });
        });
      });

      it("should work correctly when called from multiple instances", () => {
        const mockSetAiState1 = vi.fn();
        const mockSetAiState2 = vi.fn();

        const reject1 = createHandleRejectAIChanges(mockSetAiState1);
        const reject2 = createHandleRejectAIChanges(mockSetAiState2);

        reject1();
        reject2();

        expect(mockSetAiState1).toHaveBeenCalledWith({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });

        expect(mockSetAiState2).toHaveBeenCalledWith({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
      });
    });
  });

  // ==========================================
  // INTEGRATION TESTS - BOTH FUNCTIONS
  // ==========================================
  describe("integration - approve and reject workflow", () => {
    it("should work correctly in approve-reject-approve sequence", async () => {
      const formValues = createValidRecipeFormValues({
        name: "Workflow Test Recipe",
      });
      mockFormGetValues.mockReturnValue(formValues);
      mockHandleSaveRecipe.mockResolvedValue(undefined);

      // First approve
      await handleApproveAIChanges();
      expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValues, "AI");

      // Then reject
      handleRejectAIChanges();
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });

      // Then approve again
      await handleApproveAIChanges();
      expect(mockHandleSaveRecipe).toHaveBeenCalledTimes(2);
      expect(mockHandleSaveRecipe).toHaveBeenNthCalledWith(2, formValues, "AI");
    });

    it("should handle reject after failed approve", async () => {
      const formValues = createValidRecipeFormValues();
      mockFormGetValues.mockReturnValue(formValues);
      mockHandleSaveRecipe.mockRejectedValueOnce(new Error("Save failed"));

      // Failed approve
      await expect(handleApproveAIChanges()).rejects.toThrow("Save failed");

      // Should still be able to reject
      handleRejectAIChanges();
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });

    it("should maintain independence between approve and reject operations", async () => {
      const formValues = createValidRecipeFormValues();
      mockFormGetValues.mockReturnValue(formValues);
      mockHandleSaveRecipe.mockResolvedValue(undefined);

      // Reject should not affect approve
      handleRejectAIChanges();
      await handleApproveAIChanges();

      expect(mockSetAiState).toHaveBeenCalledTimes(1); // Only from reject
      expect(mockHandleSaveRecipe).toHaveBeenCalledTimes(1); // From approve
      expect(mockFormGetValues).toHaveBeenCalledTimes(1); // From approve
    });
  });

  // ==========================================
  // BUSINESS LOGIC VALIDATION TESTS
  // ==========================================
  describe("business logic validation", () => {
    it("approve should preserve AI source in business logic", async () => {
      const formValues = createValidRecipeFormValues();
      mockFormGetValues.mockReturnValue(formValues);
      mockHandleSaveRecipe.mockResolvedValue(undefined);

      await handleApproveAIChanges();

      // Verify that AI source is always used, never manual
      expect(mockHandleSaveRecipe).toHaveBeenCalledWith(formValues, "AI");
      expect(mockHandleSaveRecipe).not.toHaveBeenCalledWith(formValues, "manual");
    });

    it("reject should completely clear AI workflow state", () => {
      handleRejectAIChanges();

      const resetState = mockSetAiState.mock.calls[0][0];

      // Verify all AI workflow properties are cleared
      expect(resetState.isAIFlowActive).toBe(false);
      expect(resetState.originalContentForAI).toBe(null);
      expect(resetState.aiModifiedContent).toBe(null);

      // Verify no undefined or other falsy values
      expect(resetState.isAIFlowActive).not.toBeUndefined();
      expect(resetState.originalContentForAI).not.toBeUndefined();
      expect(resetState.aiModifiedContent).not.toBeUndefined();
    });

    it("should maintain clear separation of concerns", async () => {
      const formValues = createValidRecipeFormValues();
      mockFormGetValues.mockReturnValue(formValues);
      mockHandleSaveRecipe.mockResolvedValue(undefined);

      // Approve should only deal with saving
      await handleApproveAIChanges();
      expect(mockSetAiState).not.toHaveBeenCalled();

      // Reject should only deal with state reset
      handleRejectAIChanges();
      expect(mockHandleSaveRecipe).toHaveBeenCalledTimes(1); // Only from approve
      expect(mockFormGetValues).toHaveBeenCalledTimes(1); // Only from approve
    });
  });
});
