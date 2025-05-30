# Architektura UI dla HealthyMeal

## 1. Przegląd struktury UI

Ogólna struktura interfejsu opiera się na podziale na wyraźnie zdefiniowane widoki, które realizują kluczowe funkcjonalności określone w PRD, API plan i notatkach z sesji. Architektura zakłada korzystanie z:
- Responsive design dzięki Tailwind
- Komponentów UI opartych na Shadcn/ui oraz React

## 2. Lista widoków

1. **Ekran autoryzacji**
   - Ścieżka: `/login` (oraz `/register`)
   - Główny cel: Umożliwienie użytkownikom logowania i rejestracji.
   - Kluczowe informacje: Formularz logowania/rejestracji, komunikaty o błędach.
   - Kluczowe komponenty: Formularze, przyciski, powiadomienia inline.
   - UX/Dostępność: Prosty, intuicyjny interfejs z wyraźnymi polami wejściowymi i komunikatami o walidacji; poprawna nawigacja klawiaturą (keyboard accessibility).
   - Względy bezpieczeństwa: Ochrona danych logowania oraz zabezpieczenia JWT.

2. **Lista przepisów z modalem edycji**
   - Ścieżka: `/recipes`
   - Główny cel: Przegląd, edycja (ręczna lub przez AI) oraz usuwanie przepisów.
   - Kluczowe informacje: Lista przepisów użytkownika wraz z podsumowaniami (nazwa, ocena, źródło).
   - Kluczowe komponenty:
     - Lista przepisów (karty/przejrzysty widok listowy)
     - Modal do edycji przepisu, który umożliwia przełączanie pomiędzy edycją ręczną a modyfikacją przez AI.
     - Komponenty do filtrowania, paginacji oraz wyszukiwania.
   - UX/Dostępność: Responsywny widok, intuicyjne sterowanie modalem, wygodna możliwość przeglądania i edycji.
   - Względy bezpieczeństwa: Walidacja operacji użytkownika oraz bezpieczne przekazywanie danych API.

3. **Konfiguracja preferencji**
   - Ścieżka: `/preferences`
   - Główny cel: Umożliwienie ustawienia i edycji preferencji żywieniowych użytkownika.
   - Kluczowe informacje: Formularz ustawień, status konfiguracji (np. przypomnienie o brakujących preferencjach).
   - Kluczowe komponenty: Formularze, pola wyboru, listy rozwijane, komunikaty inline.
   - UX/Dostępność: Prosty i intuicyjny formularz, natychmiastowe walidacje i powiadomienia, responsywność.
   - Względy bezpieczeństwa: Dane użytkownika zabezpieczone, łatwa modyfikacja ustawień.

4. **Ekran dodawania przepisu**
   - Ścieżka: `/add-recipe`
   - Główny cel: Dodanie nowego przepisu (ręcznie lub ze zmodyfikowaną przez AI wersją).
   - Kluczowe informacje: Formularz do wprowadzania treści przepisu, opcja modyfikacji przez AI, komunikaty walidacyjne.
   - Kluczowe komponenty: Pola tekstowe, przyciski, moduł AI dla modyfikacji przepisu, komunikaty inline.
   - UX/Dostępność: Jasno oznaczone opcje, intuicyjna edycja treści oraz walidacja wejścia.
   - Względy bezpieczeństwa: Weryfikacja danych wejściowych (walidacja długości treści przepisu, unikalność nazwy, ocena przepisu).

## 3. Mapa podróży użytkownika

1. Użytkownik trafia na stronę logowania/rejestracji (`/login` lub `/register`).
2. Po autentykacji przenoszony jest do listy przepisów (`/recipes`), gdzie może przeglądać, edytować lub usuwać przepisy.
   - Kliknięcie na przepis otwiera modal edycji, umożliwiający przełączenie między edycją ręczną a modyfikacją przez AI.
4. Jeśli użytkownik próbuje skorzystać z modyfikacji przez AI, a nie uzupełnił preferencji żywieniowych, wyświetla mu się komunikat z informacją o braku preferencji i możliwością przejścia do ustawień.
5. Użytkownik może przejść do konfiguracji preferencji (`/preferences`), aby zaktualizować swoje ustawienia.
6. Proces dodawania nowego przepisu (`/add-recipe`) oferuje możliwość wyboru pomiędzy dodaniem przepisu ręcznie a użyciem modyfikacji AI, co dodatkowo integruje się z walidacją dostępności preferencji.

## 4. Układ i struktura nawigacji

Górne menu nawigacyjne, oparte na komponencie Navigation menu z Shadcn/ui, zawiera odnośniki do:
- Listy przepisów
- Konfiguracji preferencji
- Ekranu dodawania przepisu

Menu jest widoczne na wszystkich głównych widokach i umożliwia szybkie przełączanie między sekcjami. Dodatkowo, w menu umieszczone są opcje dostępne tylko dla zalogowanych użytkowników, zapewniając spójność interfejsu i ochronę danych.

## 5. Kluczowe komponenty

- **Navigation Menu**: Centralny komponent nawigacji, który umożliwia przełączanie między widokami.
- **Formularze**: Komponenty wykorzystywane w ekranach logowania, rejestracji, konfiguracji preferencji i dodawania przepisu, z natychmiastową walidacją wejścia.
- **Lista Przepisów**: Elastyczny komponent umożliwiający wyświetlanie przepisów w formie kart lub listy z funkcjami sortowania i filtrowania.
- **Modal Edycji**: Komponent modalny do edycji przepisu, oferujący tryby ręczny i AI.
- **Komunikaty Błędów**: Inline'owe komunikaty informujące o błędach walidacji i problemach z API.
- **React Context & Hooks**: Mechanizmy zarządzania stanem aplikacji oraz in-memory caching.
- **Responsywność**: Wszelkie komponenty wykorzystują Tailwind utility variants (sm:, md:, lg:) do zapewnienia responsywności. 