# API Endpoint Implementation Plan: Aktualizacja Przepisu

## 1. Przegląd punktu końcowego
- Endpoint umożliwia aktualizację istniejącego przepisu przy użyciu metody PUT na ścieżce `/api/recipes/{recipeId}`.
- Po aktualizacji, zwłaszcza przy modyfikacjach opartych o AI, tworzony jest nowy rekord w tabeli `recipe_modifications`, który zapisuje poprzednią wersję przepisu (original_recipe) oraz wersję zmodyfikowaną (modified_recipe) w celu śledzenia historii.

## 2. Szczegóły żądania
- **Metoda HTTP:** PUT
- **Struktura URL:** /api/recipes/{recipeId}
- **Parametry:**
  - **Wymagane:**
    - `recipeId` (ścieżka): identyfikator przepisu, który ma zostać zaktualizowany
    - Request Body zgodne z modelem `UpdateRecipeCommand`:
      - `name` (opcjonalnie, string)
      - `rating` (opcjonalnie, number, wartość między 1 a 10)
      - `recipe` (opcjonalnie, JSON zawierający zaktualizowaną treść przepisu)
  - **Opcjonalne:**
    - Dodatkowe pola mogą być przekazane, jeśli przyszłe wymagania je rozszerzą

## 3. Wykorzystywane typy
- `RecipeDTO` – reprezentuje dane przepisu zwracane w odpowiedzi
- `UpdateRecipeCommand` – reprezentuje ładunek żądania aktualizacji przepisu
- (Opcjonalnie) Typy związane z historią modyfikacji, np. `RecipeModificationHistoryDTO`, do logowania starych i nowych wersji przepisu

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):**
  - Zwraca zaktualizowany obiekt przepisu, w tym zaktualizowany znacznik czasu (`updated_at`)
- **Błędy:**
  - 400 Bad Request – niepoprawne dane wejściowe lub walidacja nie powiodła się
  - 401 Unauthorized – brak autoryzacji lub nieprawidłowy token
  - 404 Not Found – nie znaleziono przepisu o podanym `recipeId`
  - 500 Internal Server Error – błąd po stronie serwera podczas aktualizacji

## 5. Przepływ danych
1. Odebranie żądania wraz z identyfikatorem przepisu (`recipeId`) z URL i ładunkiem aktualizacji.
2. Walidacja danych wejściowych przy użyciu schematu (np. Zod) zgodnie z `UpdateRecipeCommand`.
3. Weryfikacja autentyczności użytkownika (przy użyciu Supabase Auth) oraz sprawdzenie, czy użytkownik jest właścicielem przepisu.
4. Pobranie istniejącego przepisu z bazy danych.
5. Zachowanie oryginalnej wersji przepisu w celu logowania (jeśli nastąpiła modyfikacja AI lub inna istotna zmiana).
6. Aktualizacja rekordu w tabeli `recipes` przy jednoczesnym zapisaniu nowego rekordu w tabeli `recipe_modifications` z danymi:
   - `original_recipe`: poprzednia wersja
   - `modified_recipe`: nowa wersja
   - `ai_model`: informacja o modelu AI, jeśli dotyczy
7. Aktualizacja metryk przepisu w tabeli `recipe_statistics` (np. zwiększenie `modification_count`)
8. Zwrócenie zaktualizowanego obiektu przepisu w odpowiedzi

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: Endpoint musi sprawdzać, czy żądanie pochodzi od zalogowanego użytkownika.
- Autoryzacja: Weryfikacja, czy użytkownik wysyłający żądanie jest właścicielem przepisu.
- Walidacja danych: Użycie biblioteki Zod (lub podobnej) do walidacji ładunku żądania.

## 7. Obsługa błędów
- **400 Bad Request:** Błędne dane wejściowe lub niepoprawna walidacja.
- **401 Unauthorized:** Użytkownik nie jest zalogowany lub token jest nieważny.
- **404 Not Found:** Przepis o podanym `recipeId` nie istnieje.
- **500 Internal Server Error:** Błąd podczas aktualizacji przepisu lub logowania modyfikacji.

## 8. Etapy implementacji
1. Stworzenie/aktualizacja walidacji przy użyciu Zod dla `UpdateRecipeCommand`.
2. Wdrożenie mechanizmu uwierzytelniania i autoryzacji na poziomie endpointu.
3. Implementacja logiki biznesowej w nowej lub istniejącej warstwie serwisów (np. funkcja `updateRecipe`):
   - Pobranie istniejącego przepisu
   - Walidacja własności przepisu
   - Aktualizacja rekordu w tabeli `recipes`
   - Utworzenie rekordu w tabeli `recipe_modifications`
   - Aktualizacja metryk w tabeli `recipe_statistics`
4. Implementacja endpointu API w pliku: `/src/pages/api/recipes/update.ts`.
5. Obsługa błędów oraz zapewnienie odpowiednich kodów statusu odpowiedzi (400, 401, 404, 500).