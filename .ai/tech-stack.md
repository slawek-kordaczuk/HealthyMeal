Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testowanie - Kompleksowe rozwiązania do zapewnienia jakości kodu:
- Vitest do testów jednostkowych i integracyjnych (preferowany dla projektów Vite/Astro)
- React Testing Library do testowania komponentów React
- Playwright do testów end-to-end (wsparcie dla wielu przeglądarek)
- Mock Service Worker (MSW) do mockowania API w testach
- ESLint + TypeScript strict mode do analizy statycznej kodu
- Prettier + Husky + lint-staged do automatycznego formatowania i kontroli jakości kodu

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD
- Cloudflare Pages jako hosting aplikacji Astro (z wrangler-action@v3)