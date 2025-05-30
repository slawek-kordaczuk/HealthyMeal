# API Endpoint Implementation Plan: POST /api/recipes

## 1. Przegląd punktu końcowego
Endpoint służy do tworzenia nowego przepisu. Jego główne zadania to:
- Walidacja danych wejściowych,
- Sprawdzenie unikalności nazwy przepisu,
- Zapis poprawnych danych do bazy,
- Zwrócenie utworzonego obiektu przepisu.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** /api/recipes
- **Parametry:**
  - **Wymagane:**
    - `name` (string): Nazwa przepisu, która musi być unikalna.
    - `source` (string): "manual" albo "AI"
    - `recipe` (object/JSON): Szczegóły przepisu, którego zawartość (jako tekst) musi mieć długość między 100 a 10000 znaków.
  - **Opcjonalne:**
    - `rating` (number): Ocena przepisu w zakresie od 1 do 10.
- **Request Body Example:**
  ```json
  {
    "name": "New Recipe",
    "source": "manual",
    "rating": 7,
    "recipe": { /* szczegóły przepisu */ }
  }
  ```

## 3. Wykorzystywane typy
- **DTO:** `RecipeDTO` – reprezentuje przepis zwracany w odpowiedzi.
- **Command Model:** `CreateRecipeCommand` – reprezentuje payload żądania tworzenia przepisu.

## 4. Szczegóły odpowiedzi
- **Kod Sukcesu:** 201 Created
- **Struktura odpowiedzi:** Utworzony obiekt przepisu zgodny z `RecipeDTO`.
- **Kody błędów:**
  - `400 Bad Request` – Błędne dane wejściowe (np. rating poza zakresem, zła długość zawartości recipe).
  - `401 Unauthorized` – Brak autoryzacji użytkownika.
  - `409 Conflict` – Nazwa przepisu już istnieje.
  - `500 Internal Server Error` – Błędy po stronie serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie POST na `/api/recipes` z odpowiednim payloadem.
2. Middleware/endpoint sprawdza autoryzację użytkownika za pomocą Supabase Auth (używając `context.locals`).
3. Dane wejściowe są walidowane przy użyciu Zod:
   - Sprawdzenie, czy `rating` mieści się w przedziale 1-10.
   - Weryfikacja, że zawartość `recipe` mieści się w długości od 100 do 10000 znaków.
4. Przed zapisaniem do bazy wykonywane jest zapytanie sprawdzające unikalność pola `name` w tabeli `recipes`.
5. W przypadku pomyślnej walidacji i braku konfliktu, dane są zapisywane w tabeli `recipes`.
6. Endpoint zwraca odpowiedź 201 Created z utworzonym obiektem przepisu.

## 6. Względy bezpieczeństwa
- **Autoryzacja:** Endpoint wymaga, aby użytkownik był zalogowany (integracja z Supabase Auth).
- **Walidacja danych:** Wszystkie dane wejściowe są walidowane (np. za pomocą Zod) w celu ochrony przed atakami typu injection oraz zapewnienia integralności danych.
- **Unikalność:** Sprawdzenie unikalności nazwy przepisu zabezpiecza przed duplikatami i niespójnymi danymi.
- **Ochrona danych:** Przetwarzanie i logowanie danych użytkownika odbywa się zgodnie z polityką bezpieczeństwa, a wrażliwe informacje są chronione.

## 7. Obsługa błędów
- **Walidacja:** Jeśli żądanie nie spełnia wymagań (np. rating poza zakresem lub nieprawidłowa długość `recipe`), zwracane jest 400 Bad Request.
- **Konflikt:** W przypadku, gdy przepis o podanej nazwie już istnieje, zwracany jest 409 Conflict.
- **Autoryzacja:** Brak sesji użytkownika skutkuje 401 Unauthorized.
- **Błędy serwera:** Niespodziewane błędy generują odpowiedź 500 Internal Server Error. Dodatkowo, możliwe logowanie błędów do tabeli `recipe_modification_errors` w celu analizy problemów.

## 8. Rozważania dotyczące wydajności
- **Indeksacja:** Tabela `recipes` posiada unikalny indeks na kolumnie `name` oraz gin index na kolumnie `recipe` dla szybkich zapytań.

## 9. Etapy wdrożenia
1. **Utworzenie endpointu:**
   - Umieszczenie nowego pliku, np. `/src/pages/api/recipes/create.ts`.
2. **Implementacja logiki usługi:** Wyodrębnienie logiki do warstwy serwisowej (np. `recipe.create.service.ts`) odpowiedzialnej za sprawdzanie istnienia rekordu oraz operacje insert.
3. **Walidacja danych wejściowych:**
   - Implementacja walidacji za pomocą Zod, weryfikującej `rating` oraz długość `recipe`.
4. **Sprawdzenie unikalności nazwy:**
   - Wykonanie zapytania do bazy danych, aby upewnić się, że przepis o podanej nazwie nie istnieje.
5. **Wstawienie danych:**
   - Zapis danych do tabeli `recipes` z ustawieniem pola `source` na `'manual'` lub `'AI'`.
6. **Zwrócenie odpowiedzi:**
   - Zwrot utworzonego obiektu przepisu z kodem 201 Created.