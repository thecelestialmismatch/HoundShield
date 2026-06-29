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
});
