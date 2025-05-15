-- Migration: Initial Schema
-- Description: Creates the initial database schema for HealthyMeal application
-- Tables: preferences, recipes, recipe_modifications, recipe_statistics, recipe_modification_errors
-- Author: System
-- Date: 2024-03-27

-- Create preferences table
create table preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    diet_type varchar,
    daily_calorie_requirement integer,
    allergies varchar,
    food_intolerances varchar,
    preferred_cuisines varchar,
    excluded_ingredients varchar,
    macro_distribution_protein integer,
    macro_distribution_fats integer,
    macro_distribution_carbohydrates integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

-- Create recipes table
create table recipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar not null,
    rating integer check (rating between 1 and 10),
    source varchar not null check (source in ('AI', 'manual')),
    recipe jsonb not null,
    created_at timestamptz not null default now(),
    constraint recipes_name_unique unique (name)
);

-- Create GIN index for recipe JSONB column
create index idx_recipe_gin on recipes using gin(recipe);

-- Create recipe_modifications table
create table recipe_modifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    original_recipe jsonb not null,
    modified_recipe jsonb not null,
    timestamp timestamptz not null default now(),
    ai_model varchar not null
);

-- Create recipe_statistics table
create table recipe_statistics (
    recipe_id uuid primary key references recipes(id) on delete cascade,
    search_count integer not null default 0,
    modification_count integer not null default 0,
    last_updated timestamptz not null default now()
);

-- Create recipe_modification_errors table
create table recipe_modification_errors (
    id uuid primary key default gen_random_uuid(),
    ai_model varchar not null,
    recipe_text text not null,
    error_code integer,
    error_description text,
    timestamp timestamptz not null default now()
);

-- Enable Row Level Security
alter table preferences enable row level security;
alter table recipes enable row level security;
alter table recipe_modifications enable row level security;
alter table recipe_statistics enable row level security;
alter table recipe_modification_errors enable row level security;

-- Create RLS Policies for preferences
create policy "Users can view own preferences"
    on preferences for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert own preferences"
    on preferences for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update own preferences"
    on preferences for update
    to authenticated
    using (user_id = auth.uid());

create policy "Users can delete own preferences"
    on preferences for delete
    to authenticated
    using (user_id = auth.uid());

-- Create RLS Policies for recipes
create policy "Users can view own recipes"
    on recipes for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert own recipes"
    on recipes for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update own recipes"
    on recipes for update
    to authenticated
    using (user_id = auth.uid());

create policy "Users can delete own recipes"
    on recipes for delete
    to authenticated
    using (user_id = auth.uid());

-- Create RLS Policies for recipe_modifications
create policy "Users can view own recipe modifications"
    on recipe_modifications for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert own recipe modifications"
    on recipe_modifications for insert
    to authenticated
    with check (user_id = auth.uid());

-- Create RLS Policies for recipe_statistics
create policy "Users can view recipe statistics for own recipes"
    on recipe_statistics for select
    to authenticated
    using (recipe_id in (select id from recipes where user_id = auth.uid()));

create policy "Users can update recipe statistics for own recipes"
    on recipe_statistics for update
    to authenticated
    using (recipe_id in (select id from recipes where user_id = auth.uid()));

-- Create RLS Policies for recipe_modification_errors
-- This table is for system logging, so we'll restrict it to service role only
create policy "Service role can manage error logs"
    on recipe_modification_errors for all
    to service_role
    using (true); 