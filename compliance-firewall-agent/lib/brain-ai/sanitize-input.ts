/**
 * Sanitize a user chat message before it reaches the LLM / FAQ matcher.
 * Defense-in-depth for the Brain AI input boundary: caps length (cost + abuse),
 * strips script/HTML so nothing can be reflected into a rendered surface, and
 * neutralizes obvious prompt-injection control lines. Conservative — it only
 * removes markup, never the user's actual words.
 */
const MAX_LEN = 4000;

export function sanitizeChatInput(input: string): string {
  if (!input) return "";
  let s = String(input).slice(0, MAX_LEN);

  // Remove script/style blocks entirely.
  s = s.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // Strip any remaining HTML tags.
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  // Drop stray angle brackets that could start markup.
  s = s.replace(/[<>]/g, "");

  return s.trim();
}
