# E2E Database Teardown - Czyszczenie danych testowego użytkownika

Ten projekt wykorzystuje Playwright teardown do automatycznego czyszczenia danych testowego użytkownika z bazy danych Supabase po wszystkich testach e2e.

## Konfiguracja

### 1. Zmienne środowiskowe

Teardown wymaga następujących zmiennych w pliku `.env.test`:

```bash
# Supabase Configuration for E2E Tests
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Optional: Service Role Key for teardown (bypasses RLS)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Test User Configuration
E2E_USERNAME_ID=d28f8076-e270-41fe-afda-f593d4c93136
E2E_USERNAME=test@test.pl
E2E_PASSWORD=TestPassword123
```

**Ważne**: 
- `E2E_USERNAME_ID` musi być rzeczywistym UUID użytkownika w systemie auth Supabase
- Jeśli RLS jest włączone, teardown automatycznie loguje się jako testowy użytkownik
- Opcjonalnie można użyć `SUPABASE_SERVICE_ROLE_KEY` do pominięcia RLS

## Jak to działa

### Bezpieczne czyszczenie danych

Teardown usuwa **tylko dane konkretnego testowego użytkownika**, nie wpływając na:
- Inne konta użytkowników
- Dane produkcyjne
- Konfigurację systemową

### Kolejność usuwania

1. **Recipe modifications** - usuwane na podstawie `user_id`
2. **Recipe statistics** - usuwane dla przepisów należących do testowego użytkownika
3. **Recipes** - usuwane na podstawie `user_id`
4. **Preferences** - usuwane na podstawie `user_id`
5. **Recipe modification errors** - czyszczone tylko z ostatniej godziny (brak `user_id`)

### Global Teardown

- **Plik**: `e2e/global.teardown.ts`
- **Konfiguracja**: `playwright.config.ts` → `globalTeardown`
- **Workers**: `1` (pojedynczy worker dla bezpieczeństwa danych)
- **Uruchomienie**: Automatycznie po wszystkich testach e2e

## Uruchomienie testów

```bash
# Uruchom wszystkie testy e2e
npx playwright test

# Uruchom pojedynczy test z teardown
npx playwright test e2e/auth-flow.spec.ts --reporter=line
```

## Logi podczas teardown

Po testach zobaczysz:

```
🧹 Czyszczenie danych testowego użytkownika po testach e2e...
🔑 Używany klucz: Anon (ograniczone przez RLS)
⚠️ Próba logowania jako testowy użytkownik (anon key wymaga auth)...
✅ Pomyślnie zalogowano jako testowy użytkownik w teardown
🎯 Usuwanie danych dla testowego użytkownika: 7c934cc4-adc6-4af7-923b-c314b0746073
🔍 Sprawdzanie danych testowego użytkownika...
📊 Znalezione dane:
    - Przepisy: 3
    - Preferencje: 1
    - Modyfikacje: 0
📝 Przepisy do usunięcia: "Testowy Przepis 123", "Inny Przepis", "Test Recipe"
✅ Usunięto 3 przepisów testowego użytkownika
✅ Usunięto 1 preferencji testowego użytkownika
🎉 Dane testowego użytkownika zostały pomyślnie wyczyszczone po testach e2e
```

## Bezpieczeństwo

### Izolacja danych
- Usuwa tylko dane powiązane z `E2E_USERNAME_ID`
- Nie dotyka danych innych użytkowników
- Respektuje foreign key constraints

### Error handling
- Szczegółowe logi dla każdej operacji
- Graceful handling błędów nie-krytycznych
- Walidacja zmiennych środowiskowych

### Ograniczenia czasowe
- Recipe modification errors: tylko z ostatniej godziny
- Inne dane: tylko dla konkretnego user_id

### Pojedynczy worker
- `workers: 1` w konfiguracji Playwright
- Zapobiega konfliktom podczas pracy z tym samym testowym użytkownikiem
- Testy wykonują się sekwencyjnie, nie równolegle
- Zapewnia czystość danych między testami

## Troubleshooting

### Błąd: "Missing test user ID environment variable"

```bash
# Sprawdź czy .env.test zawiera E2E_USERNAME_ID
cat .env.test | grep E2E_USERNAME_ID
```

### Błąd: "Missing Supabase environment variables"

```bash
# Sprawdź konfigurację Supabase
cat .env.test | grep SUPABASE
```

### Błąd podczas usuwania danych

1. **RLS (Row Level Security) blokuje dostęp**:
   - Teardown automatycznie próbuje zalogować się jako testowy użytkownik
   - Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` są poprawne
   - Alternatywnie dodaj `SUPABASE_SERVICE_ROLE_KEY` do `.env.test`

2. **Testowy użytkownik nie istnieje**:
   - Sprawdź czy użytkownik istnieje w auth.users w Supabase Dashboard
   - Sprawdź czy `E2E_USERNAME_ID` jest poprawny

3. **RLS policies są zbyt restrykcyjne**:
   - Sprawdź RLS policies dla tabel w Supabase Dashboard
   - Upewnij się, że użytkownik ma dostęp do swoich danych

### Dezaktywacja teardown

Skomentuj w `playwright.config.ts`:

```typescript
// globalTeardown: "./e2e/global.teardown.ts",
```

## Struktura plików

```
e2e/
├── global.teardown.ts       # Implementacja teardown
├── README-TEARDOWN.md       # Ta dokumentacja  
├── *.spec.ts               # Twoje testy e2e
└── ...

playwright.config.ts         # Konfiguracja z globalTeardown
.env.test                    # Zmienne środowiskowe dla testów
```

## Najlepsze praktyki

### Konfiguracja testowego użytkownika

1. Utwórz dedykowanego użytkownika tylko do testów
2. Użyj unikalnej domeny email (np. `test@test.pl`)
3. Zapisz UUID w `E2E_USERNAME_ID`
4. Zapisz dane logowania w `E2E_USERNAME` i `E2E_PASSWORD`
5. Nie używaj prawdziwych danych osobowych

**Ważne**: Wszystkie testy logowania używają automatycznie danych z `.env.test` - nie ma potrzeby przekazywania parametrów do metod `login()`.

### Środowisko testowe

1. Używaj oddzielnej instancji Supabase dla testów
2. Skonfiguruj RLS policies zgodne z aplikacją
3. Regularnie backup'uj dane testowe
4. Monitoruj performance teardown

### Debugging

```bash
# Zobacz szczegółowe logi teardown
npx playwright test --reporter=line

# Sprawdź tylko teardown bez testów  
# (obecnie nie ma takiej opcji - teardown uruchamia się tylko po testach)
``` 