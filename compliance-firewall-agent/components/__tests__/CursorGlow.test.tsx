import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock matchMedia (jsdom doesn't implement it)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { CursorGlow } from "../CursorGlow";

describe("CursorGlow", () => {
  it("renders without crashing", () => {
    const { container } = render(<CursorGlow />);
    expect(container).toBeTruthy();
  });

  it("mounts a glow element", () => {
    const { container } = render(<CursorGlow />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
