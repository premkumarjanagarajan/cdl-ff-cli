/**
 * MCP Setup Command
 *
 * CLI handler for: ff mcp <workflow> [target-dir] [--force]
 *
 * Always configures MCP servers for both Cursor and VS Code.
 * The first positional argument is the workflow ID (e.g. "dev").
 * Loads MCP server definitions from the workflow's JSON config file.
 */

import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import { promptConfirm } from "../ui/menu.js";
import { requireWorkflow, getAllWorkflows } from "../workflows/registry.js";
import {
  setupWorkflowMcp,
  analyzeAllWorkflowTargets,
  loadMcpServers,
  type ConfigAnalysis,
} from "../modules/mcp-installer.js";
import { isDirectory } from "../installer/file-ops.js";
import type { McpTarget, McpSetupResult, WorkflowConfig } from "../workflows/types.js";

// -- CLI entry point ----------------------------------------------------------

/**
 * Run the mcp-setup command from CLI arguments.
 * Usage: ff mcp <workflow> [target-dir] [--force]
 *
 * Always configures both Cursor and VS Code MCP servers.
 * The first element of args is the workflow ID.
 */
export async function runMcpSetupCLI(args: string[]): Promise<void> {
  const workflowId = args[0];

  if (!workflowId || workflowId.startsWith("-")) {
    console.error(theme.textError("  Missing workflow ID."));
    console.error(theme.hint(`  Usage: ff mcp <workflow> [options]`));
    console.error(
      theme.hint(
        `  Available: ${getAllWorkflows().filter((w) => w.features.includes("mcp")).map((w) => w.id).join(", ")}`
      )
    );
    process.exit(1);
  }

  let config;
  try {
    config = requireWorkflow(workflowId);
  } catch {
    console.error(theme.textError(`  Unknown workflow: "${workflowId}"`));
    console.error(theme.hint(`  Available: ${getAllWorkflows().filter((w) => w.features.includes("mcp")).map((w) => w.id).join(", ")}`));
    process.exit(1);
  }

  if (!config.mcp) {
    console.error(theme.textError(`  ${config.name} does not have MCP configuration.`));
    process.exit(1);
  }

  const restArgs = args.slice(1);

  let targetDir: string | undefined;
  let force = false;

  for (let i = 0; i < restArgs.length; i++) {
    const arg = restArgs[i]!;
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      printMcpSetupHelp(config);
      return;
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    }
  }

  targetDir = targetDir ? path.resolve(targetDir) : process.cwd();

  if (!isDirectory(targetDir)) {
    console.error(theme.textError(`  Target directory does not exist: ${targetDir}`));
    process.exit(1);
  }

  const target: McpTarget = "both";

  // Analyze and confirm
  const confirmed = await analyzeAndConfirm(config, targetDir, target, force);
  if (!confirmed) return;

  try {
    const result = await setupWorkflowMcp(config, { target, targetDir, force });
    printMcpSetupSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
    process.exit(1);
  }
}

// -- Shared: post-install MCP setup -------------------------------------------

/**
 * Offer MCP setup after a successful install.
 * Called from install command handlers.
 * Always configures both Cursor and VS Code.
 */
export async function offerMcpSetupAfterInstall(
  config: WorkflowConfig,
  targetDir: string
): Promise<void> {
  if (!config.mcp) return;

  console.log(theme.brandBright("  \u2500\u2500\u2500 MCP Server Configuration \u2500\u2500\u2500"));
  console.log();
  console.log(theme.text("  Would you also like to configure MCP servers for this project?"));
  console.log(theme.textSecondary("  This sets up Atlassian, GitHub, filesystem, and other MCP tools."));
  console.log(theme.textSecondary("  MCP will be configured for both Cursor and VS Code."));
  console.log();

  const wantsMcp = await promptConfirm("Configure MCP servers?");

  if (!wantsMcp) {
    console.log();
    console.log(theme.hint(`  You can configure MCP servers later with: ff mcp ${config.id}`));
    console.log();
    return;
  }

  const target: McpTarget = "both";
  const confirmed = await analyzeAndConfirm(config, targetDir, target, false);
  if (!confirmed) return;

  try {
    const result = await setupWorkflowMcp(config, { target, targetDir });
    printMcpSetupSuccess(result);
  } catch (err) {
    console.log();
    console.error(theme.textError(`  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`));
    console.log(theme.hint(`  You can retry with: ff mcp ${config.id}`));
    console.log();
  }
}

// -- Analysis & Confirmation --------------------------------------------------

async function analyzeAndConfirm(
  config: WorkflowConfig,
  targetDir: string,
  target: McpTarget,
  force: boolean
): Promise<boolean> {
  const analyses = analyzeAllWorkflowTargets(config, targetDir, target);
  const allFullyConfigured = analyses.every((a) => a.newServerNames.length === 0);

  if (allFullyConfigured && !force) {
    console.log();
    console.log(`  ${theme.textSuccess("\u2713")} ${theme.text("All MCP servers are already configured.")}`);
    for (const a of analyses) {
      console.log(`    ${theme.path(a.relativePath)}: ${theme.textSecondary(`${a.alreadyConfiguredNames.length} servers`)}`);
    }
    console.log();
    console.log(theme.hint("  Use --force to overwrite existing server entries."));
    console.log();
    return false;
  }

  let needsConfirmation = false;

  for (const analysis of analyses) {
    displayConfigAnalysis(analysis, force);
    if (analysis.hasExistingConfig && analysis.newServerNames.length > 0) {
      needsConfirmation = true;
    }
  }

  if (needsConfirmation && !force) {
    console.log();
    const proceed = await promptConfirm("Add the new entries shown above?");
    if (!proceed) {
      console.log();
      console.log(theme.textSecondary("  MCP setup cancelled."));
      console.log();
      return false;
    }
  }

  return true;
}

function displayConfigAnalysis(analysis: ConfigAnalysis, force: boolean): void {
  const platformLabel = analysis.platform === "cursor" ? "Cursor" : "VS Code / Copilot";
  console.log();

  if (!analysis.hasExistingConfig) {
    console.log(`  ${theme.brandBright("\u2192")} ${theme.text(`${platformLabel}:`)} ${theme.path(analysis.relativePath)}`);
    console.log(`    ${theme.textSecondary("No existing config \u2014 will create fresh with")} ${theme.text(String(analysis.newServerNames.length))} ${theme.textSecondary("servers")}`);
    return;
  }

  console.log(`  ${theme.textWarning("\u26a0")} ${theme.text(`Existing MCP configuration found for ${platformLabel}`)}`);
  console.log(`    ${theme.textSecondary("File:")} ${theme.path(analysis.relativePath)}`);
  console.log(`    ${theme.textSecondary("Existing servers:")} ${theme.text(analysis.existingServerNames.join(", ") || "none")}`);

  if (analysis.userCustomServers.length > 0) {
    console.log(`    ${theme.textSecondary("User-defined (preserved):")} ${theme.text(analysis.userCustomServers.join(", "))}`);
  }

  if (analysis.alreadyConfiguredNames.length > 0) {
    console.log(
      `    ${theme.textSecondary("Already configured:")} ${theme.textSuccess(analysis.alreadyConfiguredNames.join(", "))}${force ? theme.textWarning(" (will be overwritten with --force)") : ""}`
    );
  }

  if (analysis.newServerNames.length > 0) {
    console.log(`    ${theme.textSecondary("New servers to add:")} ${theme.highlight(analysis.newServerNames.join(", "))}`);
  } else if (!force) {
    console.log(`    ${theme.textSuccess("\u2713")} ${theme.textSecondary("All servers already configured")}`);
  }
}

// -- Output helpers -----------------------------------------------------------

function formatTarget(target: McpTarget): string {
  switch (target) {
    case "cursor": return "Cursor";
    case "copilot": return "VS Code / GitHub Copilot";
    case "both": return "Both (Cursor + VS Code / Copilot)";
  }
}

function printMcpSetupSuccess(result: McpSetupResult): void {
  console.log();
  console.log(`  ${theme.textSuccess("\u2713")} ${theme.brandBold("MCP servers configured successfully!")}`);
  console.log();
  console.log(`  ${theme.textSecondary("Platform:")}    ${theme.text(formatTarget(result.target))}`);
  console.log(`  ${theme.textSecondary("Added:")}       ${theme.text(String(result.serversAdded))} servers`);

  if (result.serversSkipped > 0) {
    console.log(`  ${theme.textSecondary("Skipped:")}     ${theme.text(String(result.serversSkipped))} (already configured)`);
  }

  console.log(`  ${theme.textSecondary("Files:")}       ${theme.text(result.filesWritten.join(", "))}`);

  if (result.prerequisitesMissing.length > 0) {
    console.log();
    console.log(theme.textWarning(`  \u26a0 Missing prerequisites: ${result.prerequisitesMissing.join(", ")}`));
  }

  console.log();
}

function printMcpSetupHelp(config: WorkflowConfig): void {
  console.log();
  console.log(
    theme.brandBold(`  ff mcp ${config.id}`) +
    theme.textSecondary(` \u2014 Configure MCP servers for ${config.name}`)
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary(`    ff mcp ${config.id} [target-dir] [options]`));
  console.log();
  console.log(theme.text("  Always configures MCP for both Cursor (.cursor/mcp.json) and VS Code (.vscode/mcp.json)."));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(`    ${theme.command("--force, -f")}  ${theme.textSecondary("Overwrite existing entries")}`);
  console.log(`    ${theme.command("--help, -h")}   ${theme.textSecondary("Show this help")}`);
  console.log();

  if (config.mcp) {
    try {
      const servers = loadMcpServers(config);
      console.log(theme.text("  MCP servers included:"));
      for (const [name, def] of Object.entries(servers)) {
        const status = def.disabled ? theme.textMuted("disabled") : theme.textSuccess("enabled");
        const runtime = def.command === "uvx" ? "Python/uv" : "Node.js";
        console.log(`    ${theme.command(name.padEnd(24))} ${status}   ${theme.textSecondary(runtime)}`);
      }
      console.log();
    } catch {
      // Config file not readable, skip
    }
  }
}
