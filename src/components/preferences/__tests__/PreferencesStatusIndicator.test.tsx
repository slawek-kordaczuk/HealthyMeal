import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/utils";
import PreferencesStatusIndicator from "../PreferencesStatusIndicator";

describe("PreferencesStatusIndicator", () => {
  it("should render alert when preferences are not set", () => {
    render(<PreferencesStatusIndicator arePreferencesSet={false} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("should not render alert when preferences are set", () => {
    render(<PreferencesStatusIndicator arePreferencesSet={true} />);

    const alert = screen.queryByRole("alert");
    expect(alert).not.toBeInTheDocument();
  });

  it("should apply custom className when provided", () => {
    const customClass = "custom-test-class";
    render(<PreferencesStatusIndicator arePreferencesSet={false} className={customClass} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass(customClass);
  });

  it("should have correct accessibility attributes", () => {
    render(<PreferencesStatusIndicator arePreferencesSet={false} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("role", "alert");
  });

  it("should contain link to preferences page", () => {
    render(<PreferencesStatusIndicator arePreferencesSet={false} />);

    const link = screen.getByRole("link", { name: /skonfiguruj preferencje/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/preferences");
  });
});
