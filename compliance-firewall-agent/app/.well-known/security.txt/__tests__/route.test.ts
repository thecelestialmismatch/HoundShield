import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("/.well-known/security.txt", () => {
  it("serves an RFC 9116 policy as plain text", async () => {
    const res = GET();
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain("Contact: mailto:security@houndshield.com");
    expect(body).toContain("Policy: https://houndshield.com/security");
    expect(body).toContain("Canonical: https://houndshield.com/.well-known/security.txt");
  });

  it("sets an Expires date in the future", async () => {
    const res = GET();
    const body = await res.text();
    const match = body.match(/Expires: (.+)/);
    expect(match).toBeTruthy();
    const expires = new Date(match![1]);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });
});
