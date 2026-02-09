import readline from "node:readline";
import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import {
  install,
  type Platform,
  type InstallResult,
} from "../installer/index.js";
import { isInstalled, readManifest, getManifestFileName } from "../installer/manifest.js";
import { getRepoInfo } from "../installer/github-source.js";
import { isDirectory } from "../installer/file-ops.js";
import { offerMcpSetupAfterInstall } from "./mcp-setup.js";

// ── CLI entry point ────────────────────────────────────

/**
 * Run the install command from CLI arguments.
 * Usage: ff install [target-dir] [--target cursor|copilot] [--force]
 */
export async function runInstallCLI(args: string[]): Promise<void> {
  let targetDir: string | undefined;
  let platform: Platform | undefined;
  let force = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if ((arg === "--target" || arg === "-t") && args[i + 1]) {
      const value = args[++i]!.toLowerCase();
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
      printInstallHelp();
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
  if (!force && isInstalled(targetDir)) {
    const manifest = readManifest(targetDir);
    console.log();
    console.log(
      theme.textWarning(
        "  Fluid Flow is already installed in this directory."
      )
    );
    console.log(
      theme.textSecondary(
        `  Platform: ${manifest?.platform}  |  Commit: ${manifest?.commitSha?.slice(0, 8)}`
      )
    );
    console.log(
      theme.hint("  Use 'ff update' to update, or 'ff install --force' to reinstall.")
    );
    console.log();
    process.exit(0);
  }

  // Prompt for platform if not specified
  if (!platform) {
    platform = await promptPlatform();
  }

  // Show install plan
  const repo = getRepoInfo();
  console.log();
  console.log(
    renderBox(
      [
        "",
        theme.brandBold("  Installing Fluid Flow Pro"),
        "",
        `  ${theme.textSecondary("Source:")}   ${theme.path(repo.fullName)}`,
        `  ${theme.textSecondary("Target:")}   ${theme.path(targetDir)}`,
        `  ${theme.textSecondary("Platform:")} ${theme.highlight(platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`,
        "",
      ],
      { title: "Fluid Flow", minWidth: 55 }
    )
  );
  console.log();

  // Execute install
  try {
    const result = await install(targetDir, platform);
    printInstallSuccess(result, targetDir);

    // Offer MCP setup after successful install
    await offerMcpSetupAfterInstall(targetDir);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  Installation failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log();
    process.exit(1);
  }
}

// ── REPL command handler ────────────────────────────────

/**
 * Handle the install command from within the REPL.
 */
export async function handleInstallREPL(
  args: string,
  ctx: { cwd: string }
): Promise<void> {
  const parts = args.trim().split(/\s+/);

  let targetDir = ctx.cwd;
  let platform: Platform | undefined;
  let force = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part === "--cursor" || part === "cursor") {
      platform = "cursor";
    } else if (part === "--copilot" || part === "copilot") {
      platform = "copilot";
    } else if (part === "--force" || part === "-f") {
      force = true;
    } else if (part && !part.startsWith("-")) {
      targetDir = path.resolve(ctx.cwd, part);
    }
  }

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(
      theme.textError(`  Target directory does not exist: ${targetDir}`)
    );
    console.log();
    return;
  }

  // Check if already installed
  if (!force && isInstalled(targetDir)) {
    const manifest = readManifest(targetDir);
    console.log();
    console.log(
      theme.textWarning(
        "  Fluid Flow is already installed in this directory."
      )
    );
    console.log(
      theme.textSecondary(
        `  Platform: ${manifest?.platform}  |  Commit: ${manifest?.commitSha?.slice(0, 8)}`
      )
    );
    console.log(
      theme.hint("  Use 'update' to update, or 'install --force' to reinstall.")
    );
    console.log();
    return;
  }

  if (!platform) {
    platform = await promptPlatform();
  }

  const repo = getRepoInfo();
  console.log();
  console.log(
    `  ${theme.textSecondary("Source:")}   ${theme.path(repo.fullName)}`
  );
  console.log(
    `  ${theme.textSecondary("Target:")}   ${theme.path(targetDir)}`
  );
  console.log(
    `  ${theme.textSecondary("Platform:")} ${theme.highlight(platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
  );
  console.log();

  try {
    const result = await install(targetDir, platform);
    printInstallSuccess(result, targetDir);

    // Offer MCP setup after successful install
    await offerMcpSetupAfterInstall(targetDir);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  Install failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log();
  }
}

// ── Interactive prompts ─────────────────────────────────

/**
 * Prompt the user to choose a platform.
 */
async function promptPlatform(): Promise<Platform> {
  console.log();
  console.log(theme.brandBold("  Choose your target platform:"));
  console.log();
  console.log(
    `  ${theme.highlight("1")}  ${theme.text("Cursor IDE")}     ${theme.textSecondary("— installs .cursor/rules/workflow.mdc")}`
  );
  console.log(
    `  ${theme.highlight("2")}  ${theme.text("GitHub Copilot")} ${theme.textSecondary("— installs .github/copilot-instructions.md")}`
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
            console.log(
              theme.textWarning("  Please enter 1 (Cursor) or 2 (Copilot).")
            );
            ask();
          }
        }
      );
    };

    ask();
  });
}

// ── Output helpers ──────────────────────────────────────

function printInstallSuccess(result: InstallResult, targetDir: string): void {
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
    `  ${theme.textSecondary("Platform:")}      ${theme.text(result.platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
  );
  console.log();

  // Platform-specific next steps
  if (result.platform === "cursor") {
    console.log(theme.hint("  Next steps:"));
    console.log(
      theme.textSecondary(
        "  1. Open this project in Cursor — the workflow rule activates automatically"
      )
    );
    console.log(
      theme.textSecondary(
        "  2. Make a development request in chat to trigger the workflow"
      )
    );
  } else {
    console.log(theme.hint("  Next steps:"));
    console.log(
      theme.textSecondary(
        "  1. The instructions are loaded automatically by GitHub Copilot"
      )
    );
    console.log(
      theme.textSecondary(
        "  2. Make a development request in Copilot Chat to trigger the workflow"
      )
    );
  }

  console.log();
  console.log(
    theme.hint(`  Tip: Add '${getManifestFileName()}' to your .gitignore if you don't want to track it.`)
  );
  console.log();
}

function printInstallHelp(): void {
  console.log();
  console.log(theme.brandBold("  ff install") + theme.textSecondary(" — Install Fluid Flow Pro into a repository"));
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff install [target-dir] [options]"));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(
    `    ${theme.command("--target, -t")} ${theme.textSecondary("<cursor|copilot>")}  Target platform`
  );
  console.log(
    `    ${theme.command("--force, -f")}                      ${theme.textSecondary("Reinstall even if already installed")}`
  );
  console.log(
    `    ${theme.command("--help, -h")}                       ${theme.textSecondary("Show this help")}`
  );
  console.log();
  console.log(theme.text("  Examples:"));
  console.log(
    theme.textSecondary("    ff install                          # Install in current directory (prompts for platform)")
  );
  console.log(
    theme.textSecondary("    ff install --target cursor          # Install for Cursor IDE")
  );
  console.log(
    theme.textSecondary("    ff install /path/to/repo -t copilot # Install for GitHub Copilot in a specific directory")
  );
  console.log(
    theme.textSecondary("    ff install --force                  # Force reinstall")
  );
  console.log();
}
