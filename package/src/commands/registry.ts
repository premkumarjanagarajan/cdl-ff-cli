import { theme } from "../ui/theme.js";
import { getVersion } from "../utils/system.js";
import { runVerify } from "./verify.js";
import { getAllWorkflows, requireWorkflow } from "../workflows/registry.js";
import { showWorkflowMenu } from "./workflow-menu.js";
import { getInstalledWorkflowIds, readWorkflowManifest } from "../modules/manifest.js";

export interface CommandContext {
  cwd: string;
  requestExit: () => void;
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
    // -- Core workflow commands --
    {
      name: "install",
      aliases: ["/install"],
      description: "Install a workflow (e.g. install dev)",
      execute: async (args, _ctx) => {
        const workflowId = args.trim().split(/\s+/)[0];
        if (!workflowId) {
          console.log();
          console.log(theme.textWarning("  Usage: install <workflow>"));
          console.log(theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`));
          console.log();
          return;
        }
        try {
          const config = requireWorkflow(workflowId);
          await showWorkflowMenu(config);
        } catch {
          console.log();
          console.log(theme.textError(`  Unknown workflow: ${workflowId}`));
          console.log(theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`));
          console.log();
        }
      },
    },
    {
      name: "update",
      aliases: ["/update"],
      description: "Update a workflow (e.g. update dev)",
      execute: async (args, _ctx) => {
        const workflowId = args.trim().split(/\s+/)[0];
        if (!workflowId) {
          console.log();
          console.log(theme.textWarning("  Usage: update <workflow>"));
          console.log(theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`));
          console.log();
          return;
        }
        try {
          const config = requireWorkflow(workflowId);
          await showWorkflowMenu(config);
        } catch {
          console.log();
          console.log(theme.textError(`  Unknown workflow: ${workflowId}`));
          console.log();
        }
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
    {
      name: "mcp-setup",
      aliases: ["/mcp-setup", "mcp"],
      description: "Configure MCP servers (e.g. mcp dev)",
      execute: async (args, _ctx) => {
        const workflowId = args.trim().split(/\s+/)[0];
        if (!workflowId) {
          console.log();
          console.log(theme.textWarning("  Usage: mcp <workflow>"));
          console.log(
            theme.hint(
              `  Available: ${getAllWorkflows().filter((w) => w.features.includes("mcp")).map((w) => w.id).join(", ")}`
            )
          );
          console.log();
          return;
        }
        try {
          const config = requireWorkflow(workflowId);
          await showWorkflowMenu(config);
        } catch {
          console.log();
          console.log(theme.textError(`  Unknown workflow: ${workflowId}`));
          console.log();
        }
      },
    },

    // -- Workflow shortcuts --
    ...getAllWorkflows().map((wf) => ({
      name: wf.id,
      aliases: [`/${wf.id}`],
      description: `Open ${wf.name} menu`,
      execute: async (_args: string, _ctx: CommandContext) => {
        await showWorkflowMenu(wf);
      },
    })),

    // -- General commands --
    {
      name: "workflows",
      aliases: ["/workflows", "list"],
      description: "List all available workflows",
      execute: (_args, ctx) => {
        const workflows = getAllWorkflows();
        const installedIds = getInstalledWorkflowIds(ctx.cwd);

        console.log();
        console.log(theme.brandBold("  Available Workflows"));
        console.log(theme.separator("  " + "\u2500".repeat(40)));
        console.log();

        for (const wf of workflows) {
          const installed = installedIds.includes(wf.id);
          const status = installed
            ? theme.textSuccess("installed")
            : theme.textMuted("not installed");
          console.log(`  ${theme.command(wf.id.padEnd(12))} ${theme.text(wf.name.padEnd(28))} ${status}`);
        }
        console.log();
      },
    },
    {
      name: "help",
      aliases: ["?", "/help"],
      description: "Show available commands and shortcuts",
      execute: (_args, _ctx) => {
        const cmds = getBuiltinCommands();
        console.log();
        console.log(theme.brandBold("  Fluid Flow Commands"));
        console.log(theme.separator("  " + "\u2500".repeat(40)));
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
        console.log(`    ${theme.key("Tab")}        ${theme.textSecondary("Toggle stream/compact mode")}`);
        console.log(`    ${theme.key("Ctrl+C")}     ${theme.textSecondary("Exit Fluid Flow")}`);
        console.log(`    ${theme.key("Ctrl+L")}     ${theme.textSecondary("Clear screen")}`);
        console.log();
      },
    },
    {
      name: "version",
      aliases: ["/version", "-v"],
      description: "Display the current version",
      execute: () => {
        console.log();
        console.log(`  ${theme.brandBold("Fluid Flow")} ${theme.version(`v${getVersion()}`)}`);
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
        const workflows = getAllWorkflows();
        const installedIds = getInstalledWorkflowIds(ctx.cwd);

        console.log();
        console.log(theme.brandBold("  Flow Status"));
        console.log(theme.separator("  " + "\u2500".repeat(40)));
        console.log(`  ${theme.textSecondary("Working dir:")}  ${theme.path(ctx.cwd)}`);
        console.log(`  ${theme.textSecondary("Version:")}      ${theme.version(`v${getVersion()}`)}`);
        console.log();

        if (installedIds.length === 0) {
          console.log(`  ${theme.textSecondary("Installed:")}    ${theme.textWarning("No workflows")}`);
          console.log(theme.hint("  Run 'install <workflow>' to set up a workflow"));
        } else {
          for (const wf of workflows) {
            const entry = readWorkflowManifest(ctx.cwd, wf.id);
            if (entry) {
              console.log(
                `  ${theme.textSuccess("\u2713")} ${theme.text(wf.name.padEnd(24))} ${theme.textSecondary(entry.platform)} ${theme.textMuted(entry.commitSha.slice(0, 8))}`
              );
            } else {
              console.log(
                `  ${theme.textMuted("\u2500")} ${theme.textMuted(wf.name.padEnd(24))} ${theme.textMuted("not installed")}`
              );
            }
          }
        }
        console.log();
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
