import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star } from "lucide-react";
import type { RecipeDTO } from "@/types/types";

interface RecipeRowProps {
  recipe: RecipeDTO;
  onEdit: (recipe: RecipeDTO) => void;
  onDelete: (recipe: RecipeDTO) => void;
}

export default function RecipeRow({ recipe, onEdit, onDelete }: RecipeRowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSourceLabel = (source: string) => {
    return source === "AI" ? "AI" : "Ręczny";
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-yellow-400 fill-current" />
        <span>{rating}/10</span>
      </div>
    );
  };

  return (
    <TableRow data-testid={`recipe-row-${recipe.id}`}>
      <TableCell className="font-medium">
        <div className="max-w-[200px] truncate" title={recipe.name} data-testid={`recipe-name-${recipe.id}`}>
          {recipe.name}
        </div>
      </TableCell>
      <TableCell data-testid={`recipe-rating-${recipe.id}`}>
        {recipe.rating ? renderRating(recipe.rating) : <span className="text-gray-400">Brak oceny</span>}
      </TableCell>
      <TableCell data-testid={`recipe-source-${recipe.id}`}>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            recipe.source === "AI" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
          }`}
        >
          {getSourceLabel(recipe.source)}
        </span>
      </TableCell>
      <TableCell data-testid={`recipe-date-${recipe.id}`}>{formatDate(recipe.created_at)}</TableCell>
      <TableCell className="text-right" data-testid={`recipe-actions-${recipe.id}`}>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(recipe)}
            className="h-8 w-8 p-0"
            data-testid={`recipe-edit-button-${recipe.id}`}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edytuj przepis</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(recipe)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`recipe-delete-button-${recipe.id}`}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Usuń przepis</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
