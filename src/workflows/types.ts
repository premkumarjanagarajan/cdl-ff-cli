/**
 * Workflow Types
 *
 * Core type definitions for the multi-workflow framework.
 * Every workflow is defined by a single WorkflowConfig object.
 * Adding a new workflow = creating a new config file, no new code needed.
 */

// -- Workflow Configuration ---------------------------------------------------

/**
 * Complete configuration for a single workflow.
 * This is the primary type that drives the entire modular system.
 */
export interface WorkflowConfig {
  /** Unique identifier (e.g. "dev", "product", "design"). */
  id: string;

  /** Human-readable name shown in menus (e.g. "Development Workflow"). */
  name: string;

  /** Short description shown in the main menu. */
  description: string;

  /** GitHub source repository for the workflow files. */
  source: SourceConfig;

  /** File installation configuration. */
  install: InstallConfig;

  /** MCP server configuration (optional, not all workflows need MCP). */
  mcp?: McpConfig;

  /** Which features/actions this workflow supports. */
  features: WorkflowFeature[];
}

/** Available features a workflow can support. */
export type WorkflowFeature = "install" | "update" | "verify" | "mcp";

// -- Source Configuration -----------------------------------------------------

/** GitHub repository source for a workflow. */
export interface SourceConfig {
  /** Repository owner (e.g. "BetssonGroup"). */
  owner: string;
  /** Repository name (e.g. "aidlc-workflow"). */
  repo: string;
  /** Branch to clone from (e.g. "release"). */
  branch: string;
}

// -- Install Configuration ----------------------------------------------------

/** Configuration for which files to install from the source repo. */
export interface InstallConfig {
  /** Directories from the source repo to copy into the target. */
  directories: string[];

  /** Platform-specific entry point configuration. */
  entryPoints: {
    cursor?: EntryPointConfig;
    copilot?: EntryPointConfig;
  };

  /** Technology-specific instruction files for Copilot (optional). */
  techInstructions?: TechInstructionsConfig;

  /** File extensions that should be made executable (e.g. [".sh"]). */
  executableExtensions?: string[];
}

/** Configuration for a platform-specific entry point file. */
export interface EntryPointConfig {
  /** Source path relative to the cloned repo root. */
  source: string;
  /** Target path relative to the target repo root. */
  target: string;
  /** Transform to apply when copying (undefined = copy as-is). */
  transform?: "copilot";
}

/** Configuration for Copilot technology instruction files. */
export interface TechInstructionsConfig {
  /** Source directory relative to repo root. */
  sourceDir: string;
  /** Target directory relative to target root. */
  targetDir: string;
}

// -- MCP Configuration --------------------------------------------------------

/** MCP server configuration for a workflow. */
export interface McpConfig {
  /**
   * Path to the MCP JSON config file, relative to the ff-cli package root.
   * e.g. "mcp-configs/dev-mcp.json"
   */
  configFile: string;
}

// -- Manifest Types -----------------------------------------------------------

/** Supported target platforms for installation. */
export type Platform = "cursor" | "copilot" | "both";

/** MCP target platforms. */
export type McpTarget = "cursor" | "copilot" | "both";

/**
 * Installation manifest v2 -- supports multiple workflows.
 * Stored as `.fluid-flow.json` in the target repository root.
 */
export interface ManifestV2 {
  version: 2;
  workflows: Record<string, WorkflowManifestEntry>;
}

/** Installation record for a single workflow within the manifest. */
export interface WorkflowManifestEntry {
  platform: Platform;
  commitSha: string;
  branch: string;
  sourceRepo: string;
  installedAt: string;
  updatedAt: string;
  installedPaths: string[];
}

/**
 * Legacy v1 manifest (single-workflow).
 * Kept for backward compatibility, automatically migrated to v2 on read.
 */
export interface ManifestV1 {
  version: 1;
  platform: Platform;
  commitSha: string;
  branch: string;
  sourceRepo: string;
  installedAt: string;
  updatedAt: string;
  installedPaths: string[];
}

/** Union of all manifest versions. */
export type ManifestAny = ManifestV1 | ManifestV2;

// -- Result Types -------------------------------------------------------------

/** Result of a workflow file installation. */
export interface InstallResult {
  success: boolean;
  workflowId: string;
  platform: Platform;
  filesCopied: number;
  commitSha: string;
  installedPaths: string[];
  error?: string;
}

/** Result of a workflow update. */
export interface UpdateResult {
  success: boolean;
  workflowId: string;
  platform: Platform;
  filesCopied: number;
  previousSha: string;
  newSha: string;
  wasUpToDate: boolean;
  installedPaths: string[];
  error?: string;
}

/** Result of an update availability check. */
export interface UpdateCheckResult {
  installed: boolean;
  workflowId: string;
  platform?: Platform;
  currentSha?: string;
  latestSha?: string;
  updateAvailable: boolean;
}

/** Result of MCP server setup. */
export interface McpSetupResult {
  target: McpTarget;
  serversAdded: number;
  serversSkipped: number;
  filesWritten: string[];
  prerequisitesMissing: string[];
  prerequisitesInstalled: string[];
}
