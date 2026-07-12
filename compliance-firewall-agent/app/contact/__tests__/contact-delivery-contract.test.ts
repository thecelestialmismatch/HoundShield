/**
 * Contract: the /contact page must deliver leads for real and must not make the
 * banned FedRAMP claim. Both regressed silently once (a setTimeout fake-success
 * form, and "hosted on FedRAMP-authorized cloud services") — encode them as guards.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "app/contact/page.tsx"), "utf8");

describe("/contact delivery contract", () => {
  it("posts the form to the real /api/contact endpoint", () => {
    expect(src).toContain('fetch("/api/contact"');
  });

  it("does not fake success with a bare setTimeout", () => {
    // The old bug: setTimeout(() => setSubmitted(true)) with no network call.
    expect(src).not.toMatch(/setTimeout\([^)]*setSubmitted/);
  });

  it("only marks submitted on a real ok response", () => {
    expect(src).toMatch(/res\.ok[\s\S]*setSubmitted\(true\)/);
  });

  it("never claims the hosted plane is FedRAMP-authorized", () => {
    expect(src).not.toMatch(/hosted on FedRAMP-authorized/i);
  });
});
