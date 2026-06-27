import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Logo } from "../Logo";

describe("Logo", () => {
  it("renders without crashing", () => {
    const { container } = render(<Logo />);
    expect(container.firstChild).toBeTruthy();
  });

  it("matches snapshot", () => {
    const { container } = render(<Logo />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies custom className", () => {
    const { container } = render(<Logo className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  // Tone is deterministic per surface, NEVER inferred from the ambient `.dark`
  // theme. `dark:invert` keyed off the OS theme via the `.dark` class, so a
  // dark-OS visitor on a light marketing page got a white mark on white
  // (invisible). These guard against that regression returning.
  it("default tone is the native dark mark — no ambient dark:invert", () => {
    const { container } = render(<Logo />);
    const img = container.firstChild as HTMLElement;
    expect(img.className).toContain("logo-img");
    expect(img.className).not.toContain("dark:invert");
    expect(img.className).not.toContain("logo-on-dark");
  });

  it('variant="dark" paints the mark white for dark surfaces', () => {
    const { container } = render(<Logo variant="dark" />);
    const img = container.firstChild as HTMLElement;
    expect(img.className).toContain("logo-on-dark");
    expect(img.className).not.toContain("dark:invert");
  });

  it("carries the shared motion class so the global idle/hover rule applies", () => {
    const { container } = render(<Logo />);
    const img = container.firstChild as HTMLElement;
    // `.logo-img` is the hook the global hs-logo-idle animation + hover pose bind to.
    expect(img.className).toMatch(/\blogo-img\b/);
  });
});
