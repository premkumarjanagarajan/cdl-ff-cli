import { theme, box as chars } from "./theme.js";

export interface BoxOptions {
  /** Label rendered inside the top border, e.g. "Fluid Flow" */
  title?: string;
  /** Minimum inner width (content area). Will expand to fit content. */
  minWidth?: number;
  /** Padding inside the box (left/right character count). Default: 2 */
  padding?: number;
}

/** Strip ANSI escape codes to calculate visible string length. */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Render a rounded-corner bordered box around content lines.
 *
 * ```
 * ╭─ Fluid Flow ─────────────────────╮
 * │                                   │
 * │   content line 1                  │
 * │   content line 2                  │
 * │                                   │
 * ╰───────────────────────────────────╯
 * ```
 */
export function renderBox(lines: string[], options: BoxOptions = {}): string {
  const { title, minWidth = 50, padding = 2 } = options;

  const pad = " ".repeat(padding);

  // Calculate the widest visible content width
  const contentWidths = lines.map((l) => stripAnsi(l).length);
  const maxContentWidth = Math.max(...contentWidths, 0);
  const innerWidth = Math.max(maxContentWidth + padding * 2, minWidth);

  // ── Top border ───────────────────────────────────────
  let topBorder: string;
  if (title) {
    const label = ` ${title} `;
    const remaining = innerWidth - label.length - 1; // -1 for the space after ╭─
    topBorder =
      theme.border(chars.topLeft + chars.horizontal + " ") +
      theme.borderLabel(title) +
      theme.border(
        " " + chars.horizontal.repeat(Math.max(remaining - 1, 0)) + chars.topRight
      );
  } else {
    topBorder = theme.border(
      chars.topLeft + chars.horizontal.repeat(innerWidth) + chars.topRight
    );
  }

  // ── Content lines ────────────────────────────────────
  const renderedLines = lines.map((line) => {
    const visible = stripAnsi(line).length;
    const rightPad = innerWidth - padding * 2 - visible;
    return (
      theme.border(chars.vertical) +
      pad +
      line +
      " ".repeat(Math.max(rightPad, 0)) +
      pad +
      theme.border(chars.vertical)
    );
  });

  // ── Bottom border ────────────────────────────────────
  const bottomBorder = theme.border(
    chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight
  );

  return [topBorder, ...renderedLines, bottomBorder].join("\n");
}
