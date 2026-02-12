import os from "node:os";
import path from "node:path";
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
