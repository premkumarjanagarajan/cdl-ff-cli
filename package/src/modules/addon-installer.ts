/**
 * Addon Installer Module
 *
 * Installs domain-specific addon rule files into the target repository.
 * Follows the same pattern as the main workflow installer:
 *
 *   Source (.mdc) -> .cursor/rules/{name}.mdc          (copied as-is)
 *   Source (.mdc) -> .github/instructions/{name}.instructions.md  (frontmatter stripped)
 */

import fs from "node:fs";
import path from "node:path";
import { theme } from "../ui/theme.js";
import { ensureDirectory } from "../installer/file-ops.js";
import { stripCursorFrontmatter } from "../installer/copilot-adapter.js";
import type { DiscoveredAddon } from "../workflows/types.js";

export interface AddonInstallResult {
  addonId: string;
  addonName: string;
  filesCopied: number;
  installedPaths: string[];
}

/**
 * Install a single addon's rule files into the target repo.
 * Follows the same dual-platform pattern as the main workflow installer.
 */
export async function installAddonRules(
  addon: DiscoveredAddon,
  targetDir: string
): Promise<AddonInstallResult> {
  const rulesDir = addon.manifest.rulesDir ?? "rules";
  const rulesPath = path.join(addon.localPath, rulesDir);

  if (!fs.existsSync(rulesPath) || !fs.statSync(rulesPath).isDirectory()) {
    console.log(
      `  ${theme.textWarning("!")} Addon "${addon.manifest.name}" has no rules directory: ${rulesDir}`
    );
    return {
      addonId: addon.manifest.id,
      addonName: addon.manifest.name,
      filesCopied: 0,
      installedPaths: [],
    };
  }

  const installedPaths: string[] = [];
  let filesCopied = 0;

  const ruleFiles = findRuleFiles(rulesPath);

  console.log(
    `  ${theme.brandBright("\u2192")} ${theme.text(`Installing addon: ${addon.manifest.name} (${ruleFiles.length} rule files)...`)}`
  );

  for (const ruleFile of ruleFiles) {
    const content = fs.readFileSync(ruleFile, "utf-8");
    const baseName = path.basename(ruleFile, path.extname(ruleFile));

    // Cursor: copy .mdc files as-is to .cursor/rules/
    if (ruleFile.endsWith(".mdc")) {
      const cursorTarget = path.join(targetDir, ".cursor", "rules", path.basename(ruleFile));
      await ensureDirectory(path.dirname(cursorTarget));
      fs.writeFileSync(cursorTarget, content, "utf-8");
      installedPaths.push(`.cursor/rules/${path.basename(ruleFile)}`);
      filesCopied++;
    }

    // Copilot: strip frontmatter, write to .github/instructions/
    const cleanContent = stripCursorFrontmatter(content).replace(/^\n+/, "");
    const copilotFileName = `${baseName}.instructions.md`;
    const copilotTarget = path.join(targetDir, ".github", "instructions", copilotFileName);
    await ensureDirectory(path.dirname(copilotTarget));
    fs.writeFileSync(copilotTarget, cleanContent, "utf-8");
    installedPaths.push(`.github/instructions/${copilotFileName}`);
    filesCopied++;
  }

  return {
    addonId: addon.manifest.id,
    addonName: addon.manifest.name,
    filesCopied,
    installedPaths,
  };
}

/**
 * Install multiple addons. Returns results for each addon.
 */
export async function installAllAddonRules(
  addons: DiscoveredAddon[],
  targetDir: string
): Promise<AddonInstallResult[]> {
  const results: AddonInstallResult[] = [];
  for (const addon of addons) {
    results.push(await installAddonRules(addon, targetDir));
  }
  return results;
}

/**
 * Load MCP server definitions from an addon's mcp.json file.
 * Returns empty object if no MCP config exists for the addon.
 */
export function loadAddonMcpServers(
  addon: DiscoveredAddon
): Record<string, unknown> {
  if (!addon.manifest.mcp) return {};

  const mcpPath = path.join(addon.localPath, addon.manifest.mcp);
  if (!fs.existsSync(mcpPath)) return {};

  try {
    const raw = fs.readFileSync(mcpPath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.warn(`  Warning: Failed to parse MCP config for addon "${addon.manifest.id}"`);
    return {};
  }
}

/**
 * Aggregate MCP servers from multiple addons into a single record.
 */
export function loadAllAddonMcpServers(
  addons: DiscoveredAddon[]
): Record<string, unknown> {
  const servers: Record<string, unknown> = {};
  for (const addon of addons) {
    Object.assign(servers, loadAddonMcpServers(addon));
  }
  return servers;
}

// -- Internal -----------------------------------------------------------------

/** Recursively find all .mdc and .md rule files in a directory. */
function findRuleFiles(dir: string): string[] {
  const results: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRuleFiles(fullPath));
    } else if (entry.name.endsWith(".mdc") || entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results.sort();
}
