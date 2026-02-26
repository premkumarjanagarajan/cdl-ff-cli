/**
 * MCP Setup
 *
 * Configures Model Context Protocol (MCP) servers for AI coding assistants.
 * Supports two target platforms with different configuration formats:
 *
 *  - Cursor:              .cursor/mcp.json   (mcpServers key)
 *  - VS Code / Copilot:   .vscode/mcp.json   (servers key + inputs)
 *                         .vscode/settings.json (MCP-related settings)
 *
 * Non-destructive by default:
 *  - Analyzes existing config before writing
 *  - Only adds servers that are not already configured
 *  - Never removes or overwrites existing user-defined servers
 *
 * Reference:
 *  - Cursor:    https://cursor.com/docs/context/mcp
 *  - VS Code:   https://code.visualstudio.com/docs/copilot/customization/mcp-servers
 */

import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { theme } from "../ui/theme.js";
import { ensureDirectory, pathExists } from "./file-ops.js";

// ── Types ────────────────────────────────────────────────

export type McpTarget = "cursor" | "copilot" | "both";

export interface McpServerDef {
  /** Shell command to start the server (e.g. "npx", "uvx"). */
  command: string;
  /** Arguments passed to the command. */
  args: string[];
  /** Whether the server is disabled by default (Cursor only). */
  disabled?: boolean;
  /** Tool names to auto-approve without user confirmation (Cursor only). */
  autoApprove?: string[];
  /** Environment variables for the server process. */
  env?: Record<string, string>;
}

export interface McpSetupResult {
  target: McpTarget;
  serversAdded: number;
  serversSkipped: number;
  filesWritten: string[];
  prerequisitesMissing: string[];
  prerequisitesInstalled: string[];
}

export interface PrerequisiteCheck {
  name: string;
  command: string;
  available: boolean;
  version?: string;
  requiredBy: string[];
  installInstructions: string[];
  autoInstallCommand?: string;
}

export interface SetupOptions {
  target: McpTarget;
  targetDir: string;
  force?: boolean;
  skipPrereqs?: boolean;
}

// ── Config Analysis ─────────────────────────────────────

/**
 * Analysis of an existing MCP configuration file.
 * Used to determine what needs to be added vs. what's already there.
 */
export interface ConfigAnalysis {
  /** Whether the config file exists and has server entries. */
  hasExistingConfig: boolean;
  /** Absolute path to the config file. */
  filePath: string;
  /** Relative path for display (e.g. ".cursor/mcp.json"). */
  relativePath: string;
  /** Platform target ("cursor" or "copilot"). */
  platform: "cursor" | "copilot";
  /** All server names currently in the config file. */
  existingServerNames: string[];
  /** Servers from our set that are already in the config. */
  alreadyConfiguredNames: string[];
  /** Servers from our set that need to be added. */
  newServerNames: string[];
  /** User-custom servers not in our set (will be preserved). */
  userCustomServers: string[];
  /** Pretty-printed JSON of just the new entries to add. */
  newEntriesJson: string;
}

/**
 * Analyze an existing MCP config file and determine what servers
 * need to be added vs. what's already configured.
 *
 * This is the core of the non-destructive behavior: we never
 * blindly overwrite, and we can show the user exactly what
 * will be added and where.
 */
export function analyzeExistingConfig(
  targetDir: string,
  platform: "cursor" | "copilot"
): ConfigAnalysis {
  const configKey = platform === "cursor" ? "mcpServers" : "servers";
  const relativePath =
    platform === "cursor" ? ".cursor/mcp.json" : ".vscode/mcp.json";
  const filePath = path.join(targetDir, relativePath);

  // Read existing servers from the config file
  let existingServerNames: string[] = [];

  if (pathExists(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(stripJsonComments(raw));
      const section = (parsed[configKey] ?? {}) as Record<string, unknown>;
      existingServerNames = Object.keys(section);
    } catch {
      // Can't parse — treat as empty
    }
  }

  const ourServerNames = Object.keys(MCP_SERVERS);

  const alreadyConfiguredNames = ourServerNames.filter((name) =>
    existingServerNames.includes(name)
  );
  const newServerNames = ourServerNames.filter(
    (name) => !existingServerNames.includes(name)
  );
  const userCustomServers = existingServerNames.filter(
    (name) => !ourServerNames.includes(name)
  );

  // Build the JSON for only the new entries
  const newEntries: Record<string, unknown> = {};
  for (const name of newServerNames) {
    const def = MCP_SERVERS[name]!;
    newEntries[name] =
      platform === "cursor"
        ? buildCursorServerEntry(def)
        : buildVSCodeServerEntry(def);
  }

  return {
    hasExistingConfig:
      pathExists(filePath) && existingServerNames.length > 0,
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
 * Run analysis for all platforms included in the target.
 * Returns one ConfigAnalysis per platform.
 */
export function analyzeAllTargets(
  targetDir: string,
  target: McpTarget
): ConfigAnalysis[] {
  const analyses: ConfigAnalysis[] = [];
  if (target === "cursor" || target === "both") {
    analyses.push(analyzeExistingConfig(targetDir, "cursor"));
  }
  if (target === "copilot" || target === "both") {
    analyses.push(analyzeExistingConfig(targetDir, "copilot"));
  }
  return analyses;
}

// ── MCP Server Definitions ──────────────────────────────
//
// Placeholder tokens:
//   __GITHUB_PAT__  → resolved per-platform for the GitHub PAT
//   __WORKSPACE__   → resolved to ${workspaceFolder} for both platforms

const GITHUB_PAT_PLACEHOLDER = "__GITHUB_PAT__";
const WORKSPACE_PLACEHOLDER = "__WORKSPACE__";

export const MCP_SERVERS: Record<string, McpServerDef> = {
  atlassian: {
    command: "npx",
    args: ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
    disabled: false,
    autoApprove: ["search_jira", "get_confluence_page"],
    env: {
      LOG_LEVEL: "INFO",
      NODE_ENV: "production",
    },
  },

  github: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    disabled: false,
    autoApprove: [
      "search_repositories",
      "get_file_contents",
      "list_repository_contents",
    ],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_PAT_PLACEHOLDER,
      LOG_LEVEL: "INFO",
      NODE_ENV: "production",
    },
  },

  filesystem: {
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      WORKSPACE_PLACEHOLDER,
    ],
    disabled: false,
    autoApprove: ["read_file", "list_directory", "search_files"],
    env: {
      LOG_LEVEL: "INFO",
      NODE_ENV: "production",
      MAX_FILE_SIZE: "10485760",
      ALLOWED_EXTENSIONS:
        ".js,.ts,.tsx,.jsx,.py,.json,.md,.txt,.yaml,.yml,.toml,.env,.gitignore,.dockerfile",
    },
  },

  "web-search": {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-web-search"],
    disabled: true,
    autoApprove: ["search_web"],
    env: {
      LOG_LEVEL: "INFO",
      NODE_ENV: "production",
      SEARCH_ENGINE: "google",
      MAX_RESULTS: "10",
    },
  },

  "aws-document-loader": {
    command: "uvx",
    args: ["awslabs.document-loader-mcp-server@latest"],
    disabled: false,
    autoApprove: [],
    env: {
      FASTMCP_LOG_LEVEL: "ERROR",
    },
  },
};

// ── Server Entry Builders ───────────────────────────────

/**
 * Build a single Cursor-format server entry from a definition.
 * Includes: command, args, disabled, autoApprove, env.
 */
export function buildCursorServerEntry(
  def: McpServerDef
): Record<string, unknown> {
  const server: Record<string, unknown> = {
    command: def.command,
    args: resolvePlaceholders(def.args),
  };

  if (def.disabled !== undefined) {
    server.disabled = def.disabled;
  }

  if (def.autoApprove && def.autoApprove.length > 0) {
    server.autoApprove = def.autoApprove;
  }

  if (def.env) {
    server.env = resolveEnvVars(def.env, "cursor");
  }

  return server;
}

/**
 * Build a single VS Code-format server entry from a definition.
 * Includes: command, args, env.
 * Note: VS Code does not support autoApprove or disabled fields.
 */
export function buildVSCodeServerEntry(
  def: McpServerDef
): Record<string, unknown> {
  const server: Record<string, unknown> = {
    command: def.command,
    args: resolvePlaceholders(def.args),
  };

  if (def.env) {
    server.env = resolveEnvVars(def.env, "copilot");
  }

  return server;
}

// ── Prerequisite Checks ─────────────────────────────────

/**
 * Check whether the required runtimes (Node.js/npx, uv/uvx) are available.
 */
export function checkPrerequisites(): PrerequisiteCheck[] {
  const checks: PrerequisiteCheck[] = [
    {
      name: "Node.js / npx",
      command: "npx",
      available: false,
      requiredBy: ["atlassian", "github", "filesystem", "web-search"],
      installInstructions: [
        "Homebrew (macOS):  brew install node",
        "nvm:               https://github.com/nvm-sh/nvm",
        "Official:          https://nodejs.org/",
      ],
      autoInstallCommand:
        process.platform === "darwin" ? "brew install node" : undefined,
    },
    {
      name: "uv / uvx",
      command: "uvx",
      available: false,
      requiredBy: ["aws-document-loader"],
      installInstructions: [
        "Homebrew (macOS):  brew install uv",
        "curl:              curl -LsSf https://astral.sh/uv/install.sh | sh",
        "Official:          https://docs.astral.sh/uv/",
      ],
      autoInstallCommand:
        process.platform === "darwin"
          ? "brew install uv"
          : "curl -LsSf https://astral.sh/uv/install.sh | sh",
    },
  ];

  for (const check of checks) {
    try {
      const output = execSync(`${check.command} --version 2>/dev/null`, {
        encoding: "utf-8",
        timeout: 10_000,
      }).trim();
      check.available = true;
      check.version = output.split("\n")[0]; // First line only
    } catch {
      check.available = false;
    }
  }

  return checks;
}

/**
 * Attempt to install a missing prerequisite automatically.
 * Returns true if installation succeeded and the command is now available.
 */
export function installPrerequisite(check: PrerequisiteCheck): boolean {
  if (!check.autoInstallCommand) return false;

  // If the command is a brew command, verify Homebrew is available first
  if (check.autoInstallCommand.startsWith("brew")) {
    try {
      execSync("which brew 2>/dev/null", { encoding: "utf-8" });
    } catch {
      if (check.command === "uvx") {
        check.autoInstallCommand =
          "curl -LsSf https://astral.sh/uv/install.sh | sh";
      } else {
        return false;
      }
    }
  }

  try {
    logStep(`Installing ${check.name}...`);
    execSync(check.autoInstallCommand, {
      stdio: "inherit",
      timeout: 120_000,
    });

    try {
      execSync(`${check.command} --version 2>/dev/null`, {
        encoding: "utf-8",
        timeout: 10_000,
      });
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

// ── Config Generation ───────────────────────────────────

/**
 * Generate the full Cursor MCP configuration for `.cursor/mcp.json`.
 * Optionally limited to only the specified server names.
 */
export function generateCursorConfig(
  onlyServers?: string[]
): Record<string, unknown> {
  const mcpServers: Record<string, unknown> = {};

  for (const [name, def] of Object.entries(MCP_SERVERS)) {
    if (onlyServers && !onlyServers.includes(name)) continue;
    mcpServers[name] = buildCursorServerEntry(def);
  }

  return { mcpServers };
}

/**
 * Generate the full VS Code MCP configuration for `.vscode/mcp.json`.
 * Optionally limited to only the specified server names.
 */
export function generateVSCodeConfig(
  onlyServers?: string[]
): Record<string, unknown> {
  const servers: Record<string, unknown> = {};
  const inputs: Array<Record<string, unknown>> = [];
  let needsGitHubPat = false;

  for (const [name, def] of Object.entries(MCP_SERVERS)) {
    if (onlyServers && !onlyServers.includes(name)) continue;

    const server = buildVSCodeServerEntry(def);
    servers[name] = server;

    // Track whether we need a GitHub PAT input variable
    if (def.env && GITHUB_PAT_PLACEHOLDER in Object.values(def.env)) {
      needsGitHubPat = true;
    }
    if (
      def.env &&
      Object.values(def.env).includes(GITHUB_PAT_PLACEHOLDER)
    ) {
      needsGitHubPat = true;
    }
  }

  const config: Record<string, unknown> = {};

  if (needsGitHubPat) {
    inputs.push({
      type: "promptString",
      id: "github-pat",
      description: "GitHub Personal Access Token",
      password: true,
    });
  }

  if (inputs.length > 0) {
    config.inputs = inputs;
  }

  config.servers = servers;
  return config;
}

/**
 * Generate VS Code settings required for MCP support.
 */
export function generateVSCodeSettings(): Record<string, unknown> {
  return {
    "chat.mcp.discovery.enabled": true,
    "chat.agent.enabled": true,
  };
}

// ── Placeholder & Variable Resolution ───────────────────

/**
 * Strip JSON comments (// and /* ... *​/) without breaking
 * content inside string literals (e.g. URLs containing //).
 *
 * Works by matching strings first (group 1) and returning them
 * as-is, then matching comments and replacing them with empty.
 */
function stripJsonComments(str: string): string {
  return str.replace(
    /("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (match, stringLiteral: string | undefined) =>
      stringLiteral !== undefined ? match : ""
  );
}

function resolvePlaceholders(args: string[]): string[] {
  return args.map((arg) => {
    if (arg === WORKSPACE_PLACEHOLDER) {
      return "${workspaceFolder}";
    }
    return arg;
  });
}

function resolveEnvVars(
  env: Record<string, string>,
  target: "cursor" | "copilot"
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (value === GITHUB_PAT_PLACEHOLDER) {
      resolved[key] =
        target === "cursor"
          ? "${env:GITHUB_PERSONAL_ACCESS_TOKEN}"
          : "${input:github-pat}";
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

// ── File Writing & Merging ──────────────────────────────

/**
 * Merge a new config object into an existing JSON file,
 * or create it if it doesn't exist.
 *
 * When `mergeKey` is provided, the merge happens at that nested
 * level (e.g. "servers" or "mcpServers"), preserving existing
 * entries that aren't overwritten.
 */
function mergeJsonFile(
  filePath: string,
  newConfig: Record<string, unknown>,
  mergeKey?: string
): void {
  let existing: Record<string, unknown> = {};

  if (pathExists(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      existing = JSON.parse(stripJsonComments(raw));
    } catch {
      existing = {};
    }
  }

  if (mergeKey) {
    const existingSection =
      (existing[mergeKey] as Record<string, unknown>) ?? {};
    const newSection =
      (newConfig[mergeKey] as Record<string, unknown>) ?? {};
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
  fs.writeFileSync(
    filePath,
    JSON.stringify(existing, null, 2) + "\n",
    "utf-8"
  );
}

// ── Main Setup Function ─────────────────────────────────

/**
 * Configure MCP servers for the specified target platform(s).
 *
 * Non-destructive by default:
 *  - Only adds servers that are not already in the config
 *  - Preserves all existing user-defined servers
 *  - Uses --force to overwrite (replaces server entries, but still preserves user servers)
 */
export async function setupMcp(options: SetupOptions): Promise<McpSetupResult> {
  const { target, targetDir, force = false, skipPrereqs = false } = options;
  const filesWritten: string[] = [];
  const prerequisitesMissing: string[] = [];
  const prerequisitesInstalled: string[] = [];
  let totalAdded = 0;
  let totalSkipped = 0;

  // ── Step 1: Check prerequisites ─────────────────────
  if (!skipPrereqs) {
    logStep("Checking prerequisites...");
    const checks = checkPrerequisites();

    for (const check of checks) {
      if (check.available) {
        logInfo(
          `${check.name}: ${theme.textSuccess("✓")} ${theme.textSecondary(check.version ?? "")}`
        );
      } else {
        logInfo(
          `${check.name}: ${theme.textWarning("✗")} ${theme.textWarning("not found")}`
        );

        const installed = installPrerequisite(check);

        if (installed) {
          prerequisitesInstalled.push(check.name);
          logInfo(
            `${check.name}: ${theme.textSuccess("✓")} ${theme.textSuccess("installed successfully")}`
          );
        } else {
          prerequisitesMissing.push(check.name);
          console.log();
          console.log(
            theme.textWarning(
              `  Could not auto-install ${check.name}. Install manually:`
            )
          );
          for (const instruction of check.installInstructions) {
            console.log(theme.textSecondary(`    ${instruction}`));
          }
          console.log();
        }
      }
    }
  }

  // ── Step 2: Write Cursor config ─────────────────────
  if (target === "cursor" || target === "both") {
    const analysis = analyzeExistingConfig(targetDir, "cursor");
    const serversToAdd = force
      ? Object.keys(MCP_SERVERS)
      : analysis.newServerNames;

    if (serversToAdd.length === 0 && !force) {
      logStep(
        `All MCP servers already configured in ${theme.path(analysis.relativePath)}`
      );
      totalSkipped += analysis.alreadyConfiguredNames.length;
    } else {
      logStep("Configuring MCP servers for Cursor...");
      const config = generateCursorConfig(force ? undefined : serversToAdd);
      const configPath = analysis.filePath;

      if (analysis.hasExistingConfig && !force) {
        mergeJsonFile(configPath, config, "mcpServers");
      } else {
        await ensureDirectory(path.dirname(configPath));
        if (analysis.hasExistingConfig && force) {
          // Force: merge to preserve user-custom servers
          mergeJsonFile(configPath, config, "mcpServers");
        } else {
          fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2) + "\n",
            "utf-8"
          );
        }
      }

      totalAdded += serversToAdd.length;
      totalSkipped += analysis.alreadyConfiguredNames.length;
      filesWritten.push(analysis.relativePath);
      logInfo(`Written: ${theme.path(analysis.relativePath)}`);
    }
  }

  // ── Step 3: Write VS Code / Copilot config ──────────
  if (target === "copilot" || target === "both") {
    const analysis = analyzeExistingConfig(targetDir, "copilot");
    const serversToAdd = force
      ? Object.keys(MCP_SERVERS)
      : analysis.newServerNames;

    if (serversToAdd.length === 0 && !force) {
      logStep(
        `All MCP servers already configured in ${theme.path(analysis.relativePath)}`
      );
      totalSkipped += analysis.alreadyConfiguredNames.length;
    } else {
      logStep("Configuring MCP servers for VS Code / GitHub Copilot...");
      const config = generateVSCodeConfig(force ? undefined : serversToAdd);
      const configPath = analysis.filePath;

      if (analysis.hasExistingConfig && !force) {
        mergeJsonFile(configPath, config, "servers");
      } else {
        await ensureDirectory(path.dirname(configPath));
        if (analysis.hasExistingConfig && force) {
          mergeJsonFile(configPath, config, "servers");
        } else {
          fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2) + "\n",
            "utf-8"
          );
        }
      }

      totalAdded += serversToAdd.length;
      totalSkipped += analysis.alreadyConfiguredNames.length;
      filesWritten.push(analysis.relativePath);
      logInfo(`Written: ${theme.path(analysis.relativePath)}`);

      // Update .vscode/settings.json with MCP-related settings
      logStep("Updating VS Code settings for MCP support...");
      const settingsPath = path.join(targetDir, ".vscode", "settings.json");
      mergeJsonFile(settingsPath, generateVSCodeSettings());
      filesWritten.push(".vscode/settings.json");
      logInfo(`Updated: ${theme.path(".vscode/settings.json")}`);
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

// ── Logging helpers ─────────────────────────────────────

function logStep(message: string): void {
  console.log(`  ${theme.brandBright("→")} ${theme.text(message)}`);
}

function logInfo(message: string): void {
  console.log(`    ${message}`);
}
