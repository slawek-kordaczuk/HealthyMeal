import { useState, useCallback } from "react";
import type { RecipeDTO } from "@/types/types";

interface ModalState<T = unknown> {
  isOpen: boolean;
  data: T | null;
}

interface UseModalManagementReturn {
  editModal: ModalState<RecipeDTO>;
  deleteModal: ModalState<RecipeDTO>;
  openEditModal: (recipe: RecipeDTO) => void;
  closeEditModal: () => void;
  openDeleteModal: (recipe: RecipeDTO) => void;
  closeDeleteModal: () => void;
}

/**
 * Hook for managing modal states across the application.
 * Handles edit and delete modal states with associated data.
 */
export function useModalManagement(): UseModalManagementReturn {
  const [editModal, setEditModal] = useState<ModalState<RecipeDTO>>({
    isOpen: false,
    data: null,
  });

  const [deleteModal, setDeleteModal] = useState<ModalState<RecipeDTO>>({
    isOpen: false,
    data: null,
  });

  const openEditModal = useCallback((recipe: RecipeDTO) => {
    setEditModal({
      isOpen: true,
      data: recipe,
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({
      isOpen: false,
      data: null,
    });
  }, []);

  const openDeleteModal = useCallback((recipe: RecipeDTO) => {
    setDeleteModal({
      isOpen: true,
      data: recipe,
    });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      data: null,
    });
  }, []);

  return {
    editModal,
    deleteModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
  };
}
