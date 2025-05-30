# Dokumentacja komponentów autentykacji HealthyMeal

## Przegląd

Zostały zaimplementowane komponenty interfejsu użytkownika dla systemu autentykacji zgodnie ze specyfikacją w `.ai/auth-spec.md`. Implementacja obejmuje:

### Komponenty React

#### 1. `LoginForm.tsx`
- **Lokalizacja**: `src/components/auth/LoginForm.tsx`
- **Funkcjonalność**: Formularz logowania z walidacją email i hasła
- **Walidacja**: 
  - Email: format email
  - Hasło: wymagane pole
- **Nawigacja**: Linki do rejestracji i odzyskiwania hasła
- **Post-login**: Automatyczne ustawienie stanu autentykacji i przekierowanie

#### 2. `RegisterForm.tsx`
- **Lokalizacja**: `src/components/auth/RegisterForm.tsx`
- **Funkcjonalność**: Formularz rejestracji z kompleksową walidacją
- **Walidacja**:
  - Email: format email
  - Hasło: min. 8 znaków, mała litera, duża litera, cyfra
  - Potwierdzenie hasła: zgodność z hasłem
- **Nawigacja**: Link do logowania
- **Rejestracja**: Bezpośrednia aktywacja konta bez potwierdzenia email
- **Post-registration**: Automatyczne logowanie po 2 sekundach

#### 3. `RecoverPasswordForm.tsx`
- **Lokalizacja**: `src/components/auth/RecoverPasswordForm.tsx`
- **Funkcjonalność**: Formularz odzyskiwania hasła
- **Walidacja**: Email w poprawnym formacie
- **Nawigacja**: Link powrotu do logowania

### Strony Astro

#### 1. Strona logowania
- **URL**: `/login`
- **Plik**: `src/pages/login.astro`
- **Komponenty**: `LoginForm`

#### 2. Strona rejestracji
- **URL**: `/register`
- **Plik**: `src/pages/register.astro`
- **Komponenty**: `RegisterForm`

#### 3. Strona odzyskiwania hasła
- **URL**: `/recover-password`
- **Plik**: `src/pages/recover-password.astro`
- **Komponenty**: `RecoverPasswordForm`

## Dynamiczne menu nawigacyjne

### Stan autentykacji
- **Lokalizacja**: `src/components/NavigationMenuContainer.tsx`
- **Mechanizm**: Tymczasowo używa `sessionStorage` do przechowywania stanu autentykacji
- **Synchronizacja**: Nasłuchuje zmian w storage dla synchronizacji między zakładkami

### Menu dla niezalogowanych użytkowników
- **"HealthyMeal"** - link do strony głównej (logo)
- **"Zaloguj się"** - przycisk ghost (ukryty na mobile)
- **"Zarejestruj się"** - przycisk primary
- **"Test Login"** - tymczasowy przycisk do testowania (ukryty na mobile)

### Menu dla zalogowanych użytkowników
- **"HealthyMeal"** - link do strony głównej (logo)
- **"Moje Przepisy"** - link do listy przepisów (ukryty na mobile)
- **"Dodaj Przepis"** - link do formularza dodawania (ukryty na mobile)
- **"Preferencje"** - link do preferencji użytkownika (ukryty na mobile)
- **"Zalogowany"** - wskaźnik stanu (ukryty na mobile)
- **"Wyloguj się"** - przycisk wylogowania

### Responsywność
- **Desktop**: Wszystkie elementy widoczne
- **Mobile**: Tylko logo i podstawowe przyciski, hamburger menu dla pozostałych opcji

## Tymczasowy system autentykacji

### Mechanizm działania
- **Storage**: `sessionStorage.setItem('isAuthenticated', 'true')`
- **Sprawdzanie**: Komponent menu sprawdza stan przy każdym renderowaniu
- **Synchronizacja**: Event listener na zmiany storage

### Funkcje testowe
- **Test Login**: Przycisk symulujący pomyślne logowanie
- **Symulacja API**: setTimeout dla imitacji opóźnień sieciowych
- **Auto-login**: Automatyczne logowanie po rejestracji

### TODO - Integracja z Supabase
```typescript
// Zastąpi obecny kod:
const { data: { session }, error } = await supabase.auth.getSession();
setIsAuthenticated(!!session?.user);
```

## Stylistyka i komponenty UI

### Wykorzystane komponenty Shadcn/ui:
- `Button` - przyciski formularzy i nawigacji
- `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`, `FormDescription` - struktura formularzy
- `Input` - pola tekstowe i hasła
- `Alert`, `AlertDescription` - komunikaty błędów i sukcesu

### Walidacja:
- **React Hook Form** z resolverem **Zod**
- Walidacja po stronie klienta
- Komunikaty błędów w języku polskim
- Responsywne komunikaty dla różnych scenariuszy błędów

## Funkcjonalności do implementacji w przyszłości

### Backend integration
Obecnie komponenty zawierają TODO komentarze dla miejsc, gdzie należy zintegrować:
1. **Supabase Auth** dla rzeczywistej autentykacji
2. **API endpointy** w `src/pages/api/auth/`:
   - `register.ts` - rejestracja (bez wymagania potwierdzenia email)
   - `login.ts` - logowanie
   - `logout.ts` - wylogowanie
   - `recover.ts` - odzyskiwanie hasła

### Middleware i ochrona tras
- Middleware Astro do weryfikacji sesji
- Ochrona stron wymagających autentykacji
- Przekierowania dla niezalogowanych użytkowników

### Zaawansowane funkcje menu
- **Mobile hamburger menu**: Pełne menu mobilne z wszystkimi opcjami
- **Profil użytkownika**: Dropdown z opcjami profilu
- **Powiadomienia**: System powiadomień w menu
- **Breadcrumbs**: Nawigacja kontekstowa

## Testowanie

### Dostępne strony do przetestowania:
1. **http://localhost:4321/login** - Formularz logowania
2. **http://localhost:4321/register** - Formularz rejestracji
3. **http://localhost:4321/recover-password** - Formularz odzyskiwania hasła

### Testowanie dynamicznego menu:
1. **Stan niezalogowany**: Widoczne tylko logo, login i rejestracja
2. **Przycisk "Test Login"**: Symuluje logowanie bez formularza
3. **Stan zalogowany**: Widoczne wszystkie linki aplikacji i przycisk wylogowania
4. **Wylogowanie**: Powrót do stanu niezalogowanego

### Przepływ użytkownika:
1. Użytkownik widzi uproszczone menu (tylko logo + auth buttons)
2. Po zalogowaniu/rejestracji menu rozszerza się o funkcje aplikacji
3. Stan autentykacji utrzymuje się między odświeżeniami strony
4. Wylogowanie czyści stan i wraca do menu podstawowego

## Zgodność ze specyfikacją

✅ **Spełnione wymagania**:
- Wykorzystanie React Hook Form z Zod
- Spójna stylistyka z istniejącymi komponentami
- Komponenty w katalogu `src/components/auth/`
- Strony Astro w `src/pages/`
- Walidacja po stronie klienta
- Komunikaty błędów w języku polskim
- Responsywny design z Tailwind CSS
- Wykorzystanie komponentów Shadcn/ui
- **✅ Dynamiczne menu nawigacyjne**
- **✅ Różne elementy dla zalogowanych/niezalogowanych**
- **✅ Ukrywanie funkcji dla niezalogowanych**
- Uproszczony proces rejestracji bez wymagania potwierdzenia email

🔄 **Gotowe do implementacji**:
- Backend API endpoints
- Supabase Auth integration (z konfiguracją bez potwierdzenia email)
- Middleware dla ochrony tras
- Zaawansowane funkcje menu mobilnego
- Profil użytkownika i zarządzanie kontem 