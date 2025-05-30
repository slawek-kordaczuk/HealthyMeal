# Dokument wymagań produktu (PRD) - HealthyMeal

## 1. Przegląd produktu
HealthyMeal to aplikacja MVP, której celem jest automatyzacja dostosowywania przepisów kulinarnych do indywidualnych potrzeb żywieniowych użytkownika przy użyciu AI. Aplikacja umożliwia zapisywanie, przeglądanie, edycję oraz usuwanie przepisów, a dodatkowo pozwala na konfigurację preferencji żywieniowych użytkownika. System integruje funkcjonalność AI, umożliwiając modyfikację przepisu, przy czym finalna wersja przepisu jest zatwierdzana przez użytkownika.

## 2. Problem użytkownika
Użytkownicy mają problem z dostosowaniem dostępnych w sieci przepisów do swoich indywidualnych wymagań dietetycznych. Ręczna modyfikacja przepisów jest czasochłonna i podatna na błędy, dlatego potrzebne jest narzędzie, które automatycznie proponuje zmodyfikowane wersje przepisów zgodne z preferencjami użytkownika.

## 3. Wymagania funkcjonalne
1. Zapisywanie, odczytywanie, przeglądanie oraz usuwanie przepisów w formie tekstowej.
2. Prosty system rejestracji i logowania, umożliwiający wiązanie przepisów z konkretnym użytkownikiem.
3. Interfejs użytkownika do konfiguracji preferencji żywieniowych.
4. Integracja z AI do modyfikowania przepisów na podstawie podanych preferencji.
5. Mechanizm zatwierdzania zmian przepisu – użytkownik decyduje, czy zatwierdzić czy odrzucić zmodyfikowaną wersję.
6. Wyświetlanie komunikatu przypominającego o konfiguracji preferencji żywieniowych, jeśli użytkownik próbuje modyfikować przepis bez ich uzupełnienia.
7. Spójny design oraz wspólna nawigacja pomiędzy trzema głównymi interfejsami: preferencje, dodawanie/modyfikacja przepisu oraz wyszukiwanie/edycja/usuwanie przepisu.
8. Zapisywanie danych analitycznych dotyczących modyfikacji oraz wyszukiwań przepisów do wewnętrznego monitoringu.
9. Logowanie krytycznych błędów integracji AI do dedykowanej tabeli błędów.
10. Implementacja polityki RLS, opartej o identyfikator user_id, z możliwością rozszerzenia o dodatkowe role czy uprawnienia.

## 4. Granice produktu
1. Import przepisów z zewnętrznych adresów URL – nie jest wspierany w MVP.
2. Rozbudowana obsługa multimediów, np. zdjęcia przepisów – MVP skupia się wyłącznie na tekście.
3. Udostępnianie przepisów innym użytkownikom oraz funkcje społecznościowe.
4. Szczegółowa audytowa rejestracja operacji użytkownika – logowanie odbywa się wyłącznie do potrzeb monitoringu.

## 5. Historyjki użytkowników

- ID: US-001
  Tytuł: Rejestracja i logowanie
  Opis: Jako nowy użytkownik chcę móc zarejestrować się i zalogować do systemu, aby móc korzystać z funkcjonalności aplikacji oraz mieć dostęp do swoich przepisów.
  Kryteria akceptacji:
    - Użytkownik może utworzyć konto oraz zalogować się do systemu.
    - Autoryzacja umożliwia dostęp tylko do własnych danych, zgodnie z polityką RLS.
    - Proces rejestracji jest prosty i intuicyjny.
    - Możliwość odzyskiwania hasła

- ID: US-002
  Tytuł: Konfiguracja preferencji żywieniowych
  Opis: Jako użytkownik chcę mieć możliwość ustawienia i edycji moich preferencji żywieniowych, aby system mógł precyzyjnie modyfikować przepisy zgodnie z moimi wymaganiami dietetycznymi.
  Kryteria akceptacji:
    - Użytkownik ma interfejs do uzupełnienia preferencji żywieniowych.
    - W przypadku braku uzupełnionych preferencji, system informuje użytkownika i sugeruje przejście do ustawień.
    - Preferencje są zapisywane i wykorzystywane przez mechanizm AI podczas modyfikacji przepisów.

- ID: US-003
  Tytuł: Dodawanie przepisu
  Opis: Jako użytkownik chcę móc dodać nowy przepis w formie tekstowej, aby móc go zapisać lub poddać modyfikacji przez AI.
  Kryteria akceptacji:
    - Użytkownik może wprowadzić przepis w jednym polu tekstowym.
    - Dostępne są opcje "zapisz" oraz "modyfikuj przy pomocy AI".
    - Przy wyborze modyfikacji, w przypadku braku preferencji żywieniowych, system wyświetla komunikat przypominający o konieczności ich uzupełnienia.

- ID: US-004
  Tytuł: Modyfikacja przepisu przy użyciu AI
  Opis: Jako użytkownik chcę skorzystać z opcji modyfikacji przepisu przez AI, aby uzyskać wersję przepisu dostosowaną do moich preferencji żywieniowych.
  Kryteria akceptacji:
    - Po wybraniu opcji "modyfikuj przy pomocy AI", użytkownik otrzymuje podgląd zmodyfikowanej wersji przepisu.
    - Interfejs podglądu zawiera jedynie opcje "zatwierdź" i "odrzuć".
    - Tylko zatwierdzona wersja przepisu jest zapisywana w systemie.

- ID: US-005
  Tytuł: Przegląd, edycja i usuwanie przepisów
  Opis: Jako użytkownik chcę mieć możliwość przeglądania, edytowania oraz usuwania zapisanych przepisów, aby móc zarządzać swoimi zasobami w aplikacji.
  Kryteria akceptacji:
    - Użytkownik może zobaczyć listę swoich przepisów.
    - Każdy przepis ma opcje ręcznej edycji, modyfikuj przy pomocy AI oraz usunięcia.
    - System potwierdza akcję usunięcia, aby zapobiec przypadkowym usunięciom.

- ID: US-006
  Tytuł: Powiadomienie o braku preferencji żywieniowych podczas modyfikacji przepisu
  Opis: Jako użytkownik chcę otrzymać wyraźne powiadomienie, że moje preferencje żywieniowe są niekompletne, gdy próbuję zmodyfikować przepis przez AI, aby móc uzupełnić te dane przed kontynuacją.
  Kryteria akceptacji:
    - Gdy użytkownik próbuje użyć funkcji modyfikacji przepisu bez uzupełnionych preferencji, system wyświetla komunikat z informacją oraz linkiem do interfejsu edycji preferencji.
    - Powiadomienie jest widoczne i zrozumiałe dla użytkownika.

## 6. Metryki sukcesu
1. Co najmniej 90% użytkowników ma uzupełnione preferencje żywieniowe w swoim profilu.
2. Co najmniej 75% użytkowników generuje jeden lub więcej zmodyfikowanych przepisów w tygodniu.
3. Wysoka satysfakcja użytkowników z intuicyjności i szybkości działania aplikacji.
4. Stabilna integracja z modułem AI, potwierdzona brakiem krytycznych błędów w logach.
5. Spójność nawigacji pomiędzy trzema głównymi interfejsami oraz utrzymanie jednolitego designu. 