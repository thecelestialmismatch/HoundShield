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

// Freeze "today" so the CMMC Phase 2 day counter is deterministic in snapshots.
// Without this, the snapshot ticks every time the suite runs on a new UTC day.
const FROZEN_NOW = new Date("2026-05-26T00:00:00.000Z");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("HeroSection", () => {
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
