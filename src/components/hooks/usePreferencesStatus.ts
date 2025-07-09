import { useState, useEffect, useCallback } from "react";

interface UsePreferencesStatusReturn {
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
  const [arePreferencesSet, setArePreferencesSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/preferences");
      if (response.ok) {
        const preferences = await response.json();
        // Check if user has any meaningful preferences set
        const hasPreferences = Boolean(
          preferences.diet_type ||
            preferences.daily_calorie_requirement ||
            preferences.allergies ||
            preferences.food_intolerances
        );
        setArePreferencesSet(hasPreferences);
      } else {
        throw new Error("Failed to fetch preferences");
      }
    } catch (err) {
      console.error("Failed to check preferences:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setArePreferencesSet(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPreferences();
  }, [checkPreferences]);

  return {
    arePreferencesSet,
    isLoading,
    error,
    refetch: checkPreferences,
  };
}
