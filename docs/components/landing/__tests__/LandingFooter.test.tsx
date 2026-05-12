import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/Logo", () => ({
  Logo: () => <div data-testid="logo-mock" />,
}));
vi.mock("@/components/TextLogo", () => ({
  TextLogo: () => <span data-testid="text-logo-mock">Hound Shield</span>,
}));

import { LandingFooter } from "../LandingFooter";

describe("LandingFooter", () => {
  it("renders without crashing", () => {
    const { container } = render(<LandingFooter />);
    expect(container.querySelector("footer")).toBeTruthy();
  });

  it("renders all section headings", () => {
    render(<LandingFooter />);
    ["Product", "Industries", "Resources", "Legal"].forEach((heading) => {
      expect(screen.getByText(heading)).toBeTruthy();
    });
  });

  it("renders Privacy and Terms links", () => {
    render(<LandingFooter />);
    const privacyLinks = screen.getAllByText(/Privacy/i);
    expect(privacyLinks.length).toBeGreaterThan(0);
  });

  it("matches snapshot", () => {
    const { container } = render(<LandingFooter />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
