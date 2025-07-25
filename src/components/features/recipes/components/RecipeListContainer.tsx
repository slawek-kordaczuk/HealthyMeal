import React from "react";
import { useRecipes } from "../hooks/useRecipes";
import { usePreferencesStatus } from "../../preferences/hooks/usePreferencesStatus";
import { useModalManagement } from "../../../common/useModalManagement";
import { useRecipeListOperations } from "../hooks/useRecipeListOperations";
import EnhancedRecipeSearchInput from "./EnhancedRecipeSearchInput";
import RecipeTable from "./RecipeTable";
import RecipePagination from "./RecipePagination";
import EditRecipeModal from "./EditRecipeModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import type { RecipeDTO, UpdateRecipeCommand } from "@/types/types";

export default function RecipeListContainer() {
  // Data fetching and state management
  const { recipes, pagination, isLoading, error, filters, setSearchTerm, setPage, refreshRecipes } = useRecipes();

  // Preferences status
  const { arePreferencesSet } = usePreferencesStatus();

  // Modal state management
  const { editModal, deleteModal, openEditModal, closeEditModal, openDeleteModal, closeDeleteModal } =
    useModalManagement();

  // Recipe operations
  const { updateRecipe, deleteRecipe } = useRecipeListOperations();

  // Event handlers
  const handleEditRecipe = (recipe: RecipeDTO) => {
    openEditModal(recipe);
  };

  const handleDeleteRecipe = (recipe: RecipeDTO) => {
    openDeleteModal(recipe);
  };

  const handleRecipeUpdate = async (recipeId: number, data: UpdateRecipeCommand) => {
    try {
      await updateRecipe(recipeId, data);
      closeEditModal();
      await refreshRecipes();
    } catch (error) {
      // Error is already handled and displayed by the hook
      console.error("Failed to update recipe:", error);
    }
  };

  const handleConfirmDelete = async (recipeId: number) => {
    try {
      await deleteRecipe(recipeId);
      closeDeleteModal();
      await refreshRecipes();
    } catch (error) {
      // Error is already handled and displayed by the hook
      console.error("Failed to delete recipe:", error);
    }
  };

  const handleNavigateToPreferences = () => {
    window.location.href = "/preferences";
  };

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="recipes-error-container">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4" data-testid="recipes-error-message">
            {error}
          </p>
          <button
            onClick={refreshRecipes}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            data-testid="recipes-retry-button"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="recipe-list-container">
      {/* Enhanced Search Input */}
      <EnhancedRecipeSearchInput
        searchQuery={filters.searchTerm}
        onSearchQueryChange={setSearchTerm}
        placeholder="Wyszukaj przepisy..."
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]" data-testid="recipes-loading-container">
          <div className="text-lg" data-testid="recipes-loading-message">
            Ładowanie przepisów...
          </div>
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
        isOpen={editModal.isOpen}
        recipeToEdit={editModal.data}
        onClose={closeEditModal}
        onRecipeUpdate={handleRecipeUpdate}
        preferencesAvailable={arePreferencesSet}
        onNavigateToPreferences={handleNavigateToPreferences}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        recipeToDelete={deleteModal.data}
        onClose={closeDeleteModal}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
