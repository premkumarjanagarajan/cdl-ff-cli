#!/usr/bin/env node

/**
 *  Fluid Flow CLI - Multi-Workflow Architecture
 *
 *  Main entry point. Presents a dynamic main menu driven by the
 *  workflow registry. Each registered workflow gets its own sub-menu
 *  with Install / Update / Verify / MCP Setup actions.
 */

import path from "node:path";
import { theme } from "./ui/theme.js";
import { getVersion, shortenPath } from "./utils/system.js";
import { renderWelcome } from "./ui/welcome.js";
import { promptMenu } from "./ui/menu.js";
import { renderBox } from "./ui/box.js";
import { getAllWorkflows, requireWorkflow } from "./workflows/registry.js";
import { showWorkflowMenu } from "./commands/workflow-menu.js";
import { getInstalledWorkflowIds, readWorkflowManifest } from "./modules/manifest.js";
import type { WorkflowConfig } from "./workflows/types.js";

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

switch (command) {
  case "install": {
    const workflowId = args[1]?.toLowerCase();
    if (!workflowId) {
      console.error(theme.textError("  Missing workflow ID. Usage: ff install <workflow>"));
      console.error(theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`));
      process.exit(1);
    }
    const { runInstallCLI } = await import("./commands/install.js");
    await runInstallCLI([workflowId, ...args.slice(2)]).catch(fatal);
    break;
  }

  case "update": {
    const workflowId = args[1]?.toLowerCase();
    if (!workflowId) {
      console.error(theme.textError("  Missing workflow ID. Usage: ff update <workflow>"));
      console.error(theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`));
      process.exit(1);
    }
    const { runUpdateCLI } = await import("./commands/update.js");
    await runUpdateCLI([workflowId, ...args.slice(2)]).catch(fatal);
    break;
  }

  case "verify": {
    const { runVerifyCLI } = await import("./commands/verify.js");
    await runVerifyCLI(args.slice(1)).catch(fatal);
    break;
  }

  case "mcp-setup":
  case "mcp": {
    const workflowId = args[1]?.toLowerCase();
    if (!workflowId) {
      console.error(theme.textError("  Missing workflow ID. Usage: ff mcp <workflow>"));
      console.error(theme.hint(`  Available: ${getAllWorkflows().filter((w) => w.features.includes("mcp")).map((w) => w.id).join(", ")}`));
      process.exit(1);
    }
    const { runMcpSetupCLI } = await import("./commands/mcp-setup.js");
    await runMcpSetupCLI([workflowId, ...args.slice(2)]).catch(fatal);
    break;
  }

  case "workflows":
  case "list":
    printWorkflows();
    break;

  case "version":
  case "--version":
  case "-v":
    console.log(`Fluid Flow CLI v${getVersion()}`);
    break;

  case "help":
  case "--help":
  case "-h":
    printHelp();
    break;

  case undefined:
    await runInteractiveMenu().catch(fatal);
    break;

  default:
    // Check if the command is a workflow ID (e.g. ff dev)
    try {
      const workflow = requireWorkflow(command);
      await showWorkflowMenu(workflow);
    } catch {
      console.error(theme.textError(`  Unknown command: ${command}`));
      console.error(theme.hint("  Run 'ff --help' for available commands."));
      process.exit(1);
    }
}

// -- Interactive menu ---------------------------------------------------------

async function runInteractiveMenu(): Promise<void> {
  process.stdout.write("\x1B[2J\x1B[H");
  console.log(renderWelcome(process.cwd()));

  let running = true;

  while (running) {
    // Build dynamic menu items from the workflow registry
    const workflows = getAllWorkflows();
    const items = workflows.map((w) => ({
      key: w.id,
      label: w.name,
      description: w.description,
    }));

    // Add utility items
    items.push({
      key: "status",
      label: "Status",
      description: "Check all installed workflows",
    });

    items.push({
      key: "exit",
      label: "Exit",
      description: "Quit Fluid Flow CLI",
    });

    const action = await promptMenu(items, {
      title: "Main Menu",
      prompt: "Select a workflow or action",
    });

    if (action.key === "exit") {
      console.log();
      console.log(theme.brandDim("  ~~~ until next flow ~~~"));
      console.log();
      running = false;
    } else if (action.key === "status") {
      handleGlobalStatus();
    } else {
      // It's a workflow - show its sub-menu
      const workflow = requireWorkflow(action.key);
      await showWorkflowMenu(workflow);
    }
  }
}

// -- Global status ------------------------------------------------------------

function handleGlobalStatus(): void {
  const cwd = process.cwd();
  const workflows = getAllWorkflows();
  const installedIds = getInstalledWorkflowIds(cwd);

  const lines: string[] = [
    "",
    theme.brandBold("  Installation Status"),
    "",
    `  ${theme.textSecondary("Directory:")}  ${theme.path(shortenPath(cwd))}`,
    "",
  ];

  if (installedIds.length === 0) {
    lines.push(`  ${theme.textSecondary("No workflows installed.")}`);
    lines.push("");
    lines.push(`  ${theme.hint("Select a workflow from the main menu to install.")}`);
  } else {
    for (const wf of workflows) {
      const entry = readWorkflowManifest(cwd, wf.id);
      if (entry) {
        const platformLabel =
          entry.platform === "both"
            ? "Cursor + Copilot"
            : entry.platform === "cursor"
              ? "Cursor"
              : "Copilot";
        lines.push(
          `  ${theme.textSuccess("\u2713")} ${theme.text(wf.name)}` +
          `  ${theme.textSecondary(platformLabel)}` +
          `  ${theme.textMuted(entry.commitSha.slice(0, 8))}`
        );
      } else {
        lines.push(
          `  ${theme.textMuted("\u2500")} ${theme.textMuted(wf.name)}` +
          `  ${theme.textMuted("not installed")}`
        );
      }
    }
  }

  lines.push("");

  console.log();
  console.log(renderBox(lines, { title: "Status", minWidth: 55 }));
  console.log();
}

// -- Help ---------------------------------------------------------------------

function printWorkflows(): void {
  const workflows = getAllWorkflows();
  const cwd = process.cwd();
  const installedIds = getInstalledWorkflowIds(cwd);

  console.log();
  console.log(theme.brandBold("  Available Workflows"));
  console.log();

  for (const wf of workflows) {
    const installed = installedIds.includes(wf.id);
    const status = installed
      ? theme.textSuccess("installed")
      : theme.textMuted("not installed");
    console.log(
      `  ${theme.command(wf.id.padEnd(12))} ${theme.text(wf.name.padEnd(28))} ${status}`
    );
    console.log(
      `  ${" ".repeat(12)} ${theme.textSecondary(wf.description)}`
    );
    console.log();
  }
}

function printHelp(): void {
  const workflows = getAllWorkflows();

  console.log();
  console.log(
    theme.brandBold("  Fluid Flow CLI") +
      theme.textSecondary(` v${getVersion()}`)
  );
  console.log(
    theme.textSecondary("  Multi-workflow orchestration tool")
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff [command] [workflow] [options]"));
  console.log();
  console.log(theme.text("  Commands:"));
  console.log(
    `    ${theme.command("install <workflow>")}   ${theme.textSecondary("Install a workflow into a repository")}`
  );
  console.log(
    `    ${theme.command("update <workflow>")}    ${theme.textSecondary("Update a workflow to the latest version")}`
  );
  console.log(
    `    ${theme.command("verify")}              ${theme.textSecondary("Check for upstream changes")}`
  );
  console.log(
    `    ${theme.command("mcp <workflow>")}       ${theme.textSecondary("Configure MCP servers for a workflow")}`
  );
  console.log(
    `    ${theme.command("workflows")}            ${theme.textSecondary("List all available workflows")}`
  );
  console.log(
    `    ${theme.command("<workflow>")}            ${theme.textSecondary("Open a workflow's sub-menu (e.g. ff dev)")}`
  );
  console.log(
    `    ${theme.command("version")}              ${theme.textSecondary("Show CLI version")}`
  );
  console.log(
    `    ${theme.command("help")}                 ${theme.textSecondary("Show this help message")}`
  );
  console.log();
  console.log(theme.text("  Available workflows:"));
  for (const wf of workflows) {
    console.log(
      `    ${theme.command(wf.id.padEnd(12))} ${theme.textSecondary(wf.name)}`
    );
  }
  console.log();
  console.log(theme.text("  Interactive mode:"));
  console.log(
    theme.textSecondary("    ff              Launch the interactive menu")
  );
  console.log();
  console.log(theme.text("  Examples:"));
  console.log(
    theme.textSecondary("    ff                                  # Interactive menu")
  );
  console.log(
    theme.textSecondary("    ff dev                              # Open dev workflow menu")
  );
  console.log(
    theme.textSecondary("    ff install dev                      # Install dev workflow")
  );
  console.log(
    theme.textSecondary("    ff update dev                       # Update dev workflow")
  );
  console.log(
    theme.textSecondary("    ff mcp dev                          # Setup MCP servers")
  );
  console.log(
    theme.textSecondary("    ff workflows                        # List all workflows")
  );
  console.log();
}

// -- Error handling -----------------------------------------------------------

function fatal(err: unknown): never {
  console.error("Fatal error:", err);
  process.exit(1);
}
