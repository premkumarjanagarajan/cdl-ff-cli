import { theme } from "./theme.js";
import { getTerminalWidth } from "../utils/system.js";

/** Strip ANSI escape codes to calculate visible string length. */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

export interface StatusBarState {
  streamMode: boolean;
}

/**
 * Render the bottom status bar, split into left/right sections.
 *
 *   ? for shortcuts                   Stream off (tab to toggle)
 */
export function renderStatusBar(state: StatusBarState): string {
  const width = getTerminalWidth();

  const left = theme.hint("  ? for shortcuts");
  const modeLabel = state.streamMode ? "Stream" : "Compact";
  const right = theme.hint(`${modeLabel} mode (tab to toggle)  `);

  const leftLen = stripAnsi(left).length;
  const rightLen = stripAnsi(right).length;
  const gap = Math.max(width - leftLen - rightLen, 1);

  return left + " ".repeat(gap) + right;
}

/**
 * Render a horizontal separator line spanning the terminal width.
 */
export function renderSeparator(): string {
  const width = getTerminalWidth();
  return theme.separator("─".repeat(width));
}
