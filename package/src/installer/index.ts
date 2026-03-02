import path from "node:path";
import { theme } from "../ui/theme.js";
import {
  copyRecursive,
  ensureDirectory,
  readText,
  writeText,
  makeExecutable,
  findFiles,
  pathExists,
} from "./file-ops.js";
import { cloneSource, getRemoteHeadSha, getRepoInfo } from "./github-source.js";
import {
  transformEntryPointForCopilot,
  stripCursorFrontmatter,
  hasCursorFrontmatter,
  transformTechInstruction,
  TECH_INSTRUCTION_MAPPINGS,
} from "./copilot-adapter.js";
import {
  type Platform,
  type Manifest,
  readManifest,
  writeManifest,
  createManifest,
  updateManifestForUpdate,
} from "./manifest.js";

// ── Types ────────────────────────────────────────────────

export type { Platform } from "./manifest.js";

export interface InstallResult {
  success: boolean;
  platform: Platform;
  filesCopied: number;
  commitSha: string;
  installedPaths: string[];
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  platform: Platform;
  filesCopied: number;
  previousSha: string;
  newSha: string;
  wasUpToDate: boolean;
  installedPaths: string[];
  error?: string;
}

export interface UpdateCheckResult {
  installed: boolean;
  platform?: Platform;
  currentSha?: string;
  latestSha?: string;
  updateAvailable: boolean;
}

// ── Files & directories to install ──────────────────────

/**
 * Directories from the source repo that get installed
 * into the target repository root.
 */
const INSTALL_DIRS = ["main-workflow"];

/**
 * The Cursor entry point file (source path relative to repo root).
 */
const CURSOR_ENTRY_SRC = ".cursor/rules/workflow.mdc";

/**
 * Where the entry point goes for each platform (relative to target root).
 */
const ENTRY_POINTS: Record<Platform, string> = {
  cursor: ".cursor/rules/workflow.mdc",
  copilot: ".github/copilot-instructions.md",
};

/**
 * Source directory for technology instructions (relative to repo root).
 */
const TECH_INSTRUCTIONS_SRC = "main-workflow/Instructions/technology";

/**
 * Copilot path-specific instructions directory (relative to target root).
 */
const COPILOT_INSTRUCTIONS_DIR = ".github/instructions";

// ── Install ─────────────────────────────────────────────

/**
 * Install Fluid Flow Pro into a target repository.
 *
 * 1. Clones the latest from GitHub
 * 2. Copies `main-workflow/` into the target root
 * 3. For Cursor: copies `.cursor/rules/workflow.mdc` as-is
 *    For Copilot: transforms and writes `.github/copilot-instructions.md`
 * 4. For Copilot: strips Cursor frontmatter from all workflow .md files
 * 5. For Copilot: creates .github/instructions/*.instructions.md files
 * 6. Makes bash scripts executable
 * 7. Writes the `.fluid-flow.json` manifest
 */
export async function install(
  targetDir: string,
  platform: Platform
): Promise<InstallResult> {
  const installedPaths: string[] = [];
  let totalFiles = 0;

  // ── Step 1: Clone source ────────────────────────────
  logStep("Downloading latest from GitHub...");
  const source = await cloneSource();

  try {
    // ── Step 2: Copy workflow directories ───────────────
    for (const dir of INSTALL_DIRS) {
      const srcDir = path.join(source.localPath, dir);
      const destDir = path.join(targetDir, dir);

      if (!pathExists(srcDir)) {
        logWarn(`Source directory '${dir}' not found in repo, skipping.`);
        continue;
      }

      logStep(`Copying ${dir}/...`);
      const copied = await copyRecursive(srcDir, destDir);
      totalFiles += copied.length;
      installedPaths.push(dir);
    }

    // ── Step 3: Install entry point ────────────────────
    const entrySourcePath = path.join(source.localPath, CURSOR_ENTRY_SRC);

    if (!pathExists(entrySourcePath)) {
      throw new Error(
        `Entry point '${CURSOR_ENTRY_SRC}' not found in source repository.`
      );
    }

    const entryContent = readText(entrySourcePath);
    const entryDest = path.join(targetDir, ENTRY_POINTS[platform]);

    if (platform === "cursor") {
      logStep("Installing Cursor rule...");
      await writeText(entryDest, entryContent);
    } else {
      logStep("Transforming entry point for GitHub Copilot...");
      const transformed = transformEntryPointForCopilot(entryContent);
      await writeText(entryDest, transformed);
    }

    totalFiles++;
    installedPaths.push(ENTRY_POINTS[platform]);

    // ── Step 4 (Copilot only): Strip Cursor frontmatter ─
    if (platform === "copilot") {
      logStep("Stripping Cursor-specific frontmatter from workflow files...");
      const strippedCount = await stripFrontmatterFromWorkflowFiles(targetDir);
      logInfo(`Cleaned ${strippedCount} files`);
    }

    // ── Step 5 (Copilot only): Create path-specific instructions ─
    if (platform === "copilot") {
      logStep("Creating Copilot path-specific technology instructions...");
      const techCount = await createCopilotTechInstructions(
        source.localPath,
        targetDir
      );
      if (techCount > 0) {
        installedPaths.push(COPILOT_INSTRUCTIONS_DIR);
        totalFiles += techCount;
        logInfo(`Created ${techCount} instruction files in .github/instructions/`);
      }
    }

    // ── Step 6: Make scripts executable ────────────────
    logStep("Setting script permissions...");
    const scripts = findFiles(
      path.join(targetDir, "main-workflow"),
      (f) => f.endsWith(".sh")
    );
    for (const script of scripts) {
      makeExecutable(script);
    }

    // ── Step 7: Write manifest ─────────────────────────
    const repo = getRepoInfo();
    const manifest = createManifest({
      platform,
      commitSha: source.commitSha,
      branch: source.branch,
      sourceRepo: repo.fullName,
      installedPaths,
    });
    writeManifest(targetDir, manifest);

    return {
      success: true,
      platform,
      filesCopied: totalFiles,
      commitSha: source.commitSha,
      installedPaths,
    };
  } finally {
    // Always clean up the temp clone
    source.cleanup();
  }
}

// ── Update ──────────────────────────────────────────────

/**
 * Update an existing Fluid Flow Pro installation.
 *
 * Reads the existing manifest, downloads the latest from GitHub,
 * and replaces all installed files.
 */
export async function update(
  targetDir: string,
  options: { force?: boolean } = {}
): Promise<UpdateResult> {
  const manifest = readManifest(targetDir);

  if (!manifest) {
    throw new Error(
      "No Fluid Flow installation found in this directory.\n" +
        "Run 'ff install' first."
    );
  }

  const platform = manifest.platform;
  const previousSha = manifest.commitSha;

  // ── Check if update is needed ────────────────────────
  if (!options.force) {
    logStep("Checking for updates...");
    const latestSha = getRemoteHeadSha(manifest.branch);

    if (latestSha && latestSha === previousSha) {
      return {
        success: true,
        platform,
        filesCopied: 0,
        previousSha,
        newSha: previousSha,
        wasUpToDate: true,
        installedPaths: manifest.installedPaths,
      };
    }
  }

  // ── Clone and re-install ─────────────────────────────
  logStep("Downloading latest from GitHub...");
  const source = await cloneSource(manifest.branch);
  const installedPaths: string[] = [];
  let totalFiles = 0;

  try {
    // ── Copy workflow directories ──────────────────────
    for (const dir of INSTALL_DIRS) {
      const srcDir = path.join(source.localPath, dir);
      const destDir = path.join(targetDir, dir);

      if (!pathExists(srcDir)) {
        logWarn(`Source directory '${dir}' not found in repo, skipping.`);
        continue;
      }

      logStep(`Updating ${dir}/...`);
      const copied = await copyRecursive(srcDir, destDir, { overwrite: true });
      totalFiles += copied.length;
      installedPaths.push(dir);
    }

    // ── Update entry point ─────────────────────────────
    const entrySourcePath = path.join(source.localPath, CURSOR_ENTRY_SRC);

    if (pathExists(entrySourcePath)) {
      const entryContent = readText(entrySourcePath);
      const entryDest = path.join(targetDir, ENTRY_POINTS[platform]);

      if (platform === "cursor") {
        logStep("Updating Cursor rule...");
        await writeText(entryDest, entryContent);
      } else {
        logStep("Updating Copilot instructions...");
        const transformed = transformEntryPointForCopilot(entryContent);
        await writeText(entryDest, transformed);
      }

      totalFiles++;
      installedPaths.push(ENTRY_POINTS[platform]);
    }

    // ── Copilot-specific post-processing ──────────────
    if (platform === "copilot") {
      logStep("Stripping Cursor-specific frontmatter from workflow files...");
      const strippedCount = await stripFrontmatterFromWorkflowFiles(targetDir);
      logInfo(`Cleaned ${strippedCount} files`);

      logStep("Updating Copilot path-specific technology instructions...");
      const techCount = await createCopilotTechInstructions(
        source.localPath,
        targetDir
      );
      if (techCount > 0) {
        installedPaths.push(COPILOT_INSTRUCTIONS_DIR);
        totalFiles += techCount;
        logInfo(`Updated ${techCount} instruction files`);
      }
    }

    // ── Make scripts executable ────────────────────────
    const scripts = findFiles(
      path.join(targetDir, "main-workflow"),
      (f) => f.endsWith(".sh")
    );
    for (const script of scripts) {
      makeExecutable(script);
    }

    // ── Update manifest ────────────────────────────────
    const updated = updateManifestForUpdate(manifest, {
      commitSha: source.commitSha,
      branch: source.branch,
      installedPaths,
    });
    writeManifest(targetDir, updated);

    return {
      success: true,
      platform,
      filesCopied: totalFiles,
      previousSha,
      newSha: source.commitSha,
      wasUpToDate: false,
      installedPaths,
    };
  } finally {
    source.cleanup();
  }
}

// ── Check ───────────────────────────────────────────────

/**
 * Check if an update is available without performing it.
 */
export function checkForUpdate(targetDir: string): UpdateCheckResult {
  const manifest = readManifest(targetDir);

  if (!manifest) {
    return { installed: false, updateAvailable: false };
  }

  const latestSha = getRemoteHeadSha(manifest.branch);

  return {
    installed: true,
    platform: manifest.platform,
    currentSha: manifest.commitSha,
    latestSha: latestSha ?? undefined,
    updateAvailable: latestSha !== null && latestSha !== manifest.commitSha,
  };
}

// ── Copilot-specific helpers ────────────────────────────

/**
 * Post-process all .md files in main-workflow/ to strip
 * Cursor-specific YAML frontmatter for Copilot installs.
 *
 * Cursor frontmatter fields (name, description, alwaysApply) are
 * meaningless in GitHub Copilot context and should be removed.
 *
 * Returns the number of files that were modified.
 */
async function stripFrontmatterFromWorkflowFiles(
  targetDir: string
): Promise<number> {
  const workflowDir = path.join(targetDir, "main-workflow");
  const mdFiles = findFiles(workflowDir, (f) => f.endsWith(".md"));

  let strippedCount = 0;

  for (const filePath of mdFiles) {
    const content = readText(filePath);

    if (hasCursorFrontmatter(content)) {
      const cleaned = stripCursorFrontmatter(content);
      await writeText(filePath, cleaned);
      strippedCount++;
    }
  }

  return strippedCount;
}

/**
 * Create Copilot path-specific instruction files from the
 * technology instruction sources.
 *
 * Reads from: main-workflow/Instructions/technology/{tech}/general.md
 * Writes to:  .github/instructions/{tech}.instructions.md
 *
 * Each file gets proper Copilot `applyTo` frontmatter so Copilot
 * automatically loads the right instructions when working with
 * matching file types.
 *
 * Reference:
 * https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#creating-path-specific-custom-instructions
 *
 * Returns the number of instruction files created.
 */
async function createCopilotTechInstructions(
  sourceDir: string,
  targetDir: string
): Promise<number> {
  const instructionsDir = path.join(targetDir, COPILOT_INSTRUCTIONS_DIR);
  await ensureDirectory(instructionsDir);

  let created = 0;

  for (const mapping of TECH_INSTRUCTION_MAPPINGS) {
    const srcPath = path.join(
      sourceDir,
      TECH_INSTRUCTIONS_SRC,
      mapping.sourceRelPath
    );

    if (!pathExists(srcPath)) {
      continue;
    }

    const content = readText(srcPath);
    const transformed = transformTechInstruction(content, mapping.applyTo);
    const destPath = path.join(instructionsDir, mapping.instructionFileName);

    await writeText(destPath, transformed);
    created++;
  }

  return created;
}

// ── Logging helpers ─────────────────────────────────────

function logStep(message: string): void {
  console.log(`  ${theme.brandBright("→")} ${theme.text(message)}`);
}

function logInfo(message: string): void {
  console.log(`    ${theme.textSecondary(message)}`);
}

function logWarn(message: string): void {
  console.log(`  ${theme.textWarning("⚠")} ${theme.textWarning(message)}`);
}
