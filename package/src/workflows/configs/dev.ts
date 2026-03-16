/**
 * Development Workflow Configuration — Fluid Flow v1.0
 *
 * AI-powered development lifecycle orchestration.
 * Source: premkumarjanagarajan/fluid-flow-ai
 *
 * Installs the Fluid Flow framework into fluid-flow-ai/ subfolder
 * in the target repo. Entry points go to IDE-specific locations.
 */

import type { WorkflowConfig } from "../types.js";

export const devWorkflow: WorkflowConfig = {
  id: "dev",
  name: "Development Workflow",
  description: "AI-powered development lifecycle orchestration",

  source: {
    owner: "premkumarjanagarajan",
    repo: "fluid-flow-ai",
    branch: "release",
  },

  install: {
    // Install all framework files under fluid-flow-ai/ in the target repo
    targetRoot: "fluid-flow-ai",

    // Framework directories (relative to source root, installed under targetRoot)
    directories: [
      ".github/agents",
      "knowledge-base-core",
      "primitives",
      "skills",
      "workflow",
      "templates",
    ],

    // Standalone framework files (installed under targetRoot)
    rootFiles: ["orchestrator.md", "domain-catalog.yaml", "*-domain-catalog.yaml"],

    // Entry points go to IDE-specific locations (NOT prefixed by targetRoot)
    entryPoints: {
      cursor: {
        source: ".cursor/rules/instructions.mdc",
        target: ".cursor/rules/instructions.mdc",
      },
      copilot: {
        source: ".github/copilot-instructions.md",
        target: ".github/copilot-instructions.md",
      },
    },

    // Create initiatives directory under the subfolder
    createDirectories: [
      "initiatives",
    ],

    executableExtensions: [".sh"],
  },

  mcp: {
    configFile: "mcp-configs/dev-mcp.json",
  },

  features: ["install", "update", "verify", "mcp"],
};
