/**
 * Install Command
 *
 * CLI handler for: ff install <workflow> [target-dir] [--target cursor|copilot] [--force]
 *
 * The first positional argument is the workflow ID (e.g. "dev").
 */

import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import { requireWorkflow, getAllWorkflows } from "../workflows/registry.js";
import { cloneSource, getRepoInfo } from "../installer/github-source.js";
import { isDirectory } from "../installer/file-ops.js";
import { installFiles } from "../modules/file-installer.js";
import { installEntryPoint } from "../modules/entry-point.js";
import {
  isWorkflowInstalled,
  readWorkflowManifest,
  writeWorkflowManifest,
  createManifestEntry,
  getManifestFileName,
} from "../modules/manifest.js";
import type { Platform } from "../workflows/types.js";

// -- CLI entry point ----------------------------------------------------------

/**
 * Run the install command from CLI arguments.
 * Usage: ff install <workflow> [target-dir] [--target cursor|copilot] [--force]
 *
 * The first element of args is the workflow ID.
 */
export async function runInstallCLI(args: string[]): Promise<void> {
  // First arg is the workflow ID (required, already validated by index.ts)
  const workflowId = args[0];

  if (!workflowId || workflowId.startsWith("-")) {
    console.error(theme.textError("  Missing workflow ID."));
    console.error(theme.hint(`  Usage: ff install <workflow> [options]`));
    console.error(
      theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`)
    );
    process.exit(1);
  }

  let config;
  try {
    config = requireWorkflow(workflowId);
  } catch {
    console.error(theme.textError(`  Unknown workflow: "${workflowId}"`));
    console.error(theme.hint(`  Available: ${getAllWorkflows().map((w) => w.id).join(", ")}`));
    process.exit(1);
  }
  const restArgs = args.slice(1);

  let targetDir: string | undefined;
  let platform: Platform | undefined;
  let force = false;

  // Parse remaining arguments
  for (let i = 0; i < restArgs.length; i++) {
    const arg = restArgs[i]!;
    if ((arg === "--target" || arg === "-t") && restArgs[i + 1]) {
      const value = restArgs[++i]!.toLowerCase();
      if (value === "cursor" || value === "copilot") {
        platform = value;
      } else {
        console.error(
          theme.textError(`  Invalid target: "${value}". Use "cursor" or "copilot".`)
        );
        process.exit(1);
      }
    } else if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      printInstallHelp(config.id);
      return;
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    }
  }

  // Resolve target directory
  targetDir = targetDir ? path.resolve(targetDir) : process.cwd();

  if (!isDirectory(targetDir)) {
    console.error(
      theme.textError(`  Target directory does not exist: ${targetDir}`)
    );
    process.exit(1);
  }

  // Check if already installed
  if (!force && isWorkflowInstalled(targetDir, config.id)) {
    const entry = readWorkflowManifest(targetDir, config.id);
    console.log();
    console.log(
      theme.textWarning(`  ${config.name} is already installed in this directory.`)
    );
    console.log(
      theme.textSecondary(
        `  Platform: ${entry?.platform}  |  Commit: ${entry?.commitSha?.slice(0, 8)}`
      )
    );
    console.log(
      theme.hint(`  Use 'ff update ${config.id}' to update, or 'ff install ${config.id} --force' to reinstall.`)
    );
    console.log();
    process.exit(0);
  }

  // Prompt for platform if not specified
  if (!platform) {
    platform = await promptPlatform();
  }

  // Show install plan
  const repo = getRepoInfo(config.source);
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold(`  Installing ${config.name}`),
        "",
        `  ${theme.textSecondary("Source:")}   ${theme.path(repo.fullName)}`,
        `  ${theme.textSecondary("Target:")}   ${theme.path(targetDir)}`,
        `  ${theme.textSecondary("Platform:")} ${theme.highlight(platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`,
        "",
      ],
      { title: "Install Plan", minWidth: 55 }
    )
  );
  console.log();

  // Execute install
  try {
    console.log(`  ${theme.brandBright("\u2192")} ${theme.text("Downloading latest from GitHub...")}`);
    const source = await cloneSource(config.source.branch, config.source);

    try {
      const fileResult = await installFiles(config, targetDir, source.localPath);
      const entryResult = await installEntryPoint(config, platform, targetDir, source.localPath);

      const installedPaths = [...fileResult.installedPaths, ...entryResult.installedPaths];
      const totalFiles = fileResult.filesCopied + entryResult.filesCopied;

      // Write manifest
      const manifestEntry = createManifestEntry({
        platform,
        commitSha: source.commitSha,
        branch: source.branch,
        sourceRepo: repo.fullName,
        installedPaths,
      });
      writeWorkflowManifest(targetDir, config.id, manifestEntry);

      printInstallSuccess(config, platform, totalFiles, source.commitSha);

      // Offer MCP setup after successful install
      if (config.features.includes("mcp") && config.mcp) {
        const { setupWorkflowMcp } = await import("../modules/mcp-installer.js");
        const { promptConfirm } = await import("../ui/menu.js");

        console.log(theme.brandBright("  \u2500\u2500\u2500 MCP Server Configuration \u2500\u2500\u2500"));
        console.log();
        console.log(theme.text("  Would you also like to configure MCP servers?"));
        console.log();

        const wantsMcp = await promptConfirm("Configure MCP servers?");
        if (wantsMcp) {
          const mcpPlatform = await promptMcpPlatform();
          const result = await setupWorkflowMcp(config, { target: mcpPlatform, targetDir });
          console.log();
          console.log(`  ${theme.textSuccess("\u2713")} MCP: ${result.serversAdded} servers added.`);
          console.log();
        }
      }
    } finally {
      source.cleanup();
    }
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  Installation failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
    process.exit(1);
  }
}

// -- Interactive prompts ------------------------------------------------------

import readline from "node:readline";
import type { McpTarget } from "../workflows/types.js";

async function promptPlatform(): Promise<Platform> {
  console.log();
  console.log(theme.brandBold("  Choose your target platform:"));
  console.log();
  console.log(
    `  ${theme.highlight("1")}  ${theme.text("Cursor IDE")}     ${theme.textSecondary("\u2014 installs .cursor/rules/workflow.mdc")}`
  );
  console.log(
    `  ${theme.highlight("2")}  ${theme.text("GitHub Copilot")} ${theme.textSecondary("\u2014 installs .github/copilot-instructions.md")}`
  );
  console.log();

  return new Promise<Platform>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const ask = () => {
      rl.question(
        theme.prompt("  Select (1 or 2): ") + " ",
        (answer) => {
          const trimmed = answer.trim().toLowerCase();
          if (trimmed === "1" || trimmed === "cursor") {
            rl.close();
            resolve("cursor");
          } else if (trimmed === "2" || trimmed === "copilot") {
            rl.close();
            resolve("copilot");
          } else {
            console.log(theme.textWarning("  Please enter 1 (Cursor) or 2 (Copilot)."));
            ask();
          }
        }
      );
    };
    ask();
  });
}

async function promptMcpPlatform(): Promise<McpTarget> {
  console.log();
  console.log(theme.brandBold("  MCP target platform:"));
  console.log(`  ${theme.highlight("1")}  Cursor`);
  console.log(`  ${theme.highlight("2")}  VS Code / Copilot`);
  console.log(`  ${theme.highlight("3")}  Both`);
  console.log();

  return new Promise<McpTarget>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin, output: process.stdout, terminal: true,
    });
    const ask = () => {
      rl.question(theme.prompt("  Select (1-3): ") + " ", (answer) => {
        const t = answer.trim();
        if (t === "1") { rl.close(); resolve("cursor"); }
        else if (t === "2") { rl.close(); resolve("copilot"); }
        else if (t === "3") { rl.close(); resolve("both"); }
        else { console.log(theme.textWarning("  Please enter 1, 2, or 3.")); ask(); }
      });
    };
    ask();
  });
}

// -- Output helpers -----------------------------------------------------------

function printInstallSuccess(
  config: import("../workflows/types.js").WorkflowConfig,
  platform: Platform,
  filesCopied: number,
  commitSha: string
): void {
  console.log();
  console.log(
    `  ${theme.textSuccess("\u2713")} ${theme.brandBold(`${config.name} installed successfully!`)}`
  );
  console.log();
  console.log(`  ${theme.textSecondary("Files copied:")}  ${theme.text(String(filesCopied))}`);
  console.log(`  ${theme.textSecondary("Commit:")}        ${theme.text(commitSha.slice(0, 8))}`);
  console.log(`  ${theme.textSecondary("Platform:")}      ${theme.text(platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`);
  console.log();

  if (platform === "cursor") {
    console.log(theme.hint("  Next steps:"));
    console.log(theme.textSecondary("  1. Open this project in Cursor \u2014 the workflow rule activates automatically"));
    console.log(theme.textSecondary("  2. Make a development request in chat to trigger the workflow"));
  } else {
    console.log(theme.hint("  Next steps:"));
    console.log(theme.textSecondary("  1. The instructions are loaded automatically by GitHub Copilot"));
    console.log(theme.textSecondary("  2. Make a development request in Copilot Chat to trigger the workflow"));
  }

  console.log();
  console.log(
    theme.hint(`  Tip: Add '${getManifestFileName()}' to your .gitignore if you don't want to track it.`)
  );
  console.log();
}

function printInstallHelp(workflowId: string): void {
  console.log();
  console.log(
    theme.brandBold(`  ff install ${workflowId}`) +
    theme.textSecondary(` \u2014 Install the ${workflowId} workflow`)
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary(`    ff install ${workflowId} [target-dir] [options]`));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(`    ${theme.command("--target, -t")} ${theme.textSecondary("<cursor|copilot>")}  Target platform`);
  console.log(`    ${theme.command("--force, -f")}                      ${theme.textSecondary("Reinstall even if already installed")}`);
  console.log(`    ${theme.command("--help, -h")}                       ${theme.textSecondary("Show this help")}`);
  console.log();
}
