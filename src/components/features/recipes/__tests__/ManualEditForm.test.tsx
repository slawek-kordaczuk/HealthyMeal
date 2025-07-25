import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManualEditForm from "../ManualEditForm";
import type { RecipeDTO } from "@/types/types";

const mockRecipe: RecipeDTO = {
  id: 1,
  name: "Test Recipe",
  rating: 5,
  recipe: { instructions: "Test recipe instructions" },
  source: "manual",
  created_at: "2023-01-01",
  updated_at: "2023-01-01",
};

describe("ManualEditForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render form with recipe data", () => {
    render(<ManualEditForm recipe={mockRecipe} onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

    expect(screen.getByDisplayValue("Test Recipe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test recipe instructions")).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    const user = userEvent.setup();

    render(<ManualEditForm recipe={mockRecipe} onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

    const nameInput = screen.getByLabelText(/nazwa przepisu/i);
    await user.clear(nameInput);

    await waitFor(() => {
      expect(screen.getByText("Nazwa przepisu jest wymagana")).toBeInTheDocument();
    });
  });

  it("should validate recipe content length", async () => {
    const user = userEvent.setup();

    render(<ManualEditForm recipe={mockRecipe} onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

    const contentTextarea = screen.getByLabelText(/zawartość przepisu/i);
    await user.clear(contentTextarea);
    await user.type(contentTextarea, "Short");

    await waitFor(() => {
      expect(screen.getByText("Przepis musi mieć co najmniej 10 znaków")).toBeInTheDocument();
    });
  });

  it("should call onSubmit with correct data", async () => {
    const user = userEvent.setup();

    render(<ManualEditForm recipe={mockRecipe} onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

    const submitButton = screen.getByTestId("manual-edit-save-button");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "Test Recipe",
        rating: 5,
        recipe: { instructions: "Test recipe instructions" },
      });
    });
  });

  it("should call onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();

    render(<ManualEditForm recipe={mockRecipe} onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={false} />);

    const cancelButton = screen.getByTestId("manual-edit-cancel-button");
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should disable buttons when submitting", () => {
    render(<ManualEditForm recipe={mockRecipe} onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />);

    expect(screen.getByTestId("manual-edit-save-button")).toBeDisabled();
    expect(screen.getByTestId("manual-edit-cancel-button")).toBeDisabled();
  });
});
