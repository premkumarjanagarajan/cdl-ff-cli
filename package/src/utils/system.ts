import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

/** Return the current user's display name (login name as fallback). */
export function getUsername(): string {
  // Try macOS full name first (e.g. "Cleber" instead of "clde01")
  if (process.platform === "darwin") {
    try {
      const fullName = execSync("id -F", { encoding: "utf-8" }).trim();
      if (fullName) {
        return fullName.split(" ")[0]!; // First name only
      }
    } catch {
      // fall through
    }
  }

  // Try git config user.name
  try {
    const gitName = execSync("git config user.name", {
      encoding: "utf-8",
    }).trim();
    if (gitName) {
      return gitName.split(" ")[0]!; // First name only
    }
  } catch {
    // fall through
  }

  // Fallback: capitalize the system username
  const login = os.userInfo().username;
  return login.charAt(0).toUpperCase() + login.slice(1);
}

/** Pretty-print a path: replace $HOME with ~ and shorten if needed. */
export function shortenPath(p: string, maxLen = 50): string {
  const home = os.homedir();
  let display = p.startsWith(home) ? "~" + p.slice(home.length) : p;

  if (display.length > maxLen) {
    const parts = display.split(path.sep);
    if (parts.length > 4) {
      display = parts[0] + "/\u2026/" + parts.slice(-2).join("/");
    }
  }

  return display;
}

/** Read the package.json version from the project root. */
export function getVersion(): string {
  try {
    const pkgPath = new URL("../../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/** Get terminal width, with a sensible fallback. */
export function getTerminalWidth(): number {
  return process.stdout.columns ?? 80;
}

/**
 * Resolve the CLI package directory from the compiled JS location.
 * Returns the `package/` subfolder (e.g. ~/.ff-cli/package) where
 * package.json, src/, bin/, and dist/ live.
 */
export function getCliInstallDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // thisFile = <git-root>/package/dist/utils/system.js → go up 2 levels to package/
  return path.resolve(path.dirname(thisFile), "..", "..");
}

/**
 * Resolve the git repository root for the CLI installation.
 * This is the parent of getCliInstallDir() (e.g. ~/.ff-cli).
 */
export function getCliGitRoot(): string {
  return path.resolve(getCliInstallDir(), "..");
}

/** Read the current git HEAD SHA of the CLI installation. */
export function getLocalHeadSha(): string | null {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: getCliGitRoot(),
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    return null;
  }
}

// -- Registration helpers -----------------------------------------------------

/** Return the full git user.name (not truncated to first name). */
export function getGitUserName(): string | null {
  try {
    const name = execSync("git config user.name", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    return name || null;
  } catch {
    return null;
  }
}

/** Return the git user.email. */
export function getGitEmail(): string | null {
  try {
    const email = execSync("git config user.email", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    return email || null;
  } catch {
    return null;
  }
}

/** Return the system hostname. */
export function getHostname(): string {
  return os.hostname();
}

/** Return OS info as "platform arch release" (e.g. "darwin arm64 24.3.0"). */
export function getOSInfo(): string {
  return `${process.platform} ${process.arch} ${os.release()}`;
}

/**
 * Read the git remote origin URL for a given directory and normalize
 * it to "owner/repo" format. Returns null if not a git repo or no
 * origin remote is configured.
 */
export function getTargetRepoRemote(dir: string): string | null {
  try {
    const url = execSync("git remote get-url origin", {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    if (!url) return null;
    return url
      .replace(/\.git$/, "")
      .replace(/.*github\.com[:/]/, "");
  } catch {
    return null;
  }
}
