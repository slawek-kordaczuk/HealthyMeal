import { useState, useEffect, useCallback } from "react";
import type { PreferencesDTO } from "@/types/types";

interface UsePreferencesStatusReturn {
  preferences: PreferencesDTO | null;
  arePreferencesSet: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for checking and managing user preferences status.
 * Determines if user has meaningful preferences set for AI operations.
 */
export function usePreferencesStatus(): UsePreferencesStatusReturn {
  const [preferences, setPreferences] = useState<PreferencesDTO | null>(null);
  const [arePreferencesSet, setArePreferencesSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/preferences", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const fetchedPreferences = await response.json();
        setPreferences(fetchedPreferences);
        // Check if user has any meaningful preferences set
        const hasPreferences = Boolean(
          fetchedPreferences?.diet_type ||
            fetchedPreferences?.daily_calorie_requirement ||
            fetchedPreferences?.allergies ||
            fetchedPreferences?.food_intolerances ||
            fetchedPreferences?.preferred_cuisines ||
            fetchedPreferences?.excluded_ingredients ||
            fetchedPreferences?.macro_distribution_protein ||
            fetchedPreferences?.macro_distribution_fats ||
            fetchedPreferences?.macro_distribution_carbohydrates
        );
        setArePreferencesSet(hasPreferences);
      } else if (response.status === 404) {
        // 404 means no preferences found - this is not an error
        setPreferences(null);
        setArePreferencesSet(false);
      } else if (response.status === 401) {
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      } else {
        throw new Error("Nie udało się załadować preferencji.");
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
      if (err instanceof Error && err.message.includes("Sesja wygasła")) {
        setError(err.message);
      } else {
        setError("Nie udało się załadować preferencji.");
      }
      setPreferences(null);
      setArePreferencesSet(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPreferences();
  }, [checkPreferences]);

  return {
    preferences,
    arePreferencesSet,
    isLoading,
    error,
    refetch: checkPreferences,
  };
}
