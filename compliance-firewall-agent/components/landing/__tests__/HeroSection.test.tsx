import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock Next.js dynamic (PlatformDashboard is SSR:false)
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="platform-dashboard-mock" />,
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("framer-motion", () => ({
  motion: {
    div:  ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
    h1:   ({ children, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...p}>{children}</h1>,
    p:    ({ children, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...p}>{children}</p>,
    ul:   ({ children, ...p }: React.HTMLAttributes<HTMLUListElement>) => <ul {...p}>{children}</ul>,
  },
}));

import { HeroSection } from "../HeroSection";

describe("HeroSection", () => {
  it("renders the main headline", () => {
    render(<HeroSection />);
    expect(screen.getByText(/Proof/i)).toBeTruthy();
  });

  it("renders primary CTA button", () => {
    render(<HeroSection />);
    // Text appears in both button and paragraph — use getAllByText
    const els = screen.getAllByText(/Deploy in 15 minutes/i);
    expect(els.length).toBeGreaterThan(0);
  });

  it("renders Book a demo link", () => {
    render(<HeroSection />);
    expect(screen.getByText(/Book a demo/i)).toBeTruthy();
  });

  it("matches snapshot", () => {
    const { container } = render(<HeroSection />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
