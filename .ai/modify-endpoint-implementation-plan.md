/* Plan wdrożenia endpointu modyfikacji przepisu (POST /api/recipes/modify) */

# API Endpoint Implementation Plan: Recipe Modification (POST /api/recipes/modify)

## 1. Przegląd punktu końcowego
Endpoint służy do modyfikacji przepisu przy użyciu algorytmów AI według preferencji żywieniowych użytkownika. Przed zastosowaniem modyfikacji, system weryfikuje, czy użytkownik ma ustawione preferencje (dane z tabeli `preferences`). W przypadku braku preferencji, zwracany jest błąd (422 Unprocessable Entity). W razie sukcesu, endpoint zwraca zmodyfikowany tekst przepisu według preferencji żywieniowych użytkownika, bez zapisywania zmian w bazie.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **URL:** /api/recipes/modify
- **Parametry:**
  - **Wymagane:** brak parametrów URL, wszystkie dane przekazywane są w ciele żądania
  - **Opcjonalne:** brak
- **Request Body:**
  ```json
  {
    "recipe_text": "Original recipe text that hasn't been saved yet"
  }
  ```
  - `recipe_text`: string (długość między 100 a 10000 znaków)

## 3. Wykorzystywane typy
- **`RecipeModificationCommand`** – DTO używany do przekazywania tekstu przepisu (pole `recipe_text`).
- **`RecipeModificationResponseDTO`** – DTO używany do zwracania zmodyfikowanego tekstu przepisu (pole `modified_recipe`).

## 4. Szczegóły odpowiedzi
- **200 OK:** 
  - Zwracany obiekt JSON:
    ```json
    {
      "modified_recipe": "AI-modified recipe text"
    }
    ```
- **Błędy:**
  - **400 Bad Request:** Błędne dane wejściowe lub naruszenie ograniczeń (np. `recipe_text` nie mieści się w wymaganym przedziale).
  - **401 Unauthorized:** Użytkownik nie jest zalogowany.
  - **422 Unprocessable Entity:** Brak ustawionych preferencji użytkownika.
  - **500 Internal Server Error:** Błędy serwera lub problemy z komunikacją z usługą AI.

## 5. Przepływ danych
1. Klient wysyła żądanie POST z ciałem zawierającym `recipe_text`.
2. Middleware uwierzytelniające weryfikuje tożsamość użytkownika przy użyciu Supabase Auth.
3. Walidacja danych wejściowych – weryfikacja długości `recipe_text` (100-10000 znaków) przy użyciu Zod.
4. System pobiera preferencje użytkownika z bazy danych (tabela `preferences`) na podstawie `user_id` z sesji.
5. Jeżeli preferencje nie są ustawione, zwracany jest błąd 422.
6. Wywoływana jest usługa AI w celu modyfikacji tekstu przepisu według preferencji żywieniowych użytkownika. 
7. Odebranie zmodyfikowanego tekstu i zwrócenie odpowiedzi 200 OK z wynikiem.

## 6. Względy bezpieczeństwa
- **Logowanie:** Rejestrowanie błędów (np. komunikacja z AI) – możliwe logowanie błędów w tabeli `recipe_modification_errors`.

## 7. Obsługa błędów
- **400 Bad Request:** Dane wejściowe nie spełniają ograniczeń walidacyjnych.
- **401 Unauthorized:** Użytkownik nie jest prawidłowo uwierzytelniony.
- **422 Unprocessable Entity:** Brak ustawionych preferencji użytkownika – komunikat wskazujący konieczność konfiguracji preferencji.
- **500 Internal Server Error:** Problemy serwerowe lub awaria komunikacji z usługą AI, z możliwością logowania błędów do tabeli `recipe_modification_errors`.

## 8. Etapy wdrożenia
1. **Konfiguracja endpointu:**
   - Utworzenie pliku API endpointu (`/src/pages/api/modify.ts`).
   - Implementacja obsługi metody POST.
   - Dodanie middleware uwierzytelniającego.
2. **Weryfikacja preferencji użytkownika:**
   - Pobranie danych z tabeli `preferences` na podstawie `user_id`.
   - Obsługa błędu 422 w przypadku braku preferencji.
3. **Integracja z usługą AI:**
   - Wyodrębnienie logiki do serwisu (`src/lib/services/recipe.modification.service.ts`).
   - Implementacja komunikacji z zewnętrzną usługą AI.
4. **Obsługa błędów i logowanie:**
   - Zaimplementowanie mechanizmu logowania błędów (do tabeli `recipe_modification_errors`).
