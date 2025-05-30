import React, { useState, useEffect } from "react";
import { useRecipes } from "../hooks/useRecipes";
import RecipeSearchInput from "./RecipeSearchInput.tsx";
import RecipeTable from "./RecipeTable.tsx";
import RecipePagination from "./RecipePagination.tsx";
import EditRecipeModal from "./EditRecipeModal.tsx";
import ConfirmDeleteModal from "./ConfirmDeleteModal.tsx";
import type { RecipeDTO, UpdateRecipeCommand } from "../../types/types";
import { toast } from "sonner";

export default function RecipeListContainer() {
  const { recipes, pagination, isLoading, error, filters, setSearchTerm, setPage, refreshRecipes } = useRecipes();

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecipeForEdit, setSelectedRecipeForEdit] = useState<RecipeDTO | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecipeForDelete, setSelectedRecipeForDelete] = useState<RecipeDTO | null>(null);

  // Preferences state - will be fetched on component mount
  const [arePreferencesSet, setArePreferencesSet] = useState(false);

  // Check if user has preferences set
  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const response = await fetch("/api/preferences");
        if (response.ok) {
          const preferences = await response.json();
          // Check if user has any meaningful preferences set
          setArePreferencesSet(
            preferences.diet_type ||
              preferences.daily_calorie_requirement ||
              preferences.allergies ||
              preferences.food_intolerances
          );
        }
      } catch (err) {
        console.error("Failed to check preferences:", err);
        setArePreferencesSet(false);
      }
    };

    checkPreferences();
  }, []);

  const handleEditRecipe = (recipe: RecipeDTO) => {
    setSelectedRecipeForEdit(recipe);
    setIsEditModalOpen(true);
  };

  const handleDeleteRecipe = (recipe: RecipeDTO) => {
    setSelectedRecipeForDelete(recipe);
    setIsDeleteModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRecipeForEdit(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRecipeForDelete(null);
  };

  const handleRecipeUpdate = async (recipeId: number, data: UpdateRecipeCommand) => {
    try {
      const response = await fetch("/api/recipes/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId, ...data }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Nie znaleziono przepisu.");
        }
        if (response.status === 401) {
          throw new Error("Sesja wygasła, zaloguj się ponownie.");
        }
        throw new Error("Nie udało się zaktualizować przepisu.");
      }

      toast.success("Przepis został zaktualizowany.");

      handleCloseEditModal();
      await refreshRecipes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      toast.error(errorMessage);
    }
  };

  const handleConfirmDelete = async (recipeId: number) => {
    try {
      const response = await fetch("/api/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Nie znaleziono przepisu.");
        }
        if (response.status === 401) {
          throw new Error("Sesja wygasła, zaloguj się ponownie.");
        }
        throw new Error("Nie udało się usunąć przepisu.");
      }

      toast.success("Przepis został usunięty.");

      handleCloseDeleteModal();
      await refreshRecipes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      toast.error(errorMessage);
    }
  };

  const handleNavigateToPreferences = () => {
    window.location.href = "/preferences";
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button onClick={refreshRecipes} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <RecipeSearchInput
        searchQuery={filters.searchTerm}
        onSearchQueryChange={setSearchTerm}
        placeholder="Wyszukaj przepisy..."
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg">Ładowanie przepisów...</div>
        </div>
      )}

      {/* Recipes Table */}
      {!isLoading && (
        <RecipeTable recipes={recipes} onEditRecipe={handleEditRecipe} onDeleteRecipe={handleDeleteRecipe} />
      )}

      {/* Pagination */}
      {pagination && <RecipePagination paginationData={pagination} onPageChange={setPage} />}

      {/* Edit Recipe Modal */}
      <EditRecipeModal
        isOpen={isEditModalOpen}
        recipeToEdit={selectedRecipeForEdit}
        onClose={handleCloseEditModal}
        onRecipeUpdate={handleRecipeUpdate}
        preferencesAvailable={arePreferencesSet}
        onNavigateToPreferences={handleNavigateToPreferences}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        recipeToDelete={selectedRecipeForDelete}
        onClose={handleCloseDeleteModal}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
