import chalk from "chalk";

/**
 * Fluid Flow color theme — warm orange / salmon palette
 * inspired by the Claude Code aesthetic.
 *
 * Brand primary  : salmon-orange (#E8866A)
 * Brand accent   : peach         (#F4A88C)
 * Surface border : muted rust    (#8B5E3C)
 * Text primary   : white
 * Text secondary : gray
 * Text muted     : dim
 */

// ── Palette ────────────────────────────────────────────────
const orange = chalk.hex("#E8866A");
const orangeBold = chalk.hex("#E8866A").bold;
const peach = chalk.hex("#F4A88C");
const rust = chalk.hex("#8B5E3C");
const amber = chalk.hex("#F0C090");

export const theme = {
  // ── Brand ──────────────────────────────────────────────
  brand: orange,
  brandBold: orangeBold,
  brandBright: peach,
  brandDim: rust,

  // ── Text ───────────────────────────────────────────────
  text: chalk.white,
  textBold: chalk.white.bold,
  textSecondary: chalk.gray,
  textMuted: chalk.dim,
  textSuccess: chalk.green,
  textWarning: chalk.yellow,
  textError: chalk.red,

  // ── UI Elements ────────────────────────────────────────
  border: rust,
  borderLabel: orangeBold,
  separator: chalk.gray.dim,
  highlight: peach.bold,
  prompt: peach.bold,
  hint: chalk.gray,
  badge: chalk.bgHex("#E8866A").black.bold,

  // ── Semantic ───────────────────────────────────────────
  command: peach,
  path: amber,
  version: chalk.white,
  key: chalk.hex("#F4A88C"),
} as const;

/** Box-drawing characters for the rounded-corner bordered box. */
export const box = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
} as const;
