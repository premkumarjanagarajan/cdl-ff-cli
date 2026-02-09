#!/usr/bin/env node

/**
 *  ╭─ Fluid Flow ───────────────────────────╮
 *  │                                         │
 *  │  Developer workflow orchestration CLI    │
 *  │  Streamline builds, deploys, and flows  │
 *  │                                         │
 *  ╰─────────────────────────────────────────╯
 */

import path from "node:path";
import { runInstallCLI } from "./commands/install.js";
import { runUpdateCLI } from "./commands/update.js";
import { runVerifyCLI, runVerify } from "./commands/verify.js";
import { theme } from "./ui/theme.js";
import { getVersion, shortenPath } from "./utils/system.js";
import { renderWelcome } from "./ui/welcome.js";
import { promptMenu, promptDirectory } from "./ui/menu.js";
import { install, update, checkForUpdate, type Platform } from "./installer/index.js";
import { isInstalled, readManifest, getManifestFileName } from "./installer/manifest.js";
import { isDirectory } from "./installer/file-ops.js";
import { renderBox } from "./ui/box.js";

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

switch (command) {
  case "install":
    runInstallCLI(args.slice(1)).catch(fatal);
    break;

  case "update":
    runUpdateCLI(args.slice(1)).catch(fatal);
    break;

  case "verify":
    runVerifyCLI(args.slice(1)).catch(fatal);
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
    // No arguments — launch the interactive menu
    runInteractiveMenu().catch(fatal);
    break;

  default:
    console.error(theme.textError(`  Unknown command: ${command}`));
    console.error(theme.hint("  Run 'ff --help' for available commands."));
    process.exit(1);
}

// ── Interactive menu flow ──────────────────────────────

async function runInteractiveMenu(): Promise<void> {
  // Clear screen and show the welcome banner
  process.stdout.write("\x1B[2J\x1B[H");
  console.log(renderWelcome(process.cwd()));

  // ── Main menu loop ──────────────────────────────────
  let running = true;

  while (running) {
    const action = await promptMenu(
      [
        {
          key: "install",
          label: "Install",
          description: "Install Fluid Flow Pro into a repository",
        },
        {
          key: "update",
          label: "Update",
          description: "Update to the latest version",
        },
        {
          key: "verify",
          label: "Verify",
          description: "Check GitHub for changes & show diff",
        },
        {
          key: "status",
          label: "Status",
          description: "Check installation status",
        },
        {
          key: "exit",
          label: "Exit",
          description: "Quit Fluid Flow CLI",
        },
      ],
      {
        title: "Main Menu",
        prompt: "Select an option",
      }
    );

    switch (action.key) {
      case "install":
        await handleInstallFlow();
        running = false;
        break;

      case "update":
        await handleUpdateFlow();
        running = false;
        break;

      case "verify":
        await handleVerifyFlow();
        // Stay in the loop so user can pick another action
        break;

      case "status":
        handleStatusCheck();
        // Stay in the loop so user can pick another action
        break;

      case "exit":
        console.log();
        console.log(theme.brandDim("  ~~~ until next flow ~~~"));
        console.log();
        running = false;
        break;
    }
  }
}

// ── Install flow ───────────────────────────────────────

async function handleInstallFlow(): Promise<void> {
  // Step 1: Choose target IDE
  const ideChoice = await promptMenu(
    [
      {
        key: "cursor",
        label: "Cursor IDE",
        description: ".cursor/rules/workflow.mdc",
        hint: "Installs the Cursor rule — activates automatically",
      },
      {
        key: "copilot",
        label: "GitHub Copilot",
        description: ".github/copilot-instructions.md",
        hint: "Transforms for Copilot + creates .instructions.md files",
      },
    ],
    {
      title: "Target IDE",
      prompt: "Select target platform",
    }
  );

  const platform = ideChoice.key as Platform;

  // Step 2: Choose target directory
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

  // Step 3: Check if already installed
  if (isInstalled(targetDir)) {
    const manifest = readManifest(targetDir);
    console.log();
    console.log(
      theme.textWarning("  Fluid Flow is already installed in this directory.")
    );
    console.log(
      theme.textSecondary(
        `  Platform: ${manifest?.platform}  |  Commit: ${manifest?.commitSha?.slice(0, 8)}`
      )
    );
    console.log(
      theme.hint("  Run 'ff update' to update, or 'ff install --force' to reinstall.")
    );
    console.log();
    return;
  }

  // Step 4: Show install plan and execute
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold("  Installing Fluid Flow Pro"),
        "",
        `  ${theme.textSecondary("Source:")}   ${theme.path("BetssonGroup/aidlc-workflow")}`,
        `  ${theme.textSecondary("Target:")}   ${theme.path(shortenPath(targetDir))}`,
        `  ${theme.textSecondary("Platform:")} ${theme.highlight(platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`,
        "",
      ],
      { title: "Install Plan", minWidth: 55 }
    )
  );
  console.log();

  try {
    const result = await install(targetDir, platform);

    console.log();
    console.log(
      `  ${theme.textSuccess("✓")} ${theme.brandBold("Fluid Flow Pro installed successfully!")}`
    );
    console.log();
    console.log(
      `  ${theme.textSecondary("Files copied:")}  ${theme.text(String(result.filesCopied))}`
    );
    console.log(
      `  ${theme.textSecondary("Commit:")}        ${theme.text(result.commitSha.slice(0, 8))}`
    );
    console.log(
      `  ${theme.textSecondary("Platform:")}      ${theme.text(platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
    );
    console.log();

    if (platform === "cursor") {
      console.log(theme.hint("  Next steps:"));
      console.log(
        theme.textSecondary("  1. Open this project in Cursor — the workflow rule activates automatically")
      );
      console.log(
        theme.textSecondary("  2. Make a development request in chat to trigger the workflow")
      );
    } else {
      console.log(theme.hint("  Next steps:"));
      console.log(
        theme.textSecondary("  1. The instructions are loaded automatically by GitHub Copilot")
      );
      console.log(
        theme.textSecondary("  2. Make a development request in Copilot Chat to trigger the workflow")
      );
    }
    console.log();
    console.log(
      theme.hint(`  Tip: Add '${getManifestFileName()}' to your .gitignore if you don't want to track it.`)
    );
    console.log();
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  Installation failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
  }
}

// ── Update flow ────────────────────────────────────────

async function handleUpdateFlow(): Promise<void> {
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

  const manifest = readManifest(targetDir);

  if (!manifest) {
    console.log();
    console.log(theme.textWarning("  Fluid Flow is not installed in this directory."));
    console.log(theme.hint("  Use 'Install' from the main menu first."));
    console.log();
    return;
  }

  console.log();
  console.log(
    `  ${theme.textSecondary("Platform:")} ${theme.text(manifest.platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
  );
  console.log(
    `  ${theme.textSecondary("Current:")}  ${theme.text(manifest.commitSha.slice(0, 8))}`
  );
  console.log();

  try {
    const result = await update(targetDir);

    console.log();
    if (result.wasUpToDate) {
      console.log(
        `  ${theme.textSuccess("✓")} ${theme.text("Already up to date.")} (${result.newSha.slice(0, 8)})`
      );
    } else {
      console.log(
        `  ${theme.textSuccess("✓")} ${theme.brandBold("Fluid Flow Pro updated successfully!")}`
      );
      console.log();
      console.log(
        `  ${theme.textSecondary("Files updated:")} ${theme.text(String(result.filesCopied))}`
      );
      console.log(
        `  ${theme.textSecondary("Previous:")}      ${theme.text(result.previousSha.slice(0, 8))}`
      );
      console.log(
        `  ${theme.textSecondary("Current:")}       ${theme.text(result.newSha.slice(0, 8))}`
      );
    }
    console.log();
  } catch (err) {
    console.log();
    console.error(
      theme.textError(`  Update failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    console.log();
  }
}

// ── Verify flow ────────────────────────────────────────

async function handleVerifyFlow(): Promise<void> {
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

  await runVerify(targetDir);
}

// ── Status check ───────────────────────────────────────

function handleStatusCheck(): void {
  const cwd = process.cwd();
  const check = checkForUpdate(cwd);

  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold("  Installation Status"),
        "",
        `  ${theme.textSecondary("Directory:")}  ${theme.path(shortenPath(cwd))}`,
        "",
        ...(check.installed
          ? [
              `  ${theme.textSecondary("Installed:")}  ${theme.textSuccess("Yes")}`,
              `  ${theme.textSecondary("Platform:")}   ${theme.text(check.platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`,
              `  ${theme.textSecondary("Current:")}    ${theme.text(check.currentSha?.slice(0, 8) ?? "unknown")}`,
              `  ${theme.textSecondary("Latest:")}     ${theme.text(check.latestSha?.slice(0, 8) ?? "checking...")}`,
              "",
              check.updateAvailable
                ? `  ${theme.textWarning("⬆")} ${theme.brandBright("Update available!")} Select Update from the menu.`
                : `  ${theme.textSuccess("✓")} ${theme.text("Up to date")}`,
            ]
          : [
              `  ${theme.textSecondary("Installed:")}  ${theme.textWarning("No")}`,
              "",
              `  ${theme.hint("Select Install from the menu to get started.")}`,
            ]),
        "",
      ],
      { title: "Status", minWidth: 55 }
    )
  );
}

// ── Helpers ────────────────────────────────────────────

function fatal(err: unknown): never {
  console.error("Fatal error:", err);
  process.exit(1);
}

function printHelp(): void {
  console.log();
  console.log(
    theme.brandBold("  Fluid Flow CLI") +
      theme.textSecondary(` v${getVersion()}`)
  );
  console.log(
    theme.textSecondary("  Developer workflow orchestration tool")
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff [command] [options]"));
  console.log();
  console.log(theme.text("  Commands:"));
  console.log(
    `    ${theme.command("install")}   ${theme.textSecondary("Install Fluid Flow Pro into a repository")}`
  );
  console.log(
    `    ${theme.command("update")}    ${theme.textSecondary("Update Fluid Flow Pro to the latest version")}`
  );
  console.log(
    `    ${theme.command("verify")}    ${theme.textSecondary("Check for upstream changes and highlight diff")}`
  );
  console.log(
    `    ${theme.command("version")}   ${theme.textSecondary("Show CLI version")}`
  );
  console.log(
    `    ${theme.command("help")}      ${theme.textSecondary("Show this help message")}`
  );
  console.log();
  console.log(theme.text("  Interactive mode:"));
  console.log(
    theme.textSecondary("    ff              Launch the interactive menu")
  );
  console.log();
  console.log(theme.text("  Install examples:"));
  console.log(
    theme.textSecondary("    ff install                     # Install in current directory")
  );
  console.log(
    theme.textSecondary("    ff install --target cursor     # Install for Cursor IDE")
  );
  console.log(
    theme.textSecondary("    ff install --target copilot    # Install for GitHub Copilot")
  );
  console.log(
    theme.textSecondary("    ff install /path/to/repo -t cursor")
  );
  console.log();
  console.log(theme.text("  Update examples:"));
  console.log(
    theme.textSecondary("    ff update                      # Update to latest")
  );
  console.log(
    theme.textSecondary("    ff update --check              # Check for updates only")
  );
  console.log(
    theme.textSecondary("    ff update --force              # Force re-download")
  );
  console.log();
  console.log(theme.text("  Verify examples:"));
  console.log(
    theme.textSecondary("    ff verify                      # Show changes since install")
  );
  console.log(
    theme.textSecondary("    ff verify /path/to/repo        # Verify a specific repo")
  );
  console.log();
  console.log(
    theme.hint(
      `  Source: github.com/BetssonGroup/aidlc-workflow`
    )
  );
  console.log();
}
