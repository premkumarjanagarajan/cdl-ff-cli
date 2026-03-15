/**
 * Addon Discovery Module
 *
 * Scans the cloned source repository's addons/ directory for
 * domain-specific addon packages. Each subdirectory containing
 * an addon.json manifest is a discoverable addon.
 */

import fs from "node:fs";
import path from "node:path";
import type { AddonManifest, DiscoveredAddon } from "../workflows/types.js";

/** Expected directory name in the source repo root. */
const ADDONS_DIR = "addons";

/** Expected manifest file name within each addon directory. */
const ADDON_MANIFEST_FILE = "addon.json";

/**
 * Discover all addons available in the cloned source repository.
 * Returns an empty array if no addons/ directory exists.
 * Addons are sorted alphabetically by name.
 */
export function discoverAddons(clonePath: string): DiscoveredAddon[] {
  const addonsDir = path.join(clonePath, ADDONS_DIR);

  if (!fs.existsSync(addonsDir) || !fs.statSync(addonsDir).isDirectory()) {
    return [];
  }

  const entries = fs.readdirSync(addonsDir);
  const addons: DiscoveredAddon[] = [];

  for (const entry of entries) {
    const addonDir = path.join(addonsDir, entry);

    if (!fs.statSync(addonDir).isDirectory()) continue;

    const manifestPath = path.join(addonDir, ADDON_MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(raw) as AddonManifest;

      if (!manifest.id || !manifest.name) {
        console.warn(`  Warning: Skipping addon "${entry}" — missing id or name in addon.json`);
        continue;
      }

      addons.push({ manifest, localPath: addonDir });
    } catch {
      console.warn(`  Warning: Skipping addon "${entry}" — invalid addon.json`);
    }
  }

  return addons.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

/**
 * Filter discovered addons to only those matching the given IDs.
 * Preserves the order of the input IDs.
 */
export function filterAddonsById(
  addons: DiscoveredAddon[],
  ids: string[]
): DiscoveredAddon[] {
  return ids
    .map((id) => addons.find((a) => a.manifest.id === id))
    .filter((a): a is DiscoveredAddon => a !== undefined);
}

/**
 * Validate a list of addon IDs against discovered addons.
 * Returns { valid, invalid } partition.
 */
export function validateAddonIds(
  addons: DiscoveredAddon[],
  requestedIds: string[]
): { valid: string[]; invalid: string[] } {
  const knownIds = new Set(addons.map((a) => a.manifest.id));
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of requestedIds) {
    if (knownIds.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}
