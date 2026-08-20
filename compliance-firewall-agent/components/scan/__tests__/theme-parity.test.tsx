import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/ReportCheckoutButton", () => ({
  ReportCheckoutButton: ({ label }: { label?: string }) => <button type="button">{label}</button>,
}));

import { LocalScanPanel } from "../LocalScanPanel";
import { SCAN_TOKENS } from "../theme";

/* ──────────────────────────────────────────────────────────────────
 * Both surfaces, one component.
 *
 * The browser smoke harness can only reach the PUBLIC surface — the dashboard
 * route is auth-gated and redirects without a session, so it reports those
 * cases as SKIPPED rather than passing them. This file covers the half the
 * harness cannot: that the dark mount renders, and that each theme uses ITS
 * OWN tokens and not the other's.
 *
 * That matters because the failure mode is not a crash. A theme regression
 * ships light-mode slate text onto the near-black dashboard and is invisible to
 * every test that only asserts behaviour.
 * ────────────────────────────────────────────────────────────────── */

const DEFENSE = `Navy contract N00024-25-C-1234, CAGE 1ABC2, SSN 123-45-6789.`;

async function scan(container: HTMLElement) {
  const ta = container.querySelector("#snapshot-input") as HTMLTextAreaElement;
  fireEvent.change(ta, { target: { value: DEFENSE } });
  fireEvent.click(screen.getByRole("button", { name: /scan locally/i }));
  await screen.findByText(/finding type/i);
}

describe("the scanner renders on both surfaces", () => {
  it("mounts in the dashboard (dark) and scans", async () => {
    const { container } = render(
      <LocalScanPanel theme="dark" surface="/command-center/scanner" heading="Local prompt scanner" />,
    );
    expect(screen.getByText("Local prompt scanner")).toBeTruthy();
    await scan(container);
    expect(screen.getByText(/network call/i)).toBeTruthy();
  });

  it("mounts on the public demo (light) and scans", async () => {
    const { container } = render(<LocalScanPanel theme="light" commerce surface="/demo#snapshot" />);
    await scan(container);
    expect(screen.getByText(/network call/i)).toBeTruthy();
  });

  it("shows commerce ONLY on the public surface", async () => {
    const dash = render(<LocalScanPanel theme="dark" surface="/command-center/scanner" />);
    await scan(dash.container);
    expect(
      screen.queryByText(/\$499 CMMC AI Risk Assessment Report/i),
      "a paying customer must not be re-sold the product inside their own dashboard",
    ).toBeNull();
    dash.unmount();

    const demo = render(<LocalScanPanel theme="light" commerce surface="/demo#snapshot" />);
    await scan(demo.container);
    expect(screen.getByText(/\$499 CMMC AI Risk Assessment Report/i)).toBeTruthy();
  });
});

describe("each theme uses its own tokens", () => {
  it.each([
    ["dark", "light"],
    ["light", "dark"],
  ] as const)("%s does not leak %s tokens", (mine, theirs) => {
    const { container } = render(
      <LocalScanPanel theme={mine} surface="test" />,
    );

    /*
     * Compare WHOLE class tokens, not substrings.
     *
     * The first draft used `html.includes(cls)` and reported that the dark
     * surface had leaked the light token `bg-white` — because dark's own
     * `bg-white/[0.03]` contains it as a substring. A guard that flags correct
     * code is measuring the wrong thing; the unit here is a class name, so
     * tokenize on whitespace and test membership exactly.
     */
    const rendered = new Set<string>();
    for (const el of container.querySelectorAll<HTMLElement>("[class]")) {
      for (const cls of el.getAttribute("class")!.split(/\s+/)) {
        if (cls) rendered.add(cls);
      }
    }

    const mineOnly = Object.values(SCAN_TOKENS[mine]).filter(
      (v) => !Object.values(SCAN_TOKENS[theirs]).includes(v),
    );
    expect(
      mineOnly.some((cls) => rendered.has(cls)),
      `no ${mine}-only token rendered — the theme may not be applied at all`,
    ).toBe(true);

    /*
     * Contrast colours used ON A FILLED SURFACE are theme-neutral and must be
     * excluded, or this guard flags correct design. `text-white` is the dark
     * theme's `ink` token AND the label colour of the brand-600 scan button,
     * which is white in both themes because it sits on a coloured fill — the
     * light surface rendering it is right, not a leak.
     */
    const THEME_NEUTRAL = new Set(["text-white"]);

    const theirsOnly = Object.values(SCAN_TOKENS[theirs]).filter(
      (v) => !Object.values(SCAN_TOKENS[mine]).includes(v) && !THEME_NEUTRAL.has(v),
    );
    const leaked = theirsOnly.filter((cls) => rendered.has(cls));
    expect(leaked, `${mine} surface rendered ${theirs} token(s): ${leaked.join(", ")}`).toEqual([]);
  });

  it("the TOKEN MAP itself keeps the two palettes apart", () => {
    /*
     * The rendering check above compares the DOM against SCAN_TOKENS — so
     * corrupting SCAN_TOKENS moves the goalposts and the check still passes.
     * Probing it that way is exactly how that was found. This pins the map
     * itself: light must use the --hs-* custom properties, dark must use the
     * dashboard's slate/white-alpha scale, and neither may borrow the other's.
     */
    const light = Object.entries(SCAN_TOKENS.light);
    const dark = Object.entries(SCAN_TOKENS.dark);

    const darkBorrowingLight = dark.filter(([, v]) => v.includes("--hs-ink") || v.includes("--hs-border"));
    expect(
      darkBorrowingLight.map(([k]) => k),
      "the dark palette must not use the light surface's --hs-ink/--hs-border variables",
    ).toEqual([]);

    const lightBorrowingDark = light.filter(([, v]) => /text-slate-|white\/\[/.test(v));
    expect(
      lightBorrowingDark.map(([k]) => k),
      "the light palette must not use the dashboard's slate / white-alpha scale",
    ).toEqual([]);

    // And the two must actually differ, or "two themes" is a fiction.
    const differing = light.filter(([k, v]) => SCAN_TOKENS.dark[k as keyof typeof SCAN_TOKENS.dark] !== v);
    expect(differing.length, "the palettes are identical — there is only one theme").toBeGreaterThan(3);
  });

  it("shares the card idiom rather than forking it", () => {
    // glass-card / btn-* are common to both surfaces already; re-declaring them
    // per theme is how the two skins would drift apart.
    for (const theme of ["light", "dark"] as const) {
      const { container, unmount } = render(<LocalScanPanel theme={theme} surface="test" />);
      expect(container.innerHTML).toContain("glass-card");
      unmount();
    }
  });
});

describe("the local-only promise is stated on both surfaces", () => {
  it.each(["light", "dark"] as const)("%s states it before any scan runs", (theme) => {
    render(<LocalScanPanel theme={theme} surface="test" />);
    expect(screen.getByText(/never sent anywhere/i)).toBeTruthy();
  });
});
