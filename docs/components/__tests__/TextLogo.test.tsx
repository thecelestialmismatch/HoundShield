import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TextLogo } from "../TextLogo";

describe("TextLogo", () => {
  it("renders 'Hound' text", () => {
    render(<TextLogo />);
    expect(screen.getByText(/Hound/i)).toBeTruthy();
  });

  it("renders 'Shield' text", () => {
    render(<TextLogo />);
    expect(screen.getByText(/Shield/i)).toBeTruthy();
  });

  it("applies dark variant correctly", () => {
    const { container } = render(<TextLogo variant="dark" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies light variant correctly", () => {
    const { container } = render(<TextLogo variant="light" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
