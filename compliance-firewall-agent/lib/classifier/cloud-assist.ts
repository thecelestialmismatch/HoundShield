/**
 * Cloud-assist gate (fixes audit C6).
 *
 * HoundShield's core promise is local-only classification: prompt content is
 * scanned on the customer's own hardware and never leaves their network. Two
 * optional stages (Gemini Flash intent scan, Anthropic advisor escalation) send
 * prompt text to third-party cloud LLMs. If those ran automatically whenever an
 * API key happened to be present, HoundShield would itself become the CUI/PHI
 * spillage vector it is sold to prevent — a DFARS 7012 / HIPAA exposure.
 *
 * Therefore cloud assist is OFF by default and must be explicitly opted into via
 * HOUNDSHIELD_CLOUD_ASSIST=1. It must NEVER be enabled in a CUI-handling
 * deployment (Mode B Docker / Mode C air-gapped). The local regex + semantic
 * engines remain the default decision path with or without this flag.
 */
export function isCloudAssistEnabled(): boolean {
  const flag = (process.env.HOUNDSHIELD_CLOUD_ASSIST ?? "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}
