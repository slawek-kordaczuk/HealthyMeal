# Schemat bazy danych - HealthyMeal

## Tabele

### 1. users

This table is managed by Supabase Auth

- `id` UUID PRIMARY KEY
- `email` VARCHAR NOT NULL UNIQUE
- `encrypted_password` VARCHAR NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 2. preferences
- `id` INTEGER PRIMARY KEY
- `user_id` UUID REFERENCES users(id) ON DELETE CASCADE
- `diet_type` VARCHAR
- `daily_calorie_requirement` INTEGER
- `allergies` VARCHAR
- `food_intolerances` VARCHAR
- `preferred_cuisines` VARCHAR
- `excluded_ingredients` VARCHAR
- `macro_distribution_protein` INTEGER
- `macro_distribution_fats` INTEGER
- `macro_distribution_carbohydrates` INTEGER
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

### 3. recipes
- `id` INTEGER PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `name` VARCHAR NOT NULL
- `rating` INTEGER CHECK (rating BETWEEN 1 AND 10)
- `source` VARCHAR NOT NULL CHECK (source IN ('AI', 'manual'))
- `recipe` JSONB NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

**Indeks:**
- GIN index na kolumnie `recipe`:
  `CREATE INDEX idx_recipe_gin ON recipes USING gin(recipe);`
- Unique composite index na parze `(name, user_id)`:
  `CREATE UNIQUE INDEX idx_recipes_name_user_unique ON recipes(name, user_id);`

### 4. recipe_modifications
- `id` INTEGER PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `recipe_id` INTEGER PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE
- `original_recipe` JSONB NOT NULL
- `modified_recipe` JSONB NOT NULL
- `timestamp` TIMESTAMPTZ NOT NULL DEFAULT now()
- `ai_model` VARCHAR NOT NULL

### 5. recipe_statistics
- `recipe_id` INTEGER PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE
- `search_count` INTEGER NOT NULL DEFAULT 0
- `modification_count` INTEGER NOT NULL DEFAULT 0
- `last_updated` TIMESTAMPTZ NOT NULL DEFAULT now()

### 6. recipe_modification_errors
- `id` INTEGER PRIMARY KEY
- `ai_model` VARCHAR NOT NULL
- `recipe_text` TEXT NOT NULL
- `error_code` INTEGER
- `error_description` TEXT
- `timestamp` TIMESTAMPTZ NOT NULL DEFAULT now()

## Relacje
- Jeden użytkownik (`users`) ma relację 1:1 z `preferences` poprzez `user_id`.
- Jeden użytkownik (`users`) może mieć wiele `recipes` (relacja 1:N między `users.id` a `recipes.user_id`).
- Każdy przepis (`recipes`) może mieć wiele `recipe_modifications` (relacja 1:N między `recipes.id` a `recipe_modifications.recipe_id`).
- Jeden użytkownik (`users`) może mieć wiele `recipe_modifications` (relacja 1:N między `users.id` a `recipe_modifications.user_id`).
- Każdy przepis (`recipes`) ma powiązany rekord w `recipe_statistics` (relacja 1:1).
- Tabela `recipe_modification_errors` służy niezależnie do logowania błędów związanych z modyfikacjami.

## Indeksy
- Unikalny indeks na `email` w tabeli `users` (narzucony przez constraint UNIQUE).
- Unique composite index na parze `(name, user_id)` w tabeli `recipes`.
- GIN index na kolumnie `recipe` w tabeli `recipes`:
  `CREATE INDEX idx_recipe_gin ON recipes USING gin(recipe);`

## Zasady PostgreSQL (RLS)
- Włączenie RLS na tabelach zawierających dane użytkowników (`users`, `preferences`, `recipes`, `recipe_modifications`):
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
  ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE recipe_modifications ENABLE ROW LEVEL SECURITY;
  ```
- Przykładowa polityka dla tabeli `recipes`:
  ```sql
  CREATE POLICY user_access ON recipes
    USING (user_id = current_setting('app.current_user')::uuid);
  ```
- Przykładowa polityka dla tabeli `recipe_modifications`:
  ```sql
  CREATE POLICY user_access ON recipe_modifications
    USING (user_id = current_setting('app.current_user')::uuid);
  ```
- Analogiczne polityki należy wdrożyć dla tabel `users` i `preferences` w celu zapewnienia, że użytkownicy mają dostęp jedynie do swoich danych.

## Dodatkowe uwagi
- Wszystkie identyfikatory wykorzystują UUID jako typ danych.
- Pole `recipe` w tabeli `recipes` przechowywane jest jako JSONB, co umożliwia elastyczne przechowywanie danych przepisu.
- Constraint na kolumnie `source` gwarantuje, że wartość przyjmuje jedynie wartości 'AI' lub 'manual'.
- Constraint na kolumnie `rating` zapewnia, że przyjmowane są tylko wartości w przedziale 1-10.
- Schemat został zaprojektowany z myślą o skalowalności i wydajności, między innymi dzięki dedykowanemu indeksowi GIN dla szybkiego przeszukiwania danych w formacie JSONB. 