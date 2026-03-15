/**
 * Manifest Manager Module
 *
 * Manages the .fluid-flow.json manifest file that tracks which workflows
 * are installed in a target repository.
 *
 * Supports:
 *  - v2 manifests (multi-workflow)
 *  - v1 manifests (legacy single-workflow, auto-migrated to v2)
 */

import path from "node:path";
import fs from "node:fs";
import type {
  Platform,
  ManifestV1,
  ManifestV2,
  ManifestAny,
  WorkflowManifestEntry,
} from "../workflows/types.js";

/** Manifest file name stored in the target repo root. */
const MANIFEST_FILE = ".fluid-flow.json";

// -- Read ---------------------------------------------------------------------

/**
 * Read the full manifest from a target directory.
 * Automatically migrates v1 manifests to v2 format in memory.
 * Returns null if not found or invalid.
 */
export function readFullManifest(targetDir: string): ManifestV2 | null {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as ManifestAny;

    if (parsed.version === 2) {
      return parsed as ManifestV2;
    }

    if (parsed.version === 1) {
      return migrateV1ToV2(parsed as ManifestV1);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Read the manifest entry for a specific workflow.
 * Returns null if the workflow is not installed.
 */
export function readWorkflowManifest(
  targetDir: string,
  workflowId: string
): WorkflowManifestEntry | null {
  const manifest = readFullManifest(targetDir);
  if (!manifest) return null;
  return manifest.workflows[workflowId] ?? null;
}

// -- Write --------------------------------------------------------------------

/**
 * Write a workflow installation entry to the manifest.
 * Creates the manifest if it does not exist.
 * Merges with existing entries for other workflows.
 */
export function writeWorkflowManifest(
  targetDir: string,
  workflowId: string,
  entry: WorkflowManifestEntry
): void {
  const existing = readFullManifest(targetDir) ?? { version: 2, workflows: {} };
  existing.workflows[workflowId] = entry;
  writeManifestFile(targetDir, existing);
}

/**
 * Create a fresh manifest entry for a new installation.
 */
export function createManifestEntry(opts: {
  platform: Platform;
  commitSha: string;
  branch: string;
  sourceRepo: string;
  installedPaths: string[];
  addons?: string[];
}): WorkflowManifestEntry {
  const now = new Date().toISOString();
  return {
    platform: opts.platform,
    commitSha: opts.commitSha,
    branch: opts.branch,
    sourceRepo: opts.sourceRepo,
    installedAt: now,
    updatedAt: now,
    installedPaths: opts.installedPaths,
    ...(opts.addons && opts.addons.length > 0 ? { addons: opts.addons } : {}),
  };
}

/**
 * Update an existing manifest entry after an update operation.
 */
export function updateManifestEntry(
  existing: WorkflowManifestEntry,
  opts: {
    commitSha: string;
    branch: string;
    installedPaths: string[];
    platform?: Platform;
    addons?: string[];
  }
): WorkflowManifestEntry {
  return {
    ...existing,
    commitSha: opts.commitSha,
    branch: opts.branch,
    updatedAt: new Date().toISOString(),
    installedPaths: opts.installedPaths,
    ...(opts.platform ? { platform: opts.platform } : {}),
    ...(opts.addons !== undefined ? { addons: opts.addons.length > 0 ? opts.addons : undefined } : {}),
  };
}

// -- Query --------------------------------------------------------------------

/**
 * Check if a specific workflow is installed in a directory.
 */
export function isWorkflowInstalled(
  targetDir: string,
  workflowId: string
): boolean {
  return readWorkflowManifest(targetDir, workflowId) !== null;
}

/**
 * Check if ANY workflow is installed (for backward compat).
 */
export function isAnyInstalled(targetDir: string): boolean {
  const manifest = readFullManifest(targetDir);
  if (!manifest) return false;
  return Object.keys(manifest.workflows).length > 0;
}

/**
 * Get all installed workflow IDs.
 */
export function getInstalledWorkflowIds(targetDir: string): string[] {
  const manifest = readFullManifest(targetDir);
  if (!manifest) return [];
  return Object.keys(manifest.workflows);
}

/**
 * Get the manifest file name (for .gitignore suggestions etc).
 */
export function getManifestFileName(): string {
  return MANIFEST_FILE;
}

// -- Migration ----------------------------------------------------------------

/**
 * Migrate a v1 (single-workflow) manifest to v2 (multi-workflow).
 * Treats the v1 entry as the "dev" workflow.
 */
function migrateV1ToV2(v1: ManifestV1): ManifestV2 {
  return {
    version: 2,
    workflows: {
      dev: {
        platform: v1.platform,
        commitSha: v1.commitSha,
        branch: v1.branch,
        sourceRepo: v1.sourceRepo,
        installedAt: v1.installedAt,
        updatedAt: v1.updatedAt,
        installedPaths: v1.installedPaths,
      },
    },
  };
}

// -- Internal -----------------------------------------------------------------

function writeManifestFile(targetDir: string, manifest: ManifestV2): void {
  const manifestPath = path.join(targetDir, MANIFEST_FILE);
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );
}
