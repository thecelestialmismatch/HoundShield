/**
 * Kaelus AI Firewall — Content Script
 *
 * Intercepts prompts typed into AI chat UIs before they are submitted.
 * Scans locally for high-confidence patterns, optionally calls Kaelus API.
 *
 * Supported sites:
 *   ChatGPT (chat.openai.com, chatgpt.com)
 *   Claude   (claude.ai)
 *   Gemini   (gemini.google.com)
 *   Copilot  (copilot.microsoft.com, github.com/copilot, bing.com/chat)
 *
 * Security: NO innerHTML — all DOM writes use textContent / createElement.
 */

// ---------------------------------------------------------------------------
// Local pattern library (subset — full library lives in the gateway)
// ---------------------------------------------------------------------------

const LOCAL_PATTERNS = [
  // CUI indicators
  { id: "cui_marking",   label: "CUI Marking",         risk: "CRITICAL", re: /\b(CUI|CONTROLLED UNCLASSIFIED|FOUO|FOR OFFICIAL USE ONLY)\b/i },
  { id: "classified",    label: "Classification Mark",  risk: "CRITICAL", re: /\b(TOP SECRET|SECRET|CONFIDENTIAL|TS\/SCI|SCI)\b/i },
  // CMMC / defense
  { id: "cage_code",     label: "CAGE Code",            risk: "HIGH",     re: /\b[A-Z0-9]{5}\b/ },
  { id: "contract_num",  label: "Contract Number",      risk: "HIGH",     re: /\b(FA\d{4}|W\d{5}|N\d{5}|DAAH\d{2})-\d{2}-[A-Z]-\d{4}\b/i },
  { id: "dfars_ref",     label: "DFARS Reference",      risk: "HIGH",     re: /DFARS\s*252\.\d{3}-\d{4}/i },
  // PII
  { id: "ssn",           label: "Social Security #",    risk: "CRITICAL", re: /\b\d{3}-\d{2}-\d{4}\b/ },
  { id: "dob",           label: "Date of Birth",        risk: "HIGH",     re: /\b(DOB|date of birth)\s*[:=]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i },
  // PHI
  { id: "mrn",           label: "Medical Record #",     risk: "HIGH",     re: /\b(MRN|medical record)\s*#?\s*\d{5,10}\b/i },
  { id: "npi",           label: "NPI Number",           risk: "HIGH",     re: /\bNPI\s*#?\s*\d{10}\b/i },
  // Secrets
  { id: "api_key",       label: "API Key",              risk: "CRITICAL", re: /\b(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36})\b/ },
  { id: "private_key",   label: "Private Key",          risk: "CRITICAL", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: "password",      label: "Password in text",     risk: "HIGH",     re: /\b(password|passwd|pwd)\s*[:=]\s*\S{4,}/i },
  // IP
  { id: "source_code",   label: "Source Code Block",    risk: "MEDIUM",   re: /```[\s\S]{200,}```/ },
];

// ---------------------------------------------------------------------------
// Site adapters — selectors for each AI chat UI
// ---------------------------------------------------------------------------

const SITE_ADAPTERS = [
  {
    name: "ChatGPT",
    hostRe: /chatgpt\.com|chat\.openai\.com/,
    inputSelector: "#prompt-textarea, div[contenteditable='true'][data-id]",
    submitSelector: "button[data-testid='send-button'], button[aria-label='Send prompt']",
  },
  {
    name: "Claude",
    hostRe: /claude\.ai/,
    inputSelector: "div[contenteditable='true'].ProseMirror, div[contenteditable='true'][data-testid]",
    submitSelector: "button[aria-label='Send Message'], button[data-testid='send-button']",
  },
  {
    name: "Gemini",
    hostRe: /gemini\.google\.com/,
    inputSelector: "div[contenteditable='true'].ql-editor, rich-textarea div[contenteditable='true']",
    submitSelector: "button[aria-label='Send message'], button.send-button",
  },
  {
    name: "Copilot",
    hostRe: /copilot\.microsoft\.com|bing\.com\/chat|github\.com\/copilot/,
    inputSelector: "textarea[name='userInput'], div[contenteditable='true']#userInput, textarea#copilot-chat-input",
    submitSelector: "button[aria-label='Submit'], button[type='submit']",
  },
];

// ---------------------------------------------------------------------------
// Kaelus settings (loaded from chrome.storage)
// ---------------------------------------------------------------------------

/** @type {{ enabled: boolean, blockOnRisk: string[], apiKey: string|null, endpoint: string }} */
let SETTINGS = {
  enabled: true,
  blockOnRisk: ["CRITICAL", "HIGH"],
  apiKey: null,
  endpoint: "https://houndshield.com/api/v1/scan",
};

function loadSettings() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(
      { enabled: true, blockOnRisk: ["CRITICAL", "HIGH"], apiKey: null, endpoint: "https://houndshield.com/api/v1/scan" },
      (items) => { Object.assign(SETTINGS, items); }
    );
  }
}

loadSettings();
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener(() => loadSettings());
}

// ---------------------------------------------------------------------------
// Scan logic
// ---------------------------------------------------------------------------

/**
 * @param {string} text
 * @returns {{ id: string, label: string, risk: string }[]}
 */
function localScan(text) {
  return LOCAL_PATTERNS
    .filter((p) => p.re.test(text))
    .map(({ id, label, risk }) => ({ id, label, risk }));
}

/**
 * Optionally forward to Kaelus API for deep scan.
 * Returns null if no API key configured.
 * @param {string} text
 * @returns {Promise<{ id: string, label: string, risk: string }[]|null>}
 */
async function remoteScan(text) {
  if (!SETTINGS.apiKey) return null;
  try {
    const res = await fetch(SETTINGS.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SETTINGS.apiKey}`,
      },
      body: JSON.stringify({ text, source: "browser-extension" }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.findings) ? data.findings : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Banner UI — built entirely with safe DOM methods (no innerHTML)
// ---------------------------------------------------------------------------

const BANNER_ID = "kaelus-warning-banner";
const OVERLAY_ID = "kaelus-overlay";

/**
 * Remove any existing banner / overlay from the page.
 */
function removeBanner() {
  document.getElementById(BANNER_ID)?.remove();
  document.getElementById(OVERLAY_ID)?.remove();
}

/**
 * Build a risk badge element.
 * @param {string} risk
 * @returns {HTMLElement}
 */
function buildRiskBadge(risk) {
  const badge = document.createElement("span");
  badge.className = "kaelus-badge";
  badge.setAttribute("data-risk", risk.toLowerCase());
  badge.textContent = risk;
  return badge;
}

/**
 * Build a single finding row element.
 * @param {{ id: string, label: string, risk: string }} finding
 * @returns {HTMLElement}
 */
function buildFindingRow(finding) {
  const row = document.createElement("div");
  row.className = "kaelus-finding-row";

  const icon = document.createElement("span");
  icon.className = "kaelus-finding-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "\u26A0\uFE0F"; // ⚠️

  const label = document.createElement("span");
  label.className = "kaelus-finding-label";
  label.textContent = finding.label;

  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(buildRiskBadge(finding.risk));

  return row;
}

/**
 * Show the compliance warning banner.
 * @param {{ id: string, label: string, risk: string }[]} findings
 * @param {boolean} blocked
 * @param {() => void} onSendAnyway
 */
function showBanner(findings, blocked, onSendAnyway) {
  removeBanner();

  // Overlay (semi-transparent backdrop)
  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "kaelus-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Kaelus compliance warning");

  // Banner card
  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.className = "kaelus-banner";

  // Header row
  const header = document.createElement("div");
  header.className = "kaelus-header";

  const logoWrap = document.createElement("div");
  logoWrap.className = "kaelus-logo-wrap";

  const shieldIcon = document.createElement("span");
  shieldIcon.className = "kaelus-shield";
  shieldIcon.setAttribute("aria-hidden", "true");
  shieldIcon.textContent = "\uD83D\uDEE1\uFE0F"; // 🛡️

  const productName = document.createElement("span");
  productName.className = "kaelus-product-name";
  productName.textContent = "Kaelus AI Firewall";

  logoWrap.appendChild(shieldIcon);
  logoWrap.appendChild(productName);

  const closeBtn = document.createElement("button");
  closeBtn.className = "kaelus-close-btn";
  closeBtn.setAttribute("aria-label", "Dismiss warning");
  closeBtn.textContent = "\u2715"; // ×
  closeBtn.addEventListener("click", removeBanner);

  header.appendChild(logoWrap);
  header.appendChild(closeBtn);

  // Title
  const title = document.createElement("p");
  title.className = "kaelus-title";
  title.textContent = blocked
    ? "Prompt blocked — sensitive data detected"
    : "Warning — potential compliance issue";

  // Findings list
  const findingsList = document.createElement("div");
  findingsList.className = "kaelus-findings-list";
  findings.forEach((f) => findingsList.appendChild(buildFindingRow(f)));

  // Subtitle
  const subtitle = document.createElement("p");
  subtitle.className = "kaelus-subtitle";
  subtitle.textContent = blocked
    ? "Remove the flagged content before sending, or send through your Kaelus gateway for audit logging."
    : "This prompt may contain regulated information. Consider reviewing before sending.";

  // Action buttons
  const actions = document.createElement("div");
  actions.className = "kaelus-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "kaelus-btn kaelus-btn-primary";
  editBtn.textContent = "Edit prompt";
  editBtn.addEventListener("click", removeBanner);

  actions.appendChild(editBtn);

  if (!blocked) {
    const sendBtn = document.createElement("button");
    sendBtn.className = "kaelus-btn kaelus-btn-secondary";
    sendBtn.textContent = "Send anyway";
    sendBtn.addEventListener("click", () => {
      removeBanner();
      onSendAnyway();
    });
    actions.appendChild(sendBtn);
  }

  // Footer link
  const footer = document.createElement("div");
  footer.className = "kaelus-footer";

  const footerLink = document.createElement("a");
  footerLink.href = "https://houndshield.com/dashboard";
  footerLink.target = "_blank";
  footerLink.rel = "noopener noreferrer";
  footerLink.className = "kaelus-footer-link";
  footerLink.textContent = "View audit log \u2192"; // →

  footer.appendChild(footerLink);

  // Assemble
  banner.appendChild(header);
  banner.appendChild(title);
  banner.appendChild(findingsList);
  banner.appendChild(subtitle);
  banner.appendChild(actions);
  banner.appendChild(footer);

  overlay.appendChild(banner);
  document.body.appendChild(overlay);

  // Trap focus in banner
  editBtn.focus();
}

// ---------------------------------------------------------------------------
// Input extraction helpers
// ---------------------------------------------------------------------------

/**
 * Get plain text from a textarea or contenteditable element.
 * @param {Element} el
 * @returns {string}
 */
function getInputText(el) {
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    return el.value;
  }
  return el.innerText || el.textContent || "";
}

// ---------------------------------------------------------------------------
// Intercept logic
// ---------------------------------------------------------------------------

let pendingSubmit = null; // stores deferred submit action when user clicks "send anyway"

/**
 * Run scan and optionally block.
 * @param {string} text
 * @param {() => void} submitCallback — the real submit action
 */
async function interceptPrompt(text, submitCallback) {
  if (!SETTINGS.enabled || !text.trim()) {
    submitCallback();
    return;
  }

  // Local scan first (synchronous, <1ms)
  let findings = localScan(text);

  // Remote scan if API key configured (async, up to 3s)
  if (!findings.length && SETTINGS.apiKey) {
    const remote = await remoteScan(text);
    if (remote) findings = remote;
  }

  if (!findings.length) {
    submitCallback();
    return;
  }

  // Determine if blocked (CRITICAL/HIGH by default)
  const blocked = findings.some((f) => SETTINGS.blockOnRisk.includes(f.risk));

  // Notify background for badge/logging
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({
      type: "KAELUS_FINDING",
      findings,
      blocked,
      host: location.hostname,
    });
  }

  showBanner(findings, blocked, submitCallback);
}

// ---------------------------------------------------------------------------
// Site wiring — attach to each supported site
// ---------------------------------------------------------------------------

/**
 * Find the active adapter for this site.
 * @returns {{ name: string, inputSelector: string, submitSelector: string }|null}
 */
function getAdapter() {
  return SITE_ADAPTERS.find((a) => a.hostRe.test(location.hostname)) ?? null;
}

/**
 * Attach keydown (Enter) + click interceptors to the submit button.
 * Uses event capture to intercept before the site's own listeners.
 * @param {Element} inputEl
 * @param {Element|null} submitEl
 */
function attachInterceptors(inputEl, submitEl) {
  // Enter key on contenteditable / textarea
  inputEl.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const text = getInputText(inputEl);
        e.preventDefault();
        e.stopImmediatePropagation();
        interceptPrompt(text, () => {
          // Re-fire without interception
          inputEl.removeEventListener("keydown", arguments.callee, true);
          const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
          inputEl.dispatchEvent(ev);
          // Re-attach after a tick
          setTimeout(() => attachInterceptors(inputEl, submitEl), 200);
        });
      }
    },
    true // capture phase
  );

  // Submit button click
  if (submitEl) {
    submitEl.addEventListener(
      "click",
      (e) => {
        const text = getInputText(inputEl);
        e.preventDefault();
        e.stopImmediatePropagation();
        interceptPrompt(text, () => {
          submitEl.removeEventListener("click", arguments.callee, true);
          submitEl.click();
          setTimeout(() => attachInterceptors(inputEl, submitEl), 200);
        });
      },
      true
    );
  }
}

// ---------------------------------------------------------------------------
// MutationObserver — wait for the chat input to appear in the DOM
// ---------------------------------------------------------------------------

function init() {
  const adapter = getAdapter();
  if (!adapter) return;

  let attached = false;

  const observer = new MutationObserver(() => {
    if (attached) return;
    const inputEl = document.querySelector(adapter.inputSelector);
    if (!inputEl) return;

    const submitEl = document.querySelector(adapter.submitSelector);
    attachInterceptors(inputEl, submitEl);
    attached = true;

    // Re-check if the input element is replaced (SPA navigation)
    const reattach = new MutationObserver(() => {
      const el = document.querySelector(adapter.inputSelector);
      if (el && el !== inputEl) {
        attached = false;
        reattach.disconnect();
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
    reattach.observe(document.body, { childList: true, subtree: true });
    observer.disconnect();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also try immediately (for already-loaded pages)
  const inputEl = document.querySelector(adapter.inputSelector);
  if (inputEl) {
    observer.disconnect();
    const submitEl = document.querySelector(adapter.submitSelector);
    attachInterceptors(inputEl, submitEl);
    attached = true;
  }
}

// Run after DOM is interactive
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
