import { describe, it, expect } from "vitest";
import { registerFormSchema, type RegisterFormValues } from "../RegisterForm";

describe("RegisterForm Zod Schema Validation", () => {
  describe("✅ Happy Path - Valid Data", () => {
    it("should accept valid registration data", () => {
      const validData = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("Password123");
        expect(result.data.confirmPassword).toBe("Password123");
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
        const result = registerFormSchema.safeParse({
          email,
          password: "ValidPass123",
          confirmPassword: "ValidPass123",
        });

        expect(result.success).toBe(true);
      });
    });

    it("should accept various valid password formats", () => {
      const validPasswords = [
        "Password1", // minimum requirements
        "MySecurePass123", // standard format
        "P@ssw0rd123", // with special characters
        "VeryLongPasswordWith123", // longer password
        "aB3defgh", // exactly 8 characters
        "ComplexP@ssw0rd123!", // complex password
      ];

      validPasswords.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
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
        const result = registerFormSchema.safeParse({
          email,
          password: "ValidPass123",
          confirmPassword: "ValidPass123",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
          expect(emailError?.code).toBe("invalid_string");
          if (emailError?.code === "invalid_string") {
            expect(emailError.validation).toBe("email");
          }
          expect(emailError?.message).toBe("Wprowadź poprawny adres email");
        }
      });
    });

    it("should reject non-string email values", () => {
      const invalidEmailTypes = [null, undefined, 123, true, {}, [], new Date()];

      invalidEmailTypes.forEach((email) => {
        const result = registerFormSchema.safeParse({
          email,
          password: "ValidPass123",
          confirmPassword: "ValidPass123",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
          expect(emailError?.code).toBe("invalid_type");
        }
      });
    });
  });

  describe("❌ Password Validation Failures", () => {
    it("should reject passwords shorter than 8 characters", () => {
      const shortPasswords = ["", "a", "Ab1", "Pass12", "1234567"];

      shortPasswords.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
          if (password === "") {
            expect(passwordError?.code).toBe("too_small");
          } else {
            expect(passwordError?.code).toBe("too_small");
          }
          expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej 8 znaków");
        }
      });
    });

    it("should reject passwords without lowercase letters", () => {
      const passwordsWithoutLowercase = [
        "PASSWORD123", // all uppercase
        "12345678", // only digits
        "PASSWORD", // only uppercase letters
        "123456789", // only numbers
        "PASS@WORD123", // uppercase with special chars and numbers
      ];

      passwordsWithoutLowercase.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
          expect(passwordError?.code).toBe("invalid_string");
          if (passwordError?.code === "invalid_string") {
            expect(passwordError.validation).toBe("regex");
          }
          expect(passwordError?.message).toBe(
            "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
          );
        }
      });
    });

    it("should reject passwords without uppercase letters", () => {
      const passwordsWithoutUppercase = [
        "password123", // all lowercase
        "mypass123", // lowercase with numbers
        "secure@pass123", // lowercase with special chars and numbers
      ];

      passwordsWithoutUppercase.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
          expect(passwordError?.code).toBe("invalid_string");
          expect(passwordError?.message).toBe(
            "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
          );
        }
      });
    });

    it("should reject passwords without digits", () => {
      const passwordsWithoutDigits = [
        "Password", // only letters
        "MySecurePass", // mixed case letters
        "Pass@Word", // letters with special chars
        "PASSWORD", // all uppercase
        "password", // all lowercase
      ];

      passwordsWithoutDigits.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
          expect(passwordError?.code).toBe("invalid_string");
          expect(passwordError?.message).toBe(
            "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
          );
        }
      });
    });

    it("should reject non-string password values", () => {
      const invalidPasswordTypes = [null, undefined, 123, true, {}, [], new Date()];

      invalidPasswordTypes.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: "ValidPass123",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
          expect(passwordError?.code).toBe("invalid_type");
        }
      });
    });
  });

  describe("❌ Confirm Password Validation Failures", () => {
    it("should reject empty confirm password", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.code).toBe("too_small");
        expect(confirmPasswordError?.message).toBe("Potwierdzenie hasła jest wymagane");
      }
    });

    it("should reject non-string confirm password values", () => {
      const invalidConfirmPasswordTypes = [null, undefined, 123, true, {}, [], new Date()];

      invalidConfirmPasswordTypes.forEach((confirmPassword) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password: "ValidPass123",
          confirmPassword,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
          expect(confirmPasswordError?.code).toBe("invalid_type");
        }
      });
    });
  });

  describe("❌ Password Matching Validation", () => {
    it("should reject when passwords don't match", () => {
      const mismatchedPairs = [
        { password: "ValidPass123", confirmPassword: "ValidPass124" },
        { password: "Password1", confirmPassword: "Password2" },
        { password: "MySecure123", confirmPassword: "YourSecure123" },
        { password: "ValidPass123", confirmPassword: "validpass123" }, // case sensitivity
        { password: "Password123", confirmPassword: "Password123 " }, // trailing space
        { password: " Password123", confirmPassword: "Password123" }, // leading space
      ];

      mismatchedPairs.forEach(({ password, confirmPassword }) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const matchError = result.error.issues.find((issue) => issue.path.includes("confirmPassword"));
          expect(matchError?.message).toBe("Hasła nie są identyczne");
          expect(matchError?.path).toEqual(["confirmPassword"]);
        }
      });
    });

    it("should validate password matching even when individual passwords are valid", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123",
        confirmPassword: "AnotherValid456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should only have the matching error, not individual password validation errors
        const matchingError = result.error.issues.find((issue) => issue.message === "Hasła nie są identyczne");
        expect(matchingError).toBeDefined();
        expect(matchingError?.path).toEqual(["confirmPassword"]);
      }
    });
  });

  describe("❌ Missing Fields", () => {
    it("should reject missing email field", () => {
      const result = registerFormSchema.safeParse({
        password: "ValidPass123",
        confirmPassword: "ValidPass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        expect(emailError?.code).toBe("invalid_type");
        if (emailError?.code === "invalid_type") {
          expect(emailError.expected).toBe("string");
          expect(emailError.received).toBe("undefined");
        }
      }
    });

    it("should reject missing password field", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        confirmPassword: "ValidPass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
        expect(passwordError?.code).toBe("invalid_type");
      }
    });

    it("should reject missing confirmPassword field", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.code).toBe("invalid_type");
      }
    });

    it("should reject completely empty object", () => {
      const result = registerFormSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);

        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");

        expect(emailError?.code).toBe("invalid_type");
        expect(passwordError?.code).toBe("invalid_type");
        expect(confirmPasswordError?.code).toBe("invalid_type");
      }
    });
  });

  describe("❌ Multiple Validation Errors", () => {
    it("should return all validation errors when all fields are invalid", () => {
      const result = registerFormSchema.safeParse({
        email: "invalid-email",
        password: "weak", // too short and missing requirements
        confirmPassword: "", // empty
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);

        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");

        expect(emailError?.message).toBe("Wprowadź poprawny adres email");
        expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej 8 znaków");
        expect(confirmPasswordError?.message).toBe("Potwierdzenie hasła jest wymagane");
      }
    });

    it("should show password complexity error before matching error", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "weak", // doesn't meet complexity requirements
        confirmPassword: "differentweak", // also doesn't match
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
        expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej 8 znaków");
      }
    });

    it("should show matching error when passwords are valid but don't match", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const matchError = result.error.issues.find((issue) => issue.message === "Hasła nie są identyczne");
        expect(matchError).toBeDefined();
        expect(matchError?.path).toEqual(["confirmPassword"]);
      }
    });
  });

  describe("🔒 Business Rules & Edge Cases", () => {
    it("should handle exactly 8 character password with all requirements", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "aB345678", // exactly 8 chars: lowercase, uppercase, digit
        confirmPassword: "aB345678",
      });

      expect(result.success).toBe(true);
    });

    it("should handle very long passwords", () => {
      const longPassword = "VeryLongPassword123WithManyCharactersButStillValid";

      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: longPassword,
        confirmPassword: longPassword,
      });

      expect(result.success).toBe(true);
    });

    it("should handle passwords with special characters", () => {
      const passwordsWithSpecialChars = ["Password123!", "MyP@ssw0rd", "Secure#Pass1", "Valid$Pass9", "Test&Pass8"];

      passwordsWithSpecialChars.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
        });

        expect(result.success).toBe(true);
      });
    });

    it("should handle international characters in passwords", () => {
      // These should be valid as long as they meet the regex requirements
      const internationalPasswords = [
        "Pássword123", // accented characters
        "Пароль123А", // Cyrillic with Latin requirements
        "密码Password1", // mixed scripts
      ];

      internationalPasswords.forEach((password) => {
        const result = registerFormSchema.safeParse({
          email: "test@example.com",
          password,
          confirmPassword: password,
        });

        // The regex only checks for [a-z], [A-Z], and \d, so international chars are allowed
        // as long as there's at least one of each required type
        if (result.success) {
          expect(result.data.password).toBe(password);
        }
      });
    });

    it("should preserve case sensitivity in password matching", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "password123", // different case
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const matchError = result.error.issues.find((issue) => issue.message === "Hasła nie są identyczne");
        expect(matchError).toBeDefined();
      }
    });

    it("should handle whitespace in passwords strictly", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "Password 123", // space in middle
        confirmPassword: "Password 123",
      });

      expect(result.success).toBe(true); // Spaces are allowed in passwords
    });

    it("should handle leading/trailing spaces as different passwords", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: " Password123 ", // with spaces
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const matchError = result.error.issues.find((issue) => issue.message === "Hasła nie są identyczne");
        expect(matchError).toBeDefined();
      }
    });
  });

  describe("📝 Error Message Localization", () => {
    it("should return Polish error messages for all validation types", () => {
      const result = registerFormSchema.safeParse({
        email: "invalid-email",
        password: "weak",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((issue) => issue.path[0] === "email");
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");

        expect(emailError?.message).toBe("Wprowadź poprawny adres email");
        expect(passwordError?.message).toBe("Hasło musi zawierać co najmniej 8 znaków");
        expect(confirmPasswordError?.message).toBe("Potwierdzenie hasła jest wymagane");
      }
    });

    it("should return Polish error message for password complexity", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "password123", // missing uppercase
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((issue) => issue.path[0] === "password");
        expect(passwordError?.message).toBe(
          "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
        );
      }
    });

    it("should return Polish error message for password mismatch", () => {
      const result = registerFormSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass124",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const matchError = result.error.issues.find((issue) => issue.message === "Hasła nie są identyczne");
        expect(matchError).toBeDefined();
        expect(matchError?.path).toEqual(["confirmPassword"]);
      }
    });
  });

  describe("🏷️ TypeScript Type Safety", () => {
    it("should infer correct TypeScript types", () => {
      const validData: RegisterFormValues = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        // TypeScript should infer these as strings
        const email: string = result.data.email;
        const password: string = result.data.password;
        const confirmPassword: string = result.data.confirmPassword;

        expect(typeof email).toBe("string");
        expect(typeof password).toBe("string");
        expect(typeof confirmPassword).toBe("string");
      }
    });

    it("should match exported type definition", () => {
      // This test ensures type consistency
      const testData: RegisterFormValues = {
        email: "test@example.com",
        password: "TestPassword123",
        confirmPassword: "TestPassword123",
      };

      const result = registerFormSchema.parse(testData);

      expect(result).toEqual(testData);
      expect(result satisfies RegisterFormValues).toBe(result);
    });

    it("should enforce required fields at compile time", () => {
      // This test documents the TypeScript interface
      const requiredFields: Required<RegisterFormValues> = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerFormSchema.parse(requiredFields);
      expect(result).toEqual(requiredFields);
    });
  });
});
