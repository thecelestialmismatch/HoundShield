/**
 * Kaelus AI Firewall — Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 *   - Maintain a findings counter per tab (badge)
 *   - Relay messages from content scripts
 *   - Provide extension lifecycle management
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {Map<number, number>} tabId → findings count */
const tabFindings = new Map();

// ---------------------------------------------------------------------------
// Extension install / update
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: "https://houndshield.com?ref=extension" });
  }
});

// ---------------------------------------------------------------------------
// Message handling from content scripts
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "KAELUS_FINDING") return;

  const tabId = sender.tab?.id;
  if (!tabId) return;

  const prev = tabFindings.get(tabId) ?? 0;
  const next = prev + message.findings.length;
  tabFindings.set(tabId, next);

  // Update badge
  chrome.action.setBadgeText({ tabId, text: String(next) });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: message.blocked ? "#ef4444" : "#f97316", // red if blocked, orange if warned
  });

  // Persist finding to storage for popup display
  chrome.storage.session.get({ recentFindings: [] }, ({ recentFindings }) => {
    const entry = {
      tabId,
      host: message.host,
      findings: message.findings,
      blocked: message.blocked,
      ts: Date.now(),
    };
    // Keep last 50 findings
    const updated = [entry, ...recentFindings].slice(0, 50);
    chrome.storage.session.set({ recentFindings: updated });
  });
});

// ---------------------------------------------------------------------------
// Tab lifecycle — clear badge when tab navigates
// ---------------------------------------------------------------------------

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    tabFindings.delete(tabId);
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabFindings.delete(tabId);
});
