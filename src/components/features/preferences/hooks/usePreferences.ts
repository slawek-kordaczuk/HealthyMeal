import { useState, useCallback } from "react";
import type { PreferencesDTO, PreferencesCommandDTO } from "@/types/types";
import type { UseFormReturn } from "react-hook-form";
import type { PreferencesFormValues } from "../PreferencesForm";

interface UsePreferencesOptions {
  form: UseFormReturn<PreferencesFormValues>;
}

interface UsePreferencesReturn {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  preferencesId: number | undefined;
  fetchPreferences: () => Promise<void>;
  savePreferences: (values: PreferencesFormValues) => Promise<void>;
  clearMessages: () => void;
}

export function usePreferences({ form }: UsePreferencesOptions): UsePreferencesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preferencesId, setPreferencesId] = useState<number | undefined>(undefined);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleApiError = useCallback((err: unknown) => {
    console.error("API Error:", err);

    if (err instanceof Error) {
      switch (err.message) {
        case "Unauthorized":
          return "Sesja wygasła. Zaloguj się ponownie.";
        case "Forbidden":
          return "Nie masz uprawnień do wykonania tej operacji.";
        case "Invalid data":
          return "Wprowadzone dane są nieprawidłowe. Sprawdź formularz i spróbuj ponownie.";
        default:
          return "Wystąpił błąd podczas operacji. Spróbuj ponownie później.";
      }
    }

    return "Wystąpił nieoczekiwany błąd.";
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      clearMessages();

      const response = await fetch("/api/preferences", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 404) {
        // User has no preferences yet - this is normal for new users
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch preferences");
      }

      const preferences: PreferencesDTO = await response.json();

      // Update form with fetched preferences
      setPreferencesId(preferences.id);
      form.reset({
        id: preferences.id,
        diet_type: preferences.diet_type || "",
        daily_calorie_requirement: preferences.daily_calorie_requirement,
        allergies: preferences.allergies || "",
        food_intolerances: preferences.food_intolerances || "",
        preferred_cuisines: preferences.preferred_cuisines || "",
        excluded_ingredients: preferences.excluded_ingredients || "",
        macro_distribution_protein: preferences.macro_distribution_protein,
        macro_distribution_fats: preferences.macro_distribution_fats,
        macro_distribution_carbohydrates: preferences.macro_distribution_carbohydrates,
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [form, clearMessages, handleApiError]);

  const savePreferences = useCallback(
    async (values: PreferencesFormValues) => {
      try {
        setIsLoading(true);
        clearMessages();

        // Prepare payload - userId will be set by the server from the authenticated session
        const payload: Omit<PreferencesCommandDTO, "userId"> = {
          diet_type: values.diet_type || null,
          daily_calorie_requirement: values.daily_calorie_requirement ?? null,
          allergies: values.allergies || null,
          food_intolerances: values.food_intolerances || null,
          preferred_cuisines: values.preferred_cuisines || null,
          excluded_ingredients: values.excluded_ingredients || null,
          macro_distribution_protein: values.macro_distribution_protein ?? null,
          macro_distribution_fats: values.macro_distribution_fats ?? null,
          macro_distribution_carbohydrates: values.macro_distribution_carbohydrates ?? null,
        };

        // Include id if updating existing preferences
        if (preferencesId) {
          (payload as PreferencesCommandDTO).id = preferencesId;
        }

        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          } else if (response.status === 403) {
            throw new Error("Forbidden");
          } else if (response.status === 400) {
            throw new Error("Invalid data");
          } else {
            throw new Error("Server error");
          }
        }

        const savedPreferences: PreferencesDTO = await response.json();
        setPreferencesId(savedPreferences.id);
        setSuccessMessage("Preferencje zostały zapisane pomyślnie!");

        // Update form with saved data
        form.reset({
          ...values,
          id: savedPreferences.id,
        });
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [preferencesId, form, clearMessages, handleApiError]
  );

  return {
    isLoading,
    error,
    successMessage,
    preferencesId,
    fetchPreferences,
    savePreferences,
    clearMessages,
  };
}
