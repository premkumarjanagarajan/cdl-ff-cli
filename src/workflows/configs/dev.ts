/**
 * Development Workflow Configuration
 *
 * AI-powered development lifecycle orchestration.
 * Source: BetssonGroup/fluid-flow-ai
 *
 * This was the original (and only) workflow before the multi-workflow
 * architecture. All hardcoded values from installer/index.ts have been
 * migrated here.
 */

import type { WorkflowConfig } from "../types.js";

export const devWorkflow: WorkflowConfig = {
  id: "dev",
  name: "Development Workflow",
  description: "AI-powered development lifecycle orchestration",

  source: {
    owner: "BetssonGroup",
    repo: "fluid-flow-ai",
    branch: "release",
  },

  install: {
    directories: ["main-workflow"],

    entryPoints: {
      cursor: {
        source: ".cursor/rules/workflow.mdc",
        target: ".cursor/rules/workflow.mdc",
      },
      copilot: {
        source: ".cursor/rules/workflow.mdc",
        target: ".github/copilot-instructions.md",
        transform: "copilot",
      },
    },

    techInstructions: {
      sourceDir: "main-workflow/Instructions/technology",
      targetDir: ".github/instructions",
    },

    executableExtensions: [".sh"],
  },

  mcp: {
    configFile: "mcp-configs/dev-mcp.json",
  },

  features: ["install", "update", "verify", "mcp"],
};
