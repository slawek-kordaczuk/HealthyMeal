# API Endpoint Implementation Plan: DELETE /api/recipes/{recipeId}

## 1. Przegląd punktu końcowego
Endpoint służy do usunięcia istniejącego przepisu. Użytkownik autoryzowany (właściciel przepisu) może usunąć swój przepis, co spowoduje kaskadowe usunięcie powiązanych rekordów (np. modyfikacje, statystyki). Endpoint zwraca komunikat o sukcesie bądź odpowiedni kod błędu w zależności od sytuacji.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE
- **Struktura URL:** /api/recipes/{recipeId}
- **Parametry:**
  - Wymagane: 
    - `recipeId` (część ścieżki) – identyfikator przepisu, typu liczbowego
  - Opcjonalne: brak
- **Request Body:** Brak

## 3. Wykorzystywane typy
- Nie są wymagane dodatkowe DTO ani Command Model, ale operacja wykorzystuje model `RecipeDTO` (importowany z `src/types/types.ts`) w operacjach odczytu przed usunięciem.

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - Kody statusu: 200 OK (z komunikatem) lub 204 No Content (bez treści)
  - Treść odpowiedzi (jeśli występuje): `{ "message": "Przepis został usunięty pomyślnie." }`
- **Błędy:**
  - 400 Bad Request – gdy `recipeId` nie jest poprawną liczbą
  - 401 Unauthorized – gdy użytkownik nie jest uwierzytelniony lub nie jest właścicielem przepisu
  - 404 Not Found – gdy przepis o podanym `recipeId` nie istnieje
  - 500 Internal Server Error – przy nieoczekiwanych błędach serwera

## 5. Przepływ danych
1. Odebranie żądania DELETE wraz z `recipeId` w URL.
2. Autoryzacja użytkownika:
   - Weryfikacja tokenu/sesji użytkownika
   - Sprawdzenie, czy użytkownik jest właścicielem przepisu
3. Walidacja wejściowa:
   - Sprawdzenie, czy `recipeId` jest liczbą całkowitą
4. Weryfikacja istnienia przepisu w bazie danych:
   - Pobranie przepisu z tabeli `recipes` na podstawie `recipeId`
5. Usunięcie przepisu:
   - Wykonanie zapytania DELETE
6. Zwrócenie odpowiedniego kodu statusu i komunikatu do klienta

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja:**
  - Upewnij się, że tylko zalogowany użytkownik z odpowiednimi uprawnieniami może usunąć przepis.
  - Weryfikacja, że użytkownik jest właścicielem przepisu przed wykonaniem operacji.
- **Walidacja danych:**
  - Sprawdzenie poprawności `recipeId` (np. czy jest liczbą).
- **Zabezpieczenia bazy danych:**
  - Używanie zapytań parametryzowanych dla ochrony przed SQL Injection.

## 7. Obsługa błędów
- **400 Bad Request:**
  - Błędny format `recipeId` (np. nie liczba)
- **401 Unauthorized:**
  - Brak ważnej autoryzacji lub niewłaściwy użytkownik
- **404 Not Found:**
  - Przepis o danym `recipeId` nie istnieje
- **500 Internal Server Error:**
  - Błędy nieprzewidziane, np. problemy z bazą danych
- Każdy błąd powinien być odpowiednio logowany

## 8. Rozważania dotyczące wydajności
- Usunięcie rekordu na podstawie klucza głównego zapewnia szybkie wykonanie operacji.

## 9. Etapy wdrożenia
1. **Stworzenie endpointu:**
   - Utworzenie pliku w `./src/pages/api/recipes/delete.ts` z obsługą żądania DELETE.
2. **Implementacja logiki usuwania:**
   - Pobranie `recipeId` z parametrów URL.
   - Weryfikacja, czy użytkownik jest uwierzytelniony oraz czy jest właścicielem przepisu.
   - Walidacja `recipeId` i weryfikacja istnienia przepisu w bazie.
   - Wywołanie funkcji serwisowej, np. `deleteRecipe(recipeId: number, userId: string)`, umieszczonej w `./src/lib/services/recipeService.ts`.
3. **Obsługa błędów i odpowiedzi:**
   - Zaimplementowanie odpowiednich odpowiedzi HTTP w zależności od wyniku operacji (200/204, 400, 401, 404, 500).