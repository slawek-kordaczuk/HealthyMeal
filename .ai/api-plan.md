# REST API Plan

## 1. Resources
- **Users**  
  - Managed by Supabase Auth  
  - Database Table: `users`  
  - Contains unique user identifiers, emails, encrypted passwords, and creation timestamps.

- **Preferences**  
  - Represents each user's dietary preferences  
  - Database Table: `preferences`  
  - One-to-one relationship with `users` (via `user_id`)

- **Recipes**  
  - Contains recipes added by users  
  - Database Table: `recipes`  
  - Each recipe is associated with a user (1:N relationship) and includes fields such as name, rating (must be between 1 and 10), source (either `AI` or `manual`), recipe content (JSONB), and creation timestamp.

- **Recipe Modifications**  
  - Logs the history of AI-modified recipes  
  - Database Table: `recipe_modifications`  
  - One-to-many relationship with users; used to record both the original and modified recipes along with the AI model used.

- **Recipe Statistics**  
  - Contains analytics about recipe searches and modifications  
  - Database Table: `recipe_statistics`  
  - Holds metrics such as search count and modification count with update timestamps.

- **Recipe Modification Errors**  
  - Stores error logs related to AI modifications  
  - Database Table: `recipe_modification_errors`  
  - Useful for debugging and monitoring critical errors during recipe modification.

---

## 2. Endpoints

### Preferences
- **GET /api/preferences**  
  - **Description:** Retrieve the current user's dietary preferences  
  - **Response:**  
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
  - **Success Codes:** 200 OK  
  - **Error Codes:** 401 Unauthorized, 404 Not Found

- **POST /api/preferences**  
  - **Description:** Create or update the current user's dietary preferences  
  - **Request Payload:** 
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
  - **Response:** The created or updated preferences object  
  - **Success Codes:** 200 OK / 201 Created  
  - **Error Codes:** 400 Bad Request, 401 Unauthorized

---

### Recipes
- **GET /api/recipes**  
  - **Description:** List recipes for the authenticated user with support for pagination, filtering, and sorting  
  - **Query Parameters:**  
    - `page`: Page number  
    - `limit`: Number of items per page  
    - `sortBy`: Field to sort by (e.g., `name`, `created_at`)  
    - `order`: `asc` or `desc`  
  - **Response:**  
    ```json
    [
      {
        "id": 1,
        "name": "Delicious Salad",
        "rating": 8,
        "source": "manual",
        "recipe": { /* recipe content */ },
        "created_at": "2023-10-01T12:34:56Z",
        "updated_at": "2024-10-01T12:34:56Z"
      }
    ]
    ```  
  - **Success Codes:** 200 OK  
  - **Error Codes:** 401 Unauthorized

- **GET /api/recipes/{recipeId}**  
  - **Description:** Retrieve detailed information for a specific recipe  
  - **Response:** 
      ```json
       {
        "id": 1,
        "name": "Delicious Salad",
        "rating": 8,
        "source": "manual",
        "recipe": { /* recipe content */ },
        "created_at": "2023-10-01T12:34:56Z",
        "updated_at": "2024-10-01T12:34:56Z"
      }
    
    ```  
  - **Success Codes:** 200 OK  
  - **Error Codes:** 401 Unauthorized, 404 Not Found

- **POST /api/recipes**  
  - **Description:** Create a new recipe  
  - **Request Payload:**  
    ```json
    {
      "name": "New Recipe",
      "source": "manual",
      "rating": 7,
      "recipe": { /* recipe details as JSON */ }
    }
    ```  
  - **Notes:**  
    - Validate that `rating` is between 1 and 10  
    - Enforce unique recipe names  
    - Validate that recipe content is between 100 and 10000 characters  
  - **Response:** Newly created recipe object  
  - **Success Codes:** 201 Created  
  - **Error Codes:** 400 Bad Request (including validation errors), 401 Unauthorized, 409 Conflict

- **PUT /api/recipes/{recipeId}**  
  - **Description:** Update an existing recipe. When the recipe is updated—especially after an AI-based modification—the endpoint will also create a new record in the `recipe_modifications` table. This record will log the previous version (original recipe) along with the modified version for auditing and history tracking purposes.  
  - **Request Payload:** (Same as POST payload or a partial update)  
    ```json
    {
      "name": "Updated Recipe Name",
      "rating": 8,
      "recipe": { /* modified recipe content as JSON */ }
    }
    ```  
  - **Response:** Returns the updated recipe object including details such as the updated timestamp.  
  - **Success Codes:** 200 OK  
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 404 Not Found

- **DELETE /api/recipes/{recipeId}**  
  - **Description:** Delete an existing recipe  
  - **Response:** Success message or no content  
  - **Success Codes:** 200 OK / 204 No Content  
  - **Error Codes:** 401 Unauthorized, 404 Not Found

- **POST /api/recipes/modify**  
  - **Description:** Request an AI-based modification for a specific recipe based on user dietary preferences.
    - On the initial call, the endpoint verifies that the user's preferences are set.  
    - If preferences are missing, returns an error prompting the user to configure them.  
  - **Request Payload:**  
    ```json
    {
      "recipe_text": "Original recipe text that hasn't been saved yet"
    }
    ```  
  - **Response:**  
    ```json
    {
      "modified_recipe": "AI-modified recipe text"
    }
      ```  
  - **Notes:**  
    - This endpoint checks if user preferences are set
    - Validate that recipe_text content is between 100 and 10000 characters 
    - The endpoint only returns modified text without saving anything
  - **Success Codes:** 200 OK  
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity (if preferences are not set)

---

### Recipe Modifications
- **GET /api/recipes/{recipeId}/modifications**  
  - **Description:** Retrieve the modification history for a specific recipe  
  - **Response:**  
    ```json
    [
      {
        "id": 1,
        "recipe_id": 1,
        "original_recipe": { /* original recipe JSON */ },
        "modified_recipe": { /* AI modified recipe JSON */ },
        "timestamp": "2023-10-01T12:45:00Z"
      }
    ]
    ```  
  - **Success Codes:** 200 OK  
  - **Error Codes:** 401 Unauthorized, 404 Not Found

---

### Recipe Statistics
- **GET /api/recipes/{recipeId}/statistics**  
  - **Description:** Retrieve statistics for a given recipe such as search count and modification count  
  - **Response:**  
    ```json
    {
      "recipe_id": 1,
      "search_count": 10,
      "modification_count": 2,
      "last_updated": "2023-10-01T13:00:00Z"
    }
    ```  
  - **Success Codes:** 200 OK  
  - **Error Codes:** 401 Unauthorized, 404 Not Found

---

### Recipe Modification Errors
- **GET /api/modification-errors**  
  - **Description:** Retrieve a list of AI modification errors (restricted to admin users)  
  - **Response:**  
    ```json
    [
      {
        "id": 1,
        "ai_model": "model-name",
        "recipe_text": "The recipe content that failed modification",
        "error_code": 500,
        "error_description": "Detailed error message",
        "timestamp": "2023-10-01T13:15:00Z"
      }
    ]
    ```  
  - **Success Codes:** 200 OK  
  - **Error Codes:** 401 Unauthorized, 403 Forbidden

- **POST /api/modification-errors**  
  - **Description:** Log a new AI modification error  
  - **Request Payload:**  
    ```json
    {
      "recipe_text": "The problematic recipe text",
      "error_code": 500,
      "error_description": "Detailed error description"
    }
    ```  
  - **Response:** The created error log object  
  - **Success Codes:** 201 Created  
  - **Error Codes:** 400 Bad Request, 401 Unauthorized

---

## 3. Authentication and Authorization
- **Mechanism:**  
  - JWT-based authentication integrated with Supabase Auth.
  - Public endpoints: `/api/auth/register` and `/api/auth/login`  
  - Protected endpoints require the JWT token, which is verified by middleware on each request.
- **Authorization:**  
  - Leverage database row-level security (RLS) policies to ensure that only the owner (user) can access or modify their respective data.
  - Admin-specific endpoints (e.g., for viewing recipe modification errors) enforce role checks.

---

## 4. Validation and Business Logic
- **Input Validation:**  
  - **Recipes:**  
    - `rating` must be an integer between 1 and 10.
    - `name` must be unique.
    - The JSON structure for the `recipe` field must be validated.
    - Validate that the input recipe text meets the length constraints before processing.
  - **Preferences:** Validate that all required fields (diet type, caloric needs, etc.) are provided.
- **Business Logic Implementation:**  
  - For AI modification endpoints (`POST /api/recipes/modify`):
    - Verify that the current user has provided the necessary dietary preferences. If not, respond with a 422 Unprocessable Entity status and a message prompting the user to update their preferences.
    - Validate that the input recipe text meets the length constraints before processing.
    - Invoke the external AI modification service with the provided recipe text and user dietary preferences to generate a modified version.
    - Return the AI-modified recipe text in the response without saving any data to the database.
  - For subsequent creation or update of a recipe:
    - The client must use the modified recipe text (returned by the AI modification endpoints) to create a new recipe via `POST /api/recipes` or update an existing recipe via `PUT /api/recipes/{recipeId}`.
  - **Pagination, Filtering, and Sorting:**  
    - For list endpoints (e.g., GET `/api/recipes`), incorporate query parameters to support pagination, dynamic filtering, and sorting to enhance performance.
  - **Security Measures:**  
    - Apply rate limiting and input sanitization on all endpoints.
    - Mirror database constraints (such as unique and range validations) in the API to provide immediate and clear feedback.

---
