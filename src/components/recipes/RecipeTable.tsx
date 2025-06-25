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
      <div className="text-center py-12" data-testid="recipes-empty-state">
        <p className="text-lg text-gray-500" data-testid="recipes-empty-message">
          Nie znaleziono przepisów.
        </p>
        <p className="text-sm text-gray-400 mt-2" data-testid="recipes-empty-hint">
          Spróbuj zmienić kryteria wyszukiwania lub dodaj nowy przepis.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="recipes-table-container">
      <Table data-testid="recipes-table">
        <TableHeader>
          <TableRow>
            <TableHead data-testid="recipes-table-header-name">Nazwa</TableHead>
            <TableHead data-testid="recipes-table-header-rating">Ocena</TableHead>
            <TableHead data-testid="recipes-table-header-source">Źródło</TableHead>
            <TableHead data-testid="recipes-table-header-date">Data utworzenia</TableHead>
            <TableHead className="text-right" data-testid="recipes-table-header-actions">
              Akcje
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="recipes-table-body">
          {recipes.map((recipe) => (
            <RecipeRow key={recipe.id} recipe={recipe} onEdit={onEditRecipe} onDelete={onDeleteRecipe} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
