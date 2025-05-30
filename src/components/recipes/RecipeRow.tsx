import React from "react";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Edit, Trash2, Star } from "lucide-react";
import type { RecipeDTO } from "../../types/types";

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
    <TableRow>
      <TableCell className="font-medium">
        <div className="max-w-[200px] truncate" title={recipe.name}>
          {recipe.name}
        </div>
      </TableCell>
      <TableCell>
        {recipe.rating ? renderRating(recipe.rating) : <span className="text-gray-400">Brak oceny</span>}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            recipe.source === "AI" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
          }`}
        >
          {getSourceLabel(recipe.source)}
        </span>
      </TableCell>
      <TableCell>{formatDate(recipe.created_at)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(recipe)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edytuj przepis</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(recipe)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Usuń przepis</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
