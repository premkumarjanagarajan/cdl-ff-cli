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

import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { theme } from "../ui/theme.js";
import { promptConfirm } from "../ui/menu.js";
import { getCliGitRoot, getLocalHeadSha, getVersion } from "../utils/system.js";
import {
  generateBashUpdateScript,
  generatePowerShellUpdateScript,
} from "../updater/update-script.js";
import { registerCliSelfUpdate } from "../modules/registration.js";

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
  return path.join(getCliGitRoot(), ".update-check.json");
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
 * Cache-only check for the interactive menu startup. Never makes network
 * calls — reads only from the local cache file. If the cache is stale,
 * fires a background refresh (non-blocking) so the next launch benefits.
 */
export function getUpdateHint(): string | null {
  const localSha = getLocalHeadSha();
  if (!localSha) return null;

  const cached = readCache();

  if (!cached) {
    refreshCacheInBackground();
    return null;
  }

  // Keep cached localSha in sync with the currently running CLI version
  if (cached.localSha !== localSha) {
    writeCache({ ...cached, localSha });
  }

  if (Date.now() - cached.lastCheck >= CACHE_TTL_MS) {
    refreshCacheInBackground();
  }

  if (cached.remoteSha && cached.remoteSha !== localSha) {
    return formatHint(localSha, cached.remoteSha);
  }

  return null;
}

/**
 * Lightweight check used by the menu to decide whether to annotate
 * the "Self Update" item. Compares the live local SHA against the
 * cached remote SHA to avoid stale results after a manual update.
 */
export function isUpdateAvailable(): boolean {
  const cached = readCache();
  if (!cached) return false;

  const currentLocalSha = getLocalHeadSha();
  if (!currentLocalSha) return false;

  return cached.remoteSha !== currentLocalSha;
}

/**
 * Fire-and-forget background cache refresh via a detached shell process.
 * Does not block the caller. Skipped on Windows where bash is unavailable.
 */
function refreshCacheInBackground(): void {
  if (process.platform === "win32") return;

  try {
    const localSha = (getLocalHeadSha() ?? "unknown").replace(/[^a-f0-9]/gi, "");
    const cachePath = getCachePath().replace(/'/g, "'\\''");
    const script = `
      sha=$(gh api repos/${CLI_REPO_OWNER}/${CLI_REPO_NAME}/commits/${CLI_BRANCH} --jq '.sha' 2>/dev/null) || \
      sha=$(git ls-remote "https://github.com/${CLI_REPO_OWNER}/${CLI_REPO_NAME}.git" refs/heads/${CLI_BRANCH} 2>/dev/null | cut -f1);
      [ -n "$sha" ] && printf '{"lastCheck":%d,"remoteSha":"%s","localSha":"%s"}' $(date +%s000) "$sha" "${localSha}" > '${cachePath}'
    `;
    const child = spawn("bash", ["-c", script], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    // Non-critical
  }
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

  const gitRoot = getCliGitRoot();
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

  registerCliSelfUpdate(localSha, remoteSha);

  // Generate and run the external update script
  await launchExternalUpdate(gitRoot, localSha);
}

// ── External script launcher ────────────────────────────────────────────────

async function launchExternalUpdate(
  gitRoot: string,
  rollbackSha: string,
): Promise<void> {
  const isWindows = process.platform === "win32";
  const ext = isWindows ? "ps1" : "sh";
  const scriptPath = path.join(os.tmpdir(), `ff-update-${Date.now()}.${ext}`);

  const scriptContent = isWindows
    ? generatePowerShellUpdateScript(gitRoot, rollbackSha, CLI_BRANCH)
    : generateBashUpdateScript(gitRoot, rollbackSha, CLI_BRANCH);

  const writeOptions = isWindows ? {} : { mode: 0o755 };
  fs.writeFileSync(scriptPath, scriptContent, writeOptions);

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

  let spawnFailed = false;

  child.on("error", (err) => {
    spawnFailed = true;
    console.error(theme.textError(`  Failed to launch updater: ${err.message}`));
    console.error(theme.hint(`  Try running manually: ${shell} ${scriptPath}`));
    process.exit(1);
  });

  child.unref();

  // Short delay so the async spawn 'error' event can fire if the shell
  // binary doesn't exist, before we exit the process.
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (!spawnFailed) process.exit(0);
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
