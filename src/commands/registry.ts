import { theme } from "../ui/theme.js";
import { getVersion } from "../utils/system.js";
import { handleInstallREPL } from "./install.js";
import { handleUpdateREPL } from "./update.js";
import { runVerify } from "./verify.js";

export interface CommandContext {
  cwd: string;
  /** Request the REPL to exit gracefully. */
  requestExit: () => void;
  /** Clear the screen and re-render welcome. */
  clearScreen: () => void;
}

export interface Command {
  name: string;
  aliases: string[];
  description: string;
  execute: (args: string, ctx: CommandContext) => void | Promise<void>;
}

/** Built-in commands shipped with Fluid Flow. */
export function getBuiltinCommands(): Command[] {
  return [
    // ── Core workflow commands ────────────────────────
    {
      name: "install",
      aliases: ["/install"],
      description: "Install Fluid Flow Pro into a repository",
      execute: async (args, ctx) => {
        await handleInstallREPL(args, ctx);
      },
    },
    {
      name: "update",
      aliases: ["/update"],
      description: "Update Fluid Flow Pro to the latest version",
      execute: async (args, ctx) => {
        await handleUpdateREPL(args, ctx);
      },
    },

    {
      name: "verify",
      aliases: ["/verify", "diff"],
      description: "Check GitHub for changes and show what's new",
      execute: async (_args, ctx) => {
        await runVerify(ctx.cwd);
      },
    },

    // ── General commands ─────────────────────────────
    {
      name: "help",
      aliases: ["?", "/help"],
      description: "Show available commands and shortcuts",
      execute: (_args, _ctx) => {
        const cmds = getBuiltinCommands();
        console.log();
        console.log(theme.brandBold("  Fluid Flow Commands"));
        console.log(theme.separator("  " + "─".repeat(40)));
        console.log();
        for (const cmd of cmds) {
          const names = [cmd.name, ...cmd.aliases]
            .map((n) => theme.command(n))
            .join(theme.textMuted(", "));
          console.log(`  ${names}`);
          console.log(`    ${theme.textSecondary(cmd.description)}`);
        }
        console.log();
        console.log(theme.hint("  Keyboard shortcuts:"));
        console.log(
          `    ${theme.key("Tab")}        ${theme.textSecondary("Toggle stream/compact mode")}`
        );
        console.log(
          `    ${theme.key("Ctrl+C")}     ${theme.textSecondary("Exit Fluid Flow")}`
        );
        console.log(
          `    ${theme.key("Ctrl+L")}     ${theme.textSecondary("Clear screen")}`
        );
        console.log();
      },
    },
    {
      name: "version",
      aliases: ["/version", "-v"],
      description: "Display the current version",
      execute: () => {
        console.log();
        console.log(
          `  ${theme.brandBold("Fluid Flow")} ${theme.version(`v${getVersion()}`)}`
        );
        console.log();
      },
    },
    {
      name: "clear",
      aliases: ["/clear"],
      description: "Clear the screen",
      execute: (_args, ctx) => {
        ctx.clearScreen();
      },
    },
    {
      name: "exit",
      aliases: ["/exit", "quit", "/quit"],
      description: "Exit Fluid Flow",
      execute: (_args, ctx) => {
        console.log();
        console.log(theme.brandDim("  Wave goodbye! ~~~"));
        console.log();
        ctx.requestExit();
      },
    },
    {
      name: "status",
      aliases: ["/status"],
      description: "Show current flow status and installation info",
      execute: (_args, ctx) => {
        // Inline import to avoid circular dependency
        import("../installer/manifest.js").then(({ readManifest }) => {
          const manifest = readManifest(ctx.cwd);

          console.log();
          console.log(theme.brandBold("  Flow Status"));
          console.log(theme.separator("  " + "─".repeat(40)));
          console.log(
            `  ${theme.textSecondary("Working dir:")}  ${theme.path(ctx.cwd)}`
          );
          console.log(
            `  ${theme.textSecondary("Version:")}      ${theme.version(`v${getVersion()}`)}`
          );

          if (manifest) {
            console.log(
              `  ${theme.textSecondary("Installed:")}    ${theme.textSuccess("Yes")}`
            );
            console.log(
              `  ${theme.textSecondary("Platform:")}     ${theme.text(manifest.platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
            );
            console.log(
              `  ${theme.textSecondary("Commit:")}       ${theme.text(manifest.commitSha.slice(0, 8))}`
            );
            console.log(
              `  ${theme.textSecondary("Updated:")}      ${theme.text(manifest.updatedAt)}`
            );
          } else {
            console.log(
              `  ${theme.textSecondary("Installed:")}    ${theme.textWarning("No")}`
            );
            console.log(
              theme.hint("  Run 'install' to set up Fluid Flow Pro")
            );
          }
          console.log();
        });
      },
    },
  ];
}

/** Attempt to match user input to a registered command. */
export function matchCommand(
  input: string,
  commands: Command[]
): { command: Command; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const [first, ...rest] = trimmed.split(/\s+/);
  const args = rest.join(" ");
  const lower = first!.toLowerCase();

  for (const cmd of commands) {
    if (
      cmd.name === lower ||
      cmd.aliases.some((a) => a.toLowerCase() === lower)
    ) {
      return { command: cmd, args };
    }
  }

  return null;
}
