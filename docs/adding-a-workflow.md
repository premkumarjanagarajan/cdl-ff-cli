# Adding a New Workflow

This guide walks through every step needed to add a new workflow to Fluid Flow CLI. The architecture is **configuration-driven** -- you only need to create config files and register them. No new modules or command code is required.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step-by-Step Guide](#step-by-step-guide)
  - [Step 1: Prepare the Source Repository](#step-1-prepare-the-source-repository)
  - [Step 2: Create the Workflow Config](#step-2-create-the-workflow-config)
  - [Step 3: Create the MCP Config (optional)](#step-3-create-the-mcp-config-optional)
  - [Step 4: Register the Workflow](#step-4-register-the-workflow)
  - [Step 5: Build and Test](#step-5-build-and-test)
- [Configuration Reference](#configuration-reference)
  - [WorkflowConfig](#workflowconfig)
  - [SourceConfig](#sourceconfig)
  - [InstallConfig](#installconfig)
  - [EntryPointConfig](#entrypointconfig)
  - [TechInstructionsConfig](#techinstructionsconfig)
  - [McpConfig](#mcpconfig)
  - [WorkflowFeature](#workflowfeature)
  - [MCP Server Definition](#mcp-server-definition)
- [Architecture Diagram](#architecture-diagram)
- [Complete Example: Product Workflow](#complete-example-product-workflow)
- [Checklist](#checklist)
- [FAQ](#faq)

---

## Overview

```mermaid
graph LR
    A[Create config file] --> B[Create MCP JSON - optional]
    B --> C[Register in registry.ts]
    C --> D[Build and test]
    D --> E[Workflow appears in CLI]
    
    style A fill:#1a1a2e,stroke:#00d4ff,color:#fff
    style E fill:#1a1a2e,stroke:#3fb950,color:#fff
```

Every workflow in Fluid Flow CLI is defined by a single `WorkflowConfig` object. The system uses this config to:

1. **Show the workflow in menus** -- main menu, sub-menus, help text, and status output
2. **Clone the right source repo** -- each workflow can pull from a different GitHub repository and branch
3. **Install the right files** -- directories are auto-discovered from the repo by default, or can be explicitly listed
4. **Install both IDE entry points** -- every install sets up both Cursor IDE and VS Code (GitHub Copilot) automatically
5. **Configure MCP servers** -- each workflow has its own MCP server definitions in a JSON file, always configured for both IDEs
6. **Track installations** -- the manifest records which workflows are installed per project

**Files you will create or modify:**

| File | Action | Purpose |
|------|--------|---------|
| `src/workflows/configs/<id>.ts` | **Create** | Workflow configuration |
| `mcp-configs/<id>-mcp.json` | **Create** (optional) | MCP server definitions |
| `src/workflows/registry.ts` | **Modify** (1 line) | Register the new workflow |

---

## Prerequisites

Before adding a workflow, you need:

1. **A source repository** on GitHub containing the workflow files (e.g. `BetssonGroup/product-workflow`)
2. **An entry point file** in that repo (a Cursor `.mdc` file — it will be installed for Cursor and transformed for Copilot automatically)
3. **Node.js >= 20** and the ff-cli repo cloned locally

---

## Step-by-Step Guide

### Step 1: Prepare the Source Repository

Your source repository should contain the workflow files you want to install into target projects. At minimum it needs:

```
your-workflow-repo/
├── <directories>/          # Any directories — all are copied by default
│   ├── ...workflow files...
│   └── ...
└── .cursor/
    └── rules/
        └── <rule>.mdc       # Entry point (used for both Cursor and Copilot)
```

**Key points:**

| Decision | Example | Notes |
|----------|---------|-------|
| Entry point file | `.cursor/rules/product.mdc` | Installed for Cursor, transformed for Copilot |
| Branch | `release` | Which branch to clone from |
| Directories | All by default | Omit `directories` to auto-copy everything from the repo |
| Executable files | `.sh` scripts | Will be `chmod +x` on install |

> **Auto-discovery:** By default, every directory at the repo root is copied into the target project (excluding `.git`, `.gitignore`, `.github`, `README.md`, and `LICENSE`). You only need to specify `directories` if you want to limit what gets copied.

### Step 2: Create the Workflow Config

Create a new file at `src/workflows/configs/<id>.ts`.

The `id` is the short identifier users will type in commands (e.g. `ff install product`). Keep it lowercase, short, and memorable.

**Template:**

```typescript
/**
 * <Name> Workflow Configuration
 *
 * <Brief description of what this workflow does.>
 * Source: <owner>/<repo>
 */

import type { WorkflowConfig } from "../types.js";

export const <id>Workflow: WorkflowConfig = {
  // ── Identity ──────────────────────────────────────────
  id: "<id>",                           // CLI identifier: ff install <id>
  name: "<Name> Workflow",              // Shown in menus
  description: "<One-line description>", // Shown next to menu item

  // ── Source Repository ─────────────────────────────────
  source: {
    owner: "BetssonGroup",              // GitHub org or user
    repo: "<repo-name>",               // Repository name
    branch: "release",                  // Branch to clone
  },

  // ── Installation ──────────────────────────────────────
  install: {
    // Omit `directories` to auto-discover all directories from the repo.
    // Or list specific ones: directories: ["workflow-dir"],

    // Entry points — both Cursor and Copilot are always installed
    entryPoints: {
      cursor: {
        source: ".cursor/rules/<rule>.mdc",          // Path in source repo
        target: ".cursor/rules/<rule>.mdc",          // Path in target project
      },
      copilot: {
        source: ".cursor/rules/<rule>.mdc",          // Same source, different target
        target: ".github/<name>-instructions.md",    // Copilot reads from .github/
        transform: "copilot",                         // Transform Cursor format to Copilot
      },
    },

    // (Optional) Copilot technology-specific instruction files
    // techInstructions: {
    //   sourceDir: "<workflow-dir>/Instructions/technology",
    //   targetDir: ".github/instructions",
    // },

    // File extensions that should be made executable
    executableExtensions: [".sh"],
  },

  // ── MCP Servers (optional) ────────────────────────────
  mcp: {
    configFile: "mcp-configs/<id>-mcp.json",
  },

  // ── Features ──────────────────────────────────────────
  // Controls which actions appear in the workflow's sub-menu
  features: ["install", "update", "verify", "mcp"],
};
```

> **Tip:** Use the existing `src/workflows/configs/dev.ts` as a real-world reference.

### Step 3: Create the MCP Config (optional)

If your workflow includes MCP server setup (`features` includes `"mcp"`), create a JSON file at `mcp-configs/<id>-mcp.json`.

This file defines which MCP servers to configure when users run `ff mcp <id>`. MCP is always configured for **both** Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`).

**Template:**

```json
{
  "server-name": {
    "command": "npx",
    "args": ["-y", "@scope/package-name"],
    "disabled": false,
    "autoApprove": ["tool_name_1", "tool_name_2"],
    "env": {
      "LOG_LEVEL": "INFO",
      "NODE_ENV": "production"
    }
  }
}
```

**Placeholder tokens** (resolved automatically at setup time):

| Token | Cursor resolves to | VS Code / Copilot resolves to |
|-------|--------------------|-------------------------------|
| `__GITHUB_PAT__` | `${env:GITHUB_PERSONAL_ACCESS_TOKEN}` | `${input:github-pat}` |
| `__WORKSPACE__` | `${workspaceFolder}` | `${workspaceFolder}` |

**Example** -- a workflow that needs only GitHub and a custom API server:

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "disabled": false,
    "autoApprove": ["search_repositories", "get_file_contents"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "__GITHUB_PAT__",
      "LOG_LEVEL": "INFO"
    }
  },
  "product-api": {
    "command": "npx",
    "args": ["-y", "@company/product-mcp-server"],
    "disabled": false,
    "autoApprove": [],
    "env": {
      "API_BASE_URL": "https://api.internal.example.com"
    }
  }
}
```

> **No MCP?** If your workflow does not need MCP servers, omit the `mcp` property from the config and remove `"mcp"` from the `features` array.

### Step 4: Register the Workflow

Open `src/workflows/registry.ts` and add two lines:

1. **Import** the config at the top
2. **Add** it to the `ALL_WORKFLOWS` array

```typescript
import { devWorkflow } from "./configs/dev.js";
import { productWorkflow } from "./configs/product.js";  // <-- add import
import type { WorkflowConfig } from "./types.js";

const ALL_WORKFLOWS: WorkflowConfig[] = [
  devWorkflow,
  productWorkflow,  // <-- add to array
];
```

That's it. The rest of the system picks it up automatically.

### Step 5: Build and Test

```bash
# Build
npm run build

# Verify it appears in the CLI
ff workflows
ff --help

# Test the sub-menu
ff <id>

# Test CLI commands
ff install <id> --help
ff mcp <id> --help

# Full install test (in a test directory)
mkdir /tmp/test-workflow && cd /tmp/test-workflow
ff install <id>
```

---

## Configuration Reference

### WorkflowConfig

The top-level configuration object. Every field is documented below.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier, used in CLI commands (`ff install <id>`) |
| `name` | `string` | Yes | Human-readable name shown in menus |
| `description` | `string` | Yes | One-line description shown next to menu items |
| `source` | `SourceConfig` | Yes | GitHub repository to pull workflow files from |
| `install` | `InstallConfig` | Yes | What files to install and where |
| `mcp` | `McpConfig` | No | MCP server configuration file path |
| `features` | `WorkflowFeature[]` | Yes | Which actions the workflow supports |

### SourceConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `owner` | `string` | Yes | GitHub org or username (e.g. `"BetssonGroup"`) |
| `repo` | `string` | Yes | Repository name (e.g. `"fluid-flow-ai"`) |
| `branch` | `string` | Yes | Branch to clone (e.g. `"release"`) |

### InstallConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `directories` | `string[]` | No | Directories from source to copy. **Omit to auto-discover all directories** from the repo (excludes `.git`, `.gitignore`, `.github`, `README.md`, `LICENSE`). |
| `entryPoints` | `{ cursor?, copilot? }` | Yes | IDE entry point files — both are always installed |
| `techInstructions` | `TechInstructionsConfig` | No | Copilot path-specific instruction files |
| `executableExtensions` | `string[]` | No | Extensions to `chmod +x` (default: `[".sh"]`) |

### EntryPointConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `source` | `string` | Yes | Path in the source repo (relative to repo root) |
| `target` | `string` | Yes | Path in the target project (relative to project root) |
| `transform` | `"copilot"` | No | If set, transforms Cursor format to Copilot format |

**How entry points work:**

Both Cursor and Copilot entry points are **always installed** — there is no IDE selection prompt. The install flow:

1. **Cursor:** Copies the `.mdc` file as-is to `.cursor/rules/`
2. **Copilot:** Transforms the same source, strips Cursor frontmatter, and writes to `.github/`
3. **Frontmatter cleanup:** Cursor-specific YAML frontmatter is stripped from all `.md` files in copied directories
4. **Tech instructions** (optional): Creates `.github/instructions/*.instructions.md` for path-specific Copilot guidance

### TechInstructionsConfig

Only relevant for Copilot. Creates `.github/instructions/*.instructions.md` files that provide path-specific instructions to Copilot.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sourceDir` | `string` | Yes | Source directory with technology instruction files |
| `targetDir` | `string` | Yes | Target directory (usually `".github/instructions"`) |

### McpConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `configFile` | `string` | Yes | Path to the MCP JSON file, relative to ff-cli package root |

MCP servers are always configured for **both** Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`) — there is no platform selection prompt.

### WorkflowFeature

Controls which actions appear in the workflow's interactive sub-menu.

| Value | Menu Item | CLI Command |
|-------|-----------|-------------|
| `"install"` | Install | `ff install <id>` |
| `"update"` | Update | `ff update <id>` |
| `"verify"` | Verify | `ff verify` |
| `"mcp"` | MCP Setup | `ff mcp <id>` |

**Example:** A workflow without MCP and without verify:

```typescript
features: ["install", "update"],
```

### MCP Server Definition

Each entry in the MCP JSON config file follows this structure:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `command` | `string` | Yes | Shell command to start the server (`"npx"`, `"uvx"`, etc.) |
| `args` | `string[]` | Yes | Arguments passed to the command |
| `disabled` | `boolean` | No | If `true`, server is disabled by default (Cursor only) |
| `autoApprove` | `string[]` | No | Tool names to auto-approve (Cursor only) |
| `env` | `Record<string, string>` | No | Environment variables for the server process |

---

## Architecture Diagram

This diagram shows how a workflow config flows through the modular system:

```mermaid
graph TD
    subgraph Config ["Your Config File"]
        WC["src/workflows/configs/product.ts"]
    end

    subgraph Registry ["Registry"]
        REG["src/workflows/registry.ts"]
    end

    subgraph Menu ["CLI / Interactive Menu"]
        IDX["src/index.ts"]
        WM["src/commands/workflow-menu.ts"]
    end

    subgraph Modules ["Reusable Modules"]
        FI["FileInstaller<br/>auto-discovers + copies dirs"]
        EP["EntryPointInstaller<br/>both Cursor + Copilot"]
        MI["McpInstaller<br/>both .cursor + .vscode"]
        MAN["ManifestManager<br/>tracks installations"]
    end

    subgraph External ["External"]
        GH["GitHub Source Repo<br/>(release branch)"]
        MCP_JSON["mcp-configs/product-mcp.json"]
        TARGET["Target Project"]
    end

    WC --> REG
    REG --> IDX
    IDX --> WM

    WM --> FI
    WM --> EP
    WM --> MI
    WM --> MAN

    FI -->|clone + copy| GH
    FI -->|write| TARGET
    EP -->|write| TARGET
    MI -->|read| MCP_JSON
    MI -->|write| TARGET
    MAN -->|write| TARGET

    style Config fill:#1a1a2e,stroke:#00d4ff,color:#fff
    style Modules fill:#1a1a2e,stroke:#f0883e,color:#fff
    style External fill:#1a1a2e,stroke:#3fb950,color:#fff
```

**Key insight:** The modules are completely generic. They receive a `WorkflowConfig` and act on it. You never need to modify modules, commands, or UI code to add a new workflow.

---

## Complete Example: Product Workflow

Here is a complete, copy-paste-ready example of adding a hypothetical "Product Workflow" that pulls from `BetssonGroup/product-workflow`.

### File 1: `src/workflows/configs/product.ts`

```typescript
/**
 * Product Workflow Configuration
 *
 * Product management and planning orchestration for product teams.
 * Source: BetssonGroup/product-workflow
 */

import type { WorkflowConfig } from "../types.js";

export const productWorkflow: WorkflowConfig = {
  id: "product",
  name: "Product Workflow",
  description: "Product management and planning orchestration",

  source: {
    owner: "BetssonGroup",
    repo: "product-workflow",
    branch: "release",
  },

  install: {
    // No `directories` — auto-discovers all directories from the repo

    entryPoints: {
      cursor: {
        source: ".cursor/rules/product.mdc",
        target: ".cursor/rules/product.mdc",
      },
      copilot: {
        source: ".cursor/rules/product.mdc",
        target: ".github/product-instructions.md",
        transform: "copilot",
      },
    },

    executableExtensions: [".sh"],
  },

  mcp: {
    configFile: "mcp-configs/product-mcp.json",
  },

  features: ["install", "update", "verify", "mcp"],
};
```

### File 2: `mcp-configs/product-mcp.json`

```json
{
  "atlassian": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
    "disabled": false,
    "autoApprove": ["search_jira", "get_confluence_page"],
    "env": {
      "LOG_LEVEL": "INFO",
      "NODE_ENV": "production"
    }
  },
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "disabled": false,
    "autoApprove": ["search_repositories", "get_file_contents"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "__GITHUB_PAT__",
      "LOG_LEVEL": "INFO"
    }
  }
}
```

### File 3: `src/workflows/registry.ts` (modified)

```typescript
import { devWorkflow } from "./configs/dev.js";
import { productWorkflow } from "./configs/product.js";   // <-- new
import type { WorkflowConfig } from "./types.js";

const ALL_WORKFLOWS: WorkflowConfig[] = [
  devWorkflow,
  productWorkflow,   // <-- new
];

// ... rest of file unchanged ...
```

### Result

After `npm run build`, the Product Workflow is fully functional:

```bash
ff workflows                          # Lists: dev, product
ff product                            # Opens product sub-menu
ff install product                    # Installs for both Cursor + Copilot
ff mcp product                        # Configures MCP servers (both IDEs)
ff update product                     # Updates to latest
```

---

## Checklist

Use this checklist when adding a new workflow:

- [ ] Source repository exists on GitHub and is accessible
- [ ] Source repo has an entry point file (`.cursor/rules/<name>.mdc`)
- [ ] Created `src/workflows/configs/<id>.ts` with a valid `WorkflowConfig`
- [ ] Created `mcp-configs/<id>-mcp.json` (if workflow has MCP feature)
- [ ] Added import + array entry in `src/workflows/registry.ts`
- [ ] `npm run build` succeeds with no errors
- [ ] `ff workflows` shows the new workflow
- [ ] `ff <id>` opens the sub-menu with correct actions
- [ ] `ff install <id> --help` shows correct help text
- [ ] Tested full install in a temporary directory
- [ ] Tested MCP setup (if applicable)
- [ ] Committed and pushed changes

---

## FAQ

### Can I add a workflow without MCP support?

Yes. Omit the `mcp` property from your config and remove `"mcp"` from the `features` array:

```typescript
export const minimalWorkflow: WorkflowConfig = {
  id: "minimal",
  name: "Minimal Workflow",
  description: "A workflow without MCP",
  source: { owner: "BetssonGroup", repo: "minimal-workflow", branch: "release" },
  install: {
    entryPoints: {
      cursor: {
        source: ".cursor/rules/minimal.mdc",
        target: ".cursor/rules/minimal.mdc",
      },
      copilot: {
        source: ".cursor/rules/minimal.mdc",
        target: ".github/minimal-instructions.md",
        transform: "copilot",
      },
    },
  },
  features: ["install", "update"],  // no "mcp", no "verify"
};
```

### Do I need to list directories explicitly?

No. By default, the installer auto-discovers all directories at the root of the source repository (excluding `.git`, `.gitignore`, `.github`, `README.md`, and `LICENSE`). This means new directories added to the source repo are picked up automatically on the next install/update.

If you only want a subset of directories, you can specify them explicitly:

```typescript
install: {
  directories: ["only-this-dir", "and-this-one"],
  // ...
},
```

### Are both Cursor and VS Code always installed?

Yes. Every install and update sets up entry points for **both** Cursor IDE and VS Code (GitHub Copilot) automatically. There is no IDE selection prompt. Similarly, MCP servers are always configured for both `.cursor/mcp.json` and `.vscode/mcp.json`.

### Can two workflows install into the same project?

Yes. The manifest (`.fluid-flow.json`) tracks each workflow independently:

```json
{
  "version": 2,
  "workflows": {
    "dev": { "platform": "both", "commitSha": "abc...", ... },
    "product": { "platform": "both", "commitSha": "def...", ... }
  }
}
```

Each workflow can have different source repos and different installed paths.

### Can two workflows share the same source repository?

Yes. Just point both configs to the same `source.owner` / `source.repo` but use different `install.directories` to control which parts each workflow installs.

### What if my workflow needs a custom module or behavior?

The current architecture handles most cases through configuration. If you truly need custom logic (e.g. a post-install hook, a custom transform, or a new entry point format), you would need to extend the modules. Open an issue or discuss with the team before adding custom code.

### Where do I find the existing dev workflow config as a reference?

The dev workflow config is the canonical reference:

- **Config:** `src/workflows/configs/dev.ts`
- **MCP JSON:** `mcp-configs/dev-mcp.json`
- **Types:** `src/workflows/types.ts`
