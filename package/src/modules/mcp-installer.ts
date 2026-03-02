/**
 * MCP Installer Module
 *
 * Loads MCP server definitions from a workflow's JSON config file
 * and delegates to the MCP setup infrastructure. Each workflow can
 * have its own MCP configuration (e.g. dev-mcp.json, product-mcp.json).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WorkflowConfig, McpTarget, McpSetupResult } from "../workflows/types.js";
import type { McpServerDef } from "../installer/mcp-setup.js";
import {
  analyzeExistingConfig as analyzeExistingConfigBase,
  buildCursorServerEntry,
  buildVSCodeServerEntry,
  checkPrerequisites,
  installPrerequisite,
  generateVSCodeSettings,
  type ConfigAnalysis,
  type SetupOptions,
} from "../installer/mcp-setup.js";
import { ensureDirectory, pathExists } from "../installer/file-ops.js";
import { theme } from "../ui/theme.js";

// Re-export types needed by consumers
export type { ConfigAnalysis } from "../installer/mcp-setup.js";

// -- Load MCP config from JSON ------------------------------------------------

/**
 * Load MCP server definitions from a workflow's JSON config file.
 * The configFile path is relative to the ff-cli package root.
 */
export function loadMcpServers(config: WorkflowConfig): Record<string, McpServerDef> {
  if (!config.mcp?.configFile) {
    return {};
  }

  // Resolve relative to the package root (two levels up from this file)
  const thisFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(thisFile), "..", "..");
  const configPath = path.join(packageRoot, config.mcp.configFile);

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `MCP config file not found: ${config.mcp.configFile}\n` +
      `Expected at: ${configPath}`
    );
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as Record<string, McpServerDef>;
  } catch (err) {
    throw new Error(
      `Failed to parse MCP config: ${config.mcp.configFile}\n` +
      `${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// -- Analyze ------------------------------------------------------------------

/**
 * Analyze existing MCP config for a workflow, using the workflow's
 * server definitions instead of the global hardcoded ones.
 */
export function analyzeWorkflowMcpConfig(
  config: WorkflowConfig,
  targetDir: string,
  platform: "cursor" | "copilot"
): ConfigAnalysis {
  const servers = loadMcpServers(config);
  const configKey = platform === "cursor" ? "mcpServers" : "servers";
  const relativePath = platform === "cursor" ? ".cursor/mcp.json" : ".vscode/mcp.json";
  const filePath = path.join(targetDir, relativePath);

  let existingServerNames: string[] = [];

  if (pathExists(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(stripJsonComments(raw));
      const section = (parsed[configKey] ?? {}) as Record<string, unknown>;
      existingServerNames = Object.keys(section);
    } catch {
      // Can't parse, treat as empty
    }
  }

  const ourServerNames = Object.keys(servers);
  const alreadyConfiguredNames = ourServerNames.filter((n) => existingServerNames.includes(n));
  const newServerNames = ourServerNames.filter((n) => !existingServerNames.includes(n));
  const userCustomServers = existingServerNames.filter((n) => !ourServerNames.includes(n));

  const newEntries: Record<string, unknown> = {};
  for (const name of newServerNames) {
    const def = servers[name]!;
    newEntries[name] = platform === "cursor"
      ? buildCursorServerEntry(def)
      : buildVSCodeServerEntry(def);
  }

  return {
    hasExistingConfig: pathExists(filePath) && existingServerNames.length > 0,
    filePath,
    relativePath,
    platform,
    existingServerNames,
    alreadyConfiguredNames,
    newServerNames,
    userCustomServers,
    newEntriesJson: JSON.stringify(newEntries, null, 2),
  };
}

/**
 * Analyze all MCP targets for a workflow.
 */
export function analyzeAllWorkflowTargets(
  config: WorkflowConfig,
  targetDir: string,
  target: McpTarget
): ConfigAnalysis[] {
  const analyses: ConfigAnalysis[] = [];
  if (target === "cursor" || target === "both") {
    analyses.push(analyzeWorkflowMcpConfig(config, targetDir, "cursor"));
  }
  if (target === "copilot" || target === "both") {
    analyses.push(analyzeWorkflowMcpConfig(config, targetDir, "copilot"));
  }
  return analyses;
}

// -- Setup --------------------------------------------------------------------

/**
 * Configure MCP servers for a specific workflow.
 * Reads server definitions from the workflow's JSON config file.
 */
export async function setupWorkflowMcp(
  config: WorkflowConfig,
  options: SetupOptions
): Promise<McpSetupResult> {
  const { target, targetDir, force = false, skipPrereqs = false } = options;
  const servers = loadMcpServers(config);
  const filesWritten: string[] = [];
  const prerequisitesMissing: string[] = [];
  const prerequisitesInstalled: string[] = [];
  let totalAdded = 0;
  let totalSkipped = 0;

  // Step 1: Check prerequisites
  if (!skipPrereqs) {
    logStep("Checking prerequisites...");
    const checks = checkPrerequisites();

    for (const check of checks) {
      if (check.available) {
        logInfo(`${check.name}: ${theme.textSuccess("\u2713")} ${theme.textSecondary(check.version ?? "")}`);
      } else {
        logInfo(`${check.name}: ${theme.textWarning("\u2717")} ${theme.textWarning("not found")}`);
        const installed = installPrerequisite(check);
        if (installed) {
          prerequisitesInstalled.push(check.name);
        } else {
          prerequisitesMissing.push(check.name);
          for (const instruction of check.installInstructions) {
            console.log(theme.textSecondary(`    ${instruction}`));
          }
        }
      }
    }
  }

  // Step 2: Write Cursor config
  if (target === "cursor" || target === "both") {
    const analysis = analyzeWorkflowMcpConfig(config, targetDir, "cursor");
    const serversToAdd = force ? Object.keys(servers) : analysis.newServerNames;

    if (serversToAdd.length === 0 && !force) {
      logStep(`All MCP servers already configured in ${theme.path(analysis.relativePath)}`);
      totalSkipped += analysis.alreadyConfiguredNames.length;
    } else {
      logStep("Configuring MCP servers for Cursor...");
      const mcpServers: Record<string, unknown> = {};
      for (const name of (force ? Object.keys(servers) : serversToAdd)) {
        mcpServers[name] = buildCursorServerEntry(servers[name]!);
      }
      const cursorConfig = { mcpServers };
      mergeJsonFile(analysis.filePath, cursorConfig, "mcpServers");
      totalAdded += serversToAdd.length;
      totalSkipped += analysis.alreadyConfiguredNames.length;
      filesWritten.push(analysis.relativePath);
      logInfo(`Written: ${theme.path(analysis.relativePath)}`);
    }
  }

  // Step 3: Write VS Code config
  if (target === "copilot" || target === "both") {
    const analysis = analyzeWorkflowMcpConfig(config, targetDir, "copilot");
    const serversToAdd = force ? Object.keys(servers) : analysis.newServerNames;

    if (serversToAdd.length === 0 && !force) {
      logStep(`All MCP servers already configured in ${theme.path(analysis.relativePath)}`);
      totalSkipped += analysis.alreadyConfiguredNames.length;
    } else {
      logStep("Configuring MCP servers for VS Code / GitHub Copilot...");
      const vscodeServers: Record<string, unknown> = {};
      const inputs: Array<Record<string, unknown>> = [];
      let needsGitHubPat = false;

      for (const name of (force ? Object.keys(servers) : serversToAdd)) {
        const def = servers[name]!;
        vscodeServers[name] = buildVSCodeServerEntry(def);
        if (def.env && Object.values(def.env).includes("__GITHUB_PAT__")) {
          needsGitHubPat = true;
        }
      }

      const vscodeConfig: Record<string, unknown> = {};
      if (needsGitHubPat) {
        inputs.push({
          type: "promptString",
          id: "github-pat",
          description: "GitHub Personal Access Token",
          password: true,
        });
        vscodeConfig.inputs = inputs;
      }
      vscodeConfig.servers = vscodeServers;

      mergeJsonFile(analysis.filePath, vscodeConfig, "servers");
      totalAdded += serversToAdd.length;
      totalSkipped += analysis.alreadyConfiguredNames.length;
      filesWritten.push(analysis.relativePath);
      logInfo(`Written: ${theme.path(analysis.relativePath)}`);

      // Update settings.json
      logStep("Updating VS Code settings for MCP support...");
      const settingsPath = path.join(targetDir, ".vscode", "settings.json");
      mergeJsonFile(settingsPath, generateVSCodeSettings());
      filesWritten.push(".vscode/settings.json");
    }
  }

  return {
    target,
    serversAdded: totalAdded,
    serversSkipped: totalSkipped,
    filesWritten,
    prerequisitesMissing,
    prerequisitesInstalled,
  };
}

// -- Helpers ------------------------------------------------------------------

function stripJsonComments(str: string): string {
  return str.replace(
    /("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (match, stringLiteral: string | undefined) =>
      stringLiteral !== undefined ? match : ""
  );
}

function mergeJsonFile(
  filePath: string,
  newConfig: Record<string, unknown>,
  mergeKey?: string
): void {
  let existing: Record<string, unknown> = {};

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      existing = JSON.parse(stripJsonComments(raw));
    } catch {
      existing = {};
    }
  }

  if (mergeKey) {
    const existingSection = (existing[mergeKey] as Record<string, unknown>) ?? {};
    const newSection = (newConfig[mergeKey] as Record<string, unknown>) ?? {};
    existing[mergeKey] = { ...existingSection, ...newSection };

    for (const [key, value] of Object.entries(newConfig)) {
      if (key === mergeKey) continue;
      if (key === "inputs" && Array.isArray(existing[key])) {
        const existingInputs = existing[key] as Array<{ id: string }>;
        const newInputs = value as Array<{ id: string }>;
        const existingIds = new Set(existingInputs.map((i) => i.id));
        for (const input of newInputs) {
          if (!existingIds.has(input.id)) {
            existingInputs.push(input);
          }
        }
      } else {
        existing[key] = value;
      }
    }
  } else {
    existing = { ...existing, ...newConfig };
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
}

// -- Logging ------------------------------------------------------------------

function logStep(message: string): void {
  console.log(`  ${theme.brandBright("\u2192")} ${theme.text(message)}`);
}

function logInfo(message: string): void {
  console.log(`    ${message}`);
}
