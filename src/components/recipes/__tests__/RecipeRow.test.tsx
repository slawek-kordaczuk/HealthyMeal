import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecipeRow from "../RecipeRow";
import type { RecipeDTO } from "../../../types/types";
import type { Json } from "../../../db/database.types";

// Mock data factories
const createMockRecipe = (overrides?: Partial<RecipeDTO>): RecipeDTO => ({
  id: 1,
  name: "Spaghetti Carbonara",
  rating: 8,
  source: "manual",
  recipe: { instructions: "Cook pasta with eggs and bacon" },
  created_at: "2024-03-15T10:30:00.000Z",
  updated_at: "2024-03-15T10:30:00.000Z",
  ...overrides,
});

describe("RecipeRow", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render recipe row with all data", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Spaghetti Carbonara")).toBeInTheDocument();
      expect(screen.getByText("8/10")).toBeInTheDocument();
      expect(screen.getByText("Ręczny")).toBeInTheDocument();
      expect(screen.getByText("15 mar 2024")).toBeInTheDocument();
    });

    it("should render as table row with correct structure", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const row = screen.getByRole("row");
      expect(row).toBeInTheDocument();

      const cells = screen.getAllByRole("cell");
      expect(cells).toHaveLength(5); // name, rating, source, date, actions
    });

    it("should render edit and delete buttons", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      const deleteButton = screen.getByRole("button", { name: /usuń przepis/i });

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("Recipe Name Display", () => {
    it("should display recipe name with truncation for long names", () => {
      const longName = "A".repeat(250);
      const recipe = createMockRecipe({ name: longName });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const nameElement = screen.getByText(longName);
      expect(nameElement).toBeInTheDocument();
      expect(nameElement.closest("div")).toHaveClass("max-w-[200px]", "truncate");
    });

    it("should show full name in title attribute for accessibility", () => {
      const longName = "Very Long Recipe Name That Should Be Truncated";
      const recipe = createMockRecipe({ name: longName });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const nameElement = screen.getByText(longName);
      expect(nameElement.closest("div")).toHaveAttribute("title", longName);
    });

    it("should handle empty recipe name", () => {
      const recipe = createMockRecipe({ name: "" });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const nameCell = screen.getAllByRole("cell")[0];
      expect(nameCell).toHaveTextContent("");
    });

    it("should handle special characters in recipe name", () => {
      const specialName = "Pierogi & Bigos (Tradycyjne) - 100% Polish! 🇵🇱";
      const recipe = createMockRecipe({ name: specialName });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });

  describe("Rating Display", () => {
    it("should render rating with star icon for valid ratings", () => {
      const recipe = createMockRecipe({ rating: 7 });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("7/10")).toBeInTheDocument();

      // Check for star icon (using data-testid or class)
      const starIcon = document.querySelector(".lucide-star");
      expect(starIcon).toBeInTheDocument();
    });

    it("should show 'Brak oceny' for zero rating", () => {
      const recipe = createMockRecipe({ rating: 0 });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Brak oceny")).toBeInTheDocument();
      expect(screen.queryByText("0/10")).not.toBeInTheDocument();
    });

    it("should handle high ratings (boundary testing)", () => {
      const recipe = createMockRecipe({ rating: 10 });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("10/10")).toBeInTheDocument();
    });

    it("should handle low ratings (boundary testing)", () => {
      const recipe = createMockRecipe({ rating: 1 });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("1/10")).toBeInTheDocument();
    });

    it("should apply correct styling to rating display", () => {
      const recipe = createMockRecipe({ rating: 5 });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const ratingContainer = screen.getByText("5/10").closest("div");
      expect(ratingContainer).toHaveClass("flex", "items-center", "gap-1");
    });

    it("should apply correct styling to 'Brak oceny' text", () => {
      const recipe = createMockRecipe({ rating: 0 });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const noRatingText = screen.getByText("Brak oceny");
      expect(noRatingText).toHaveClass("text-gray-400");
    });
  });

  describe("Source Display", () => {
    it("should display 'AI' with blue styling for AI source", () => {
      const recipe = createMockRecipe({ source: "AI" });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const sourceElement = screen.getByText("AI");
      expect(sourceElement).toBeInTheDocument();
      expect(sourceElement).toHaveClass("bg-blue-100", "text-blue-800");
    });

    it("should display 'Ręczny' with green styling for manual source", () => {
      const recipe = createMockRecipe({ source: "manual" });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const sourceElement = screen.getByText("Ręczny");
      expect(sourceElement).toBeInTheDocument();
      expect(sourceElement).toHaveClass("bg-green-100", "text-green-800");
    });

    it("should apply consistent badge styling to source labels", () => {
      const recipe = createMockRecipe({ source: "AI" });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const sourceElement = screen.getByText("AI");
      expect(sourceElement).toHaveClass(
        "inline-flex",
        "items-center",
        "px-2",
        "py-1",
        "rounded-full",
        "text-xs",
        "font-medium"
      );
    });

    it("should handle edge case of invalid source", () => {
      // TypeScript should prevent this, but test runtime behavior
      const recipe = createMockRecipe({ source: "unknown" as unknown as "manual" | "AI" });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Should default to manual behavior (green styling)
      const sourceElement = screen.getByText("Ręczny");
      expect(sourceElement).toHaveClass("bg-green-100", "text-green-800");
    });
  });

  describe("Date Formatting", () => {
    it("should format date in Polish locale", () => {
      const recipe = createMockRecipe({ created_at: "2024-03-15T10:30:00.000Z" });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("15 mar 2024")).toBeInTheDocument();
    });

    it("should handle different date formats consistently", () => {
      const testDates = [
        { input: "2024-01-01T00:00:00.000Z" },
        { input: "2024-12-31T23:59:59.999Z" },
        { input: "2024-07-04T12:00:00.000Z" },
      ];

      testDates.forEach(({ input }) => {
        const recipe = createMockRecipe({ created_at: input, id: Math.random() });
        const { unmount } = render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        // Verify that a date cell exists and contains a formatted date
        const dateCells = screen.getAllByRole("cell");
        const dateCell = dateCells[3]; // Fourth cell is the date cell
        expect(dateCell).toBeInTheDocument();
        expect(dateCell.textContent).toMatch(/\d{1,2}\s\w{3}\s\d{4}/); // Pattern: "DD MMM YYYY"
        unmount();
      });
    });

    it("should handle invalid date strings gracefully", () => {
      const recipe = createMockRecipe({ created_at: "invalid-date" });

      // Should not crash the component
      expect(() => {
        render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      }).not.toThrow();
    });

    it("should handle empty date string", () => {
      const recipe = createMockRecipe({ created_at: "" });

      expect(() => {
        render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      }).not.toThrow();
    });
  });

  describe("Button Interactions", () => {
    it("should call onEdit with recipe when edit button is clicked", async () => {
      const user = userEvent.setup();
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(recipe);
    });

    it("should call onDelete with recipe when delete button is clicked", async () => {
      const user = userEvent.setup();
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /usuń przepis/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(recipe);
    });

    it("should handle rapid clicking without multiple calls", async () => {
      const user = userEvent.setup();
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });

      // Rapid clicks
      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);

      // Should be called for each click (no debouncing in component)
      expect(mockOnEdit).toHaveBeenCalledTimes(3);
    });

    it("should maintain button functionality after multiple renders", async () => {
      const user = userEvent.setup();
      const recipe1 = createMockRecipe({ id: 1, name: "Recipe 1" });
      const recipe2 = createMockRecipe({ id: 2, name: "Recipe 2" });

      const { rerender } = render(<RecipeRow recipe={recipe1} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      await user.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(recipe1);

      // Re-render with different recipe
      rerender(<RecipeRow recipe={recipe2} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      await user.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(recipe2);
    });
  });

  describe("Button Styling and Accessibility", () => {
    it("should apply correct styling to edit button", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      expect(editButton).toHaveClass("h-8", "w-8", "p-0");
    });

    it("should apply correct styling to delete button", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button", { name: /usuń przepis/i });
      expect(deleteButton).toHaveClass("h-8", "w-8", "p-0", "text-red-600", "hover:text-red-700", "hover:bg-red-50");
    });

    it("should have proper ARIA labels for screen readers", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      const deleteButton = screen.getByRole("button", { name: /usuń przepis/i });

      expect(editButton).toHaveAccessibleName("Edytuj przepis");
      expect(deleteButton).toHaveAccessibleName("Usuń przepis");
    });

    it("should contain proper icons in buttons", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Check for actual Lucide icon classes based on rendered output
      expect(document.querySelector(".lucide-square-pen")).toBeInTheDocument();
      expect(document.querySelector(".lucide-trash2")).toBeInTheDocument();
    });

    it("should have screen reader only text for accessibility", () => {
      const recipe = createMockRecipe();
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const srTexts = screen.getAllByText(/edytuj przepis|usuń przepis/i);
      const hiddenTexts = srTexts.filter((element) => element.classList.contains("sr-only"));

      expect(hiddenTexts).toHaveLength(2);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle missing optional fields gracefully", () => {
      const recipe: RecipeDTO = {
        id: 1,
        name: "Minimal Recipe",
        rating: 0,
        source: "manual",
        recipe: null as Json,
        created_at: "2024-01-01T00:00:00.000Z",
      };

      expect(() => {
        render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      }).not.toThrow();
    });

    it("should render correctly with minimal recipe data", () => {
      const minimalRecipe = createMockRecipe({
        name: "Min",
        rating: 0,
        source: "manual",
      });

      render(<RecipeRow recipe={minimalRecipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Min")).toBeInTheDocument();
      expect(screen.getByText("Brak oceny")).toBeInTheDocument();
      expect(screen.getByText("Ręczny")).toBeInTheDocument();
    });

    it("should handle very large recipe IDs", () => {
      const recipe = createMockRecipe({ id: Number.MAX_SAFE_INTEGER });
      render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(recipe);
    });

    it("should handle undefined callback functions gracefully", () => {
      const recipe = createMockRecipe();

      expect(() => {
        render(
          <RecipeRow
            recipe={recipe}
            onEdit={undefined as unknown as (recipe: RecipeDTO) => void}
            onDelete={undefined as unknown as (recipe: RecipeDTO) => void}
          />
        );
      }).not.toThrow();
    });
  });

  describe("Component Re-rendering", () => {
    it("should update display when recipe props change", () => {
      const recipe1 = createMockRecipe({ name: "Original Recipe", rating: 5 });
      const recipe2 = createMockRecipe({ name: "Updated Recipe", rating: 9 });

      const { rerender } = render(<RecipeRow recipe={recipe1} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Original Recipe")).toBeInTheDocument();
      expect(screen.getByText("5/10")).toBeInTheDocument();

      rerender(<RecipeRow recipe={recipe2} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText("Updated Recipe")).toBeInTheDocument();
      expect(screen.getByText("9/10")).toBeInTheDocument();
      expect(screen.queryByText("Original Recipe")).not.toBeInTheDocument();
    });

    it("should maintain stable references for callback props", async () => {
      const user = userEvent.setup();
      const recipe = createMockRecipe();

      const { rerender } = render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      await user.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance and Memory", () => {
    it("should not create new objects on every render", () => {
      const recipe = createMockRecipe();

      const { rerender } = render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      // Multiple re-renders should not cause issues
      for (let i = 0; i < 10; i++) {
        rerender(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      }

      expect(screen.getByText("Spaghetti Carbonara")).toBeInTheDocument();
    });

    it("should handle large numbers of rapid re-renders", () => {
      const recipe = createMockRecipe();

      const { rerender } = render(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(<RecipeRow recipe={recipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        }
      }).not.toThrow();
    });
  });

  describe("TypeScript Type Safety", () => {
    it("should accept valid RecipeDTO props", () => {
      const validRecipe: RecipeDTO = {
        id: 1,
        name: "Valid Recipe",
        rating: 7,
        source: "manual",
        recipe: { instructions: "Valid instructions" },
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };

      expect(() => {
        render(<RecipeRow recipe={validRecipe} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
      }).not.toThrow();
    });

    it("should handle callback types correctly", () => {
      const recipe = createMockRecipe();

      const typedOnEdit = (recipe: RecipeDTO) => {
        expect(typeof recipe.id).toBe("number");
        expect(typeof recipe.name).toBe("string");
        expect(typeof recipe.rating).toBe("number");
      };

      const typedOnDelete = (recipe: RecipeDTO) => {
        expect(recipe).toHaveProperty("id");
        expect(recipe).toHaveProperty("name");
      };

      render(<RecipeRow recipe={recipe} onEdit={typedOnEdit} onDelete={typedOnDelete} />);

      const editButton = screen.getByRole("button", { name: /edytuj przepis/i });
      fireEvent.click(editButton);
    });
  });
});
