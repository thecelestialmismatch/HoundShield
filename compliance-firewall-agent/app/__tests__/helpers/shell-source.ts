import { readdirSync, readFileSync } from "fs";
import path from "path";

const CFA = path.join(__dirname, "..", "..", "..");
const TOOLS_DIR = path.join(CFA, "app/command-center/(tools)");
const SHELL_DIR = path.join(TOOLS_DIR, "_shell");

/**
 * The Command Center shell, read as ONE source.
 *
 * Every guard that greps the shell used to pin `app/command-center/(tools)/
 * layout.tsx` by path — eleven assertions across three test files. That was
 * fine while the shell was one 427-line file, and it became a tripwire the
 * moment the file had to be split: the responsive drawer and the ⌘K palette
 * would have pushed it past the repo's 500-line component rule, and moving
 * `NAV_SECTIONS` or the `/api/me` read into a sibling would have failed eight
 * passing tests that were each still asserting something true.
 *
 * The invariants were never about which file held the code. They are about the
 * shell as a whole: it identifies the customer and not the build, it can be
 * signed out of, it carries no indigo, every nav href resolves to a real page.
 * So the guards now read the whole shell and the split is free — this one and
 * the next one.
 *
 * Precedent: `tasks/todo.md` 2026-07-31, where guards that encoded the old
 * architecture were rewritten rather than deleted, with the reversal recorded.
 */
export function readShellSource(): string {
  const parts = [readFileSync(path.join(TOOLS_DIR, "layout.tsx"), "utf8")];
  for (const entry of readdirSync(SHELL_DIR, { withFileTypes: true })) {
    // Skip `__tests__` — a guard must never satisfy itself by matching a string
    // that only exists in the test asserting it.
    if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      parts.push(readFileSync(path.join(SHELL_DIR, entry.name), "utf8"));
    }
  }
  return parts.join("\n");
}

/** The composition root alone, for assertions genuinely about that file. */
export function readShellRoot(): string {
  return readFileSync(path.join(TOOLS_DIR, "layout.tsx"), "utf8");
}
