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
  /** Repository name (e.g. "fluid-flow-ai"). */
  repo: string;
  /** Branch to clone from (e.g. "release"). */
  branch: string;
}

// -- Install Configuration ----------------------------------------------------

/** Configuration for which files to install from the source repo. */
export interface InstallConfig {
  /**
   * Base path within the source repo to install from.
   * All `directories` and `entryPoints.source` paths are relative to this.
   * Defaults to "." (repo root) if omitted.
   */
  sourceRoot?: string;

  /**
   * Directories from the source repo to copy into the target.
   * Paths are relative to `sourceRoot`. Installed at the target root
   * using only the directory basename (e.g. "sub/.github" → ".github").
   * If omitted or empty, all directories from the sourceRoot are copied
   * (excluding .git and repo metadata).
   */
  directories?: string[];

  /** Platform-specific entry point configuration. */
  entryPoints: {
    cursor?: EntryPointConfig;
    copilot?: EntryPointConfig;
  };

  /** Technology-specific instruction files for Copilot (optional). */
  techInstructions?: TechInstructionsConfig;

  /**
   * Individual files from the source root to copy into the target root.
   * Unlike templateFiles, these are overwritten during updates.
   * Paths are relative to `sourceRoot`.
   */
  rootFiles?: string[];

  /**
   * Template files to process during installation.
   * Each template is copied to the target with {{TOKEN}} placeholders
   * left for the user to fill (or replaced if tokens are provided).
   */
  templateFiles?: TemplateFileConfig[];

  /**
   * Directories to create (empty) in the target during installation.
   * Useful for setting up expected directory structures.
   */
  createDirectories?: string[];

  /** File extensions that should be made executable (e.g. [".sh"]). */
  executableExtensions?: string[];
}

/** Configuration for a template file to be processed during installation. */
export interface TemplateFileConfig {
  /** Source path relative to sourceRoot (e.g. "templates/manifest.yaml.template"). */
  source: string;
  /** Target path relative to target root (e.g. "manifest.yaml"). */
  target: string;
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

// -- Addon Types --------------------------------------------------------------

/** Schema for addon.json in the source repository. */
export interface AddonManifest {
  /** Unique addon identifier (e.g. "betting", "payments"). */
  id: string;
  /** Human-readable name shown in menus. */
  name: string;
  /** Short description shown in the addon picker. */
  description: string;
  /** Directory containing rule files, relative to the addon root. Default: "rules". */
  rulesDir?: string;
  /** Path to MCP config JSON file, relative to the addon root. */
  mcp?: string;
}

/** A discovered addon with its resolved location in the cloned source repo. */
export interface DiscoveredAddon {
  /** Parsed addon.json manifest. */
  manifest: AddonManifest;
  /** Absolute path to the addon directory in the cloned repo. */
  localPath: string;
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
  /** IDs of installed domain addons. Undefined or empty = no addons. */
  addons?: string[];
}

/**
 * Legacy v1 manifest (single-workflow).
 * Kept for backward compatibility, automatically migrated to v2 on read.
 * Note: v1 only ever stored "cursor" or "copilot", never "both".
 */
export interface ManifestV1 {
  version: 1;
  platform: "cursor" | "copilot";
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
