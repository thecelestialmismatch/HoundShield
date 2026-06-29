import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock Next.js modules
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock theme provider
vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
    useSpring: () => ({ set: vi.fn(), get: () => 0 }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
      nav: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <nav {...props}>{children}</nav>,
      span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
      button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    },
  };
});

import { Navbar } from "../Navbar";

describe("Navbar", () => {
  it("renders without crashing", () => {
    const { container } = render(<Navbar />);
    expect(container).toBeTruthy();
  });

  it("contains a nav element", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("matches snapshot", () => {
    const { container } = render(<Navbar />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
