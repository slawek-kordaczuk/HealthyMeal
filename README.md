# HealthyMeal

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
HealthyMeal is a web application designed to empower users to customize recipes according to their unique dietary requirements. By integrating artificial intelligence (AI), the application suggests modifications to recipes based on individual preferences such as allergies, special diets (e.g., vegan, gluten-free, low carb), and ingredient choices. The platform supports user authentication, profile management, and secure password encryption (AES-256), ensuring a safe and personalized cooking experience.

## Tech Stack
- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, authentication)
- **AI Integration:** Openrouter.ai (supports multiple models like OpenAI, Anthropic, and more)
- **Testing:** Vitest (unit tests), React Testing Library, Playwright (e2e tests), Mock Service Worker (MSW)
- **Code Quality:** ESLint, Prettier, TypeScript strict mode, Husky + lint-staged
- **CI/CD & Hosting:** GitHub Actions for CI/CD pipelines and deployment via DigitalOcean with Docker

## Getting Started Locally
### Prerequisites
- Node.js (version as specified in `.nvmrc`: 22.14.0)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/slawek-kordaczuk/HealthyMeal.git
   cd healthymeal
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   # Create .env file with the following variables:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_ENDPOINT=https://openrouter.ai/api/v1/chat/completions
   OPENROUTER_REFERER=https://your-app-domain.com
   OPENROUTER_TITLE=HealthyMeal App
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts
- `npm run dev` - Starts the Astro development server.
- `npm run build` - Builds the project for production.
- `npm run preview` - Previews the production build.
- `npm run astro` - Runs the Astro CLI.
- `npm run lint` - Runs ESLint to analyze code quality.
- `npm run lint:fix` - Automatically fixes linting errors.
- `npm run format` - Formats code using Prettier.
- `npm run test` - Runs unit tests using Vitest.
- `npm run test:ui` - Runs unit tests with Vitest UI.
- `npm run test:e2e` - Runs end-to-end tests using Playwright.

## Project Scope
HealthyMeal focuses on providing a core set of functionalities:
- **Recipe Management (CRUD):** Create, view, edit, and delete recipes.
- **User Account System:** Secure registration and login with encrypted passwords (AES-256).
- **Profile & Preferences:** Configure dietary preferences and manage filters.
- **AI-driven Recipe Modification:** Suggestions for recipe modifications based on user dietary preferences, pending user approval.
- **Dynamic Filtering & Rating:** Ability to filter recipes and rate them, tracking various interaction metrics.

Features excluded from the MVP include:
- Importing recipes via URL
- Advanced multimedia handling (e.g., images, videos)
- Social sharing and community features
- Detailed versioning and history of recipe modifications
- Individual API key management for AI integration

## Project Status
The project is currently in the MVP stage, with core functionalities implemented. Future improvements will expand feature sets and enhance user experience.

## License
This project is licensed under the MIT License.
