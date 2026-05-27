import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Logo } from "../Logo";

describe("Logo", () => {
  it("renders without crashing", () => {
    const { container } = render(<Logo />);
    expect(container.firstChild).toBeTruthy();
  });

  it("matches snapshot (card variant)", () => {
    const { container } = render(<Logo />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders bare image when card=false", () => {
    const { container } = render(<Logo card={false} />);
    expect((container.firstChild as HTMLElement).tagName).toBe("IMG");
  });

  it("applies custom className", () => {
    const { container } = render(<Logo className="custom-class" />);
    expect((container.firstChild as HTMLElement).className).toContain("custom-class");
  });
});
