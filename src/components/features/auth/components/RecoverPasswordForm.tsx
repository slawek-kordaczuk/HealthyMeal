import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Zod schema for form validation
const recoverPasswordFormSchema = z.object({
  email: z.string().email("Wprowadź poprawny adres email"),
});

export type RecoverPasswordFormValues = z.infer<typeof recoverPasswordFormSchema>;

interface RecoverPasswordFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export default function RecoverPasswordForm({
  onSuccess,
  onNavigateToLogin = () => (window.location.href = "/login"),
}: RecoverPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RecoverPasswordFormValues>({
    resolver: zodResolver(recoverPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: RecoverPasswordFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // TODO: Replace with actual password recovery logic when backend is implemented
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email } = values;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For now, show success message
      setSuccessMessage(
        "Jeśli podany adres email istnieje w naszym systemie, wysłaliśmy na niego link do zresetowania hasła. Sprawdź swoją skrzynkę email."
      );

      // Reset form after successful request
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Password recovery error:", err);
      setError("Wystąpił błąd podczas wysyłania linku do odzyskiwania hasła. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Odzyskiwanie hasła</h2>
        <p className="text-gray-600">Wprowadź swój adres email, a wyślemy Ci link do zresetowania hasła.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="wprowadz@email.com" {...field} />
                </FormControl>
                <FormDescription>Wprowadź adres email użyty podczas rejestracji.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Wysyłanie..." : "Wyślij link do odzyskiwania"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-gray-600">
        Przypomniałeś sobie hasło?{" "}
        <button type="button" onClick={onNavigateToLogin} className="text-blue-600 hover:text-blue-500 underline">
          Zaloguj się
        </button>
      </div>
    </div>
  );
}
