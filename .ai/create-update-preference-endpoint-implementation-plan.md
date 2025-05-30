/*
API Endpoint Implementation Plan: POST /api/preferences

## 1. Przegląd punktu końcowego
Endpoint ten służy do tworzenia lub aktualizacji preferencji dietetycznych. Odpowiada za zapis lub modyfikację wpisu w tabeli `preferences` powiązanego z użytkownikiem. 

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** /api/preferences
- **Parametry:**
  - **Wymagane (w ciele żądania):**
    - `userId` (string) – identyfikator użytkownika 
    - `diet_type` (string lub null) – typ diety (np. "vegan")
    - `daily_calorie_requirement` (number lub null) – dzienne zapotrzebowanie kaloryczne
    - `allergies` (string lub null) – alergie
    - `food_intolerances` (string lub null) – nietolerancje pokarmowe
    - `preferred_cuisines` (string lub null) – preferowane kuchnie
    - `excluded_ingredients` (string lub null) – składniki do wykluczenia
    - `macro_distribution_protein` (number lub null) – procent białka
    - `macro_distribution_fats` (number lub null) – procent tłuszczów
    - `macro_distribution_carbohydrates` (number lub null) – procent węglowodanów
  - **Opcjonalne:**
    - `id` (number, opcjonalny) – identyfikator preferencji, używany podczas aktualizacji istniejącego rekordu

- **Request Body:** Przykładowa struktura:
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

## 3. Wykorzystywane typy
- **PreferencesDTO:** Reprezentuje dane zwracane z endpointa (odczyt preferencji użytkownika).
- **PreferencesCommandDTO:** Reprezentuje dane wejściowe przy tworzeniu lub aktualizacji preferencji, gdzie `id` jest opcjonalne.

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi:** Obiekt JSON zawierający dane preferencji zgodne z `PreferencesDTO`.
- **Kody statusu:**
  - 200 OK – przy udanej aktualizacji
  - 201 Created – przy udanym stworzeniu nowego rekordu
  - 400 Bad Request – w przypadku niepoprawnych danych wejściowych
  - 401 Unauthorized – w przypadku braku autoryzacji

## 5. Przepływ danych
1. Klient wysyła żądanie POST /api/preferences z danymi preferencji.
2. Sprawdzenie, czy dla danego `userId` już istnieje rekord w tabeli `preferences`.
3. Jeśli rekord istnieje, przeprowadzenie operacji aktualizacji; jeśli nie – utworzenie nowego rekordu.
4. Zapis do bazy danych za pośrednictwem klienta Supabase, używając bezpiecznych zapytań.
5. Zwrot odpowiedzi JSON z danymi zapisanych preferencji.

## 6. Względy bezpieczeństwa
- Stosowanie zasady minimalnych uprawnień (tylko właściciel może modyfikować swoje dane).

## 7. Obsługa błędów
- **400 Bad Request:** Niepoprawna struktura lub typy danych wejściowych (np. brak wymaganych właściwości, niewłaściwy typ danych).
- **401 Unauthorized:** Brak lub nieprawidłowy token uwierzytelniający.
- **500 Internal Server Error:** Błąd po stronie serwera lub problem z dostępem do bazy danych.
- Logowanie błędów przy użyciu systemu logowania w celu diagnozy problemów.

## 8. Etapy wdrożenia
1. **Implementacja logiki usługi:** Wyodrębnienie logiki do warstwy serwisowej (np. `preferences.service.ts`) odpowiedzialnej za sprawdzanie istnienia rekordu oraz operacje insert/update.
2. **Implementacja endpointa API:** Utworzenie lub modyfikacja endpointa w odpowiednim pliku (np. `src/pages/api/preferences.ts`), integracja z middlewarem autoryzacyjnym i wywołanie logiki serwisowej.
*/ 