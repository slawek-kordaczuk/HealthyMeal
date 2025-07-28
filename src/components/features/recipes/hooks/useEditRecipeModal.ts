import { useState, useCallback } from "react";

export type TabType = "manual" | "ai";

interface UseEditRecipeModalReturn {
  activeTab: TabType;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  handleTabChange: (tab: TabType) => void;
}

/**
 * Hook for managing edit recipe modal state.
 * Handles tab switching and submission states.
 */
export function useEditRecipeModal(): UseEditRecipeModalReturn {
  const [activeTab, setActiveTab] = useState<TabType>("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    isSubmitting,
    setIsSubmitting,
    handleTabChange,
  };
}
