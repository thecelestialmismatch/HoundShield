import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthTabs } from "../AuthTabs";

describe("AuthTabs", () => {
  it("marks the active tab and links the other to its route", () => {
    render(<AuthTabs active="signin" />);
    const signin = screen.getByText("Sign in");
    const signup = screen.getByText("Sign up");
    // Active = plain highlighted label (aria-current), not a link.
    expect(signin.getAttribute("aria-current")).toBe("page");
    expect(signin.closest("a")).toBeNull();
    // Idle = link to the sibling route.
    expect(signup.closest("a")?.getAttribute("href")).toBe("/signup");
  });

  it("flips which tab is active on the signup surface", () => {
    render(<AuthTabs active="signup" />);
    expect(screen.getByText("Sign up").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Sign in").closest("a")?.getAttribute("href")).toBe("/login");
  });

  it("preserves a same-origin redirect target across the toggle", () => {
    render(<AuthTabs active="signin" redirect="/console?welcome=true" />);
    const href = screen.getByText("Sign up").closest("a")?.getAttribute("href");
    expect(href).toBe(`/signup?redirect=${encodeURIComponent("/console?welcome=true")}`);
  });

  it("keeps the toggle links clean when there is no redirect", () => {
    render(<AuthTabs active="signup" />);
    expect(screen.getByText("Sign in").closest("a")?.getAttribute("href")).toBe("/login");
  });
});
