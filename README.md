# HealthyMeal

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing Environment](#testing-environment)
- [Project Structure](#project-structure)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
HealthyMeal is an AI-powered web application that revolutionizes recipe customization by automatically adapting culinary content to individual dietary requirements and preferences. The platform combines advanced artificial intelligence with comprehensive user profiling to deliver personalized cooking experiences.

### Core Functionality
- **AI-Driven Recipe Modification**: Automatically adapts existing recipes based on user's dietary preferences, allergies, and nutritional requirements
- **Comprehensive User Profiles**: Detailed preference system including diet types, calorie requirements, food intolerances, preferred cuisines, and macro-nutrient distribution
- **Recipe Management System**: Full CRUD operations for recipes with rating system (1-10), source tracking (AI vs manual), and advanced search capabilities
- **Smart Notifications**: Contextual prompts to complete dietary preferences before AI modifications
- **Analytics & Monitoring**: Built-in tracking of recipe modifications, search patterns, and error logging

### User Journey
1. **Authentication**: Secure registration/login system with password recovery
2. **Profile Setup**: Configure dietary preferences (vegan, keto, allergies, calorie targets, macro distribution)
3. **Recipe Input**: Add recipes manually or import existing ones
4. **AI Enhancement**: Request AI modifications based on personal dietary profile
5. **Review & Approve**: Preview AI suggestions with side-by-side comparison before saving
6. **Recipe Library**: Manage personal collection with search, filter, and organization tools

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

### Development
- `npm run dev` - Starts the Astro development server.
- `npm run build` - Builds the project for production.
- `npm run preview` - Previews the production build.
- `npm run astro` - Runs the Astro CLI.

### Code Quality
- `npm run lint` - Runs ESLint to analyze code quality.
- `npm run lint:fix` - Automatically fixes linting errors.
- `npm run format` - Formats code using Prettier.

### Testing
- `npm run test` - Runs unit tests using Vitest in watch mode.
- `npm run test:run` - Runs unit tests once.
- `npm run test:ui` - Runs unit tests with Vitest UI.
- `npm run test:coverage` - Runs unit tests with coverage report.
- `npm run test:e2e` - Runs end-to-end tests using Playwright.
- `npm run test:e2e:ui` - Runs E2E tests with Playwright UI.
- `npm run test:e2e:headed` - Runs E2E tests with visible browser.
- `npm run test:e2e:debug` - Runs E2E tests in debug mode.
- `npm run test:all` - Runs both unit and E2E tests.

## Application Architecture

### Backend Architecture
- **Database**: PostgreSQL with Row Level Security (RLS) policies ensuring data isolation per user
- **Authentication**: Supabase Auth with JWT-based session management
- **API Design**: RESTful endpoints with comprehensive validation using Zod schemas
- **AI Integration**: OpenRouter service supporting multiple AI models (OpenAI, Anthropic, etc.)

### Database Schema
The application uses a well-structured relational database:

- **users**: Managed by Supabase Auth (UUID-based user identification)
- **preferences**: User dietary profiles (1:1 with users)
  - Diet types (vegan, keto, paleo, etc.)
  - Daily calorie requirements
  - Allergies and food intolerances
  - Macro-nutrient distribution (protein/fats/carbs percentages)
  - Preferred cuisines and excluded ingredients
- **recipes**: Recipe storage with JSONB content (1:N with users)
  - Unique recipe names per user
  - Rating system (1-10)
  - Source tracking (AI vs manual)
  - Full-text search capabilities
- **recipe_modifications**: Audit trail of AI modifications
- **recipe_statistics**: Analytics data (search/modification counts)
- **recipe_modification_errors**: Error logging for monitoring

### Frontend Architecture
- **State Management**: React hooks with custom state management patterns
- **Component Structure**: Feature-based organization (auth, recipes, preferences)
- **Validation**: Client-side validation with Zod schemas mirroring backend
- **UI Components**: Shadcn/ui component library with Tailwind CSS styling
- **Routing**: Astro's file-based routing with middleware for protected routes

### API Endpoints
- **Authentication**: `/api/auth/*` (register, login, logout, recover)
- **Preferences**: `/api/preferences` (GET, POST for user dietary settings)
- **Recipes**: `/api/recipes/*` (CRUD operations with pagination and filtering)
- **AI Modifications**: `/api/recipes/modify` (AI-powered recipe adaptation)
- **Analytics**: Recipe statistics and modification history tracking

## Testing Environment

This project uses comprehensive testing with two main frameworks:

### Unit Tests (Vitest)
- **Framework:** Vitest with React Testing Library
- **Environment:** jsdom  
- **Coverage:** v8 provider with 80% minimum thresholds
- **Setup:** `src/test/setup.ts` with global mocks
- **Test files:** `*.test.tsx` or `*.spec.tsx` in `src/` directory

### End-to-End Tests (Playwright)
- **Framework:** Playwright with Page Object Model architecture
- **Browsers:** Chromium (Desktop Chrome)
- **Base URL:** http://localhost:4321
- **Pattern:** Component-based Page Object Model
- **Test files:** `e2e/*.spec.ts`
- **Specialized tests:** AI recipe modification flow with complete user journey testing

#### E2E Test Configuration
For E2E tests, create `.env.test` file:
```bash
# Supabase Configuration for E2E Tests
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Test User Configuration
E2E_USERNAME_ID=your-test-user-uuid
E2E_USERNAME=your-test-user-email
E2E_PASSWORD=your-test-user-password
```

**Important:** E2E tests include automatic database teardown that cleans only test user data after all tests complete.

### Coverage Requirements
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Project Structure

The project follows a structured directory organization:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers 
- `./src/assets` - static internal assets
- `./public` - public assets
- `./e2e` - End-to-end tests with Page Object Model
- `./e2e/page-objects` - Page and component classes for E2E tests

### Key Components Architecture
- **Feature-based organization:** Components grouped by domain (auth, recipes, preferences)
- **Component layer:** Reusable UI components with dedicated test files
- **Hook layer:** Custom React hooks for state management and API calls
- **Service layer:** Business logic and API integration services

## Project Scope

### ✅ Core Features (Implemented)
- **Complete User Management**
  - Secure registration/login with Supabase Auth
  - Password recovery functionality
  - Session management with JWT tokens
  - Row-level security for data isolation

- **Advanced Recipe System**
  - Full CRUD operations with validation
  - Recipe rating system (1-10 scale)
  - Source tracking (AI-generated vs manual)
  - JSONB storage for flexible recipe content
  - Unique recipe names per user
  - Advanced search and pagination

- **Comprehensive Dietary Preferences**
  - Diet type selection (vegan, keto, paleo, etc.)
  - Daily calorie requirement configuration
  - Allergy and food intolerance management
  - Preferred cuisine selections
  - Macro-nutrient distribution settings (protein/fats/carbs)
  - Excluded ingredients management

- **AI-Powered Recipe Modification**
  - Integration with OpenRouter (multiple AI models)
  - Automatic recipe adaptation based on user preferences
  - Side-by-side comparison of original vs modified recipes
  - User approval workflow for AI suggestions
  - Comprehensive error handling and logging

- **Robust Testing Infrastructure**
  - Unit tests with 80% coverage requirements
  - Component-based E2E tests with Page Object Model
  - Automated test data cleanup
  - CI/CD integration

### ❌ Features Excluded from MVP
- Recipe importing from external URLs
- Multimedia support (images, videos)
- Social features and recipe sharing
- Detailed audit logs for all user actions
- Multi-language support
- Mobile application
- Batch recipe operations
- Recipe versioning and rollback
- Advanced nutritional analysis
- Integration with fitness trackers

## Project Status
The project is currently in the MVP stage, with core functionalities implemented. Future improvements will expand feature sets and enhance user experience.

## Development Guidelines

### Code Quality
- TypeScript strict mode enabled
- ESLint for code analysis
- Prettier for code formatting
- Husky + lint-staged for pre-commit hooks

### Testing Best Practices
- **Unit Tests:** Focus on component behavior, not implementation
- **E2E Tests:** Test complete user journeys using Page Object Model
- **Coverage:** Maintain 80% minimum coverage across all metrics
- **Isolation:** Each test should be independent and repeatable

### Error Handling Patterns
- Use early returns for error conditions
- Handle errors at the beginning of functions
- Implement proper error logging
- Provide user-friendly error messages
- Use custom error types for consistent error handling

### AI Integration
- **Multi-Model Support**: OpenRouter.ai integration with access to OpenAI, Anthropic, and other leading AI models
- **Smart Validation**: Recipe content must be 100-10,000 characters (JSON stringified length)
- **User Control**: Mandatory approval workflow for all AI-suggested modifications
- **Preference Integration**: AI modifications automatically consider user's dietary preferences, allergies, and restrictions
- **Error Handling**: Comprehensive logging of AI failures with retry mechanisms
- **Input Sanitization**: Automatic cleaning of control characters and normalization
- **Rate Limiting**: Built-in protection against API abuse

### Key Business Rules & Validation

#### Recipe Management
- **Unique Naming**: Recipe names must be unique per user
- **Rating System**: Accepts ratings 1-10 (including decimals like 5.5)
- **Content Validation**: Recipe content 100-10,000 characters when JSON stringified
- **Source Tracking**: Automatic categorization as 'AI' or 'manual' origin

#### User Preferences
- **Mandatory for AI**: Complete dietary preferences required before AI modifications
- **Macro Distribution**: Protein, fats, and carbohydrates percentages must be configured
- **Flexible Configuration**: Support for multiple diet types, allergies, and restrictions

#### Security & Data Protection
- **Row Level Security**: Database-level isolation ensuring users only access their data
- **JWT Authentication**: Secure session management with automatic token refresh
- **Input Validation**: Dual validation (client + server) using Zod schemas
- **Error Logging**: Comprehensive monitoring without exposing sensitive data

## Troubleshooting

### Development Issues
- Ensure Node.js version matches `.nvmrc` (22.14.0)
- Check all environment variables are properly set

### Test Issues
- **Unit tests:** Check if all mocks are properly configured
- **E2E tests:** Verify Chromium is installed: `npx playwright install chromium`
- **Coverage:** Use `npm run test:coverage` to identify untested code paths

### Database Issues
- Verify Supabase connection and RLS policies
- For E2E tests, ensure test user exists in auth.users
- Check if `.env.test` contains all required variables
