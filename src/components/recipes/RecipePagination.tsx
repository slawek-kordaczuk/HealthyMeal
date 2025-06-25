import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import type { PaginationMetadata } from "../../types/types";

interface RecipePaginationProps {
  paginationData: PaginationMetadata;
  onPageChange: (page: number) => void;
}

export default function RecipePagination({ paginationData, onPageChange }: RecipePaginationProps) {
  const { page, totalPages, total, limit } = paginationData;

  // Don't render pagination if there's only one page or no data
  if (totalPages <= 1) {
    return null;
  }

  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between" data-testid="recipe-pagination-container">
      <div className="text-sm text-gray-700" data-testid="recipe-pagination-info">
        Wyświetlanie {startItem}-{endItem} z {total} przepisów
      </div>

      <Pagination data-testid="recipe-pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && onPageChange(page - 1)}
              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              data-testid="recipe-pagination-previous"
            />
          </PaginationItem>

          {pageNumbers.map((pageNum, index) => (
            <PaginationItem key={index}>
              {pageNum === "ellipsis" ? (
                <PaginationEllipsis data-testid={`recipe-pagination-ellipsis-${index}`} />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={pageNum === page}
                  className="cursor-pointer"
                  data-testid={`recipe-pagination-page-${pageNum}`}
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && onPageChange(page + 1)}
              className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              data-testid="recipe-pagination-next"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
