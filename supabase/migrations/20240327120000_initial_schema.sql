-- Migration: Initial Schema Creation
-- Description: Creates the core tables for the HealthyMeal application
-- Tables: preferences, recipes, recipe_modifications, recipe_statistics, recipe_modification_errors

-- Note: The 'users' table is managed by Supabase Auth and is created automatically

-- Create preferences table
create table preferences (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade not null,
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
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade not null,
    name varchar not null,
    rating integer check (rating between 1 and 10),
    source varchar not null check (source in ('AI', 'manual')),
    recipe jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    constraint recipes_name_unique unique (name)
);

-- Create recipe_modifications table
create table recipe_modifications (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade not null,
    recipe_id bigint references recipes(id) on delete cascade not null,
    original_recipe jsonb not null,
    modified_recipe jsonb not null,
    timestamp timestamptz not null default now(),
    ai_model varchar not null
);

-- Create recipe_statistics table
create table recipe_statistics (
    recipe_id bigint primary key references recipes(id) on delete cascade,
    search_count integer not null default 0,
    modification_count integer not null default 0,
    last_updated timestamptz not null default now()
);

-- Create recipe_modification_errors table
create table recipe_modification_errors (
    id bigint primary key generated always as identity,
    ai_model varchar not null,
    recipe_text text not null,
    error_code integer,
    error_description text,
    timestamp timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table preferences enable row level security;
alter table recipes enable row level security;
alter table recipe_modifications enable row level security;
alter table recipe_statistics enable row level security;
alter table recipe_modification_errors enable row level security; 