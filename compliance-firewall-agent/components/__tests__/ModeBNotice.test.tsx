import { render, screen } from "@testing-library/react";
import { ModeBNotice } from "@/components/ModeBNotice";

describe("ModeBNotice", () => {
  it("full variant states CUI-safe = Mode B and Vercel is not FedRAMP-authorized", () => {
    render(<ModeBNotice variant="full" />);
    expect(screen.getByText(/Handling CUI\? Run Mode B\./i)).toBeInTheDocument();
    expect(screen.getByText(/not FedRAMP-authorized/i)).toBeInTheDocument();
    // All three deployment modes are present.
    expect(screen.getByText(/Hosted trial/i)).toBeInTheDocument();
    expect(screen.getByText(/Self-hosted Docker/i)).toBeInTheDocument();
    expect(screen.getByText(/Air-gapped/i)).toBeInTheDocument();
  });

  it("inline variant carries the same boundary claim compactly", () => {
    render(<ModeBNotice variant="inline" />);
    expect(screen.getByText(/CUI-safe = Mode B/i)).toBeInTheDocument();
    expect(screen.getByText(/not FedRAMP-authorized/i)).toBeInTheDocument();
  });

  it("defaults to the full variant", () => {
    render(<ModeBNotice />);
    expect(screen.getByText(/Handling CUI\? Run Mode B\./i)).toBeInTheDocument();
  });

  it("applies a passed className", () => {
    const { container } = render(<ModeBNotice variant="inline" className="test-marker" />);
    expect(container.querySelector(".test-marker")).not.toBeNull();
  });
});
