-- Migration: Update Recipes Table Unique Constraint
-- Description: Changes the unique constraint on recipes.name to a composite constraint (name, user_id)
-- Purpose: Allow different users to have recipes with the same name while maintaining uniqueness per user
-- Affected tables: recipes
-- 
-- This migration:
-- 1. Drops the existing unique constraint on recipes.name
-- 2. Creates a new composite unique constraint on (name, user_id)
-- 
-- IMPORTANT: This is a breaking change that allows duplicate recipe names across different users
-- Ensure application logic handles this change appropriately

-- Drop the existing unique constraint on recipe name
-- This constraint was preventing different users from having recipes with the same name
alter table recipes 
drop constraint recipes_name_unique;

-- Create a new composite unique constraint on (name, user_id)
-- This ensures that each user can only have one recipe with a given name
-- but different users can have recipes with the same name
alter table recipes 
add constraint recipes_name_user_unique unique (name, user_id);

-- The composite unique constraint automatically creates an index
-- No additional manual index creation is needed for this constraint 