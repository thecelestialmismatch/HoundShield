/**
 * cleanAnswer — make Brain AI read like a confident human expert, not a
 * markdown dump. Brain AI answers render as plain text (whitespace-pre-wrap),
 * so raw markdown shows literal `*` and `-`. This strips markdown syntax while
 * preserving real content:
 *
 *   - emphasis `**x**` / `*x*` / `__x__` / `_x_`            → x
 *   - markdown bullets `- ` / `* ` at line start           → `• `  (never a star/dash)
 *   - headings `# …`, blockquotes `> …`                    → text only
 *   - inline code `` `x` `` and ``` fences                 → x
 *   - links `[text](url)`                                  → `text (url)`
 *
 * Real hyphens stay intact: "NIST 800-171", "−203 to +110", "$30K-$150K",
 * "SOC 2 Type II" are never touched (only a `-`/`*` followed by a space at the
 * start of a line is treated as a bullet).
 */
export function cleanAnswer(input: string): string {
  if (!input) return "";
  let text = input.replace(/\r\n/g, "\n");

  // Fenced code blocks ```lang ... ``` → keep the inner code, drop the fences.
  text = text.replace(/```[a-zA-Z0-9]*\n?/g, "").replace(/```/g, "");

  // Markdown links [text](url) → text (url)  (or just text if url is empty).
  text = text.replace(/\[([^\]]+)\]\(([^)]*)\)/g, (_m, label, url) =>
    url ? `${label} (${url})` : label,
  );

  // Bold/italic emphasis. Order matters: double markers before single.
  text = text
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "$1")
    .replace(/(?<![\w_])_([^_\n]+)_(?![\w_])/g, "$1");

  // Inline code `x` → x.
  text = text.replace(/`([^`\n]+)`/g, "$1");

  // Process line by line for block-level markdown.
  text = text
    .split("\n")
    .map((line) => {
      let l = line;
      // Headings: drop leading # markers, keep the heading text.
      l = l.replace(/^\s{0,3}#{1,6}\s+/, "");
      // Blockquotes: drop the leading > marker.
      l = l.replace(/^\s{0,3}>\s?/, "");
      // Bullets: a `-` or `*` (NOT `•`) followed by a space at line start → `• `.
      l = l.replace(/^(\s*)[-*]\s+/, "$1• ");
      // Trim trailing whitespace.
      return l.replace(/\s+$/, "");
    })
    .join("\n");

  // Collapse 3+ blank lines to a single blank line; trim the whole thing.
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

/** True if the text still contains markdown emphasis or dash/star bullets. */
export function hasMarkdownArtifacts(text: string): boolean {
  return /\*\*|(?:^|\n)\s*[-*]\s+|`/.test(text);
}
