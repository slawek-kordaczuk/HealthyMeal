import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePreferencesStatus } from "../preferences/hooks/usePreferencesStatus";
import { useAuth } from "../hooks/useAuth";
import { useRecipeOperations } from "../hooks/useRecipeOperations";
import type { RecipeFormValues } from "../../types/types";

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

export default function RecipeForm() {
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Custom hooks
  const auth = useAuth();
  const { arePreferencesSet, isLoading: preferencesLoading } = usePreferencesStatus();
  const { isLoading, error, successMessage, aiState, createRecipe, modifyWithAI, rejectAIChanges, clearMessages } =
    useRecipeOperations();

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      rating: "",
      recipeContent: "",
    },
  });

  const resetFormOnly = () => {
    form.reset();
  };

  const handleSaveRecipe = async (values: RecipeFormValues, source: "manual" | "AI" = "manual") => {
    if (!auth.userId) {
      return;
    }

    clearMessages();
    const result = await createRecipe(values, source, auth.userId);

    if (result) {
      resetFormOnly(); // Reset form but keep success message visible
    }
  };

  const handleModifyWithAI = async (values: RecipeFormValues) => {
    if (!auth.userId) {
      return;
    }

    clearMessages();
    const result = await modifyWithAI(values, auth.userId, arePreferencesSet);

    if (result.needsPreferences) {
      setShowPreferencesModal(true);
    }
  };

  const handleApproveAIChanges = async () => {
    if (!auth.userId) {
      return;
    }

    const values = form.getValues();
    clearMessages();
    const result = await createRecipe(values, "AI", auth.userId);

    if (result) {
      resetFormOnly(); // Reset form but keep success message visible
    }
  };

  const handleRejectAIChanges = () => {
    rejectAIChanges();
  };

  const handleGoToPreferences = () => {
    setShowPreferencesModal(false);
    window.location.href = "/preferences";
  };

  const onSubmit = async (values: RecipeFormValues) => {
    await handleSaveRecipe(values, "manual");
  };

  const onSubmitWithAI = async () => {
    const values = form.getValues();
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    await handleModifyWithAI(values);
  };

  // Loading states
  if (auth.isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Sprawdzanie autentyczności...</div>
      </div>
    );
  }

  // Authentication check
  if (!auth.isAuthenticated) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Musisz być zalogowany, aby dodać przepis. Skontaktuj się z administratorem systemu w celu uzyskania dostępu.
          </AlertDescription>
        </Alert>
        {auth.error && (
          <Alert variant="destructive">
            <AlertDescription>{auth.error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Preferences loading
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
