import { vi } from "vitest";
import type { RecipeDTO } from "../../../../types/types";
import type { SupabaseClient } from "../../../../db/supabase.client";

// Mock user ID used across tests
export const mockUserId = "user123";

// Mock recipes data
export const mockRecipes: RecipeDTO[] = [
  {
    id: 1,
    name: "Spaghetti Carbonara",
    rating: 5,
    source: "manual",
    recipe: { ingredients: ["pasta", "eggs"], instructions: "Cook pasta..." },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Chicken Curry",
    rating: 4,
    source: "AI",
    recipe: { ingredients: ["chicken", "curry"], instructions: "Cook chicken..." },
    created_at: "2024-01-14T09:00:00Z",
    updated_at: "2024-01-14T09:00:00Z",
  },
  {
    id: 3,
    name: "Caesar Salad",
    rating: 3,
    source: "manual",
    recipe: { ingredients: ["lettuce", "croutons"], instructions: "Prepare salad..." },
    created_at: "2024-01-13T08:00:00Z",
    updated_at: "2024-01-13T08:00:00Z",
  },
];

// Mock existing recipe for update tests
export const mockExistingRecipe: RecipeDTO = {
  id: 1,
  name: "Original Recipe",
  rating: 5,
  source: "manual",
  recipe: { ingredients: ["original", "ingredients"], instructions: "Original instructions" },
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

// Mock database recipe with user_id field (for internal database operations)
export const mockExistingDbRecipe = {
  ...mockExistingRecipe,
  user_id: mockUserId,
};

// Factory function to create mock Supabase client
export function createMockSupabase(): Partial<SupabaseClient> {
  return {
    from: vi.fn(),
  };
}

// Helper function to create mock query builders
export const createMockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn(),
  upsert: vi.fn(),
});

// Helper function to create count query promise
export const createMockCountQuery = (count: number | null) => Promise.resolve({ count });

// Mock database error
export const mockDatabaseError = {
  message: "Database connection failed",
  code: "DB_ERROR",
};

// Mock constraint violation error
export const mockConstraintError = {
  message: "Unique constraint violated",
  code: "23505",
};

// Helper to create mock query response
export const createMockResponse = <T>(data: T | null, error: unknown = null) => ({
  data,
  error,
});

// Common test timeouts and delays
export const TEST_TIMEOUT = 5000;
export const MOCK_DELAY = 100;
