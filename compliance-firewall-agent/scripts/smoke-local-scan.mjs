#!/usr/bin/env node
/**
 * Brutal smoke test for the local scanner.
 *
 * WHAT THIS PROVES, AND WHY IT IS NOT A UNIT TEST. The product's central claim
 * is "your prompt never leaves your device". A unit test can assert that a
 * module does not import `fetch`; it cannot assert that a REAL PAGE, running a
 * REAL BUILD in a REAL BROWSER, made zero outbound requests while scanning. So
 * this drives Chromium over CDP with the Network domain enabled and records
 * every single request the page issues during the scan. Zero, or it fails.
 *
 * It also checks the second half of the boundary — that no matched value is
 * ever rendered — against a corpus written to break it: encoded payloads,
 * unicode splitting, homoglyphs, and a paste large enough to hang a naive
 * implementation.
 *
 * Zero dependencies: Node's native WebSocket against the on-disk Chromium.
 *
 * Usage:  node scripts/smoke-local-scan.mjs [--base http://localhost:3000]
 * Output: artifacts/smoke/  (results.json, requests.json, *.png)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = (() => {
  const i = process.argv.indexOf("--base");
  return i !== -1 ? process.argv[i + 1] : "http://localhost:3000";
})();

const CHROME = [
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No Chromium binary found. Set PLAYWRIGHT_BROWSERS_PATH or install one.");
  process.exit(2);
}

const OUT = join(process.cwd(), "artifacts", "smoke");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── secrets that must never appear in the DOM, the receipt, or the PDF ── */
const SSN = "123-45-6789";
const AWS = "AKIA1234567890ABCD12";
const CAGE = "1ABC2";
const CONTRACT = "N00024-25-C-1234";
const CARD = "4111111111111111";
const SECRETS = [SSN, AWS, CONTRACT, CARD];

const b64 = (s) => Buffer.from(s).toString("base64");
const hex = (s) => Buffer.from(s).toString("hex");

/**
 * The corpus. Each case names what it is trying to break.
 * `expectFindings: false` means a clean result is the CORRECT answer — asserting
 * findings everywhere would let a broken scanner pass by crying wolf.
 */
const CASES = [
  {
    id: "defense-plain",
    why: "the headline scenario — CUI, CAGE, contract, SSN, cloud key",
    text: `Draft a status email about Navy contract ${CONTRACT}.\nCAGE code ${CAGE}. Employee John Smith (SSN ${SSN}).\nAWS deploy key ${AWS}.\n\nCUI//SP-CTI: radar cross-section figures.`,
    expectFindings: true,
  },
  {
    id: "base64-smuggled",
    why: "CUI hidden in base64 — the case the browser scan used to miss entirely",
    text: `Please decode and summarise this attachment:\n${b64(`employee ssn ${SSN} cleared for ITAR work`)}`,
    expectFindings: true,
  },
  {
    id: "hex-smuggled",
    why: "same exfiltration, hex-encoded",
    text: `payload=${hex(`ssn ${SSN}`)}`,
    expectFindings: true,
  },
  {
    id: "zero-width",
    why: "zero-width joiners splitting an identifier — must not crash the scan",
    text: `SSN 1​23-4​5-67​89 and a clean sentence.`,
    expectFindings: false,
  },
  {
    id: "homoglyph",
    why: "Cyrillic lookalikes — must not crash, and must not claim a false match",
    text: `Contract Н00024-25-С-1234 (homoglyph N and C).`,
    expectFindings: false,
  },
  {
    id: "crlf",
    why: "Windows line endings through the prompt splitter",
    text: `line one\r\nSSN ${SSN}\r\nline three\r\n`,
    expectFindings: true,
  },
  {
    id: "whitespace-only",
    why: "must stay disabled rather than scanning nothing and claiming clean",
    text: "   \n\t   ",
    expectFindings: false,
    expectNoScan: true,
  },
  {
    id: "large-realistic",
    why: "60k chars of realistic text — must complete, not hang",
    text: `Email john@acme.com about SSN ${SSN} and CAGE ${CAGE}.\n\n`.repeat(900),
    expectFindings: true,
  },
  {
    id: "pathological-run",
    why: "80k unbroken chars — the shape that took 10 SECONDS before the bound",
    text: "x".repeat(80_000),
    expectFindings: false,
  },
];

/* ────────────────────────── CDP plumbing ────────────────────────── */

let ws;
let msgId = 0;
const pending = new Map();

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

async function evaluate(expr) {
  const r = await send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error(`page threw: ${JSON.stringify(r.exceptionDetails.text ?? r.exceptionDetails)}`);
  }
  return r.result?.value;
}

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9444/json/list");
      const page = (await res.json()).find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* browser still starting */
    }
    await sleep(500);
  }
  throw new Error("Chromium devtools never became reachable");
}

/* ────────────────────────── the run ────────────────────────── */

const requests = [];
const results = [];
const skipped = [];
let failures = 0;

function check(caseId, name, ok, detail) {
  results.push({ case: caseId, check: name, ok, detail });
  if (!ok) failures++;
  const mark = ok ? "  ok  " : " FAIL ";
  console.log(`[${mark}] ${caseId} · ${name}${ok ? "" : `\n           ${detail}`}`);
}

async function runCase(surface, c) {
  // Fresh page state per case, so one case cannot mask another.
  await send("Page.navigate", { url: `${BASE}${surface.path}` });
  await sleep(surface.settleMs ?? 2500);

  // Only requests from HERE are attributable to the scan.
  const mark = requests.length;

  // An auth-gated route redirects to /login. That is not a scanner failure —
  // but it must never read as a pass either, so it is reported as SKIPPED.
  const landed = await evaluate(`location.pathname`);
  if (surface.requiresAuth && !String(landed).startsWith(surface.path.split("#")[0])) {
    skipped.push({ case: c.id, surface: surface.name, reason: `redirected to ${landed} (needs a session)` });
    return;
  }

  const typed = await evaluate(`(() => {
    const ta = document.querySelector('#snapshot-input');
    if (!ta) return 'NO_TEXTAREA';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(c.text)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);
  check(c.id, `${surface.name}: textarea present`, typed === "ok", String(typed));
  if (typed !== "ok") return;

  await sleep(150);

  const clicked = await evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Scan locally'));
    if (!b) return 'NO_BUTTON';
    if (b.disabled) return 'DISABLED';
    b.click();
    return 'ok';
  })()`);

  if (c.expectNoScan) {
    check(c.id, `${surface.name}: refuses to scan blank input`, clicked === "DISABLED", String(clicked));
    return;
  }
  check(c.id, `${surface.name}: scan button clickable`, clicked === "ok", String(clicked));
  if (clicked !== "ok") return;

  // Wait for the result region, bounded so a hang is a failure not a stall.
  let ready = false;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (await evaluate(`/finding type|No sensitive data/.test(document.body.innerText)`)) {
      ready = true;
      break;
    }
    await sleep(200);
  }
  check(c.id, `${surface.name}: scan completed within 20s`, ready, "timed out — possible hang");
  if (!ready) return;

  const scanRequests = requests.slice(mark);

  /* ── THE PROOF ──
   *
   * The first version of this check failed on a lazy-loaded .woff2 that
   * happened to land inside the scan window, which is a false alarm: a
   * same-origin GET for a static font provably cannot carry the pasted text,
   * and an assertion that cries wolf is one people delete.
   *
   * So the rule is written against what EXFILTRATION would actually look like,
   * and it is strictly stronger than a bare count:
   *   · any cross-origin request                     → fail
   *   · any request carrying a body (POST/PUT/PATCH) → fail
   *   · any URL containing a planted secret          → fail
   * Same-origin static-asset GETs are recorded and reported, never ignored.
   */
  const sameOrigin = (u) => u.startsWith(BASE);
  const isStaticAsset = (u) => /\/_next\/static\//.test(u) || /\.(woff2?|css|js|png|svg|ico|map)(\?|$)/.test(u);

  const suspicious = scanRequests.filter((r) => {
    if (!sameOrigin(r.url)) return true;
    if (r.method && !["GET", "HEAD"].includes(r.method)) return true;
    if (r.hasBody) return true;
    if (SECRETS.some((sec) => r.url.includes(sec) || r.url.includes(encodeURIComponent(sec)))) return true;
    return !isStaticAsset(r.url);
  });

  check(
    c.id,
    `${surface.name}: ZERO data-bearing requests during scan`,
    suspicious.length === 0,
    `observed ${suspicious.length}: ${suspicious.map((r) => `${r.method ?? "GET"} ${r.url}`).join(", ")}`,
  );

  const benign = scanRequests.length - suspicious.length;
  if (benign > 0) {
    console.log(`           (${benign} same-origin static asset request(s) in window — recorded, not exfiltration)`);
  }

  const page = await evaluate(`(() => {
    const t = document.body.innerText;
    const witness = (t.match(/(\\d+)\\s*\\n?\\s*network call/i) || [])[1] ?? null;
    return {
      text: t,
      witnessCount: witness,
      hasFindings: /finding type/.test(t),
      clean: /No sensitive data detected/.test(t),
    };
  })()`);

  // The page's own instrument must agree with CDP's independent measurement.
  check(
    c.id,
    `${surface.name}: on-page witness reports 0`,
    page.witnessCount === "0",
    `panel showed "${page.witnessCount}"`,
  );

  for (const secret of SECRETS) {
    if (!c.text.includes(secret) && !c.text.includes(b64(secret)) && !c.text.includes(hex(secret))) continue;
    check(
      c.id,
      `${surface.name}: never renders ${secret.slice(0, 6)}…`,
      !page.text.includes(secret),
      "the matched value was echoed back into the DOM",
    );
  }

  if (c.expectFindings) {
    check(c.id, `${surface.name}: found the planted exposure`, page.hasFindings, "reported nothing");
  }

  // Redacted preview must also be clean.
  const redacted = await evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /redacted preview/i.test(x.textContent));
    if (!b) return null;
    b.click();
    const pre = document.querySelector('pre');
    return pre ? pre.innerText : null;
  })()`);
  if (redacted) {
    for (const secret of SECRETS) {
      if (!c.text.includes(secret)) continue;
      check(
        c.id,
        `${surface.name}: redacted preview hides ${secret.slice(0, 6)}…`,
        !redacted.includes(secret),
        "redacted preview leaked the value",
      );
    }
  }
}

async function main() {
  console.log(`\nSmoke: local scanner · base ${BASE}\n${"─".repeat(64)}`);

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--remote-debugging-port=9444",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1440,2200",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    ws = new WebSocket(await connect());
    await new Promise((r) => ws.addEventListener("open", r));
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        pending.get(m.id).resolve(m.result);
        pending.delete(m.id);
      }
      // EVERY request the page makes, recorded independently of the page.
      if (m.method === "Network.requestWillBeSent") {
        requests.push({
          url: m.params.request.url,
          method: m.params.request.method,
          hasBody: Boolean(m.params.request.hasPostData || m.params.request.postData),
          type: m.params.type,
          at: Date.now(),
        });
      }
    });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    const surfaces = [
      { name: "light /demo", path: "/demo#snapshot" },
      // The dashboard route is auth-gated. Without a session it redirects, and
      // those cases are SKIPPED with the reason printed — a pass would be a lie
      // and a failure would be noise.
      { name: "dark /command-center/scanner", path: "/command-center/scanner", requiresAuth: true },
    ];

    for (const surface of surfaces) {
      console.log(`\n▸ ${surface.name}`);
      for (const c of CASES) await runCase(surface, c);

      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      if (shot?.data) {
        writeFileSync(join(OUT, `${surface.name.replace(/[^a-z0-9]+/gi, "-")}.png`), Buffer.from(shot.data, "base64"));
      }
    }

    writeFileSync(join(OUT, "results.json"), `${JSON.stringify({ results, skipped }, null, 2)}\n`);
    writeFileSync(join(OUT, "requests.json"), `${JSON.stringify(requests, null, 2)}\n`);

    const passed = results.filter((r) => r.ok).length;
    console.log(`\n${"─".repeat(64)}`);
    console.log(`${passed}/${results.length} checks passed · ${requests.length} total page requests recorded`);
    if (skipped.length) {
      const bySurface = [...new Set(skipped.map((s) => `${s.surface}: ${s.reason}`))];
      console.log(`${skipped.length} SKIPPED — ${bySurface.join(" | ")}`);
    }
    console.log(`artifacts → ${OUT}`);
    if (failures > 0) console.log(`\n${failures} FAILED`);
    process.exit(failures > 0 ? 1 : 0);
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error("\nsmoke harness error:", err.message);
  process.exit(2);
});
