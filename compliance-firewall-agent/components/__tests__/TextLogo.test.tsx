import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TextLogo } from "../TextLogo";

describe("TextLogo", () => {
  it("renders 'HoundShield' wordmark", () => {
    render(<TextLogo />);
    expect(screen.getByText("HoundShield")).toBeTruthy();
  });

  it("applies dark variant (white text on dark surfaces)", () => {
    const { container } = render(<TextLogo variant="dark" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies light variant (ink text on light surfaces)", () => {
    const { container } = render(<TextLogo variant="light" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("merges custom className", () => {
    const { container } = render(<TextLogo className="text-3xl" />);
    expect((container.firstChild as HTMLElement).className).toContain("text-3xl");
  });
});
