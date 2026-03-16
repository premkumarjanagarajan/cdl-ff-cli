/**
 * Workspace Create Command
 *
 * CLI handler for: ff workspace create <name>
 *
 * Creates an empty workspace folder, installs Fluid Flow into it,
 * and opens it in VS Code. The user then uses Copilot chat to
 * do catalog-guided workspace setup.
 */

import path from "node:path";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { theme } from "../ui/theme.js";
import { renderBox } from "../ui/box.js";
import { requireWorkflow } from "../workflows/registry.js";
import { cloneSource, getRepoInfo } from "../installer/github-source.js";
import { installFiles } from "../modules/file-installer.js";
import { installEntryPoint } from "../modules/entry-point.js";
import {
  writeWorkflowManifest,
  createManifestEntry,
} from "../modules/manifest.js";

export async function runWorkspaceCreateCLI(args: string[]): Promise<void> {
  const name = args[0];

  if (!name) {
    console.error(theme.textError("  Missing workspace name."));
    console.error(theme.hint("  Usage: ff workspace create <name>"));
    console.error(theme.hint("  Example: ff workspace create sbbonus"));
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), name);

  if (fs.existsSync(targetDir)) {
    console.error(theme.textError(`  Directory already exists: ${name}`));
    console.error(theme.hint("  Choose a different name or remove the existing directory."));
    process.exit(1);
  }

  console.log();
  console.log(renderBox([
    "",
    theme.brandBold("  Creating Fluid Flow Workspace"),
    "",
    `  ${theme.textSecondary("Name:")}      ${theme.text(name)}`,
    `  ${theme.textSecondary("Location:")}  ${theme.path(targetDir)}`,
    "",
  ], { title: "Workspace Create", minWidth: 55 }));
  console.log();

  // 1. Create directory
  console.log(theme.hint("  > Creating directory..."));
  fs.mkdirSync(targetDir, { recursive: true });

  // 2. Initialize git
  console.log(theme.hint("  > Initializing git repository..."));
  execSync("git init", { cwd: targetDir, stdio: "pipe" });

  // 3. Install Fluid Flow files (same as ff install dev)
  console.log(theme.hint("  > Installing Fluid Flow..."));
  const config = requireWorkflow("dev");
  const { localPath, commitSha } = await cloneSource(config.source.branch, config.source);

  const copyResult = await installFiles(config, targetDir, localPath);
  await installEntryPoint(config, targetDir, localPath);

  // 4. Write manifest
  const repoInfo = getRepoInfo(config.source);
  const manifestEntry = createManifestEntry({
    platform: "both",
    commitSha,
    branch: config.source.branch,
    sourceRepo: repoInfo.fullName,
    installedPaths: copyResult.installedPaths,
  });
  writeWorkflowManifest(targetDir, config.id, manifestEntry);

  console.log(theme.textSuccess("  [OK] Fluid Flow installed"));

  // 5. Create .code-workspace file so VS Code opens as a proper workspace
  const workspaceFile = path.join(targetDir, `${name}.code-workspace`);
  console.log(theme.hint(`  > Creating ${name}.code-workspace...`));
  fs.writeFileSync(workspaceFile, JSON.stringify({
    folders: [
      { name, path: "." },
    ],
    settings: {},
  }, null, 2));
  console.log(theme.textSuccess("  [OK] Workspace file created"));

  // 6. Open the .code-workspace file in VS Code (not the folder)
  console.log(theme.hint("  > Opening in VS Code..."));
  try {
    execSync(`code "${workspaceFile}"`, { stdio: "pipe" });
    console.log(theme.textSuccess("  [OK] VS Code opened"));
  } catch {
    console.log(theme.textMuted("  Could not open VS Code automatically."));
    console.log(theme.hint(`  Open manually: code "${workspaceFile}"`));
  }

  // 6. Done
  console.log();
  console.log(renderBox([
    "",
    theme.textSuccess("  Fluid Flow Workspace created!"),
    "",
    `  ${theme.textSecondary("Next steps:")}`,
    "",
    `  1. In VS Code, open Copilot Chat`,
    `  2. Say: ${theme.command('"Create a FF workspace"')}`,
    `  3. Fluid Flow will guide you to select repos`,
    `     from the domain catalog, clone them, and`,
    `     generate ff-workspace.yaml`,
    "",
    `  ${theme.textSecondary("If you have a domain catalog:")}`,
    `  Copy it into ${theme.path(name + "/")} before starting.`,
    "",
  ], { title: "Done", minWidth: 55 }));
  console.log();
}
