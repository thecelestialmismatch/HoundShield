import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => null,
}));

vi.mock("@/components/dashboard/SPRSGauge", () => ({
  default: ({ score }: { score: number }) => (
    <div data-testid="sprs-gauge" data-score={score}>
      {score}
    </div>
  ),
}));

const mockGetAssessmentResponses = vi.fn(() => []);

vi.mock("@/lib/shieldready/storage", () => ({
  getAssessmentResponses: () => mockGetAssessmentResponses(),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import SPRSDashboardWidget from "../SPRSDashboardWidget";
import type { AssessmentResponse } from "@/lib/shieldready/types";

function makeResponse(controlId: string, status: AssessmentResponse["status"]): AssessmentResponse {
  return { controlId, status, notes: "", evidenceUploaded: false, answeredAt: "2024-01-01T00:00:00Z" };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SPRSDashboardWidget — compact variant", () => {
  beforeEach(() => {
    mockGetAssessmentResponses.mockReturnValue([]);
  });

  it("renders without crashing", () => {
    const { container } = render(<SPRSDashboardWidget variant="compact" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('shows "SPRS Score" title', () => {
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByText("SPRS Score")).toBeInTheDocument();
  });

  it("renders the SPRSGauge", () => {
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByTestId("sprs-gauge")).toBeInTheDocument();
  });

  it("shows DoD threshold label", () => {
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByText(/DoD Threshold/i)).toBeInTheDocument();
  });

  it("shows HoundShield Impact callout", () => {
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByText(/HoundShield Impact/i)).toBeInTheDocument();
  });

  it("shows the +18 pts claim in the impact callout", () => {
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByText(/\+18 pts/i)).toBeInTheDocument();
  });

  it("shows all three HoundShield control IDs", () => {
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByText(/AC\.L2-3\.1\.3/)).toBeInTheDocument();
    expect(screen.getByText(/AU\.L2-3\.3\.1/)).toBeInTheDocument();
    expect(screen.getByText(/SI\.L2-3\.14\.1/)).toBeInTheDocument();
  });

  it("links to /command-center/shield", () => {
    render(<SPRSDashboardWidget variant="compact" />);
    const link = screen.getByRole("link", { name: /View Full Assessment/i });
    expect(link).toHaveAttribute("href", "/command-center/shield");
  });

  it('shows "Met ✓" when score is at or above DoD threshold', () => {
    // Mock many MET responses to push score above 70
    const responses = Array.from({ length: 110 }, (_, i) =>
      makeResponse(`ctrl-${i}`, "MET"),
    );
    mockGetAssessmentResponses.mockReturnValue(responses);
    render(<SPRSDashboardWidget variant="compact" />);
    expect(screen.getByText(/Met ✓/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <SPRSDashboardWidget variant="compact" className="my-custom-class" />,
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("defaults to compact when no variant prop given", () => {
    render(<SPRSDashboardWidget />);
    expect(screen.getByText("SPRS Score")).toBeInTheDocument();
  });
});

describe("SPRSDashboardWidget — full variant", () => {
  beforeEach(() => {
    mockGetAssessmentResponses.mockReturnValue([]);
  });

  it("renders null when no assessment responses exist", () => {
    const { container } = render(<SPRSDashboardWidget variant="full" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders stats when assessment responses exist", () => {
    mockGetAssessmentResponses.mockReturnValue([
      makeResponse("AC.L2-3.1.1", "MET"),
      makeResponse("AC.L2-3.1.2", "UNMET"),
    ]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByTestId("sprs-gauge")).toBeInTheDocument();
  });

  it("shows Completion stat tile", () => {
    mockGetAssessmentResponses.mockReturnValue([makeResponse("AC.L2-3.1.1", "MET")]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByText(/Completion/i)).toBeInTheDocument();
  });

  it("shows Controls Met stat tile", () => {
    mockGetAssessmentResponses.mockReturnValue([makeResponse("AC.L2-3.1.1", "MET")]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByText(/Controls Met/i)).toBeInTheDocument();
  });

  it("shows Partial stat tile", () => {
    mockGetAssessmentResponses.mockReturnValue([makeResponse("AC.L2-3.1.1", "PARTIAL")]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByText(/Partial/i)).toBeInTheDocument();
  });

  it("shows Gaps stat tile", () => {
    mockGetAssessmentResponses.mockReturnValue([makeResponse("AC.L2-3.1.1", "UNMET")]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByText(/Gaps/i)).toBeInTheDocument();
  });

  it("renders DoD threshold strip when started", () => {
    mockGetAssessmentResponses.mockReturnValue([makeResponse("AC.L2-3.1.1", "MET")]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByText(/DoD SPRS Threshold/i)).toBeInTheDocument();
  });

  it("renders family breakdown chart when started", () => {
    mockGetAssessmentResponses.mockReturnValue([makeResponse("AC.L2-3.1.1", "MET")]);
    render(<SPRSDashboardWidget variant="full" />);
    expect(screen.getByText(/Score by Control Family/i)).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });
});
