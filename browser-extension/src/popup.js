/**
 * Kaelus AI Firewall — Popup Script
 * Reads chrome.storage.session for recent findings, renders them safely.
 * No innerHTML used.
 */

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const statusDot   = document.getElementById("status-dot");
const statusLabel = document.getElementById("status-label");
const toggle      = document.getElementById("enabled-toggle");
const statBlocked = document.getElementById("stat-blocked");
const statWarned  = document.getElementById("stat-warned");
const statScanned = document.getElementById("stat-scanned");
const findingsList  = document.getElementById("findings-list");
const findingsEmpty = document.getElementById("findings-empty");

// ---------------------------------------------------------------------------
// Settings load / toggle
// ---------------------------------------------------------------------------

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  setToggleState(enabled);
});

toggle.addEventListener("click", () => {
  const current = toggle.getAttribute("aria-checked") === "true";
  const next = !current;
  setToggleState(next);
  chrome.storage.sync.set({ enabled: next });
});

function setToggleState(enabled) {
  toggle.setAttribute("aria-checked", String(enabled));
  if (enabled) {
    statusDot.classList.remove("inactive");
    statusLabel.textContent = "Active";
  } else {
    statusDot.classList.add("inactive");
    statusLabel.textContent = "Paused";
  }
}

// ---------------------------------------------------------------------------
// Recent findings
// ---------------------------------------------------------------------------

chrome.storage.session.get({ recentFindings: [] }, ({ recentFindings }) => {
  renderFindings(recentFindings);
});

/**
 * @param {{ host: string, findings: {id:string,label:string,risk:string}[], blocked: boolean, ts: number }[]} entries
 */
function renderFindings(entries) {
  let blocked = 0;
  let warned  = 0;

  entries.forEach((e) => {
    if (e.blocked) blocked++;
    else warned++;
  });

  const scanned = entries.reduce((sum, e) => sum + e.findings.length, 0);
  statBlocked.textContent = String(blocked);
  statWarned.textContent  = String(warned);
  statScanned.textContent = String(scanned);

  if (entries.length === 0) {
    findingsEmpty.style.display = "block";
    return;
  }

  findingsEmpty.style.display = "none";

  // Show latest 10 individual findings
  const rows = entries.slice(0, 10).flatMap((e) =>
    e.findings.map((f) => ({ ...f, host: e.host, blocked: e.blocked }))
  );

  rows.forEach((f) => {
    const row = document.createElement("div");
    row.className = "finding-row";

    const dot = document.createElement("span");
    dot.className = `finding-dot ${f.risk.toLowerCase()}`;

    const content = document.createElement("div");
    content.className = "finding-content";

    const label = document.createElement("div");
    label.className = "finding-label";
    label.textContent = f.label;

    const host = document.createElement("div");
    host.className = "finding-host";
    host.textContent = f.host;

    content.appendChild(label);
    content.appendChild(host);

    if (f.blocked) {
      const blockedTag = document.createElement("div");
      blockedTag.className = "finding-blocked";
      blockedTag.textContent = "Blocked";
      content.appendChild(blockedTag);
    }

    row.appendChild(dot);
    row.appendChild(content);
    findingsList.appendChild(row);
  });
}
