-- Migration: Create RLS Policies
-- Description: Sets up Row Level Security policies for all tables

-- Policies for preferences table
create policy "Users can view their own preferences"
    on preferences for select
    using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
    on preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on preferences for update
    using (auth.uid() = user_id);

create policy "Users can delete their own preferences"
    on preferences for delete
    using (auth.uid() = user_id);

-- Policies for recipes table
create policy "Users can view their own recipes"
    on recipes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own recipes"
    on recipes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
    on recipes for update
    using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
    on recipes for delete
    using (auth.uid() = user_id);

-- Policies for recipe_modifications table
create policy "Users can view their own recipe modifications"
    on recipe_modifications for select
    using (auth.uid() = user_id);

create policy "Users can insert their own recipe modifications"
    on recipe_modifications for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own recipe modifications"
    on recipe_modifications for update
    using (auth.uid() = user_id);

create policy "Users can delete their own recipe modifications"
    on recipe_modifications for delete
    using (auth.uid() = user_id);

-- Policies for recipe_statistics table
create policy "Users can view statistics for their recipes"
    on recipe_statistics for select
    using (exists (
        select 1 from recipes
        where recipes.id = recipe_statistics.recipe_id
        and recipes.user_id = auth.uid()
    ));

create policy "Users can update statistics for their recipes"
    on recipe_statistics for update
    using (exists (
        select 1 from recipes
        where recipes.id = recipe_statistics.recipe_id
        and recipes.user_id = auth.uid()
    ));

-- Policies for recipe_modification_errors table
-- Note: This table is for logging purposes, so we'll restrict it to authenticated users only
create policy "Authenticated users can insert error logs"
    on recipe_modification_errors for insert
    to authenticated
    with check (true);

create policy "Users can view all error logs"
    on recipe_modification_errors for select
    to authenticated
    using (true); 