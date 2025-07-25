import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AlertType = "error" | "success";

interface AlertMessageProps {
  type: AlertType;
  message: string;
  testId?: string;
}

export function AlertMessage({ type, message, testId }: AlertMessageProps) {
  const isError = type === "error";
  const baseTestId = testId || `alert-${type}`;

  const alertClasses = isError ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50";

  const textClasses = isError ? "text-red-800" : "text-green-800";

  return (
    <Alert className={alertClasses} data-testid={`${baseTestId}-alert`}>
      <AlertDescription className={textClasses} data-testid={`${baseTestId}-message`}>
        {message}
      </AlertDescription>
    </Alert>
  );
}
