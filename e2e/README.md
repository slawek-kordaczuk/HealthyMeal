# E2E Tests - HealthyMeal

This directory contains end-to-end tests for the HealthyMeal application using Playwright with a comprehensive Page Object Model architecture.

## Test Structure

### Page Object Model Architecture

Tests are organized using a layered Page Object Model pattern:

#### Component Layer (`page-objects/components/`)
- `LoginFormComponent.ts` - Dedicated component for login form interactions
- `NavigationMenuComponent.ts` - Dedicated component for navigation menu interactions

#### Page Layer (`page-objects/`)
- `BasePage.ts` - Base class with common functionality
- `LoginPage.ts` - Login page that uses LoginFormComponent
- `NavigationPage.ts` - Navigation wrapper that uses NavigationMenuComponent  
- `HomePage.ts` - Home page with navigation integration

### Test Files

- `auth-flow.spec.ts` - Basic authentication flow tests (direct element access)
- `auth-flow-pom.spec.ts` - Authentication flow tests using basic Page Object Model
- `auth-flow-components.spec.ts` - **Recommended**: Component-based POM tests with comprehensive workflows

## Component-Based Architecture Benefits

### Separation of Concerns
- **Components**: Handle specific UI element interactions and validations
- **Pages**: Orchestrate components and provide page-level workflows
- **Tests**: Focus on business logic and user scenarios

### Reusability
- Components can be reused across multiple pages
- Consistent interaction patterns
- Shared validation methods

### Maintainability
- Changes to UI components require updates in one place only
- Clear responsibility boundaries
- Easy to extend with new functionality

## Authentication Test Scenario

The main test scenario covers the complete authentication flow:

1. **Start on Home Page**:
   - Verify non-authenticated state
   - Navigation shows login/register buttons

2. **Navigate to Login**:
   - Use navigation component
   - Verify login form is loaded

3. **Login** with credentials:
   - Email: `test@test.pl`
   - Password: `TestPassword123`

4. **Verify authenticated state**:
   - Navigation shows authenticated links
   - User email displayed in navigation
   - Logout button visible

5. **Navigate authenticated areas**:
   - Test navigation to recipes, add recipe, preferences
   - Verify authenticated home page

6. **Logout** by clicking logout button in navigation

7. **Verify non-authenticated state**:
   - Navigation shows login/register buttons
   - Return to anonymous home page state

## Component API Examples

### LoginFormComponent
```typescript
const loginForm = new LoginFormComponent(page);

// Actions
await loginForm.fillEmail('test@test.pl');
await loginForm.fillPassword('TestPassword123');
await loginForm.submit();
// Or combined: await loginForm.login('test@test.pl', 'TestPassword123');

// Validations
expect(await loginForm.isVisible()).toBe(true);
expect(await loginForm.isErrorVisible()).toBe(false);
expect(await loginForm.isSubmitButtonDisabled()).toBe(false);
```

### NavigationMenuComponent
```typescript
const navigation = new NavigationMenuComponent(page);

// Authentication state checks
expect(await navigation.isAuthenticated()).toBe(true);
expect(await navigation.verifyAuthenticatedLayout()).toBe(true);

// Actions
await navigation.clickLogout();
await navigation.navigateToRecipes();

// Wait for state changes
await navigation.waitForAuthenticatedState();
await navigation.waitForNonAuthenticatedState();
```

### Page-Level Workflows
```typescript
const loginPage = new LoginPage(page);
const navigationPage = new NavigationPage(page);

// High-level workflows
const result = await loginPage.attemptLoginAndWaitForResult(email, password);
expect(result).toBe('success');

await navigationPage.performLogout(); // Handles click + wait for state
expect(await navigationPage.verifyFullNonAuthenticatedState()).toBe(true);
```

## Data Test IDs

All interactive elements use `data-testid` attributes for reliable test targeting:

### Login Form (`LoginFormComponent`)
- `login-form` - Main form container
- `login-email-input` - Email input field
- `login-password-input` - Password input field
- `login-submit-button` - Submit button
- `login-error-alert` - Error alert container
- `login-error-message` - Error message text
- `login-forgot-password-link` - Forgot password link
- `login-register-link` - Register link

### Navigation Menu (`NavigationMenuComponent`)
- `navigation-container` - Main navigation container
- `navigation-loading` - Loading state container
- `nav-logo-link` - Logo/home link
- `nav-auth-buttons` - Non-authenticated buttons container
- `nav-login-button` - Login button (non-authenticated)
- `nav-register-button` - Register button (non-authenticated)
- `nav-authenticated-links` - Authenticated navigation links
- `nav-user-actions` - User actions container (authenticated)
- `nav-user-email` - User email display
- `nav-logout-button` - Logout button
- `nav-link-{name}` - Individual navigation links (kebab-case)

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific test suite (recommended for development)
npx playwright test auth-flow-components.spec.ts

# Run with different options
npx playwright test --ui                    # UI mode
npx playwright test --headed                # Visible browser
npx playwright test --debug                 # Debug mode
npx playwright test --trace=on              # With trace
```

## Test Guidelines

1. **Prefer Component-Based Tests** - Use `auth-flow-components.spec.ts` as the template
2. **Use Dedicated Components** - Always interact through component classes, not direct selectors
3. **Implement Page Workflows** - Create high-level methods that combine multiple component actions
4. **Wait for States** - Use proper waiting strategies for dynamic content and state changes
5. **Verify Complete States** - Use comprehensive verification methods like `verifyFullAuthenticatedState()`
6. **Follow Arrange-Act-Assert** - Structure tests clearly with setup, action, and verification phases
7. **Use Meaningful Test Names** - Describe the complete user journey being tested

## Debugging

- **Trace viewer**: `npx playwright show-trace test-results/.../trace.zip`
- **Screenshots**: Automatically captured on failure
- **Debug mode**: `npx playwright test --debug auth-flow-components.spec.ts`
- **Component inspection**: Use component validation methods to debug state issues

## Adding New Components

When adding new UI components:

1. **Create Component Class**: Add to `./page-objects/components/`
   ```typescript
   export class NewComponent {
     constructor(private page: Page) {}
     
     get element() { return this.page.getByTestId('new-element'); }
     async action() { await this.element.click(); }
     async isVisible() { return await this.element.isVisible(); }
   }
   ```

2. **Integrate with Pages**: Add component to relevant page classes
   ```typescript
   export class SomePage extends BasePage {
     readonly newComponent: NewComponent;
     
     constructor(page: Page) {
       super(page);
       this.newComponent = new NewComponent(page);
     }
   }
   ```

3. **Add Test IDs**: Update source components with appropriate `data-testid` attributes

4. **Create Tests**: Write comprehensive tests using the new component

5. **Update Documentation**: Add component API examples and test ID references

This architecture ensures scalable, maintainable, and reliable end-to-end testing for the HealthyMeal application. 