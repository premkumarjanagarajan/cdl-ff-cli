import path from "node:path";
import { theme } from "../ui/theme.js";
import {
  update,
  checkForUpdate,
  type UpdateResult,
} from "../installer/index.js";
import { readManifest } from "../installer/manifest.js";
import { isDirectory } from "../installer/file-ops.js";

// ── CLI entry point ────────────────────────────────────

/**
 * Run the update command from CLI arguments.
 * Usage: ff update [target-dir] [--force] [--check]
 */
export async function runUpdateCLI(args: string[]): Promise<void> {
  let targetDir: string | undefined;
  let force = false;
  let checkOnly = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--check" || arg === "-c") {
      checkOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      printUpdateHelp();
      return;
    } else if (!arg.startsWith("-")) {
      targetDir = arg;
    }
  }

  // Resolve target
  targetDir = targetDir ? path.resolve(targetDir) : process.cwd();

  if (!isDirectory(targetDir)) {
    console.error(
      theme.textError(`  Directory does not exist: ${targetDir}`)
    );
    process.exit(1);
  }

  // Check-only mode
  if (checkOnly) {
    const check = checkForUpdate(targetDir);

    if (!check.installed) {
      console.log();
      console.log(
        theme.textWarning("  Fluid Flow is not installed in this directory.")
      );
      console.log(theme.hint("  Run 'ff install' first."));
      console.log();
      process.exit(1);
    }

    console.log();
    console.log(
      `  ${theme.textSecondary("Platform:")}   ${theme.text(check.platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
    );
    console.log(
      `  ${theme.textSecondary("Current:")}    ${theme.text(check.currentSha?.slice(0, 8) ?? "unknown")}`
    );
    console.log(
      `  ${theme.textSecondary("Latest:")}     ${theme.text(check.latestSha?.slice(0, 8) ?? "unknown")}`
    );

    if (check.updateAvailable) {
      console.log();
      console.log(
        `  ${theme.textSuccess("✓")} ${theme.brandBold("Update available!")} Run 'ff update' to apply.`
      );
    } else {
      console.log();
      console.log(
        `  ${theme.textSuccess("✓")} ${theme.text("Already up to date.")}`
      );
    }
    console.log();
    return;
  }

  // Perform update
  console.log();
  const manifest = readManifest(targetDir);
  if (!manifest) {
    console.log(
      theme.textWarning("  Fluid Flow is not installed in this directory.")
    );
    console.log(theme.hint("  Run 'ff install' first."));
    console.log();
    process.exit(1);
  }

  console.log(
    `  ${theme.textSecondary("Platform:")} ${theme.text(manifest.platform === "cursor" ? "Cursor IDE" : "GitHub Copilot")}`
  );
  console.log(
    `  ${theme.textSecondary("Current:")}  ${theme.text(manifest.commitSha.slice(0, 8))}`
  );
  console.log();

  try {
    const result = await update(targetDir, { force });
    printUpdateSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  Update failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log();
    process.exit(1);
  }
}

// ── REPL command handler ────────────────────────────────

/**
 * Handle the update command from within the REPL.
 */
export async function handleUpdateREPL(
  args: string,
  ctx: { cwd: string }
): Promise<void> {
  const parts = args.trim().split(/\s+/).filter(Boolean);

  let targetDir = ctx.cwd;
  let force = false;
  let checkOnly = false;

  for (const part of parts) {
    if (part === "--force" || part === "-f") {
      force = true;
    } else if (part === "--check" || part === "-c") {
      checkOnly = true;
    } else if (!part.startsWith("-")) {
      targetDir = path.resolve(ctx.cwd, part);
    }
  }

  if (!isDirectory(targetDir)) {
    console.log();
    console.log(theme.textError(`  Directory does not exist: ${targetDir}`));
    console.log();
    return;
  }

  if (checkOnly) {
    const check = checkForUpdate(targetDir);

    if (!check.installed) {
      console.log();
      console.log(
        theme.textWarning("  Fluid Flow is not installed here. Run 'install' first.")
      );
      console.log();
      return;
    }

    console.log();
    console.log(
      `  ${theme.textSecondary("Current:")} ${theme.text(check.currentSha?.slice(0, 8) ?? "unknown")}`
    );
    console.log(
      `  ${theme.textSecondary("Latest:")}  ${theme.text(check.latestSha?.slice(0, 8) ?? "unknown")}`
    );

    if (check.updateAvailable) {
      console.log(
        `  ${theme.textSuccess("✓")} ${theme.brandBold("Update available!")} Run 'update' to apply.`
      );
    } else {
      console.log(`  ${theme.textSuccess("✓")} ${theme.text("Up to date.")}`);
    }
    console.log();
    return;
  }

  const manifest = readManifest(targetDir);
  if (!manifest) {
    console.log();
    console.log(
      theme.textWarning("  Fluid Flow is not installed here. Run 'install' first.")
    );
    console.log();
    return;
  }

  console.log();
  console.log(
    `  ${theme.textSecondary("Current:")} ${theme.text(manifest.commitSha.slice(0, 8))}`
  );
  console.log();

  try {
    const result = await update(targetDir, { force });
    printUpdateSuccess(result);
  } catch (err) {
    console.log();
    console.error(
      theme.textError(
        `  Update failed: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    console.log();
  }
}

// ── Output helpers ──────────────────────────────────────

function printUpdateSuccess(result: UpdateResult): void {
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
}

function printUpdateHelp(): void {
  console.log();
  console.log(
    theme.brandBold("  ff update") +
      theme.textSecondary(" — Update Fluid Flow Pro to the latest version")
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff update [target-dir] [options]"));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(
    `    ${theme.command("--check, -c")}  ${theme.textSecondary("Check for updates without applying them")}`
  );
  console.log(
    `    ${theme.command("--force, -f")}  ${theme.textSecondary("Force update even if already up to date")}`
  );
  console.log(
    `    ${theme.command("--help, -h")}   ${theme.textSecondary("Show this help")}`
  );
  console.log();
  console.log(theme.text("  Examples:"));
  console.log(
    theme.textSecondary("    ff update                 # Update in current directory")
  );
  console.log(
    theme.textSecondary("    ff update --check         # Check if update is available")
  );
  console.log(
    theme.textSecondary("    ff update --force         # Force re-download and reinstall")
  );
  console.log();
}
