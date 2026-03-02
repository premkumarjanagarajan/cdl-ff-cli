/**
 * Update Command
 *
 * CLI handler for: ff update <workflow> [target-dir] [--force] [--check]
 *
 * The first positional argument is the workflow ID (e.g. "dev").
 */

import path from "node:path";
import { theme } from "../ui/theme.js";
import { requireWorkflow, getAllWorkflows } from "../workflows/registry.js";
import { cloneSource, getRemoteHeadSha, getRepoInfo } from "../installer/github-source.js";
import { isDirectory } from "../installer/file-ops.js";
import { updateFiles } from "../modules/file-installer.js";
import { installEntryPoint } from "../modules/entry-point.js";
import {
  readWorkflowManifest,
  writeWorkflowManifest,
  updateManifestEntry,
} from "../modules/manifest.js";
import { registerWorkflowUpdate } from "../modules/registration.js";

// -- CLI entry point ----------------------------------------------------------

/**
 * Run the update command from CLI arguments.
 * Usage: ff update <workflow> [target-dir] [--force] [--check]
 *
 * The first element of args is the workflow ID.
 */
export async function runUpdateCLI(args: string[]): Promise<void> {
  const workflowId = args[0];

  if (!workflowId || workflowId.startsWith("-")) {
    console.error(theme.textError("  Missing workflow ID."));
    console.error(theme.hint(`  Usage: ff update <workflow> [options]`));
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
  let checkOnly = false;

  for (let i = 0; i < restArgs.length; i++) {
    const arg = restArgs[i]!;
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--check" || arg === "-c") {
      checkOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      printUpdateHelp(config.id);
      return;
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    }
  }

  targetDir = targetDir ? path.resolve(targetDir) : process.cwd();

  if (!isDirectory(targetDir)) {
    console.error(theme.textError(`  Directory does not exist: ${targetDir}`));
    process.exit(1);
  }

  const entry = readWorkflowManifest(targetDir, config.id);

  if (!entry) {
    console.log();
    console.log(theme.textWarning(`  ${config.name} is not installed in this directory.`));
    console.log(theme.hint(`  Run 'ff install ${config.id}' first.`));
    console.log();
    process.exit(1);
  }

  // Check-only mode
  if (checkOnly) {
    const latestSha = getRemoteHeadSha(entry.branch, config.source);

    console.log();
    console.log(`  ${theme.textSecondary("Current:")}    ${theme.text(entry.commitSha.slice(0, 8))}`);
    console.log(`  ${theme.textSecondary("Latest:")}     ${theme.text(latestSha?.slice(0, 8) ?? "unknown")}`);

    if (latestSha && latestSha !== entry.commitSha) {
      console.log();
      console.log(`  ${theme.textSuccess("\u2713")} ${theme.brandBold("Update available!")} Run 'ff update ${config.id}' to apply.`);
    } else {
      console.log();
      console.log(`  ${theme.textSuccess("\u2713")} ${theme.text("Already up to date.")}`);
    }
    console.log();
    return;
  }

  // Perform update
  const previousSha = entry.commitSha;

  console.log();
  console.log(`  ${theme.textSecondary("Current:")}  ${theme.text(previousSha.slice(0, 8))}`);
  console.log();

  // Check if update needed
  if (!force) {
    console.log(`  ${theme.brandBright("\u2192")} ${theme.text("Checking for updates...")}`);
    const latestSha = getRemoteHeadSha(entry.branch, config.source);
    if (latestSha && latestSha === previousSha) {
      console.log();
      console.log(`  ${theme.textSuccess("\u2713")} ${theme.text("Already up to date.")} (${previousSha.slice(0, 8)})`);
      console.log();
      return;
    }
  }

  try {
    console.log(`  ${theme.brandBright("\u2192")} ${theme.text("Downloading latest from GitHub...")}`);
    const source = await cloneSource(entry.branch, config.source);

    try {
      const fileResult = await updateFiles(config, targetDir, source.localPath);
      const entryResult = await installEntryPoint(config, targetDir, source.localPath);

      const installedPaths = [...fileResult.installedPaths, ...entryResult.installedPaths];
      const totalFiles = fileResult.filesCopied + entryResult.filesCopied;

      const updatedEntry = updateManifestEntry(entry, {
        commitSha: source.commitSha,
        branch: source.branch,
        installedPaths,
        platform: "both",
      });
      writeWorkflowManifest(targetDir, config.id, updatedEntry);
      registerWorkflowUpdate(config.id, config.name, targetDir, previousSha, source.commitSha);

      console.log();
      console.log(`  ${theme.textSuccess("\u2713")} ${theme.brandBold(`${config.name} updated successfully!`)}`);
      console.log();
      console.log(`  ${theme.textSecondary("Files updated:")} ${theme.text(String(totalFiles))}`);
      console.log(`  ${theme.textSecondary("Previous:")}      ${theme.text(previousSha.slice(0, 8))}`);
      console.log(`  ${theme.textSecondary("Current:")}       ${theme.text(source.commitSha.slice(0, 8))}`);
      console.log();
    } finally {
      source.cleanup();
    }
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  Update failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
    process.exit(1);
  }
}

// -- Output -------------------------------------------------------------------

function printUpdateHelp(workflowId: string): void {
  console.log();
  console.log(
    theme.brandBold(`  ff update ${workflowId}`) +
    theme.textSecondary(` \u2014 Update the ${workflowId} workflow`)
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary(`    ff update ${workflowId} [target-dir] [options]`));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(`    ${theme.command("--check, -c")}  ${theme.textSecondary("Check for updates without applying")}`);
  console.log(`    ${theme.command("--force, -f")}  ${theme.textSecondary("Force update even if up to date")}`);
  console.log(`    ${theme.command("--help, -h")}   ${theme.textSecondary("Show this help")}`);
  console.log();
}
