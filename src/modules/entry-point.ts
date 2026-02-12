/**
 * Entry Point Installer Module
 *
 * Installs IDE entry point files for both Cursor and VS Code (GitHub Copilot).
 * Always installs both platforms — no user choice required.
 * Driven by WorkflowConfig.install.entryPoints configuration.
 */

import path from "node:path";
import { theme } from "../ui/theme.js";
import {
  pathExists,
  readText,
  writeText,
  ensureDirectory,
  findFiles,
} from "../installer/file-ops.js";
import {
  transformEntryPointForCopilot,
  stripCursorFrontmatter,
  hasCursorFrontmatter,
  transformTechInstruction,
  TECH_INSTRUCTION_MAPPINGS,
} from "../installer/copilot-adapter.js";
import type { WorkflowConfig } from "../workflows/types.js";

export interface EntryPointResult {
  filesCopied: number;
  installedPaths: string[];
}

/**
 * Install entry points for both Cursor and VS Code (GitHub Copilot).
 * Installs the Cursor rule (.mdc) and the Copilot instructions (.md) in one pass.
 */
export async function installEntryPoint(
  config: WorkflowConfig,
  targetDir: string,
  clonePath: string
): Promise<EntryPointResult> {
  const installedPaths: string[] = [];
  let filesCopied = 0;

  // Install Cursor entry point
  const cursorResult = await installSinglePlatformEntry(config, "cursor", targetDir, clonePath);
  filesCopied += cursorResult.filesCopied;
  installedPaths.push(...cursorResult.installedPaths);

  // Install Copilot entry point (with transforms)
  const copilotResult = await installSinglePlatformEntry(config, "copilot", targetDir, clonePath);
  filesCopied += copilotResult.filesCopied;
  installedPaths.push(...copilotResult.installedPaths);

  return { filesCopied, installedPaths };
}

// -- Single-platform installer (private) --------------------------------------

/**
 * Install the entry point for a single platform.
 * Called internally for each platform — not exported.
 */
async function installSinglePlatformEntry(
  config: WorkflowConfig,
  platform: "cursor" | "copilot",
  targetDir: string,
  clonePath: string
): Promise<EntryPointResult> {
  const entryConfig = config.install.entryPoints[platform];
  const installedPaths: string[] = [];
  let filesCopied = 0;

  if (!entryConfig) {
    logWarn(`No entry point configured for platform: ${platform}`);
    return { filesCopied: 0, installedPaths: [] };
  }

  const entrySourcePath = path.join(clonePath, entryConfig.source);

  if (!pathExists(entrySourcePath)) {
    throw new Error(
      `Entry point '${entryConfig.source}' not found in source repository.`
    );
  }

  const entryContent = readText(entrySourcePath);
  const entryDest = path.join(targetDir, entryConfig.target);

  // Ensure parent directory exists
  await ensureDirectory(path.dirname(entryDest));

  if (entryConfig.transform === "copilot") {
    logStep("Transforming entry point for GitHub Copilot...");
    const transformed = transformEntryPointForCopilot(entryContent);
    await writeText(entryDest, transformed);
  } else {
    logStep(`Installing ${platform === "cursor" ? "Cursor rule" : "entry point"}...`);
    await writeText(entryDest, entryContent);
  }

  filesCopied++;
  installedPaths.push(entryConfig.target);

  // Copilot-specific post-processing
  if (platform === "copilot") {
    // Strip Cursor frontmatter from all workflow .md files
    const strippedCount = await stripFrontmatterFromWorkflowFiles(
      config,
      targetDir
    );
    if (strippedCount > 0) {
      logInfo(`Cleaned Cursor frontmatter from ${strippedCount} files`);
    }

    // Create Copilot tech instructions if configured
    if (config.install.techInstructions) {
      const techCount = await createCopilotTechInstructions(
        config,
        clonePath,
        targetDir
      );
      if (techCount > 0) {
        installedPaths.push(config.install.techInstructions.targetDir);
        filesCopied += techCount;
        logInfo(`Created ${techCount} instruction files`);
      }
    }
  }

  return { filesCopied, installedPaths };
}

// -- Copilot helpers ----------------------------------------------------------

async function stripFrontmatterFromWorkflowFiles(
  config: WorkflowConfig,
  targetDir: string
): Promise<number> {
  let strippedCount = 0;

  for (const dir of config.install.directories) {
    const workflowDir = path.join(targetDir, dir);
    if (!pathExists(workflowDir)) continue;

    const mdFiles = findFiles(workflowDir, (f) => f.endsWith(".md"));

    for (const filePath of mdFiles) {
      const content = readText(filePath);
      if (hasCursorFrontmatter(content)) {
        const cleaned = stripCursorFrontmatter(content);
        await writeText(filePath, cleaned);
        strippedCount++;
      }
    }
  }

  return strippedCount;
}

async function createCopilotTechInstructions(
  config: WorkflowConfig,
  sourceDir: string,
  targetDir: string
): Promise<number> {
  const techConfig = config.install.techInstructions;
  if (!techConfig) return 0;

  const instructionsDir = path.join(targetDir, techConfig.targetDir);
  await ensureDirectory(instructionsDir);

  let created = 0;

  for (const mapping of TECH_INSTRUCTION_MAPPINGS) {
    const srcPath = path.join(sourceDir, techConfig.sourceDir, mapping.sourceRelPath);

    if (!pathExists(srcPath)) continue;

    const content = readText(srcPath);
    const transformed = transformTechInstruction(content, mapping.applyTo);
    const destPath = path.join(instructionsDir, mapping.instructionFileName);

    await writeText(destPath, transformed);
    created++;
  }

  return created;
}

// -- Logging ------------------------------------------------------------------

function logStep(message: string): void {
  console.log(`  ${theme.brandBright("\u2192")} ${theme.text(message)}`);
}

function logInfo(message: string): void {
  console.log(`    ${theme.textSecondary(message)}`);
}

function logWarn(message: string): void {
  console.log(`  ${theme.textWarning("\u26a0")} ${theme.textWarning(message)}`);
}
