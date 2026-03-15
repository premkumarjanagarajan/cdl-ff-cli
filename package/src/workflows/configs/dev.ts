/**
 * Development Workflow Configuration — Fluid Flow v1.0
 *
 * AI-powered development lifecycle orchestration.
 * Source: premkumarjanagarajan/fluid-flow-ai
 *
 * Installs the Fluid Flow framework (orchestrator, knowledge base,
 * primitives, skills, workflows, templates) into the target repo.
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
    // v1.0 framework directories to copy into the target repo
    directories: [
      "knowledge-base-core",
      "primitives",
      "skills",
      "workflow",
      "templates",
    ],

    // Standalone framework files at the repo root
    rootFiles: ["orchestrator.md"],

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

    // Create the initiatives directory structure
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
