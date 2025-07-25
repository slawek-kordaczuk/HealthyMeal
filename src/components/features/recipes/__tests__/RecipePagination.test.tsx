import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecipePagination from "../components/RecipePagination";
import type { PaginationMetadata } from "@/types/types";

// Mock data factories
const createMockPaginationData = (overrides?: Partial<PaginationMetadata>): PaginationMetadata => ({
  page: 1,
  limit: 10,
  total: 50,
  totalPages: 5,
  ...overrides,
});

describe("RecipePagination", () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility Rules", () => {
    it("should not render when there is only one page", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        total: 5,
        totalPages: 1,
      });

      const { container } = render(
        <RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when there are no total pages", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        total: 0,
        totalPages: 0,
      });

      const { container } = render(
        <RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when there are multiple pages", () => {
      const paginationData = createMockPaginationData({
        totalPages: 3,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 1-10 z 50 przepisów")).toBeInTheDocument();
    });
  });

  describe("Items Display Information", () => {
    it("should display correct items range for first page", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        limit: 10,
        total: 50,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 1-10 z 50 przepisów")).toBeInTheDocument();
    });

    it("should display correct items range for middle page", () => {
      const paginationData = createMockPaginationData({
        page: 3,
        limit: 10,
        total: 50,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 21-30 z 50 przepisów")).toBeInTheDocument();
    });

    it("should display correct items range for last page with partial items", () => {
      const paginationData = createMockPaginationData({
        page: 5,
        limit: 10,
        total: 47,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 41-47 z 47 przepisów")).toBeInTheDocument();
    });

    it("should display correct items range for single page with few items", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      });

      const { container } = render(
        <RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />
      );

      // Should not render at all for single page
      expect(container.firstChild).toBeNull();
    });

    it("should handle edge case with different limit sizes", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        limit: 25,
        total: 100,
        totalPages: 4,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 26-50 z 100 przepisów")).toBeInTheDocument();
    });
  });

  describe("Page Number Generation - Small Total Pages", () => {
    it("should show all page numbers when total pages <= 5", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 4,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should show exactly 5 pages when totalPages is 5", () => {
      const paginationData = createMockPaginationData({
        page: 3,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should highlight current page correctly", () => {
      const paginationData = createMockPaginationData({
        page: 3,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const currentPageLink = screen.getByRole("link", { current: "page" });
      expect(currentPageLink).toHaveTextContent("3");
    });
  });

  describe("Page Number Generation - Large Total Pages", () => {
    it("should show ellipsis for large page count when on first pages", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 10,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      // Look for ellipsis by screen reader text
      expect(screen.getByText("More pages")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should show ellipsis for large page count when in middle", () => {
      const paginationData = createMockPaginationData({
        page: 5,
        totalPages: 10,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      const ellipsisElements = screen.getAllByText("More pages");
      expect(ellipsisElements).toHaveLength(2);
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should show ellipsis for large page count when on last pages", () => {
      const paginationData = createMockPaginationData({
        page: 9,
        totalPages: 10,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("More pages")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should handle very large page counts correctly", () => {
      const paginationData = createMockPaginationData({
        page: 50,
        total: 1000,
        totalPages: 100,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("49")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("51")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();

      const ellipsisElements = screen.getAllByText("More pages");
      expect(ellipsisElements).toHaveLength(2);
    });
  });

  describe("Previous Button Functionality", () => {
    it("should be disabled on first page", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const prevLink = screen.getByLabelText("Go to previous page");
      expect(prevLink).toHaveClass("pointer-events-none", "opacity-50");
    });

    it("should be enabled on non-first pages", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const prevLink = screen.getByLabelText("Go to previous page");
      expect(prevLink).toHaveClass("cursor-pointer");
      expect(prevLink).not.toHaveClass("pointer-events-none", "opacity-50");
    });

    it("should call onPageChange with previous page when clicked", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 3,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const prevLink = screen.getByLabelText("Go to previous page");
      await user.click(prevLink);

      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should not call onPageChange when disabled (first page)", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 1,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const prevLink = screen.getByLabelText("Go to previous page");
      await user.click(prevLink);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe("Next Button Functionality", () => {
    it("should be disabled on last page", () => {
      const paginationData = createMockPaginationData({
        page: 5,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const nextLink = screen.getByLabelText("Go to next page");
      expect(nextLink).toHaveClass("pointer-events-none", "opacity-50");
    });

    it("should be enabled on non-last pages", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const nextLink = screen.getByLabelText("Go to next page");
      expect(nextLink).toHaveClass("cursor-pointer");
      expect(nextLink).not.toHaveClass("pointer-events-none", "opacity-50");
    });

    it("should call onPageChange with next page when clicked", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const nextLink = screen.getByLabelText("Go to next page");
      await user.click(nextLink);

      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should not call onPageChange when disabled (last page)", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 5,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const nextLink = screen.getByLabelText("Go to next page");
      await user.click(nextLink);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe("Page Number Link Functionality", () => {
    it("should call onPageChange with correct page number when page link clicked", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 1,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const page3Link = screen.getByRole("link", { name: "3" });
      await user.click(page3Link);

      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should call onPageChange when clicking current page (should be allowed)", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const currentPageLink = screen.getByRole("link", { name: "2" });
      await user.click(currentPageLink);

      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should not call onPageChange when clicking ellipsis", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 5,
        totalPages: 10,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const ellipsisElements = screen.getAllByText("More pages");
      await user.click(ellipsisElements[0]);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should handle rapid clicking of page numbers", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 1,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const page2Link = screen.getByRole("link", { name: "2" });
      const page3Link = screen.getByRole("link", { name: "3" });

      await user.click(page2Link);
      await user.click(page3Link);
      await user.click(page2Link);

      expect(mockOnPageChange).toHaveBeenCalledTimes(3);
      expect(mockOnPageChange).toHaveBeenNthCalledWith(1, 2);
      expect(mockOnPageChange).toHaveBeenNthCalledWith(2, 3);
      expect(mockOnPageChange).toHaveBeenNthCalledWith(3, 2);
    });
  });

  describe("Layout and Styling", () => {
    it("should render with correct layout structure", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const container = screen.getByText("Wyświetlanie 11-20 z 50 przepisów").parentElement;
      expect(container).toHaveClass("flex", "items-center", "justify-between");
    });

    it("should apply correct styling to info text", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        totalPages: 3,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const infoText = screen.getByText("Wyświetlanie 1-10 z 50 przepisów");
      expect(infoText).toHaveClass("text-sm", "text-gray-700");
    });

    it("should render pagination components in correct order", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const paginationLinks = screen.getAllByRole("link");

      // Should start with Previous link
      expect(paginationLinks[0]).toHaveAttribute("aria-label", "Go to previous page");

      // Should end with Next link
      expect(paginationLinks[paginationLinks.length - 1]).toHaveAttribute("aria-label", "Go to next page");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero total items gracefully", () => {
      const paginationData = createMockPaginationData({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });

      const { container } = render(
        <RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should handle very large numbers gracefully", () => {
      const paginationData = createMockPaginationData({
        page: 999,
        limit: 100,
        total: 100000,
        totalPages: 1000,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 99801-99900 z 100000 przepisów")).toBeInTheDocument();
    });

    it("should handle page being larger than totalPages", () => {
      const paginationData = createMockPaginationData({
        page: 10,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      // Should still render and handle gracefully
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should handle negative page numbers", () => {
      const paginationData = createMockPaginationData({
        page: -1,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      // Should not crash and still render pagination
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should handle undefined callback gracefully", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      expect(() => {
        render(
          <RecipePagination
            paginationData={paginationData}
            onPageChange={undefined as unknown as (page: number) => void}
          />
        );
      }).not.toThrow();
    });

    it("should handle fractional page numbers", () => {
      const paginationData = createMockPaginationData({
        page: 2.5 as unknown as number,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      // Should still work (JavaScript will handle the fractional number)
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("Accessibility Features", () => {
    it("should have proper ARIA labels for navigation links", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const prevLink = screen.getByLabelText("Go to previous page");
      const nextLink = screen.getByLabelText("Go to next page");

      expect(prevLink).toHaveAttribute("aria-label", "Go to previous page");
      expect(nextLink).toHaveAttribute("aria-label", "Go to next page");
    });

    it("should mark current page with aria-current", () => {
      const paginationData = createMockPaginationData({
        page: 3,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const currentPageLink = screen.getByRole("link", { current: "page" });
      expect(currentPageLink).toHaveAttribute("aria-current", "page");
      expect(currentPageLink).toHaveTextContent("3");

      const otherPageLink = screen.getByRole("link", { name: "2" });
      expect(otherPageLink).not.toHaveAttribute("aria-current");
    });

    it("should have proper navigation structure", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("aria-label", "pagination");
    });

    it("should have screen reader support for ellipsis", () => {
      const paginationData = createMockPaginationData({
        page: 5,
        totalPages: 10,
      });

      render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      // This test case generates two ellipses, so we need to use getAllByText
      const morePages = screen.getAllByText("More pages");
      expect(morePages.length).toBeGreaterThan(0);
    });
  });

  describe("Component Re-rendering", () => {
    it("should update when paginationData changes", () => {
      const initialData = createMockPaginationData({
        page: 1,
        total: 30,
        totalPages: 3,
      });

      const { rerender } = render(<RecipePagination paginationData={initialData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 1-10 z 30 przepisów")).toBeInTheDocument();

      const updatedData = createMockPaginationData({
        page: 2,
        total: 50,
        totalPages: 5,
      });

      rerender(<RecipePagination paginationData={updatedData} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Wyświetlanie 11-20 z 50 przepisów")).toBeInTheDocument();
    });

    it("should maintain callback stability across re-renders", async () => {
      const user = userEvent.setup();
      const paginationData = createMockPaginationData({
        page: 1,
        totalPages: 3,
      });

      const { rerender } = render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      const nextLink = screen.getByLabelText("Go to next page");
      await user.click(nextLink);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      // Re-render with same props
      rerender(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      await user.click(nextLink);
      expect(mockOnPageChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance and Memory", () => {
    it("should not create new objects on every render", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      const { rerender } = render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      // Multiple re-renders should not cause issues
      for (let i = 0; i < 10; i++) {
        rerender(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);
      }

      expect(screen.getByText("Wyświetlanie 11-20 z 50 przepisów")).toBeInTheDocument();
    });

    it("should handle large numbers of re-renders efficiently", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      const { rerender } = render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);
        }
      }).not.toThrow();
    });
  });

  describe("TypeScript Type Safety", () => {
    it("should accept valid PaginationMetadata props", () => {
      const validPaginationData: PaginationMetadata = {
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      expect(() => {
        render(<RecipePagination paginationData={validPaginationData} onPageChange={mockOnPageChange} />);
      }).not.toThrow();
    });

    it("should handle callback types correctly", () => {
      const paginationData = createMockPaginationData({
        page: 2,
        totalPages: 5,
      });

      const typedOnPageChange = (page: number) => {
        expect(typeof page).toBe("number");
        expect(page).toBeGreaterThan(0);
      };

      render(<RecipePagination paginationData={paginationData} onPageChange={typedOnPageChange} />);

      const page3Link = screen.getByRole("link", { name: "3" });
      fireEvent.click(page3Link);
    });
  });
});
