#!/usr/bin/env node
// hound-web — browser primitives for the houndshield skill, with no dependencies.
//
// Exists so Tier 3 of the skill's web contract is real: if the TinyFish MCP is
// uninstalled and the host has no WebFetch, HoundShield can still render a
// JavaScript-heavy page, click through it, and read the result.
//
// Zero npm installs. Drives Chromium straight over the DevTools Protocol using
// Node 22's native WebSocket. Chromium is already on disk in this environment.
//
//   node hound-web.mjs fetch      <url> [--json] [--links] [--selector SEL] [--timeout MS]
//   node hound-web.mjs screenshot <url> <out.png> [--full]
//   node hound-web.mjs eval       <url> '<js expression>'
//   node hound-web.mjs act        <url> '<json actions>'   see ACTIONS below
//   node hound-web.mjs session    [url]                    prints a CDP ws:// url, stays open
//
// ACTIONS is a JSON array executed in order against one live page:
//   [{"click":"Sign in"},{"type":{"selector":"#email","text":"a@b.com"}},
//    {"waitFor":"#dashboard"},{"wait":1500},{"eval":"document.title"},
//    {"press":"Enter"},{"scroll":"bottom"},{"extract":true}]

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { X509Certificate, createHash } from "node:crypto";

const CHROME =
  process.env.HOUND_CHROME ||
  ["/opt/pw-browsers/chromium", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].find(
    (p) => existsSync(p),
  );

const DEFAULT_TIMEOUT = 45_000;

function die(msg, code = 1) {
  console.error(`hound-web: ${msg}`);
  process.exit(code);
}

// Corporate/sandbox egress proxies terminate TLS with their own CA. Node, curl and
// pip are pointed at that CA via the environment, but Chrome reads NSS and will not
// see it. Rather than turning verification off, derive the SPKI pins of the CAs the
// environment already trusts and tell Chrome to accept exactly those. Every other
// certificate is still fully verified.
function trustedSpkiPins() {
  const bundle = [
    process.env.HOUND_CA_BUNDLE,
    process.env.NODE_EXTRA_CA_CERTS,
    process.env.SSL_CERT_FILE,
    process.env.CURL_CA_BUNDLE,
    process.env.REQUESTS_CA_BUNDLE,
  ].find((p) => p && existsSync(p));
  if (!bundle) return [];

  try {
    const pems = readFileSync(bundle, "utf8").match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
    const pins = new Set();
    for (const pem of pems) {
      try {
        const cert = new X509Certificate(pem);
        // Only pin the private/interception CAs this environment injects; public
        // roots are already in Chrome's own store and need no help.
        if (!/Anthropic|Egress|Inspection|Proxy|Corporate|Zscaler|Netskope/i.test(cert.subject)) continue;
        const der = cert.publicKey.export({ type: "spki", format: "der" });
        pins.add(createHash("sha256").update(der).digest("base64"));
      } catch {
        /* skip unparseable entries */
      }
    }
    return [...pins];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------- CDP plumbing

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${msg.error.message} (${msg.method ?? ""})`)) : resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, DEFAULT_TIMEOUT);
    });
  }

  once(method, timeout = DEFAULT_TIMEOUT) {
    return new Promise((resolve) => {
      const t = setTimeout(() => finish(null), timeout);
      const fn = (msg) => {
        if (msg.method === method) finish(msg.params);
      };
      const finish = (v) => {
        clearTimeout(t);
        this.listeners = this.listeners.filter((f) => f !== fn);
        resolve(v);
      };
      this.listeners.push(fn);
    });
  }
}

async function launch() {
  if (!CHROME) die("no Chromium found. Set HOUND_CHROME=/path/to/chrome");

  // Honour an outbound HTTP(S) proxy when the environment mandates one. Chrome
  // does not read the *_PROXY variables itself, so pass them as flags. The CA is
  // expected to be trusted at the OS/NSS level — never disable TLS verification.
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  const bypass = (process.env.NO_PROXY || process.env.no_proxy || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(";");
  const pins = trustedSpkiPins();

  const proc = spawn(
    CHROME,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--hide-scrollbars",
      "--mute-audio",
      "--window-size=1440,900",
      ...(proxy ? [`--proxy-server=${proxy}`] : []),
      ...(proxy && bypass ? [`--proxy-bypass-list=${bypass}`] : []),
      ...(pins.length ? [`--ignore-certificate-errors-spki-list=${pins.join(",")}`] : []),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = "";
    const t = setTimeout(() => reject(new Error("Chromium did not report a DevTools endpoint in 30s")), 30_000);
    proc.stderr.on("data", (d) => {
      buf += d.toString();
      const m = buf.match(/ws:\/\/[^\s]+/);
      if (m) {
        clearTimeout(t);
        resolve(m[0]);
      }
    });
    proc.on("exit", (c) => {
      clearTimeout(t);
      reject(new Error(`Chromium exited early (code ${c})\n${buf.slice(0, 800)}`));
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", () => rej(new Error("could not open CDP socket")), { once: true });
  });

  return { proc, ws, wsUrl, cdp: new Cdp(ws) };
}

async function newPage(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("DOM.enable", {}, sessionId);
  return sessionId;
}

async function goto(cdp, sessionId, url, timeout) {
  const loaded = cdp.once("Page.loadEventFired", timeout);
  await cdp.send("Page.navigate", { url }, sessionId);
  await loaded;
  await sleep(600); // let client-side rendering settle
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(cdp, sessionId, expression) {
  const { result, exceptionDetails } = await cdp.send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  );
  if (exceptionDetails) throw new Error(exceptionDetails.text || "page evaluation threw");
  return result.value;
}

// ---------------------------------------------------------------- extraction

const EXTRACT = (selector) => `(() => {
  const strip = ['script','style','noscript','svg','iframe','template'];
  const root = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : "null"}
    || document.querySelector('main')
    || document.querySelector('article')
    || document.body;
  if (!root) return { title: document.title, text: '', links: [] };
  const clone = root.cloneNode(true);
  clone.querySelectorAll(strip.join(',')).forEach(n => n.remove());
  const text = (clone.innerText || '').replace(/\\n{3,}/g, '\\n\\n').trim();
  const links = [...root.querySelectorAll('a[href]')]
    .map(a => ({ text: (a.innerText || '').trim().slice(0, 120), href: a.href }))
    .filter(l => l.href.startsWith('http'));
  const meta = n => (document.querySelector(\`meta[name="\${n}"],meta[property="og:\${n}"]\`) || {}).content || null;
  return { title: document.title, description: meta('description'), url: location.href, text, links };
})()`;

// ---------------------------------------------------------------- actions

async function runAction(cdp, sessionId, action) {
  const [kind] = Object.keys(action);
  const arg = action[kind];

  switch (kind) {
    case "wait":
      await sleep(Number(arg));
      return { wait: arg };

    case "waitFor": {
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        const found = await evaluate(cdp, sessionId, `!!document.querySelector(${JSON.stringify(arg)})`);
        if (found) return { waitFor: arg, found: true };
        await sleep(300);
      }
      return { waitFor: arg, found: false };
    }

    case "click": {
      // Accepts a CSS selector or visible link/button text.
      const ok = await evaluate(
        cdp,
        sessionId,
        `(() => {
          const q = ${JSON.stringify(arg)};
          let el = null;
          try { el = document.querySelector(q); } catch {}
          if (!el) {
            const cands = [...document.querySelectorAll('a,button,[role=button],input[type=submit]')];
            el = cands.find(e => (e.innerText || e.value || '').trim().toLowerCase() === q.toLowerCase())
              || cands.find(e => (e.innerText || e.value || '').toLowerCase().includes(q.toLowerCase()));
          }
          if (!el) return false;
          el.scrollIntoView({ block: 'center' });
          el.click();
          return true;
        })()`,
      );
      await sleep(900);
      return { click: arg, ok };
    }

    case "type": {
      const ok = await evaluate(
        cdp,
        sessionId,
        `(() => {
          const el = document.querySelector(${JSON.stringify(arg.selector)});
          if (!el) return false;
          el.focus();
          const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
          setter ? setter.call(el, ${JSON.stringify(arg.text)}) : (el.value = ${JSON.stringify(arg.text)});
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()`,
      );
      return { type: arg.selector, ok };
    }

    case "press":
      for (const type of ["keyDown", "keyUp"]) {
        await cdp.send("Input.dispatchKeyEvent", { type, key: arg, code: arg, windowsVirtualKeyCode: arg === "Enter" ? 13 : 0 }, sessionId);
      }
      await sleep(900);
      return { press: arg };

    case "scroll":
      await evaluate(
        cdp,
        sessionId,
        arg === "bottom" ? "window.scrollTo(0, document.body.scrollHeight)" : `window.scrollBy(0, ${Number(arg) || 800})`,
      );
      await sleep(500);
      return { scroll: arg };

    case "eval":
      return { eval: arg, value: await evaluate(cdp, sessionId, String(arg)) };

    case "extract":
      return { extract: await evaluate(cdp, sessionId, EXTRACT(typeof arg === "string" ? arg : null)) };

    case "goto":
      await goto(cdp, sessionId, arg, DEFAULT_TIMEOUT);
      return { goto: arg };

    default:
      return { error: `unknown action: ${kind}` };
  }
}

// ---------------------------------------------------------------- commands

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(
      [
        "hound-web — zero-dependency browser primitives for the houndshield skill",
        "",
        "  fetch      <url> [--json] [--links] [--selector SEL] [--timeout MS]",
        "  screenshot <url> <out.png> [--full]",
        "  eval       <url> '<js>'",
        "  act        <url> '<json actions>'",
        "  session    [url]",
      ].join("\n"),
    );
    return;
  }

  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const valueOf = (name, fallback) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 && rest[i + 1] ? rest[i + 1] : fallback;
  };
  const positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
  const timeout = Number(valueOf("timeout", DEFAULT_TIMEOUT));

  const { proc, ws, wsUrl, cdp } = await launch();
  const shutdown = () => {
    try { ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
  };

  try {
    if (cmd === "session") {
      const sessionId = await newPage(cdp);
      if (positional[0]) await goto(cdp, sessionId, positional[0], timeout);
      console.log(JSON.stringify({ cdp_url: wsUrl, note: "Connect Playwright/Puppeteer via CDP. Ctrl-C to release." }, null, 2));
      await new Promise(() => {}); // hold the browser open
    }

    const url = positional[0];
    if (!url) die(`${cmd} needs a url`);
    const sessionId = await newPage(cdp);
    await goto(cdp, sessionId, url, timeout);

    if (cmd === "fetch") {
      const data = await evaluate(cdp, sessionId, EXTRACT(valueOf("selector", null)));
      if (!flags.has("--links")) delete data.links;
      if (flags.has("--json")) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`# ${data.title}\n<${data.url}>\n`);
        if (data.description) console.log(`> ${data.description}\n`);
        console.log(data.text);
        if (data.links) console.log(`\n## Links\n${data.links.map((l) => `- [${l.text}](${l.href})`).join("\n")}`);
      }
    } else if (cmd === "screenshot") {
      const out = positional[1] || "screenshot.png";
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: flags.has("--full") }, sessionId);
      await writeFile(out, Buffer.from(data, "base64"));
      console.log(`wrote ${out}`);
    } else if (cmd === "eval") {
      console.log(JSON.stringify(await evaluate(cdp, sessionId, positional[1] || "document.title"), null, 2));
    } else if (cmd === "act") {
      const actions = JSON.parse(positional[1] || "[]");
      const results = [];
      for (const a of actions) results.push(await runAction(cdp, sessionId, a));
      console.log(JSON.stringify(results, null, 2));
    } else {
      die(`unknown command: ${cmd}`);
    }
  } finally {
    shutdown();
  }
}

main().catch((e) => die(e.message));
