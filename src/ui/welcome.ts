import { theme } from "./theme.js";
import { renderBox } from "./box.js";
import { renderMascot, renderWavyName } from "./ascii.js";
import { getUsername, shortenPath, getVersion } from "../utils/system.js";

/** Strip ANSI escape codes for length calculation. */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Render the welcome screen — the first thing users see when
 * launching Fluid Flow. Mimics the Claude Code style with a
 * bordered box containing a greeting, mascot, and metadata.
 */
export function renderWelcome(cwd: string): string {
  const user = getUsername();
  const version = getVersion();
  const dir = shortenPath(cwd);

  const mascot = renderMascot();
  const wavyName = renderWavyName();

  // Center-align helper based on a reference width
  const refWidth = 46;
  const center = (text: string, visibleLen?: number) => {
    const len = visibleLen ?? text.length;
    const left = Math.max(Math.floor((refWidth - len) / 2), 0);
    return " ".repeat(left) + text;
  };

  const lines: string[] = [
    "",
    center(
      theme.textBold(`Welcome back, ${user}!`),
      `Welcome back, ${user}!`.length
    ),
    "",
    // ── Developer mascot ───────────────────────
    ...mascot.map((l) => center(l, stripAnsi(l).length)),
    "",
    // ── Wavy "Fluid Flow" name ─────────────────
    ...wavyName.map((l) => center(l, stripAnsi(l).length)),
    "",
    // ── Metadata ───────────────────────────────
    center(theme.version(`v${version}`), `v${version}`.length),
    center(theme.textSecondary("Workflow Engine"), "Workflow Engine".length),
    center(theme.path(dir), dir.length),
    "",
  ];

  return renderBox(lines, { title: "Fluid Flow", minWidth: 50 });
}
