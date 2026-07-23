import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Source contract for the auth-page reference redesign (2026-07-23): /login and
 * /signup wear the clean, centered card with the Sign in / Sign up segmented
 * toggle from the founder's reference — WITHOUT dropping any working sign-in
 * method. Locks the toggle in place and guards the auth handlers from a future
 * "cosmetic" edit that silently removes password / OAuth / forgot-password.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("auth pages — reference redesign + working auth preserved", () => {
  const login = read("app/login/page.tsx");
  const signup = read("app/signup/page.tsx");

  it("both pages render the shared AuthTabs segmented toggle", () => {
    expect(login).toMatch(/<AuthTabs active="signin"/);
    expect(signup).toMatch(/<AuthTabs active="signup"/);
    for (const src of [login, signup]) {
      expect(src).toMatch(/from ['"]@\/components\/auth\/AuthTabs['"]/);
    }
  });

  it("login keeps password sign-in, forgot-password, and GitHub OAuth", () => {
    expect(login).toMatch(/signInWithPassword/);
    expect(login).toMatch(/href="\/forgot-password"/);
    expect(login).toMatch(/handleOAuthLogin\('github'\)/);
  });

  it("signup keeps account creation and GitHub OAuth", () => {
    expect(signup).toMatch(/auth\.signUp|signUp\.email/);
    expect(signup).toMatch(/handleOAuthSignup\('github'\)/);
  });

  it("both carry the Terms of Service + Privacy Policy line", () => {
    for (const src of [login, signup]) {
      expect(src).toMatch(/Terms of Service/);
      expect(src).toMatch(/Privacy Policy/);
    }
  });

  it("both use the real doberman brand mark (Logo), not a placeholder", () => {
    for (const src of [login, signup]) {
      expect(src).toMatch(/<Logo /);
    }
  });
});
