# API Endpoint Implementation Plan: GET /api/recipes

## 1. Przegląd punktu końcowego
Endpoint służy do pobierania listy przepisów powiązanych z aktualnie zalogowanym użytkownikiem. Zaimplementowany zostanie mechanizm paginacji, filtrowania i sortowania, aby umożliwić elastyczne przeglądanie danych.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Struktura URL:** /api/recipes
- **Parametry zapytania:**
  - **Wymagane:**
    - Brak bezpośrednich obowiązkowych parametrów (autoryzacja zapewnia kontekst użytkownika)
  - **Opcjonalne:**
    - `page`: Numer strony (default np. 1)
    - `limit`: Liczba elementów na stronę (default np. 10 lub 20)
    - `sortBy`: Pole do sortowania, np. `name` lub `created_at`
    - `order`: Kierunek sortowania: `asc` lub `desc`

## 3. Wykorzystywane typy
- `RecipeDTO`: Reprezentuje dane przepisu, w tym pola: `id`, `name`, `rating`, `source`, `recipe` (JSON) oraz `created_at`.

## 4. Szczegóły odpowiedzi
- **Status 200 OK:** W przypadku prawidłowego zapytania, serwer zwraca tablicę obiektów `RecipeDTO`.
- **Przykładowa odpowiedź:**
  ```json
  [
    {
      "id": 1,
      "name": "Delicious Salad",
      "rating": 8,
      "source": "manual",
      "recipe": { /* recipe content */ },
      "created_at": "2023-10-01T12:34:56Z"
    }
  ]
  ```
- **Błędy:**
  - 401 Unauthorized: Użytkownik nie jest zalogowany lub token jest nieprawidłowy.

## 5. Przepływ danych
1. Klient wysyła zapytanie GET do `/api/recipes` z opcjonalnymi parametrami: `page`, `limit`, `sortBy`, `order`.
2. Middleware lub serwer API weryfikuje autentyczność użytkownika (Supabase Auth, np. w `context.locals`).
3. Endpoint przeprowadza walidację przekazanych parametrów (używając Zod lub innej biblioteki walidacji).
4. Serwis odpowiadający za logikę biznesową filtruje przepisy na podstawie `user_id` uzyskanego z kontekstu użytkownika i wykonuje zapytanie do bazy danych.
5. Dane są sortowane i paginowane zgodnie z przekazanymi parametrami.
6. Wyniki są zwracane w strukturze `RecipeDTO` do klienta.

## 6. Względy bezpieczeństwa
- Weryfikacja tokena autoryzacyjnego, aby zapewnić, że tylko zalogowani użytkownicy mają dostęp do swoich danych.
- Walidacja danych wejściowych (query parameters) aby zapobiec atakom SQL Injection i innym złośliwym działaniom.
- Ograniczenie liczby zwracanych wyników (limit) aby zmniejszyć ryzyko przeciążenia serwera.

## 7. Obsługa błędów
- **401 Unauthorized:** Gdy użytkownik nie jest autoryzowany.
- **400 Bad Request:** Gdy przekazane parametry są nieprawidłowe (np. niepoprawny format `page` lub `limit`).
- **500 Internal Server Error:** W przypadku niespodziewanych błędów serwera lub problemów z bazą danych.

## 8. Rozważania dotyczące wydajności
- Implementacja paginacji i sortowania, aby ograniczyć ilość przetwarzanych danych w jednym zapytaniu.
- Optymalizacja zapytań SQL przy wykorzystaniu limitów oraz offsetów.

## 9. Etapy wdrożenia
1. Utworzenie trasy API w pliku `src/pages/api/recipes.ts` zgodnie z wytycznymi Astro dla endpointów API.
2. Zaimplementowanie mechanizmu autoryzacji przy użyciu Supabase Auth (dostęp do `context.locals` dla uzyskania informacji o userze).
3. Walidacja parametrów zapytania (page, limit, sortBy, order) z użyciem Zod lub innej biblioteki walidacji.
4. Implementacja logiki serwisowej pobierania przepisów z bazy danych wyłącznie dla zalogowanego użytkownika, z uwzględnieniem paginacji i sortowania.