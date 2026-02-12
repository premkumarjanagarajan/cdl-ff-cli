import path from "node:path";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import {
  readFullManifest,
  getInstalledWorkflowIds,
} from "../modules/manifest.js";
import { isDirectory } from "../installer/file-ops.js";
import { shortenPath } from "../utils/system.js";
import {
  getRemoteHeadSha,
  getRecentCommits,
  compareCommits,
  getRepoInfo,
  type FileChange,
  type CommitInfo,
  type CompareResult,
} from "../installer/github-source.js";

// ── CLI entry point ────────────────────────────────────

/**
 * Run the verify command from CLI arguments.
 * Usage: ff verify [target-dir]
 */
export async function runVerifyCLI(args: string[]): Promise<void> {
  let targetDir: string | undefined;

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      printVerifyHelp();
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

  await runVerify(targetDir);
}

// ── Core verify logic (shared by CLI and menu) ─────────

export async function runVerify(targetDir: string): Promise<void> {
  // Read v2 manifest and pick the first installed workflow entry
  const fullManifest = readFullManifest(targetDir);
  const installedIds = getInstalledWorkflowIds(targetDir);
  const firstId = installedIds[0];
  const manifest = firstId && fullManifest
    ? fullManifest.workflows[firstId]
    : null;

  const repo = getRepoInfo();

  // ── Header ──────────────────────────────────────────
  console.log();
  console.log(
    `  ${theme.brandBright("→")} ${theme.text("Checking")} ${theme.path(repo.fullName)} ${theme.text("for changes...")}`
  );

  // ── Mode A: Installation exists — compare installed vs latest ──
  if (manifest) {
    await verifyWithManifest(manifest, targetDir, repo);
    return;
  }

  // ── Mode B: No installation — show recent repository activity ──
  await verifyWithoutManifest(targetDir, repo);
}

// ── Mode A: Compare installed vs latest ────────────────

async function verifyWithManifest(
  manifest: import("../workflows/types.js").WorkflowManifestEntry,
  targetDir: string,
  repo: ReturnType<typeof getRepoInfo>
): Promise<void> {
  const latestSha = getRemoteHeadSha(manifest.branch);

  if (!latestSha) {
    printNetworkError();
    return;
  }

  // Up to date?
  if (latestSha === manifest.commitSha) {
    printUpToDate(manifest.commitSha, manifest.platform, targetDir);
    return;
  }

  // Get the comparison
  const comparison = compareCommits(manifest.commitSha, latestSha);

  if (!comparison) {
    printBasicDiff(manifest.commitSha, latestSha, manifest.platform, targetDir);
    return;
  }

  printChangeReport(comparison, manifest.commitSha, latestSha, manifest.platform, targetDir);
}

// ── Mode B: No installation — show recent activity ─────

async function verifyWithoutManifest(
  targetDir: string,
  repo: ReturnType<typeof getRepoInfo>
): Promise<void> {
  // Fetch the latest HEAD SHA
  const latestSha = getRemoteHeadSha("release");

  if (!latestSha) {
    printNetworkError();
    return;
  }

  // Fetch recent commits
  const recentCommits = getRecentCommits(15, "release");

  if (!recentCommits || recentCommits.length === 0) {
    // Fallback: at least show the latest commit
    console.log();
    console.log(
      renderBox(
        [
          "",
          `  ${theme.brandBright("●")} ${theme.brandBold("Repository Status")}`,
          "",
          `  ${theme.textSecondary("Repository:")}  ${theme.path(repo.fullName)}`,
          `  ${theme.textSecondary("Latest:")}      ${theme.text(latestSha.slice(0, 8))}`,
          "",
          `  ${theme.hint("No local installation found.")}`,
          `  ${theme.hint("Run")} ${theme.command("ff install")} ${theme.hint("to install into this directory.")}`,
          "",
        ],
        { title: "Verify", minWidth: 58 }
      )
    );
    console.log();
    return;
  }

  // Compare oldest fetched commit to latest to get the file-level diff
  const oldestSha = recentCommits[recentCommits.length - 1]!.sha;
  const comparison = compareCommits(oldestSha, latestSha);

  // ── Header box ────────────────────────────────────────
  const commitCount = recentCommits.length;

  const headerLines: string[] = [
    "",
    `  ${theme.brandBright("●")} ${theme.brandBold("Recent Repository Activity")}`,
    "",
    `  ${theme.textSecondary("Repository:")}  ${theme.path(repo.fullName)}`,
    `  ${theme.textSecondary("Branch:")}      ${theme.text("release")}`,
    `  ${theme.textSecondary("Latest:")}      ${theme.text(latestSha.slice(0, 8))}`,
    `  ${theme.textSecondary("Showing:")}     ${theme.highlight(String(commitCount))} recent commits`,
  ];

  if (comparison) {
    const totalAdditions = comparison.files.reduce((s, f) => s + f.additions, 0);
    const totalDeletions = comparison.files.reduce((s, f) => s + f.deletions, 0);
    headerLines.push(
      `  ${theme.textSecondary("Files:")}       ${theme.highlight(String(comparison.files.length))} changed` +
        `  ${theme.textSuccess(`+${totalAdditions}`)} ${theme.textError(`-${totalDeletions}`)}`
    );
  }

  headerLines.push("");

  console.log();
  console.log(renderBox(headerLines, { title: "Verify", minWidth: 58 }));

  // ── Commits ───────────────────────────────────────────
  console.log();
  console.log(`  ${theme.brandBold("Recent Commits")}`);
  console.log(theme.separator("  " + "─".repeat(56)));

  for (const commit of recentCommits) {
    const sha = theme.textMuted(commit.sha.slice(0, 7));
    const msg = theme.text(truncate(commit.message, 46));
    const date = formatRelativeDate(commit.date);
    console.log(`  ${sha}  ${msg}  ${theme.textSecondary(date)}`);
  }

  // ── Changed files (from the comparison) ───────────────
  if (comparison && comparison.files.length > 0) {
    printFileChanges(comparison.files);
  }

  // ── Footer ────────────────────────────────────────────
  console.log();
  console.log(theme.separator("  " + "─".repeat(56)));
  console.log();
  console.log(
    `  ${theme.hint("No local installation found in")} ${theme.path(shortenPath(targetDir))}`
  );
  console.log(
    `  ${theme.hint("Run")} ${theme.command("ff install")} ${theme.hint("to install Fluid Flow Pro here.")}`
  );
  console.log();
}

// ── Platform label ─────────────────────────────────────

function formatPlatform(platform: string): string {
  switch (platform) {
    case "both": return "Cursor IDE + GitHub Copilot";
    case "cursor": return "Cursor IDE";
    case "copilot": return "GitHub Copilot";
    default: return platform;
  }
}

// ── Rendering helpers ──────────────────────────────────

function printNetworkError(): void {
  console.log();
  console.log(
    theme.textError("  Could not reach GitHub. Check your network or authentication.")
  );
  console.log();
}

function printUpToDate(
  sha: string,
  platform: string,
  targetDir: string
): void {
  console.log();
  console.log(
    renderBox(
      [
        "",
        `  ${theme.textSuccess("✓")} ${theme.brandBold("Installation is up to date")}`,
        "",
        `  ${theme.textSecondary("Directory:")}  ${theme.path(shortenPath(targetDir))}`,
        `  ${theme.textSecondary("Platforms:")}  ${theme.text(formatPlatform(platform))}`,
        `  ${theme.textSecondary("Commit:")}     ${theme.text(sha.slice(0, 8))}`,
        "",
        `  ${theme.hint("No changes detected between local and remote.")}`,
        "",
      ],
      { title: "Verify", minWidth: 55 }
    )
  );
  console.log();
}

function printBasicDiff(
  currentSha: string,
  latestSha: string,
  platform: string,
  targetDir: string
): void {
  console.log();
  console.log(
    renderBox(
      [
        "",
        `  ${theme.textWarning("⬆")} ${theme.brandBold("Update available")}`,
        "",
        `  ${theme.textSecondary("Directory:")}  ${theme.path(shortenPath(targetDir))}`,
        `  ${theme.textSecondary("Platforms:")}  ${theme.text(formatPlatform(platform))}`,
        `  ${theme.textSecondary("Installed:")}  ${theme.text(currentSha.slice(0, 8))}`,
        `  ${theme.textSecondary("Latest:")}     ${theme.text(latestSha.slice(0, 8))}`,
        "",
        `  ${theme.hint("Could not fetch detailed diff. Run 'ff update' to apply.")}`,
        "",
      ],
      { title: "Verify", minWidth: 55 }
    )
  );
  console.log();
}

function printChangeReport(
  comparison: CompareResult,
  currentSha: string,
  latestSha: string,
  platform: string,
  targetDir: string
): void {
  const { commits, files, aheadBy, htmlUrl } = comparison;

  // Summary stats
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  // Header box
  console.log();
  console.log(
    renderBox(
      [
        "",
        `  ${theme.textWarning("⬆")} ${theme.brandBold("Changes detected")}`,
        "",
        `  ${theme.textSecondary("Directory:")}   ${theme.path(shortenPath(targetDir))}`,
        `  ${theme.textSecondary("Platforms:")}   ${theme.text(formatPlatform(platform))}`,
        `  ${theme.textSecondary("Installed:")}   ${theme.text(currentSha.slice(0, 8))}`,
        `  ${theme.textSecondary("Latest:")}      ${theme.text(latestSha.slice(0, 8))}`,
        "",
        `  ${theme.textSecondary("Commits:")}     ${theme.highlight(String(aheadBy))} new`,
        `  ${theme.textSecondary("Files:")}       ${theme.highlight(String(files.length))} changed` +
          `  ${theme.textSuccess(`+${totalAdditions}`)} ${theme.textError(`-${totalDeletions}`)}`,
        "",
      ],
      { title: "Verify", minWidth: 58 }
    )
  );

  // Commits section
  if (commits.length > 0) {
    console.log();
    console.log(`  ${theme.brandBold("Commits")}`);
    console.log(theme.separator("  " + "─".repeat(56)));

    const maxDisplay = 15;
    const display = commits.slice(-maxDisplay).reverse();

    for (const commit of display) {
      const sha = theme.textMuted(commit.sha.slice(0, 7));
      const msg = theme.text(truncate(commit.message, 50));
      const author = theme.textSecondary(commit.author);
      console.log(`  ${sha}  ${msg}  ${author}`);
    }

    if (commits.length > maxDisplay) {
      console.log(
        theme.hint(`  ... and ${commits.length - maxDisplay} more commits`)
      );
    }
  }

  // File changes
  printFileChanges(files);

  // Footer
  console.log();
  console.log(theme.separator("  " + "─".repeat(56)));
  console.log();

  if (htmlUrl) {
    console.log(
      `  ${theme.hint("View on GitHub:")} ${theme.path(htmlUrl)}`
    );
  }

  console.log(
    `  ${theme.hint("Run")} ${theme.command("ff update")} ${theme.hint("to apply these changes.")}`
  );
  console.log();
}

// ── File change rendering ──────────────────────────────

function printFileChanges(files: FileChange[]): void {
  const added = files.filter((f) => f.status === "added");
  const modified = files.filter((f) => f.status === "modified");
  const removed = files.filter((f) => f.status === "removed");
  const renamed = files.filter((f) => f.status === "renamed");

  console.log();
  console.log(`  ${theme.brandBold("Changed Files")}`);
  console.log(theme.separator("  " + "─".repeat(56)));

  if (added.length > 0) {
    console.log();
    console.log(`  ${theme.textSuccess("Added")} ${theme.textSecondary(`(${added.length})`)}`);
    for (const f of added) {
      printFileChange(f, "added");
    }
  }

  if (modified.length > 0) {
    console.log();
    console.log(`  ${theme.textWarning("Modified")} ${theme.textSecondary(`(${modified.length})`)}`);
    for (const f of modified) {
      printFileChange(f, "modified");
    }
  }

  if (renamed.length > 0) {
    console.log();
    console.log(`  ${theme.brandBright("Renamed")} ${theme.textSecondary(`(${renamed.length})`)}`);
    for (const f of renamed) {
      printFileChange(f, "renamed");
    }
  }

  if (removed.length > 0) {
    console.log();
    console.log(`  ${theme.textError("Removed")} ${theme.textSecondary(`(${removed.length})`)}`);
    for (const f of removed) {
      printFileChange(f, "removed");
    }
  }
}

// ── Helpers ────────────────────────────────────────────

const STATUS_ICONS: Record<string, string> = {
  added: "  +",
  modified: "  ~",
  removed: "  -",
  renamed: "  →",
  copied: "  ©",
  changed: "  ~",
};

function printFileChange(
  file: FileChange,
  status: "added" | "modified" | "removed" | "renamed"
): void {
  const icon = STATUS_ICONS[status] ?? "  ?";
  const stats = formatStats(file.additions, file.deletions);

  let name = file.filename;
  if (status === "renamed" && file.previousFilename) {
    name = `${file.previousFilename} → ${file.filename}`;
  }

  const colorFn =
    status === "added"
      ? theme.textSuccess
      : status === "removed"
        ? theme.textError
        : status === "renamed"
          ? theme.brandBright
          : theme.textWarning;

  console.log(`  ${colorFn(icon)}  ${theme.text(name)}  ${stats}`);
}

function formatStats(additions: number, deletions: number): string {
  const parts: string[] = [];
  if (additions > 0) parts.push(theme.textSuccess(`+${additions}`));
  if (deletions > 0) parts.push(theme.textError(`-${deletions}`));
  return parts.length > 0
    ? theme.textMuted("(") + parts.join(theme.textMuted(" ")) + theme.textMuted(")")
    : "";
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function printVerifyHelp(): void {
  console.log();
  console.log(
    theme.brandBold("  ff verify") +
      theme.textSecondary(" — Check for upstream changes and show what's new")
  );
  console.log();
  console.log(theme.text("  Usage:"));
  console.log(theme.textSecondary("    ff verify [target-dir]"));
  console.log();
  console.log(theme.text("  Examples:"));
  console.log(
    theme.textSecondary("    ff verify              # Check recent changes from GitHub")
  );
  console.log(
    theme.textSecondary("    ff verify /path/to/repo # Check a specific repository")
  );
  console.log();
  console.log(theme.text("  Modes:"));
  console.log(
    theme.textSecondary("    With installation:    Compares installed version vs latest")
  );
  console.log(
    theme.textSecondary("    Without installation: Shows recent commits & changed files")
  );
  console.log();
}
