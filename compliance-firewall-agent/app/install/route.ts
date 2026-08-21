import { NextResponse } from "next/server";

/**
 * GET /install
 *
 * The docs quickstart tells operators to run
 *   curl -sSL https://houndshield.com/install | bash
 * so this pretty URL has to resolve to the real installer. Rather than keep a
 * second copy of the script in this package (which would drift from the source
 * of truth), we 302 to the canonical `proxy/install.sh` in the public repo.
 * `curl -sSL` includes `-L`, so it follows the redirect and pipes the real
 * script to bash.
 *
 * The installer pulls `ghcr.io/thecelestialmismatch/houndshield-proxy:latest`.
 * Publishing that image to GHCR is an ops step outside this repo; until it is
 * pushed, `docker pull` fails with a clear error — still far better than piping
 * a 404 HTML page into a shell, which is what this route replaced.
 */
const INSTALLER_RAW_URL =
  "https://raw.githubusercontent.com/thecelestialmismatch/HoundShield/main/proxy/install.sh";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.redirect(INSTALLER_RAW_URL, 302);
}
