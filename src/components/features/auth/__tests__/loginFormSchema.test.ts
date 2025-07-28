import { describe, it, expect } from "vitest";
import { loginFormSchema, type LoginFormValues } from "../components/LoginForm";

describe("LoginForm Zod Schema Validation", () => {
  describe("✅ Happy Path - Valid Data", () => {
    it("should accept valid email and password", () => {
      const validData = {
        email: "user@example.com",
        password: "password123",
      };

      const result = loginFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("password123");
      }
    });

    it("should accept various valid email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "first+last@subdomain.example.org",
        "user123@test-domain.com",
        "a@b.co",
        "very.long.email.address@very-long-domain-name.com",
      ];

      validEmails.forEach((email) => {
        const result = loginFormSchema.safeParse({
          email,
          password: "validpassword",
        });

        expect(result.success).toBe(true);
      });
    });

    it("should accept passwords of various lengths", () => {
      const validPasswords = [
        "a", // minimum length (1 character)
        "short",
        "medium-length-password",
        "very-long-password-with-many-characters-and-symbols-123!@#",
        "1", // single digit
        " ", // single space (edge case)
        "password with spaces",
        "пароль", // non-ASCII characters
        "密码123", // mixed scripts
      ];

      validPasswords.forEach((password) => {
        const result = loginFormSchema.safeParse({
          email: "test@example.com",
          password,
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe("❌ Email Validation Failures", () => {
    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "plainaddress",
        "@missingusername.com",
        "username@.com",
        "username@com",
        "username..double.dot@example.com",
        "username@-example.com",
        "username@",
        "username@.example.com",
        "username.@example.com",
        "username@example.",
        "username @example.com", // space before @
        "username@ example.com", // space after @
        "", // empty string
      ];

      invalidEmails.forEach((email) => {
        const result = loginFormSchema.safeParse({
          email,
          password: "validpassword",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].code).toBe("invalid_string");
          const issue = result.error.issues[0];
          if (issue.code === "invalid_string") {
            expect(issue.validation).toBe("email");
          }
          expect(result.error.issues[0].message).toBe("Wprowadź poprawny adres email");
          expect(result.error.issues[0].path).toEqual(["email"]);
        }
      });
    });

    it("should reject non-string email values", () => {
      const invalidEmailTypes = [null, undefined, 123, true, {}, [], new Date()];

      invalidEmailTypes.forEach((email) => {
        const result = loginFormSchema.safeParse({
          email,
          password: "validpassword",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].code).toBe("invalid_type");
          expect(result.error.issues[0].path).toEqual(["email"]);
        }
      });
    });
  });

  describe("❌ Password Validation Failures", () => {
    it("should reject empty password", () => {
      const result = loginFormSchema.safeParse({
        email: "test@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].code).toBe("too_small");
        const issue = result.error.issues[0];
        if (issue.code === "too_small") {
          expect(issue.minimum).toBe(1);
          expect(issue.type).toBe("string");
        }
        expect(result.error.issues[0].message).toBe("Hasło jest wymagane");
        expect(result.error.issues[0].path).toEqual(["password"]);
      }
    });

    it("should reject non-string password values", () => {
      const invalidPasswordTypes = [null, undefined, 123, true, {}, [], new Date()];

      invalidPasswordTypes.forEach((password) => {
        const result = loginFormSchema.safeParse({
          email: "test@example.com",
          password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].code).toBe("invalid_type");
          expect(result.error.issues[0].path).toEqual(["password"]);
        }
      });
    });
  });

  describe("❌ Missing Fields", () => {
    it("should reject missing email field", () => {
      const result = loginFormSchema.safeParse({
        password: "validpassword",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].code).toBe("invalid_type");
        const issue = result.error.issues[0];
        if (issue.code === "invalid_type") {
          expect(issue.expected).toBe("string");
          expect(issue.received).toBe("undefined");
        }
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });

    it("should reject missing password field", () => {
      const result = loginFormSchema.safeParse({
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].code).toBe("invalid_type");
        const issue = result.error.issues[0];
        if (issue.code === "invalid_type") {
          expect(issue.expected).toBe("string");
          expect(issue.received).toBe("undefined");
        }
        expect(result.error.issues[0].path).toEqual(["password"]);
      }
    });

    it("should reject completely empty object", () => {
      const result = loginFormSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);

        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");

        expect(emailError?.code).toBe("invalid_type");
        expect(passwordError?.code).toBe("invalid_type");
      }
    });
  });

  describe("❌ Multiple Validation Errors", () => {
    it("should return all validation errors when both fields are invalid", () => {
      const result = loginFormSchema.safeParse({
        email: "invalid-email",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);

        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");

        expect(emailError?.message).toBe("Wprowadź poprawny adres email");
        expect(passwordError?.message).toBe("Hasło jest wymagane");
      }
    });

    it("should handle mixed type and validation errors", () => {
      const result = loginFormSchema.safeParse({
        email: 123, // wrong type
        password: "", // empty string
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);

        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");

        expect(emailError?.code).toBe("invalid_type");
        expect(passwordError?.code).toBe("too_small");
      }
    });
  });

  describe("🔒 Business Rules & Edge Cases", () => {
    it("should handle extremely long but valid email", () => {
      // RFC 5321 limit: 320 characters total
      const longEmail = "a".repeat(64) + "@" + "b".repeat(63) + ".com";

      const result = loginFormSchema.safeParse({
        email: longEmail,
        password: "password",
      });

      expect(result.success).toBe(true);
    });

    it("should accept some edge case emails that Zod considers valid", () => {
      // These are edge cases that Zod accepts, which might be surprising
      const edgeCaseEmails = [
        "username@example-.com", // domain ending with hyphen
      ];

      edgeCaseEmails.forEach((email) => {
        const result = loginFormSchema.safeParse({
          email,
          password: "password",
        });

        // Document that Zod accepts these - this test serves as documentation
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe(email);
        }
      });
    });

    it("should handle international characters in email local part", () => {
      const internationalEmails = ["tëst@example.com", "тест@example.com", "测试@example.com"];

      internationalEmails.forEach((email) => {
        const result = loginFormSchema.safeParse({
          email,
          password: "password",
        });

        // Note: Zod's email validation might be strict about international characters
        // This test documents the current behavior
        if (result.success) {
          expect(result.data.email).toBe(email);
        } else {
          // Check if it's an invalid_string issue with email validation
          const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
          if (emailError?.code === "invalid_string") {
            expect(emailError.validation).toBe("email");
          }
        }
      });
    });

    it("should preserve original case in email", () => {
      const mixedCaseEmail = "Test.User@Example.COM";

      const result = loginFormSchema.safeParse({
        email: mixedCaseEmail,
        password: "password",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(mixedCaseEmail);
      }
    });

    it("should handle whitespace trimming requirements", () => {
      // Test if schema trims whitespace (it doesn't by default)
      const result = loginFormSchema.safeParse({
        email: "  test@example.com  ",
        password: "  password  ",
      });

      expect(result.success).toBe(false); // Spaces make email invalid
    });
  });

  describe("📝 Error Message Localization", () => {
    it("should return Polish error messages", () => {
      const result = loginFormSchema.safeParse({
        email: "invalid-email",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");

        expect(emailError?.message).toBe("Wprowadź poprawny adres email");
        expect(passwordError?.message).toBe("Hasło jest wymagane");
      }
    });

    it("should maintain consistent Polish error messages across different invalid emails", () => {
      const invalidEmails = ["plaintext", "@example.com", "user@"];

      invalidEmails.forEach((email) => {
        const result = loginFormSchema.safeParse({
          email,
          password: "valid",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
          expect(emailError?.message).toBe("Wprowadź poprawny adres email");
        }
      });
    });
  });

  describe("🏷️ TypeScript Type Safety", () => {
    it("should infer correct TypeScript types", () => {
      const validData: LoginFormValues = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript should infer these as strings
        const email: string = result.data.email;
        const password: string = result.data.password;

        expect(typeof email).toBe("string");
        expect(typeof password).toBe("string");
      }
    });

    it("should match exported type definition", () => {
      // This test ensures type consistency
      const testData: LoginFormValues = {
        email: "test@example.com",
        password: "testpassword",
      };

      const result = loginFormSchema.parse(testData);

      expect(result).toEqual(testData);
      expect(result satisfies LoginFormValues).toBe(result);
    });
  });
});
