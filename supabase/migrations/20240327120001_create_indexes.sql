-- Migration: Create Indexes
-- Description: Creates indexes for optimizing query performance

-- Create GIN index for the recipe JSONB column
create index idx_recipe_gin on recipes using gin(recipe);

-- Create index for user lookups in preferences
create index idx_preferences_user_id on preferences(user_id);

-- Create index for user lookups in recipes
create index idx_recipes_user_id on recipes(user_id);

-- Create index for recipe lookups in recipe_modifications
create index idx_recipe_modifications_recipe_id on recipe_modifications(recipe_id);

-- Create index for user lookups in recipe_modifications
create index idx_recipe_modifications_user_id on recipe_modifications(user_id); 