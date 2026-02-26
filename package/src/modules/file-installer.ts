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
 * Resolve which directories to install.
 * If explicit directories are configured, use those.
 * Otherwise, auto-discover all directories from the cloned repo root.
 */
export function resolveDirectories(config: WorkflowConfig, clonePath: string): string[] {
  const explicit = config.install.directories;
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  // Auto-discover: all directories at the repo root, minus ignored entries
  return fs.readdirSync(clonePath)
    .filter((name) => {
      if (IGNORED_ENTRIES.has(name)) return false;
      const fullPath = path.join(clonePath, name);
      return fs.statSync(fullPath).isDirectory();
    });
}

/**
 * Copy workflow directories from the cloned source into the target repo.
 */
export async function installFiles(
  config: WorkflowConfig,
  targetDir: string,
  clonePath: string
): Promise<FileInstallResult> {
  const directories = resolveDirectories(config, clonePath);
  const installedPaths: string[] = [];
  let totalFiles = 0;

  for (const dir of directories) {
    const srcDir = path.join(clonePath, dir);
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
 */
export async function updateFiles(
  config: WorkflowConfig,
  targetDir: string,
  clonePath: string
): Promise<FileInstallResult> {
  const directories = resolveDirectories(config, clonePath);
  const installedPaths: string[] = [];
  let totalFiles = 0;

  for (const dir of directories) {
    const srcDir = path.join(clonePath, dir);
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
