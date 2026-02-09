import readline from "node:readline";
import { theme } from "./theme.js";
import { renderStatusBar, renderSeparator, type StatusBarState } from "./statusBar.js";

export interface PromptOptions {
  onLine: (line: string) => void | Promise<void>;
  onExit: () => void;
  onToggleMode: () => void;
  getStatusState: () => StatusBarState;
}

/**
 * Interactive REPL prompt for Fluid Flow.
 *
 * Renders:
 *   ─────────────────────────────────────────
 *   > user input here
 *     ? for shortcuts              Stream mode (tab to toggle)
 */
export function createPrompt(options: PromptOptions): {
  start: () => void;
  close: () => void;
  refreshStatusBar: () => void;
} {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: theme.prompt("> ") + " ",
    terminal: true,
  });

  function printStatusBar() {
    const bar = renderStatusBar(options.getStatusState());
    process.stdout.write(bar + "\n");
  }

  function showPrompt() {
    printStatusBar();
    rl.prompt();
  }

  function start() {
    console.log(renderSeparator());
    console.log();
    showPrompt();

    rl.on("line", async (line: string) => {
      await options.onLine(line);
      showPrompt();
    });

    rl.on("close", () => {
      options.onExit();
    });

    // Handle Ctrl+L for clear screen
    if (process.stdin.isTTY) {
      process.stdin.on("keypress", (_ch: string, key: readline.Key) => {
        if (key && key.ctrl && key.name === "l") {
          process.stdout.write("\x1B[2J\x1B[H");
          showPrompt();
        }
      });
    }
  }

  function close() {
    rl.close();
  }

  function refreshStatusBar() {
    // Move up one line, clear, and reprint
    process.stdout.write("\x1B[1A\x1B[2K");
    printStatusBar();
  }

  return { start, close, refreshStatusBar };
}
