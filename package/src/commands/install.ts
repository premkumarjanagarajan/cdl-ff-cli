/**
 * Install Command
 *
 * CLI handler for: ff install <workflow> [target-dir] [--force]
 *
 * Always installs entry points for both Cursor and VS Code (GitHub Copilot).
 * The first positional argument is the workflow ID (e.g. "dev").
 */

import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import { requireWorkflow, getAllWorkflows } from "../workflows/registry.js";
import { cloneSource, fetchBranches, getRepoInfo } from "../installer/github-source.js";
import { promptBranch, promptConfirm, promptMultiSelect } from "../ui/menu.js";
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
import { registerWorkflowInstall } from "../modules/registration.js";
import { discoverAddons, filterAddonsById, validateAddonIds } from "../modules/addon-discovery.js";
import { installAllAddonRules } from "../modules/addon-installer.js";
import type { DiscoveredAddon } from "../workflows/types.js";

// -- CLI entry point ----------------------------------------------------------

/**
 * Run the install command from CLI arguments.
 * Usage: ff install <workflow> [target-dir] [--force]
 *
 * Always installs for both Cursor IDE and VS Code (GitHub Copilot).
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
  let force = false;
  let addonIds: string[] | undefined;

  // Parse remaining arguments
  for (let i = 0; i < restArgs.length; i++) {
    const arg = restArgs[i]!;
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--addons" || arg === "-a") {
      const nextArg = restArgs[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        addonIds = nextArg.split(",").map((s) => s.trim()).filter(Boolean);
        i++;
      }
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
        `  Commit: ${entry?.commitSha?.slice(0, 8)}`
      )
    );
    console.log(
      theme.hint(`  Use 'ff update ${config.id}' to update, or 'ff install ${config.id} --force' to reinstall.`)
    );
    console.log();
    process.exit(0);
  }

  // Branch selection
  const repo = getRepoInfo(config.source);
  let branch = config.source.branch;
  console.log();
  const useDefault = await promptConfirm("Would you like to install the default Fluid Flow?");
  if (!useDefault) {
    const branches = fetchBranches(config.source);
    if (branches.length > 0) {
      branch = await promptBranch(branches, { defaultBranch: config.source.branch });
    } else {
      console.log();
      console.log(theme.textWarning("  Could not fetch branch list. Using default branch."));
    }
  }

  // Show install plan
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold(`  Installing ${config.name}`),
        "",
        `  ${theme.textSecondary("Source:")}    ${theme.path(repo.fullName)}`,
        `  ${theme.textSecondary("Branch:")}    ${theme.highlight(branch)}`,
        `  ${theme.textSecondary("Target:")}    ${theme.path(targetDir)}`,
        `  ${theme.textSecondary("Platforms:")} ${theme.highlight("Cursor IDE + GitHub Copilot")}`,
        "",
      ],
      { title: "Install Plan", minWidth: 55 }
    )
  );
  console.log();

  // Execute install
  try {
    console.log(`  ${theme.brandBright("\u2192")} ${theme.text("Downloading latest from GitHub...")}`);
    const source = await cloneSource(branch, config.source);

    try {
      const fileResult = await installFiles(config, targetDir, source.localPath);
      const entryResult = await installEntryPoint(config, targetDir, source.localPath);

      // Addon discovery and selection
      const availableAddons = discoverAddons(source.localPath);
      let selectedAddons: DiscoveredAddon[] = [];

      if (availableAddons.length > 0) {
        if (addonIds) {
          const { valid, invalid } = validateAddonIds(availableAddons, addonIds);
          if (invalid.length > 0) {
            console.log(theme.textWarning(`  Unknown addons: ${invalid.join(", ")}`));
            console.log(theme.hint(`  Available: ${availableAddons.map((a) => a.manifest.id).join(", ")}`));
          }
          selectedAddons = filterAddonsById(availableAddons, valid);
        } else {
          console.log();
          console.log(theme.text("  Domain-specific addons are available for this workflow."));
          const addonItems = availableAddons.map((a) => ({
            key: a.manifest.id,
            label: a.manifest.name,
            description: a.manifest.description,
          }));
          const selected = await promptMultiSelect(addonItems, {
            title: "Available Addons",
            prompt: "Select addons to install",
          });
          selectedAddons = filterAddonsById(availableAddons, selected.map((s) => s.key));
        }

        if (selectedAddons.length > 0) {
          console.log();
          console.log(theme.textSecondary(`  Addons: ${selectedAddons.map((a) => a.manifest.name).join(", ")}`));
        }
      }

      // Install addon rules
      let addonInstalledPaths: string[] = [];
      let addonFilesCopied = 0;
      if (selectedAddons.length > 0) {
        const addonResults = await installAllAddonRules(selectedAddons, targetDir);
        for (const r of addonResults) {
          addonInstalledPaths.push(...r.installedPaths);
          addonFilesCopied += r.filesCopied;
        }
      }

      const installedPaths = [...fileResult.installedPaths, ...entryResult.installedPaths, ...addonInstalledPaths];
      const totalFiles = fileResult.filesCopied + entryResult.filesCopied + addonFilesCopied;

      // Write manifest
      const manifestEntry = createManifestEntry({
        platform: "both",
        commitSha: source.commitSha,
        branch: source.branch,
        sourceRepo: repo.fullName,
        installedPaths,
        addons: selectedAddons.map((a) => a.manifest.id),
      });
      writeWorkflowManifest(targetDir, config.id, manifestEntry);
      registerWorkflowInstall(config.id, config.name, targetDir, source.commitSha);

      printInstallSuccess(config, totalFiles, source.commitSha);

      // Offer MCP setup after successful install
      if (config.features.includes("mcp") && config.mcp) {
        const { setupWorkflowMcp } = await import("../modules/mcp-installer.js");

        console.log(theme.brandBright("  \u2500\u2500\u2500 MCP Server Configuration \u2500\u2500\u2500"));
        console.log();
        console.log(theme.text("  Would you also like to configure MCP servers?"));
        console.log(theme.textSecondary("  MCP will be configured for both Cursor and VS Code."));
        console.log();

        const wantsMcp = await promptConfirm("Configure MCP servers?");
        if (wantsMcp) {
          const result = await setupWorkflowMcp(config, { target: "both", targetDir });
          console.log();
          console.log(`  ${theme.textSuccess("\u2713")} MCP: ${result.serversAdded} servers added to both platforms.`);
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

// -- Output helpers -----------------------------------------------------------

function printInstallSuccess(
  config: import("../workflows/types.js").WorkflowConfig,
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
  console.log(`  ${theme.textSecondary("Platforms:")}     ${theme.text("Cursor IDE + GitHub Copilot")}`);
  console.log();

  console.log(theme.hint("  Next steps:"));
  console.log(theme.textSecondary("  1. Open this project in Cursor \u2014 the workflow rule activates automatically"));
  console.log(theme.textSecondary("  2. In VS Code, GitHub Copilot loads the instructions automatically"));
  console.log(theme.textSecondary("  3. Make a development request in either IDE to trigger the workflow"));

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
  console.log(theme.text("  Installs entry points for both Cursor IDE and VS Code (GitHub Copilot)."));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(`    ${theme.command("--force, -f")}    ${theme.textSecondary("Reinstall even if already installed")}`);
  console.log(`    ${theme.command("--addons, -a")}   ${theme.textSecondary("Comma-separated addon IDs (e.g., --addons betting,compliance)")}`);
  console.log(`    ${theme.command("--help, -h")}     ${theme.textSecondary("Show this help")}`);
  console.log();
}
