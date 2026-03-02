/**
 * Workflow Menu
 *
 * Per-workflow sub-menu that presents actions (install, update, verify, mcp)
 * for a specific workflow. Driven by WorkflowConfig.
 */

import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import { promptMenu, promptDirectory, promptConfirm } from "../ui/menu.js";
import { shortenPath } from "../utils/system.js";
import { isDirectory } from "../installer/file-ops.js";
import { cloneSource, getRepoInfo, getRemoteHeadSha, compareCommits, getRecentCommits } from "../installer/github-source.js";
import { installFiles, updateFiles } from "../modules/file-installer.js";
import { installEntryPoint } from "../modules/entry-point.js";
import {
  readWorkflowManifest,
  writeWorkflowManifest,
  createManifestEntry,
  updateManifestEntry,
  isWorkflowInstalled,
  getManifestFileName,
} from "../modules/manifest.js";
import { setupWorkflowMcp, analyzeAllWorkflowTargets, loadMcpServers } from "../modules/mcp-installer.js";
import { registerWorkflowInstall, registerWorkflowUpdate } from "../modules/registration.js";
import type { WorkflowConfig } from "../workflows/types.js";
import type { MenuItem } from "../ui/menu.js";

// -- Sub-menu -----------------------------------------------------------------

/**
 * Show the per-workflow sub-menu and handle selected actions.
 * Returns when the user selects "Back".
 */
export async function showWorkflowMenu(config: WorkflowConfig): Promise<void> {
  let running = true;

  while (running) {
    const items: MenuItem[] = [];

    if (config.features.includes("install")) {
      items.push({
        key: "install",
        label: "Install",
        description: `Install ${config.name}`,
      });
    }

    if (config.features.includes("update")) {
      items.push({
        key: "update",
        label: "Update",
        description: "Update to the latest version",
      });
    }

    if (config.features.includes("verify")) {
      items.push({
        key: "verify",
        label: "Verify",
        description: "Check GitHub for changes & show diff",
      });
    }

    if (config.features.includes("mcp")) {
      items.push({
        key: "mcp-setup",
        label: "MCP Setup",
        description: "Configure MCP servers",
      });
    }

    items.push({
      key: "status",
      label: "Status",
      description: "Check installation status",
    });

    items.push({
      key: "back",
      label: "Back",
      description: "Return to main menu",
    });

    const action = await promptMenu(items, {
      title: config.name,
      prompt: "Select an action",
    });

    switch (action.key) {
      case "install":
        await handleInstall(config);
        break;

      case "update":
        await handleUpdate(config);
        break;

      case "verify":
        await handleVerify(config);
        break;

      case "mcp-setup":
        await handleMcpSetup(config);
        break;

      case "status":
        handleStatus(config);
        break;

      case "back":
        running = false;
        break;
    }
  }
}

// -- Install ------------------------------------------------------------------

async function handleInstall(config: WorkflowConfig): Promise<void> {
  // Step 1: Choose target directory
  const cwd = process.cwd();
  console.log();
  const targetInput = await promptDirectory(shortenPath(cwd));
  const targetDir = targetInput === shortenPath(cwd) ? cwd : path.resolve(targetInput);

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(theme.textError(`  Directory does not exist: ${targetDir}`));
    console.log();
    return;
  }

  // Step 2: Check if already installed
  if (isWorkflowInstalled(targetDir, config.id)) {
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
      theme.hint("  Select 'Update' to update, or reinstall with the CLI: ff install " + config.id + " --force")
    );
    console.log();
    return;
  }

  // Step 3: Show install plan
  const repo = getRepoInfo(config.source);
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold(`  Installing ${config.name}`),
        "",
        `  ${theme.textSecondary("Source:")}    ${theme.path(repo.fullName)}`,
        `  ${theme.textSecondary("Target:")}    ${theme.path(shortenPath(targetDir))}`,
        `  ${theme.textSecondary("Platforms:")} ${theme.highlight("Cursor IDE + GitHub Copilot")}`,
        "",
      ],
      { title: "Install Plan", minWidth: 55 }
    )
  );
  console.log();

  // Step 4: Execute install
  try {
    console.log(`  ${theme.brandBright("\u2192")} ${theme.text("Downloading latest from GitHub...")}`);
    const source = await cloneSource(config.source.branch, config.source);

    try {
      // Copy workflow files
      const fileResult = await installFiles(config, targetDir, source.localPath);

      // Install entry points for both Cursor and Copilot
      const entryResult = await installEntryPoint(config, targetDir, source.localPath);

      // Combine installed paths
      const installedPaths = [...fileResult.installedPaths, ...entryResult.installedPaths];
      const totalFiles = fileResult.filesCopied + entryResult.filesCopied;

      // Write manifest
      const manifestEntry = createManifestEntry({
        platform: "both",
        commitSha: source.commitSha,
        branch: source.branch,
        sourceRepo: repo.fullName,
        installedPaths,
      });
      writeWorkflowManifest(targetDir, config.id, manifestEntry);
      registerWorkflowInstall(config.id, config.name, targetDir, source.commitSha);

      // Show success
      console.log();
      console.log(
        `  ${theme.textSuccess("\u2713")} ${theme.brandBold(`${config.name} installed successfully!`)}`
      );
      console.log();
      console.log(
        `  ${theme.textSecondary("Files copied:")}  ${theme.text(String(totalFiles))}`
      );
      console.log(
        `  ${theme.textSecondary("Commit:")}        ${theme.text(source.commitSha.slice(0, 8))}`
      );
      console.log(
        `  ${theme.textSecondary("Platforms:")}     ${theme.text("Cursor IDE + GitHub Copilot")}`
      );
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

      // Offer MCP setup if the workflow supports it
      if (config.features.includes("mcp") && config.mcp) {
        await offerMcpSetup(config, targetDir);
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
  }
}

// -- Update -------------------------------------------------------------------

async function handleUpdate(config: WorkflowConfig): Promise<void> {
  const cwd = process.cwd();
  console.log();
  const targetInput = await promptDirectory(shortenPath(cwd));
  const targetDir = targetInput === shortenPath(cwd) ? cwd : path.resolve(targetInput);

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(theme.textError(`  Directory does not exist: ${targetDir}`));
    console.log();
    return;
  }

  const entry = readWorkflowManifest(targetDir, config.id);

  if (!entry) {
    console.log();
    console.log(theme.textWarning(`  ${config.name} is not installed in this directory.`));
    console.log(theme.hint("  Use 'Install' from the menu first."));
    console.log();
    return;
  }

  const previousSha = entry.commitSha;

  // Check for updates
  console.log(`  ${theme.brandBright("\u2192")} ${theme.text("Checking for updates...")}`);
  const latestSha = getRemoteHeadSha(entry.branch, config.source);

  if (latestSha && latestSha === previousSha) {
    console.log();
    console.log(
      `  ${theme.textSuccess("\u2713")} ${theme.text("Already up to date.")} (${previousSha.slice(0, 8)})`
    );
    console.log();
    return;
  }

  // Download and update
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
    console.log(
      `  ${theme.textSuccess("\u2713")} ${theme.brandBold(`${config.name} updated successfully!`)}`
    );
    console.log();
    console.log(
      `  ${theme.textSecondary("Files updated:")} ${theme.text(String(totalFiles))}`
    );
    console.log(
      `  ${theme.textSecondary("Previous:")}      ${theme.text(previousSha.slice(0, 8))}`
    );
    console.log(
      `  ${theme.textSecondary("Current:")}       ${theme.text(source.commitSha.slice(0, 8))}`
    );
    console.log();
  } finally {
    source.cleanup();
  }
}

// -- Verify -------------------------------------------------------------------

async function handleVerify(config: WorkflowConfig): Promise<void> {
  const cwd = process.cwd();
  console.log();
  const targetInput = await promptDirectory(shortenPath(cwd));
  const targetDir = targetInput === shortenPath(cwd) ? cwd : path.resolve(targetInput);

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(theme.textError(`  Directory does not exist: ${targetDir}`));
    console.log();
    return;
  }

  // Delegate to the existing verify logic but with workflow source
  const { runVerify } = await import("./verify.js");
  await runVerify(targetDir);
}

// -- MCP Setup ----------------------------------------------------------------

async function handleMcpSetup(config: WorkflowConfig): Promise<void> {
  if (!config.mcp) {
    console.log();
    console.log(theme.textWarning(`  ${config.name} does not have MCP configuration.`));
    console.log();
    return;
  }

  const cwd = process.cwd();
  console.log();
  const targetInput = await promptDirectory(shortenPath(cwd));
  const targetDir = targetInput === shortenPath(cwd) ? cwd : path.resolve(targetInput);

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(theme.textError(`  Directory does not exist: ${targetDir}`));
    console.log();
    return;
  }

  // Run setup — always configure both Cursor and VS Code
  try {
    const result = await setupWorkflowMcp(config, {
      target: "both",
      targetDir,
    });
    printMcpSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
  }
}

// -- Status -------------------------------------------------------------------

function handleStatus(config: WorkflowConfig): void {
  const cwd = process.cwd();
  const entry = readWorkflowManifest(cwd, config.id);

  console.log();
  if (entry) {
    const platformLabel =
      entry.platform === "both"
        ? "Cursor IDE + GitHub Copilot"
        : entry.platform === "cursor"
          ? "Cursor IDE"
          : "GitHub Copilot";
    console.log(
      renderBox(
        [
          "",
          theme.brandBold(`  ${config.name} Status`),
          "",
          `  ${theme.textSecondary("Directory:")}  ${theme.path(shortenPath(cwd))}`,
          `  ${theme.textSecondary("Installed:")}  ${theme.textSuccess("Yes")}`,
          `  ${theme.textSecondary("Platforms:")}  ${theme.text(platformLabel)}`,
          `  ${theme.textSecondary("Commit:")}     ${theme.text(entry.commitSha.slice(0, 8))}`,
          `  ${theme.textSecondary("Updated:")}    ${theme.text(new Date(entry.updatedAt).toLocaleDateString())}`,
          "",
        ],
        { title: config.name, minWidth: 55 }
      )
    );
  } else {
    console.log(
      renderBox(
        [
          "",
          theme.brandBold(`  ${config.name} Status`),
          "",
          `  ${theme.textSecondary("Directory:")}  ${theme.path(shortenPath(cwd))}`,
          `  ${theme.textSecondary("Installed:")}  ${theme.textWarning("No")}`,
          "",
          `  ${theme.hint("Select Install from the menu to get started.")}`,
          "",
        ],
        { title: config.name, minWidth: 55 }
      )
    );
  }
  console.log();
}

// -- Helpers ------------------------------------------------------------------

async function offerMcpSetup(config: WorkflowConfig, targetDir: string): Promise<void> {
  console.log(theme.brandBright("  \u2500\u2500\u2500 MCP Server Configuration \u2500\u2500\u2500"));
  console.log();
  console.log(theme.text("  Would you also like to configure MCP servers for this project?"));
  console.log(theme.textSecondary("  This sets up Atlassian, GitHub, filesystem, and other MCP tools."));
  console.log(theme.textSecondary("  MCP will be configured for both Cursor and VS Code."));
  console.log();

  const wantsMcp = await promptConfirm("Configure MCP servers?");

  if (!wantsMcp) {
    console.log();
    console.log(theme.hint("  You can configure MCP servers later from the workflow menu."));
    console.log();
    return;
  }

  try {
    const result = await setupWorkflowMcp(config, { target: "both", targetDir });
    printMcpSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  MCP setup failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
  }
}

function printMcpSuccess(result: import("../workflows/types.js").McpSetupResult): void {
  console.log();
  console.log(
    `  ${theme.textSuccess("\u2713")} ${theme.brandBold("MCP servers configured successfully!")}`
  );
  console.log();
  console.log(
    `  ${theme.textSecondary("Added:")}    ${theme.text(String(result.serversAdded))} servers`
  );
  if (result.serversSkipped > 0) {
    console.log(
      `  ${theme.textSecondary("Skipped:")}  ${theme.text(String(result.serversSkipped))} (already configured)`
    );
  }
  if (result.filesWritten.length > 0) {
    console.log(
      `  ${theme.textSecondary("Files:")}    ${theme.text(result.filesWritten.join(", "))}`
    );
  }
  console.log();
}
