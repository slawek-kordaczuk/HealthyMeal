import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePreferencesStatus } from "../preferences/hooks/usePreferencesStatus";
import type {
  CreateRecipeCommand,
  RecipeDTO,
  RecipeModificationCommand,
  RecipeModificationResponseDTO,
} from "../../types/types";

// Shadcn/ui components
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";

// Sub-components
import AIPreviewSection from "../AIPreviewSection";
import ConfirmAIModificationModal from "../ConfirmAIModificationModal";

// Zod schema for form validation
const recipeFormSchema = z.object({
  name: z.string().min(1, "Nazwa przepisu jest wymagana"),
  rating: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Optional field
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 10;
    }, "Ocena musi być liczbą od 1 do 10"),
  recipeContent: z
    .string()
    .min(1, "Treść przepisu jest wymagana")
    .refine((content) => {
      // Validate JSON.stringify length for recipe.instructions
      const recipeJson = JSON.stringify({ instructions: content });
      return recipeJson.length >= 100 && recipeJson.length <= 10000;
    }, "Treść przepisu musi mieć odpowiednią długość (po konwersji do formatu zapisu: 100-10000 znaków)"),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

// Internal state interface
interface AddRecipeFormState {
  isAIFlowActive: boolean;
  originalContentForAI: string | null;
  aiModifiedContent: string | null;
}

export default function RecipeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // AI flow state
  const [aiState, setAiState] = useState<AddRecipeFormState>({
    isAIFlowActive: false,
    originalContentForAI: null,
    aiModifiedContent: null,
  });

  // Get user preferences - only if authenticated
  const { arePreferencesSet, isLoading: preferencesLoading } = usePreferencesStatus();

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      rating: "",
      recipeContent: "",
    },
  });

  // Get user session on component mount
  React.useEffect(() => {
    const getUserSession = async () => {
      try {
        setIsCheckingAuth(true);

        // Check authentication by trying to access protected API
        const response = await fetch("/api/preferences", {
          method: "GET",
          credentials: "include",
        });

        // If we get 401, user is not authenticated
        // If we get 200 or 404 (no preferences), user is authenticated
        const isUserAuthenticated = response.status !== 401;

        if (!isUserAuthenticated) {
          setIsAuthenticated(false);
          setUserId(null);
          return;
        }

        setIsAuthenticated(true);
        // For now, we don't need the specific userId in the component
        // since all API calls will use the session from cookies
        setUserId("authenticated");
      } catch (err) {
        console.error("Error getting session:", err);
        setIsAuthenticated(false);
        setUserId(null);
        setError("Wystąpił błąd podczas pobierania sesji użytkownika.");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    getUserSession();
  }, []);

  const resetForm = () => {
    form.reset();
    setAiState({
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    });
    setError(null);
    // Don't reset success message here - let it show to the user
  };

  const handleSaveRecipe = async (values: RecipeFormValues, source: "manual" | "AI" = "manual") => {
    if (!userId) {
      setError("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Prepare recipe content
      const recipeContent =
        source === "AI" && aiState.aiModifiedContent ? aiState.aiModifiedContent : values.recipeContent;

      const payload: CreateRecipeCommand = {
        name: values.name,
        rating: values.rating && values.rating !== "" ? Number(values.rating) : undefined,
        source,
        recipe: { instructions: recipeContent },
      };

      const response = await fetch("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError("Przepis o tej nazwie już istnieje.");
          return;
        }
        if (response.status === 401) {
          setError("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }
        throw new Error("Failed to create recipe");
      }

      const createdRecipe: RecipeDTO = await response.json();
      setSuccessMessage(`Przepis "${createdRecipe.name}" został pomyślnie zapisany!`);
      resetForm();
    } catch (err) {
      console.error("Error creating recipe:", err);
      setError("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyWithAI = async (values: RecipeFormValues) => {
    if (!userId) {
      setError("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      return;
    }

    // Check if preferences are set
    if (!arePreferencesSet) {
      setShowPreferencesModal(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Set AI flow state
      setAiState({
        isAIFlowActive: true,
        originalContentForAI: values.recipeContent,
        aiModifiedContent: null,
      });

      const payload: RecipeModificationCommand = {
        recipe_text: values.recipeContent,
      };

      const response = await fetch("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = "Failed to modify recipe with AI";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status-based message
          if (response.status === 422) {
            errorMessage = "User preferences not found. Please set your dietary preferences first.";
          } else if (response.status === 401) {
            errorMessage = "Unauthorized. Please log in again.";
          }
        }
        throw new Error(errorMessage);
      }

      const modificationResult: RecipeModificationResponseDTO = await response.json();

      setAiState((prev) => ({
        ...prev,
        aiModifiedContent: modificationResult.modified_recipe,
      }));
    } catch (err) {
      console.error("Error modifying recipe with AI:", err);

      // Check if the error is related to missing preferences
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isPreferencesError =
        errorMessage.toLowerCase().includes("preferences") || errorMessage.toLowerCase().includes("not found");

      if (isPreferencesError) {
        // Don't reset AI flow - show preferences modal instead
        setShowPreferencesModal(true);
        setError("Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI.");
      } else {
        // For other errors, reset AI flow
        setError("Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie.");
        setAiState({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAIChanges = async () => {
    const values = form.getValues();
    await handleSaveRecipe(values, "AI");
  };

  const handleRejectAIChanges = () => {
    setAiState({
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    });
  };

  const handleGoToPreferences = () => {
    setShowPreferencesModal(false);
    // Navigate to preferences page
    window.location.href = "/preferences";
  };

  const onSubmit = async (values: RecipeFormValues) => {
    // Clear any existing success message when starting a new action
    setSuccessMessage(null);
    await handleSaveRecipe(values, "manual");
  };

  const onSubmitWithAI = async () => {
    // Clear any existing success message when starting a new action
    setSuccessMessage(null);
    const values = form.getValues();
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    await handleModifyWithAI(values);
  };

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Sprawdzanie autentyczności...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Musisz być zalogowany, aby dodać przepis. Skontaktuj się z administratorem systemu w celu uzyskania dostępu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (preferencesLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Ładowanie preferencji...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="recipe-form-container">
      {error && (
        <Alert variant="destructive" data-testid="recipe-form-error-alert">
          <AlertDescription data-testid="recipe-form-error-message">{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert data-testid="recipe-form-success-alert">
          <AlertDescription className="text-green-700" data-testid="recipe-form-success-message">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="recipe-form">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem data-testid="recipe-name-field">
                <FormLabel>Nazwa przepisu</FormLabel>
                <FormControl>
                  <Input placeholder="Wprowadź nazwę przepisu" {...field} data-testid="recipe-name-input" />
                </FormControl>
                <FormMessage data-testid="recipe-name-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem data-testid="recipe-rating-field">
                <FormLabel>Ocena (opcjonalnie)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="1-10"
                    {...field}
                    data-testid="recipe-rating-input"
                  />
                </FormControl>
                <FormMessage data-testid="recipe-rating-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recipeContent"
            render={({ field }) => (
              <FormItem data-testid="recipe-content-field">
                <FormLabel>Treść przepisu</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Wprowadź instrukcje przygotowania przepisu..."
                    className="min-h-[200px]"
                    {...field}
                    data-testid="recipe-content-input"
                  />
                </FormControl>
                <FormMessage data-testid="recipe-content-error" />
              </FormItem>
            )}
          />

          <div className="flex gap-4" data-testid="recipe-form-buttons">
            <Button type="submit" disabled={isLoading} className="flex-1" data-testid="recipe-save-button">
              {isLoading ? "Zapisywanie..." : "Zapisz"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onSubmitWithAI}
              disabled={isLoading}
              className="flex-1"
              data-testid="recipe-save-with-ai-button"
            >
              {isLoading ? "Modyfikowanie..." : "Zapisz i modyfikuj z AI"}
            </Button>
          </div>
        </form>
      </Form>

      {/* AI Preview Section */}
      {aiState.isAIFlowActive && aiState.originalContentForAI && aiState.aiModifiedContent && (
        <AIPreviewSection
          originalContent={aiState.originalContentForAI}
          modifiedContent={aiState.aiModifiedContent}
          onApprove={handleApproveAIChanges}
          onReject={handleRejectAIChanges}
        />
      )}

      {/* Confirm AI Modification Modal */}
      <ConfirmAIModificationModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onGoToPreferences={handleGoToPreferences}
      />
    </div>
  );
}
