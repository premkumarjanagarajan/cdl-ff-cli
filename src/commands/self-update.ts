/**
 * Self-Update Command
 *
 * CLI handler for: ff self-update [--check] [--force]
 *
 * Checks for a newer version of the CLI itself (not workflows) and
 * delegates the actual update to an external shell script so that
 * Node.js is not running while its own files are being replaced.
 *
 * Also exports helpers used by the interactive menu:
 *   - getUpdateHint()       — cached, non-blocking startup banner
 *   - isUpdateAvailable()   — used by the menu to annotate the item
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { theme } from "../ui/theme.js";
import { promptConfirm } from "../ui/menu.js";
import { getCliInstallDir, getLocalHeadSha, getVersion } from "../utils/system.js";
import {
  generateBashUpdateScript,
  generatePowerShellUpdateScript,
} from "../updater/update-script.js";

// ── CLI source repository ────────────────────────────────────────────────────

const CLI_REPO_OWNER = "BetssonGroup";
const CLI_REPO_NAME = "cdl-ff-cli";
const CLI_BRANCH = "main";

// ── Update check cache ──────────────────────────────────────────────────────

interface UpdateCheckCache {
  lastCheck: number;
  remoteSha: string;
  localSha: string;
}

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function getCachePath(): string {
  return path.join(getCliInstallDir(), ".update-check.json");
}

function readCache(): UpdateCheckCache | null {
  try {
    const raw = fs.readFileSync(getCachePath(), "utf-8");
    return JSON.parse(raw) as UpdateCheckCache;
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCheckCache): void {
  try {
    fs.writeFileSync(getCachePath(), JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // Non-critical — silently ignore
  }
}

// ── Remote version check ────────────────────────────────────────────────────

function getRemoteCliSha(): string | null {
  // Try GitHub CLI first (works with private repos)
  try {
    const result = execSync(
      `gh api repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/commits/${CLI_BRANCH} --jq '.sha'`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 },
    ).trim();
    if (result) return result;
  } catch {
    // fall through
  }

  // Fallback to git ls-remote
  try {
    const result = execSync(
      `git ls-remote "https://github.com/${CLI_REPO_OWNER}/${CLI_REPO_NAME}.git" refs/heads/${CLI_BRANCH}`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 },
    ).trim();
    const sha = result.split("\t")[0];
    if (sha) return sha;
  } catch {
    // fall through
  }

  return null;
}

// ── Public API — startup hint ───────────────────────────────────────────────

/**
 * Non-blocking check intended for the interactive menu startup.
 * Returns a styled hint string if an update is available, or null.
 * Uses a 4-hour cache to avoid network calls on every launch.
 */
export function getUpdateHint(): string | null {
  const localSha = getLocalHeadSha();
  if (!localSha) return null;

  const cached = readCache();

  if (cached && Date.now() - cached.lastCheck < CACHE_TTL_MS) {
    if (cached.remoteSha && cached.remoteSha !== cached.localSha) {
      return formatHint(cached.localSha, cached.remoteSha);
    }
    return null;
  }

  // Cache is stale or missing — do a quick check
  const remoteSha = getRemoteCliSha();
  if (remoteSha) {
    writeCache({ lastCheck: Date.now(), remoteSha, localSha });
    if (remoteSha !== localSha) {
      return formatHint(localSha, remoteSha);
    }
  }

  return null;
}

/**
 * Lightweight check used by the menu to decide whether to annotate
 * the "Self Update" item.
 */
export function isUpdateAvailable(): boolean {
  const cached = readCache();
  if (!cached) return false;
  return cached.remoteSha !== cached.localSha;
}

function formatHint(localSha: string, remoteSha: string): string {
  return (
    `  ${theme.textWarning("⬆")} ` +
    theme.text("CLI update available ") +
    theme.textMuted(`(${localSha.slice(0, 8)} → ${remoteSha.slice(0, 8)})`) +
    theme.textSecondary("  Run ") +
    theme.command("ff self-update") +
    theme.textSecondary(" or select ") +
    theme.command("Self Update") +
    theme.textSecondary(" from the menu.")
  );
}

// ── Public API — CLI command ────────────────────────────────────────────────

export async function runSelfUpdateCLI(args: string[] = []): Promise<void> {
  const force = args.includes("--force") || args.includes("-f");
  const checkOnly = args.includes("--check") || args.includes("-c");

  if (args.includes("--help") || args.includes("-h")) {
    printSelfUpdateHelp();
    return;
  }

  const installDir = getCliInstallDir();
  const localSha = getLocalHeadSha();

  if (!localSha) {
    console.error(theme.textError("  Cannot determine current CLI version."));
    console.error(theme.hint("  Is the CLI installed via git?"));
    process.exit(1);
  }

  console.log();
  console.log(
    theme.brandBold("  Fluid Flow CLI") +
      theme.textSecondary(` v${getVersion()}`) +
      theme.textMuted(`  (${localSha.slice(0, 8)})`),
  );
  console.log();

  // Fetch remote SHA
  console.log(`  ${theme.brandBright("→")} ${theme.text("Checking for updates...")}`);
  const remoteSha = getRemoteCliSha();

  if (!remoteSha) {
    console.error(theme.textError("  Could not reach the remote repository."));
    console.error(theme.hint("  Check your network connection and GitHub CLI authentication."));
    console.log();
    process.exit(1);
  }

  // Update cache
  writeCache({ lastCheck: Date.now(), remoteSha, localSha });

  if (remoteSha === localSha && !force) {
    console.log();
    console.log(`  ${theme.textSuccess("✓")} ${theme.text("Already up to date.")} (${localSha.slice(0, 8)})`);
    console.log();
    return;
  }

  console.log();
  console.log(`  ${theme.textSecondary("Current:")}  ${theme.text(localSha.slice(0, 8))}`);
  console.log(`  ${theme.textSecondary("Latest:")}   ${theme.text(remoteSha.slice(0, 8))}`);

  // Show recent commits if possible
  showRecentCommits(localSha, remoteSha);

  if (checkOnly) {
    console.log();
    console.log(`  ${theme.textSuccess("✓")} ${theme.brandBold("Update available!")} Run ${theme.command("ff self-update")} to apply.`);
    console.log();
    return;
  }

  // Confirmation
  console.log();
  const confirmed = await promptConfirm("Proceed with update?");
  if (!confirmed) {
    console.log();
    console.log(theme.textSecondary("  Update cancelled."));
    console.log();
    return;
  }

  // Generate and run the external update script
  await launchExternalUpdate(installDir, localSha);
}

// ── External script launcher ────────────────────────────────────────────────

async function launchExternalUpdate(
  installDir: string,
  rollbackSha: string,
): Promise<void> {
  const isWindows = process.platform === "win32";
  const ext = isWindows ? "ps1" : "sh";
  const scriptPath = path.join(os.tmpdir(), `ff-update-${Date.now()}.${ext}`);

  const scriptContent = isWindows
    ? generatePowerShellUpdateScript(installDir, rollbackSha)
    : generateBashUpdateScript(installDir, rollbackSha);

  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

  console.log();
  console.log(`  ${theme.brandBright("→")} ${theme.text("Handing off to updater...")}`);
  console.log(theme.textMuted(`  ${scriptPath}`));
  console.log();

  const shell = isWindows ? "powershell.exe" : "bash";
  const shellArgs = isWindows ? ["-ExecutionPolicy", "Bypass", "-File", scriptPath] : [scriptPath];

  const child = spawn(shell, shellArgs, {
    detached: true,
    stdio: "inherit",
  });

  child.unref();
  process.exit(0);
}

// ── Changelog preview ───────────────────────────────────────────────────────

function showRecentCommits(localSha: string, remoteSha: string): void {
  try {
    const raw = execSync(
      `gh api "repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/compare/${localSha.slice(0, 12)}...${remoteSha.slice(0, 12)}" --jq '.commits | .[-5:] | .[] | .sha[:8] + " " + (.commit.message | split("\\n") | .[0])'`,
      { encoding: "utf-8", stdio: "pipe", timeout: 15_000 },
    ).trim();

    if (raw) {
      console.log();
      console.log(theme.textSecondary("  Recent changes:"));
      for (const line of raw.split("\n").slice(0, 5)) {
        console.log(`    ${theme.textMuted("•")} ${theme.textMuted(line)}`);
      }
    }
  } catch {
    // Non-critical — just skip the changelog
  }
}

// ── Help ────────────────────────────────────────────────────────────────────

function printSelfUpdateHelp(): void {
  console.log();
  console.log(
    theme.brandBold("  ff self-update") +
      theme.textSecondary(" — Update the Fluid Flow CLI itself"),
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff self-update [options]"));
  console.log();
  console.log(theme.text("  Options:"));
  console.log(`    ${theme.command("--check, -c")}  ${theme.textSecondary("Check for updates without applying")}`);
  console.log(`    ${theme.command("--force, -f")}  ${theme.textSecondary("Force update even if up to date")}`);
  console.log(`    ${theme.command("--help, -h")}   ${theme.textSecondary("Show this help")}`);
  console.log();
}
