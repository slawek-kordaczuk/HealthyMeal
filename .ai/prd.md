# Dokument wymagań produktu (PRD) - HealthyMeal

## 1. Przegląd produktu
HealthyMeal to aplikacja skierowana do użytkowników, którzy chcą dostosowywać przepisy kulinarne do swoich indywidualnych wymagań żywieniowych. Aplikacja integruje sztuczną inteligencję (AI) do proponowania modyfikacji przepisów oraz umożliwia ich ręczną edycję. Kluczowe funkcje obejmują zarządzanie przepisami, prosty system kont użytkowników, stronę profilu do przechowywania preferencji żywieniowych oraz automatyczną walidację modyfikacji przepisów przy pomocy AI, która sprawdza zgodność z preferencjami użytkownika. System przewiduje także dynamiczny system filtrów oraz ocenianie przepisów, a w zakresie bezpieczeństwa uwzględnia szyfrowanie haseł (AES-256).

## 2. Problem użytkownika
Użytkownicy napotykają trudności przy dostosowywaniu przepisów kulinarnych, które są powszechnie dostępne w sieci, do swoich specyficznych potrzeb dietetycznych. Standardowe przepisy często nie uwzględniają indywidualnych wymagań, takich jak alergie, diety specjalistyczne (np. wegańskie, bezglutenowe, low carb) czy preferencje dotyczące składników. Brak możliwości szybkiej modyfikacji przepisów zgodnie z osobistymi wymaganiami powoduje frustrację i obniża jakość doświadczenia kulinarnego.

## 3. Wymagania funkcjonalne
- Zarządzanie przepisami (CRUD): Użytkownik może tworzyć, odczytywać, edytować i usuwać przepisy w formie tekstowej.
- System kont użytkowników: Rejestracja, logowanie oraz zarządzanie kontem umożliwiając powiązanie przepisów z użytkownikiem.
- Strona profilu: Użytkownik może zapisywać i modyfikować swoje preferencje żywieniowe, takie jak kategorie, diety, składniki i alergie, z możliwością dodawania opcji predefiniowanych oraz niestandardowych.
- Automatyczna walidacja modyfikacji przepisów: Każda zmiana przepisu, zarówno od AI, jak i dokonywana ręcznie, jest weryfikowana pod kątem zgodności z preferencjami żywieniowymi przy pomocy AI. Mechanizm ten jest domyślnie włączony, ale może być wyłączony przez użytkownika.
- Integracja z AI: System analizuje przepisy i sugeruje modyfikacje zgodne z profilowymi preferencjami użytkownika. Zmiany te są prezentowane z opóźnieniem do momentu zatwierdzenia przez użytkownika.
- Dynamiczny system filtrów: Umożliwia ustawianie wag dla kryteriów filtrowania (domyślnie: alergeny > kategoria > składniki > diety), które użytkownik może modyfikować.
- Ocena przepisów: Użytkownik ocenia przepisy w skali od 1 do 5, a system rejestruje dodatkowe metryki, takie jak liczba wyszukiwań i modyfikacji.
- Bezpieczeństwo: Szyfrowanie haseł przy użyciu AES-256 zapewniają ochronę danych użytkownika.
- Integracja LLM: W MVP wykorzystywany jest jeden globalny klucz API do integracji z systemem AI, z planami umożliwienia indywidualnych kluczy API w przyszłych wersjach.

## 4. Granice produktu
- Do zakresu MVP nie wchodzą:
  - Import przepisów z adresu URL
  - Bogata obsługa multimediów (np. zdjęcia, filmy przepisów)
  - Udostępnianie przepisów dla innych użytkowników oraz funkcje społecznościowe
  - Historia modyfikacji przepisów i system wersjonowania
  - Indywidualne klucze API dla użytkowników
- Aspekty bezpieczeństwa ograniczają się do szyfrowania haseł (AES-256) bez dodatkowych metod jak 2FA.

## 5. Historyjki użytkowników

### US-001: Rejestracja i logowanie użytkownika
- Tytuł: Rejestracja i logowanie użytkownika
- Opis: Użytkownik rejestruje nowe konto i loguje się. Proces rejestracji zapewnia bezpieczne przechowywanie danych za pomocą szyfrowania AES-256.
- Kryteria akceptacji:
  - Użytkownik może utworzyć konto z unikalnym adresem email.
  - Użytkownik może zalogować się do systemu.
  - Hasło użytkownika jest szyfrowane.
  - W przypadku błędnych danych wyświetlane są odpowiednie komunikaty.

### US-002: Zarządzanie przepisami
- Tytuł: Zarządzanie przepisami
- Opis: Użytkownik może tworzyć, edytować, przeglądać i usuwać przepisy. Każda operacja podlega automatycznej walidacji zgodności przepisu z preferencjami żywieniowymi zapisanymi w profilu użytkownika.
- Kryteria akceptacji:
  - Użytkownik może dodać nowy przepis z tekstowym opisem.
  - Użytkownik może edytować istniejący przepis.
  - Użytkownik może usunąć przepis.
  - Mechanizm walidacji przy pomocy AI sprawdza zgodność przepisu z ustawionymi preferencjami żywieniowymi i wynik walidacji jest wyświetlany użytkownikowi.

### US-003: Przeglądanie przepisów
- Tytuł: Przeglądanie przepisów
- Opis: Użytkownik przegląda listę swoich przepisów i może wyszukiwać przepisy według różnych filtrów, takich jak kategorie i składniki.
- Kryteria akceptacji:
  - Lista przepisów jest dostępna po zalogowaniu.
  - Użytkownik może filtrować przepisy według kategorii, składników i preferencji.
  - Po wybraniu przepisu użytkownik widzi jego szczegóły.

### US-004: Modyfikacja przepisów przez AI
- Tytuł: Modyfikacja przepisów przez AI
- Opis: System analizuje przepisy i sugeruje modyfikacje zgodne z preferencjami użytkownika. Sugerowane zmiany są prezentowane z opóźnieniem do momentu, aż użytkownik zatwierdzi finalną wersję przepisu.
- Kryteria akceptacji:
  - AI sugeruje zmiany na podstawie preferencji żywieniowych użytkownika.
  - Sugerowane zmiany są wyświetlane do zatwierdzenia przez użytkownika.
  - Użytkownik może edytować, zaakceptować lub odrzucić zaproponowane modyfikacje.

### US-005: Zarządzanie preferencjami żywieniowymi
- Tytuł: Zarządzanie preferencjami żywieniowymi
- Opis: Użytkownik ustawia i modyfikuje swoje preferencje żywieniowe, w tym kategorie, diety, składniki i alergie, korzystając z opcji predefiniowanych oraz możliwości dodawania własnych.
- Kryteria akceptacji:
  - Użytkownik może ustawić preferencje żywieniowe na stronie profilu.
  - System umożliwia dodawanie nowych kategorii i modyfikację istniejących.
  - Preferencje żywieniowe wpływają na walidację przepisów i sugerowane modyfikacje AI.

### US-006: Ustawienia walidacji przepisów
- Tytuł: Ustawienia walidacji przepisów przez AI
- Opis: Użytkownik może włączyć lub wyłączyć automatyczną walidację modyfikacji przepisu, która sprawdza zgodność z preferencjami żywieniowymi.
- Kryteria akceptacji:
  - Użytkownik może zmieniać ustawienie walidacji w menu ustawień.
  - Zmiana ustawienia wpływa na automatyczną walidację przy edycji przepisów.
  - Wynik walidacji jest wyświetlany użytkownikowi

### US-007: Konfiguracja wag filtrów
- Tytuł: Konfiguracja wag filtrów
- Opis: Użytkownik ma możliwość dostosowania wag filtrów, które wpływają na wyniki wyszukiwania przepisu. Domyślnie wagi są ustawione jako: alergeny > kategoria > składniki > diety.
- Kryteria akceptacji:
  - System wyświetla domyślne wagi filtrów.
  - Użytkownik może modyfikować wartości wag.
  - Zmiany wag odzwierciedlają się w wynikach wyszukiwania i prezentacji przepisów.

### US-008: Ocena przepisów
- Tytuł: Ocena przepisów
- Opis: Użytkownik ocenia przepisy w skali od 1 do 5, a system rejestruje liczbę wyszukiwań i modyfikacji jako dodatkowe metryki.
- Kryteria akceptacji:
  - Użytkownik może przypisać ocenę wybranemu przepisowi.
  - Ocena jest zapisywana i wyświetlana w systemie.
  - System monitoruje liczbę wyszukiwań i modyfikacji przepisu.

### US-009: Bezpieczny dostęp do konta
- Tytuł: Bezpieczny dostęp do konta
- Opis: System zapewnia bezpieczny dostęp do konta użytkownika poprzez szyfrowanie haseł (AES-256), co gwarantuje ochronę danych osobowych.
- Kryteria akceptacji:
  - Hasła są szyfrowane przy użyciu algorytmu AES-256.
  - Użytkownik jest informowany o zasadach bezpieczeństwa podczas korzystania z systemu.

## 6. Metryki sukcesu
- 90% użytkowników musi mieć wypełnioną sekcję preferencji żywieniowych w profilu.
- 75% użytkowników musi generować jeden lub więcej przepisów w tygodniu.
- Monitorowanie liczby dodawanych i modyfikowanych przepisów.
- Oceny przepisu oraz metryki takie jak liczba wyszukiwań i modyfikacji stanowią wskaźniki jakości generowanych treści. 