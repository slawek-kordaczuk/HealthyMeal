import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useModalManagement } from "@/components/common/useModalManagement";
import type { RecipeDTO } from "@/types/types";

describe("useModalManagement", () => {
  const mockRecipe: RecipeDTO = {
    id: 1,
    name: "Test Recipe",
    rating: 5,
    source: "manual",
    recipe: { instructions: "Test instructions" },
    created_at: "2024-01-01T00:00:00Z",
  };

  it("should initialize with closed modals", () => {
    const { result } = renderHook(() => useModalManagement());

    expect(result.current.editModal.isOpen).toBe(false);
    expect(result.current.editModal.data).toBeNull();
    expect(result.current.deleteModal.isOpen).toBe(false);
    expect(result.current.deleteModal.data).toBeNull();
  });

  it("should open edit modal with recipe data", () => {
    const { result } = renderHook(() => useModalManagement());

    act(() => {
      result.current.openEditModal(mockRecipe);
    });

    expect(result.current.editModal.isOpen).toBe(true);
    expect(result.current.editModal.data).toEqual(mockRecipe);
    expect(result.current.deleteModal.isOpen).toBe(false);
  });

  it("should close edit modal and clear data", () => {
    const { result } = renderHook(() => useModalManagement());

    // First open the modal
    act(() => {
      result.current.openEditModal(mockRecipe);
    });

    // Then close it
    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.editModal.isOpen).toBe(false);
    expect(result.current.editModal.data).toBeNull();
  });

  it("should open delete modal with recipe data", () => {
    const { result } = renderHook(() => useModalManagement());

    act(() => {
      result.current.openDeleteModal(mockRecipe);
    });

    expect(result.current.deleteModal.isOpen).toBe(true);
    expect(result.current.deleteModal.data).toEqual(mockRecipe);
    expect(result.current.editModal.isOpen).toBe(false);
  });

  it("should close delete modal and clear data", () => {
    const { result } = renderHook(() => useModalManagement());

    // First open the modal
    act(() => {
      result.current.openDeleteModal(mockRecipe);
    });

    // Then close it
    act(() => {
      result.current.closeDeleteModal();
    });

    expect(result.current.deleteModal.isOpen).toBe(false);
    expect(result.current.deleteModal.data).toBeNull();
  });

  it("should handle multiple modal operations independently", () => {
    const { result } = renderHook(() => useModalManagement());

    const anotherRecipe: RecipeDTO = {
      ...mockRecipe,
      id: 2,
      name: "Another Recipe",
    };

    // Open edit modal
    act(() => {
      result.current.openEditModal(mockRecipe);
    });

    expect(result.current.editModal.isOpen).toBe(true);
    expect(result.current.editModal.data).toEqual(mockRecipe);

    // Open delete modal (should not affect edit modal)
    act(() => {
      result.current.openDeleteModal(anotherRecipe);
    });

    expect(result.current.editModal.isOpen).toBe(true);
    expect(result.current.editModal.data).toEqual(mockRecipe);
    expect(result.current.deleteModal.isOpen).toBe(true);
    expect(result.current.deleteModal.data).toEqual(anotherRecipe);

    // Close edit modal (should not affect delete modal)
    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.editModal.isOpen).toBe(false);
    expect(result.current.editModal.data).toBeNull();
    expect(result.current.deleteModal.isOpen).toBe(true);
    expect(result.current.deleteModal.data).toEqual(anotherRecipe);
  });
});
