import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

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
  // Freeze the clock so the "days until CMMC Phase 2 (Nov 10, 2026)" countdown
  // is deterministic. Without this the snapshot drifts by one every calendar
  // day and CI goes red on any day except the one the snapshot was generated.
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("renders the main headline", () => {
    render(<HeroSection />);
    // Headline text is split across spans; match a substring that's all in one node
    expect(screen.getByText(/in 10 minutes/i)).toBeTruthy();
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
