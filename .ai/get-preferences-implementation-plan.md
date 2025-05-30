# API Endpoint Implementation Plan: GET /api/preferences

## 1. Przegląd punktu końcowego
Endpoint GET /api/preferences umożliwia pobranie preferencji żywieniowych aktualnie zalogowanego użytkownika. Wykorzystuje autoryzację przy użyciu Supabase Auth oraz zapytania do bazy danych dla tabeli `preferences`.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Endpoint URL:** /api/preferences
- **Parametry:** Nie dotyczy
- **Request Body:** Nie dotyczy

## 3. Wykorzystywane typy
- **DTO:** `PreferencesDTO` (zdefiniowany w `src/types/types.ts`)
- **Command Model (dla operacji modyfikujących):** `PreferencesCommandDTO` (nie stosowany w GET)

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):**
  ```json
  {
    "id": 1,
    "userId": "uuid",
    "diet_type": "vegan",
    "daily_calorie_requirement": 2000,
    "allergies": "none",
    "food_intolerances": "gluten",
    "preferred_cuisines": "Italian",
    "excluded_ingredients": "peanuts",
    "macro_distribution_protein": 30,
    "macro_distribution_fats": 20,
    "macro_distribution_carbohydrates": 50
  }
  ```
- **Błędy:**
  - 401 Unauthorized: gdy użytkownik nie jest uwierzytelniony
  - 404 Not Found: gdy preferencje użytkownika nie zostały znalezione
  - 500 Internal Server Error: w przypadku wystąpienia nieoczekiwanych błędów

## 5. Przepływ danych
1. Klient wysyła żądanie GET do `/api/preferences`.
2. Middleware lub logika endpointu weryfikuje autentyczność oraz uprawnienia użytkownika (np. przy użyciu Supabase Auth).
3. Logika biznesowa (umieszczona w serwisie, np. `src/lib/services/preferences.service.ts`) pobiera identyfikator użytkownika z kontekstu sesji i wykonuje zapytanie do tabeli `preferences` filtrowane po `user_id`.
4. Wynik z bazy danych mapowany jest na strukturę `PreferencesDTO` i zwracany do klienta.

## 6. Względy bezpieczeństwa
- **Autoryzacja:** Upewnianie się, że użytkownik może pobierać jedynie swoje preferencje.

## 7. Obsługa błędów
- **401 Unauthorized:** Zwracany, gdy brak ważnego tokenu uwierzytelniającego.
- **404 Not Found:** Zwracany, kiedy zapytanie do tabeli `preferences` nie zwraca wyników.
- **500 Internal Server Error:** Zwracany w przypadku wystąpienia nieoczekiwanych błędów. Zalecane jest logowanie błędów na serwerze w celu monitorowania i debugowania.


## 8. Etapy wdrożenia
1. **Utworzenie lub aktualizacja endpointu:** Dodanie pliku API w `/src/pages/api/preferences.ts` lub odpowiedniej lokalizacji.
2. **Logika biznesowa:** Stworzenie lub rozszerzenie serwisu (np. `src/lib/services/preferences.service.ts`) do pobierania preferencji użytkownika z bazy danych.
3. **Mapowanie danych:** Konwersja wyniku z bazy danych na strukturę `PreferencesDTO`.