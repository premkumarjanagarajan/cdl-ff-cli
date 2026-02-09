import { renderWelcome } from "./ui/welcome.js";
import { createPrompt } from "./ui/prompt.js";
import { type StatusBarState } from "./ui/statusBar.js";
import {
  getBuiltinCommands,
  matchCommand,
  type CommandContext,
} from "./commands/registry.js";
import { theme } from "./ui/theme.js";

/**
 * FluidFlow — the main CLI application class.
 *
 * Orchestrates the welcome screen, interactive prompt, command
 * dispatch, and lifecycle management.
 */
export class FluidFlow {
  private cwd: string;
  private exitRequested = false;
  private statusState: StatusBarState = { streamMode: false };
  private prompt: ReturnType<typeof createPrompt> | null = null;

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd();
  }

  /** Boot the CLI: render welcome, start the REPL. */
  async start(): Promise<void> {
    // Clear screen for a fresh start
    process.stdout.write("\x1B[2J\x1B[H");

    // Render the welcome box
    console.log(renderWelcome(this.cwd));

    // Create and start the interactive prompt
    const commands = getBuiltinCommands();
    const ctx: CommandContext = {
      cwd: this.cwd,
      requestExit: () => this.exit(),
      clearScreen: () => this.clearAndReshow(),
    };

    this.prompt = createPrompt({
      onLine: async (line) => {
        await this.handleInput(line, commands, ctx);
      },
      onExit: () => {
        this.shutdown();
      },
      onToggleMode: () => {
        this.statusState.streamMode = !this.statusState.streamMode;
        this.prompt?.refreshStatusBar();
      },
      getStatusState: () => this.statusState,
    });

    this.prompt.start();
  }

  /** Process a line of user input. */
  private async handleInput(
    input: string,
    commands: ReturnType<typeof getBuiltinCommands>,
    ctx: CommandContext
  ): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed) return;

    const match = matchCommand(trimmed, commands);
    if (match) {
      await match.command.execute(match.args, ctx);
    } else {
      // Unrecognized input — show a friendly nudge
      console.log();
      console.log(
        theme.textSecondary(`  Unknown command: ${theme.text(trimmed)}`)
      );
      console.log(
        theme.hint("  Type ? or help to see available commands")
      );
      console.log();
    }
  }

  /** Clear the screen and re-render the welcome. */
  private clearAndReshow(): void {
    process.stdout.write("\x1B[2J\x1B[H");
    console.log(renderWelcome(this.cwd));
  }

  /** Graceful exit. */
  private exit(): void {
    this.exitRequested = true;
    this.prompt?.close();
    this.shutdown();
  }

  /** Clean up and terminate. */
  private shutdown(): void {
    if (!this.exitRequested) {
      // Ctrl+C without exit command — still be polite
      console.log();
      console.log(theme.brandDim("  ~~~ until next flow ~~~"));
      console.log();
    }
    process.exit(0);
  }
}
