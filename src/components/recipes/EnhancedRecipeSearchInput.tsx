import React, { useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Search, X } from "lucide-react";
import { Button } from "../ui/button";

const searchSchema = z.object({
  searchTerm: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface EnhancedRecipeSearchInputProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

// Simple debounce utility
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export default function EnhancedRecipeSearchInput({
  searchQuery,
  onSearchQueryChange,
  placeholder = "Wyszukaj przepisy...",
  debounceMs = 300,
}: EnhancedRecipeSearchInputProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: searchQuery,
    },
  });

  const { register, watch, setValue } = form;
  const currentValue = watch("searchTerm") || "";

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        onSearchQueryChange(value);
      }, debounceMs),
    [onSearchQueryChange, debounceMs]
  );

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValue("searchTerm", value);
      debouncedSearch(value);
    },
    [setValue, debouncedSearch]
  );

  // Clear search
  const handleClear = useCallback(() => {
    setValue("searchTerm", "");
    onSearchQueryChange("");
  }, [setValue, onSearchQueryChange]);

  return (
    <div className="relative" data-testid="enhanced-recipe-search-container">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        {...register("searchTerm")}
        type="text"
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-10 pr-10"
        data-testid="recipe-search-input"
      />
      {currentValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          data-testid="enhanced-recipe-search-clear"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
