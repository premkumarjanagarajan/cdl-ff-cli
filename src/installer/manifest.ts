import path from "node:path";
import fs from "node:fs";

/** Supported target platforms. */
export type Platform = "cursor" | "copilot";

/** Manifest file name — stored in the target repo root. */
const MANIFEST_FILE = ".fluid-flow.json";

/**
 * Installation manifest — tracks what was installed, when, and from where.
 * Stored as `.fluid-flow.json` in the target repository root.
 */
export interface Manifest {
  /** Schema version for forward compatibility. */
  version: 1;
  /** Target platform this was installed for. */
  platform: Platform;
  /** Git commit SHA from the source repo at install time. */
  commitSha: string;
  /** Source branch. */
  branch: string;
  /** Source repository identifier. */
  sourceRepo: string;
  /** ISO timestamp of the installation. */
  installedAt: string;
  /** ISO timestamp of the last update (same as installedAt on fresh install). */
  updatedAt: string;
  /** List of top-level paths installed (relative to target root). */
  installedPaths: string[];
}

/**
 * Read the installation manifest from a target directory.
 * Returns null if not found or invalid.
 */
export function readManifest(targetDir: string): Manifest | null {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as Manifest;

    // Basic validation
    if (parsed.version !== 1 || !parsed.platform || !parsed.commitSha) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Write the installation manifest to the target directory.
 */
export function writeManifest(
  targetDir: string,
  manifest: Manifest
): void {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );
}

/**
 * Create a fresh manifest for a new installation.
 */
export function createManifest(opts: {
  platform: Platform;
  commitSha: string;
  branch: string;
  sourceRepo: string;
  installedPaths: string[];
}): Manifest {
  const now = new Date().toISOString();
  return {
    version: 1,
    platform: opts.platform,
    commitSha: opts.commitSha,
    branch: opts.branch,
    sourceRepo: opts.sourceRepo,
    installedAt: now,
    updatedAt: now,
    installedPaths: opts.installedPaths,
  };
}

/**
 * Update an existing manifest after an update operation.
 */
export function updateManifestForUpdate(
  existing: Manifest,
  opts: {
    commitSha: string;
    branch: string;
    installedPaths: string[];
  }
): Manifest {
  return {
    ...existing,
    commitSha: opts.commitSha,
    branch: opts.branch,
    updatedAt: new Date().toISOString(),
    installedPaths: opts.installedPaths,
  };
}

/**
 * Get the manifest file name (for .gitignore suggestions etc).
 */
export function getManifestFileName(): string {
  return MANIFEST_FILE;
}

/**
 * Check if Fluid Flow is already installed in a directory.
 */
export function isInstalled(targetDir: string): boolean {
  return readManifest(targetDir) !== null;
}
