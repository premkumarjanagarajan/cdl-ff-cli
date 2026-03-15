/**
 * File Installer Module
 *
 * Generic module that copies workflow files from a cloned source into
 * the target repository. Driven entirely by WorkflowConfig -- no
 * hardcoded paths.
 *
 * When `config.install.directories` is omitted or empty, all directories
 * from the repo root are copied automatically (excluding .git and metadata).
 */

import fs from "node:fs";
import path from "node:path";
import { theme } from "../ui/theme.js";
import {
  copyRecursive,
  pathExists,
  findFiles,
  makeExecutable,
} from "../installer/file-ops.js";
import type { WorkflowConfig } from "../workflows/types.js";

/** Entries to always skip when auto-discovering directories. */
const IGNORED_ENTRIES = new Set([".git", ".gitignore", ".github", "README.md", "LICENSE"]);

export interface FileInstallResult {
  filesCopied: number;
  installedPaths: string[];
}

/**
 * Resolve the effective source root path within the cloned repo.
 * If sourceRoot is configured, returns clonePath/sourceRoot.
 * Otherwise, returns clonePath (repo root).
 */
export function resolveSourceRoot(config: WorkflowConfig, clonePath: string): string {
  const sourceRoot = config.install.sourceRoot;
  if (sourceRoot) {
    return path.join(clonePath, sourceRoot);
  }
  return clonePath;
}

/**
 * Resolve which directories to install.
 * If explicit directories are configured, use those.
 * Otherwise, auto-discover all directories from the source root.
 */
export function resolveDirectories(config: WorkflowConfig, clonePath: string): string[] {
  const explicit = config.install.directories;
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  // Auto-discover: all directories at the source root, minus ignored entries
  const sourceRoot = resolveSourceRoot(config, clonePath);
  return fs.readdirSync(sourceRoot)
    .filter((name) => {
      if (IGNORED_ENTRIES.has(name)) return false;
      const fullPath = path.join(sourceRoot, name);
      return fs.statSync(fullPath).isDirectory();
    });
}

/**
 * Copy workflow directories from the cloned source into the target repo.
 * When sourceRoot is configured, source paths resolve from sourceRoot
 * but install to the target root using just the directory basename.
 */
export async function installFiles(
  config: WorkflowConfig,
  targetDir: string,
  clonePath: string
): Promise<FileInstallResult> {
  const sourceRoot = resolveSourceRoot(config, clonePath);
  const directories = resolveDirectories(config, clonePath);
  const installedPaths: string[] = [];
  let totalFiles = 0;

  for (const dir of directories) {
    const srcDir = path.join(sourceRoot, dir);
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

  // Copy individual root files
  if (config.install.rootFiles) {
    for (const file of config.install.rootFiles) {
      const srcPath = path.join(sourceRoot, file);
      const destPath = path.join(targetDir, file);

      if (!pathExists(srcPath)) {
        logWarn(`Source file '${file}' not found in repo, skipping.`);
        continue;
      }

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      totalFiles++;
      installedPaths.push(file);
      logStep(`Copying ${file}`);
    }
  }

  // Create any configured empty directories
  if (config.install.createDirectories) {
    for (const dir of config.install.createDirectories) {
      const dirPath = path.join(targetDir, dir);
      fs.mkdirSync(dirPath, { recursive: true });
      logStep(`Created ${dir}/`);
    }
  }

  // Process template files
  if (config.install.templateFiles) {
    for (const tmpl of config.install.templateFiles) {
      const srcPath = path.join(sourceRoot, tmpl.source);
      const destPath = path.join(targetDir, tmpl.target);

      if (!pathExists(srcPath)) {
        logWarn(`Template '${tmpl.source}' not found, skipping.`);
        continue;
      }

      // Ensure parent directory exists
      fs.mkdirSync(path.dirname(destPath), { recursive: true });

      // Copy template (tokens left for user to fill)
      fs.copyFileSync(srcPath, destPath);
      totalFiles++;
      installedPaths.push(tmpl.target);
      logStep(`Created ${tmpl.target} (from template)`);
    }
  }

  // Make scripts executable
  const extensions = config.install.executableExtensions ?? [".sh"];
  for (const dir of directories) {
    const dirPath = path.join(targetDir, dir);
    if (!pathExists(dirPath)) continue;

    const scripts = findFiles(dirPath, (f) =>
      extensions.some((ext) => f.endsWith(ext))
    );
    for (const script of scripts) {
      makeExecutable(script);
    }
  }

  if (extensions.length > 0) {
    logStep("Setting script permissions...");
  }

  return { filesCopied: totalFiles, installedPaths };
}

/**
 * Update workflow directories (overwrite existing).
 * Template files are NOT overwritten during updates to preserve user edits.
 */
export async function updateFiles(
  config: WorkflowConfig,
  targetDir: string,
  clonePath: string
): Promise<FileInstallResult> {
  const sourceRoot = resolveSourceRoot(config, clonePath);
  const directories = resolveDirectories(config, clonePath);
  const installedPaths: string[] = [];
  let totalFiles = 0;

  for (const dir of directories) {
    const srcDir = path.join(sourceRoot, dir);
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

  // Copy individual root files (these ARE updated, unlike templateFiles)
  if (config.install.rootFiles) {
    for (const file of config.install.rootFiles) {
      const srcPath = path.join(sourceRoot, file);
      const destPath = path.join(targetDir, file);

      if (!pathExists(srcPath)) {
        logWarn(`Source file '${file}' not found in repo, skipping.`);
        continue;
      }

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      totalFiles++;
      installedPaths.push(file);
      logStep(`Updating ${file}`);
    }
  }

  // Template files are NOT updated — they contain user-specific values
  // (manifest.yaml, CLAUDE.md, AGENTS.md). Users update these manually.

  // Make scripts executable
  const extensions = config.install.executableExtensions ?? [".sh"];
  for (const dir of directories) {
    const dirPath = path.join(targetDir, dir);
    if (!pathExists(dirPath)) continue;

    const scripts = findFiles(dirPath, (f) =>
      extensions.some((ext) => f.endsWith(ext))
    );
    for (const script of scripts) {
      makeExecutable(script);
    }
  }

  return { filesCopied: totalFiles, installedPaths };
}

// -- Logging ------------------------------------------------------------------

function logStep(message: string): void {
  console.log(`  ${theme.brandBright("\u2192")} ${theme.text(message)}`);
}

function logWarn(message: string): void {
  console.log(`  ${theme.textWarning("\u26a0")} ${theme.textWarning(message)}`);
}
