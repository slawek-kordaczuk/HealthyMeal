import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RecipeSearchInputProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  placeholder?: string;
}

export default function RecipeSearchInput({
  searchQuery,
  onSearchQueryChange,
  placeholder = "Wyszukaj przepisy...",
}: RecipeSearchInputProps) {
  return (
    <div className="relative" data-testid="recipe-search-container">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
        data-testid="recipe-search-input"
      />
    </div>
  );
}
