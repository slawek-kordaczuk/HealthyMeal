import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import RecipeRow from "./RecipeRow.tsx";
import type { RecipeDTO } from "../../types/types";

interface RecipeTableProps {
  recipes: RecipeDTO[];
  onEditRecipe: (recipe: RecipeDTO) => void;
  onDeleteRecipe: (recipe: RecipeDTO) => void;
}

export default function RecipeTable({ recipes, onEditRecipe, onDeleteRecipe }: RecipeTableProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Nie znaleziono przepisów.</p>
        <p className="text-sm text-gray-400 mt-2">Spróbuj zmienić kryteria wyszukiwania lub dodaj nowy przepis.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Ocena</TableHead>
            <TableHead>Źródło</TableHead>
            <TableHead>Data utworzenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map((recipe) => (
            <RecipeRow key={recipe.id} recipe={recipe} onEdit={onEditRecipe} onDelete={onDeleteRecipe} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
