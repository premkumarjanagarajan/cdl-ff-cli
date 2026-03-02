import readline from "node:readline";
import { theme, box as chars } from "./theme.js";

/** Strip ANSI escape codes to calculate visible string length. */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// ── Menu item types ────────────────────────────────────

export interface MenuItem {
  /** Unique key for programmatic matching. */
  key: string;
  /** Display label (short name). */
  label: string;
  /** Optional description shown to the right. */
  description?: string;
  /** Optional hint shown below in muted text. */
  hint?: string;
}

export interface MenuOptions {
  /** Title rendered in the top border. */
  title: string;
  /** Minimum inner width. Default: 52 */
  minWidth?: number;
  /** Prompt text shown below the box. */
  prompt?: string;
}

// ── Menu rendering ─────────────────────────────────────

/**
 * Render a styled menu box with numbered items.
 *
 * ```
 * ╭─ Main Menu ────────────────────────────────────╮
 * │                                                 │
 * │   1  Install      Install Fluid Flow Pro        │
 * │   2  Update       Update to latest version      │
 * │   3  Exit                                       │
 * │                                                 │
 * ╰─────────────────────────────────────────────────╯
 * ```
 */
export function renderMenu(
  items: MenuItem[],
  options: MenuOptions
): string {
  const { title, minWidth = 52 } = options;
  const padding = 2;
  const pad = " ".repeat(padding);

  // ── Calculate column widths ─────────────────────────
  const numberWidth = 3; // "1  "
  const labelWidths = items.map((i) => stripAnsi(i.label).length);
  const maxLabel = Math.max(...labelWidths, 0);
  const gap = 3; // space between label and description

  // Build content lines
  const contentLines: string[] = [""];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const num = theme.highlight(String(i + 1));
    const numVisible = String(i + 1).length;

    const label = theme.text(item.label);
    const labelVisible = stripAnsi(item.label).length;

    const labelPad = " ".repeat(maxLabel - labelVisible + gap);

    let line = `  ${num}${" ".repeat(numberWidth - numVisible)}${label}`;

    if (item.description) {
      line += `${labelPad}${theme.textSecondary(item.description)}`;
    }

    contentLines.push(line);

    if (item.hint) {
      const hintIndent = " ".repeat(2 + numberWidth + maxLabel + gap);
      contentLines.push(`${hintIndent}${theme.hint(item.hint)}`);
    }
  }

  contentLines.push("");

  // ── Calculate inner width ───────────────────────────
  const visibleWidths = contentLines.map((l) => stripAnsi(l).length);
  const maxContentWidth = Math.max(...visibleWidths, 0);
  const innerWidth = Math.max(maxContentWidth + padding * 2, minWidth);

  // ── Top border ──────────────────────────────────────
  const label = ` ${title} `;
  const remaining = innerWidth - label.length - 1;
  const topBorder =
    theme.border(chars.topLeft + chars.horizontal + " ") +
    theme.borderLabel(title) +
    theme.border(
      " " + chars.horizontal.repeat(Math.max(remaining, 0)) + chars.topRight
    );

  // ── Content lines ───────────────────────────────────
  const renderedLines = contentLines.map((line) => {
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

  // ── Bottom border ───────────────────────────────────
  const bottomBorder = theme.border(
    chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight
  );

  return [topBorder, ...renderedLines, bottomBorder].join("\n");
}

// ── Interactive selection ──────────────────────────────

/**
 * Display a menu and wait for the user to select an option.
 * Returns the selected MenuItem.
 */
export function promptMenu(
  items: MenuItem[],
  options: MenuOptions
): Promise<MenuItem> {
  const { prompt: promptText = "Select an option" } = options;
  const maxNum = items.length;

  // Render and display the menu
  console.log();
  console.log(renderMenu(items, options));
  console.log();

  return new Promise<MenuItem>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const ask = () => {
      rl.question(
        `  ${theme.prompt(promptText)} ${theme.textSecondary(`(1-${maxNum}):`)} `,
        (answer) => {
          const trimmed = answer.trim().toLowerCase();

          // Try numeric selection
          const num = parseInt(trimmed, 10);
          if (num >= 1 && num <= maxNum) {
            rl.close();
            resolve(items[num - 1]!);
            return;
          }

          // Try key/label matching
          const match = items.find(
            (item) =>
              item.key.toLowerCase() === trimmed ||
              item.label.toLowerCase() === trimmed
          );

          if (match) {
            rl.close();
            resolve(match);
            return;
          }

          console.log(
            theme.textWarning(`  Please enter a number between 1 and ${maxNum}`)
          );
          ask();
        }
      );
    };

    ask();
  });
}

// ── Branch selection ───────────────────────────────────

export interface BranchPromptOptions {
  /** The configured default branch (shown first, labelled "(default)"). */
  defaultBranch: string;
  /** The currently installed branch, if any (labelled "(current)"). */
  currentBranch?: string;
}

/**
 * Show a branch selection menu and return the chosen branch name.
 * Sorts so `defaultBranch` is first, `currentBranch` second (if different),
 * then remaining branches alphabetically.
 */
export async function promptBranch(
  branches: string[],
  options: BranchPromptOptions
): Promise<string> {
  const { defaultBranch, currentBranch } = options;

  const sorted = [...branches].sort((a, b) => {
    if (a === defaultBranch) return -1;
    if (b === defaultBranch) return 1;
    if (currentBranch && a === currentBranch) return -1;
    if (currentBranch && b === currentBranch) return 1;
    return a.localeCompare(b);
  });

  const items: MenuItem[] = sorted.map((name) => {
    const tags: string[] = [];
    if (name === defaultBranch) tags.push("default");
    if (currentBranch && name === currentBranch) tags.push("current");
    return {
      key: name,
      label: name,
      description: tags.length > 0 ? `(${tags.join(", ")})` : undefined,
    };
  });

  const selected = await promptMenu(items, {
    title: "Select Branch",
    prompt: "Which branch would you like to use?",
  });

  return selected.key;
}

// ── Confirmation prompt ────────────────────────────────

/**
 * Show a yes/no confirmation prompt. Returns true for yes.
 */
export function promptConfirm(message: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl.question(
      `  ${theme.text(message)} ${theme.textSecondary("(y/n):")} `,
      (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase().startsWith("y"));
      }
    );
  });
}

// ── Directory prompt ───────────────────────────────────

/**
 * Prompt for a directory path, with a default value.
 */
export function promptDirectory(defaultDir: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl.question(
      `  ${theme.prompt("Target directory")} ${theme.textSecondary(`(${defaultDir}):`)} `,
      (answer) => {
        rl.close();
        const trimmed = answer.trim();
        resolve(trimmed || defaultDir);
      }
    );
  });
}
