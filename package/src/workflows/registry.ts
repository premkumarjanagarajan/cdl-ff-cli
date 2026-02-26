/**
 * Workflow Registry
 *
 * Central registry that discovers and loads all available workflow configurations.
 * To add a new workflow, create a config file in ./configs/ and import it here.
 */

import { devWorkflow } from "./configs/dev.js";
import type { WorkflowConfig } from "./types.js";

// -- Registry -----------------------------------------------------------------
// Import all workflow configs here. This is the ONLY place you need to
// touch when adding a new workflow (besides creating the config file).

const ALL_WORKFLOWS: WorkflowConfig[] = [
  devWorkflow,
  // Future workflows:
  // productWorkflow,
  // designWorkflow,
];

/**
 * Get all registered workflow configurations.
 */
export function getAllWorkflows(): WorkflowConfig[] {
  return ALL_WORKFLOWS;
}

/**
 * Get a specific workflow by its ID.
 * Returns undefined if not found.
 */
export function getWorkflow(id: string): WorkflowConfig | undefined {
  return ALL_WORKFLOWS.find((w) => w.id === id);
}

/**
 * Get a workflow by ID, throwing if not found.
 */
export function requireWorkflow(id: string): WorkflowConfig {
  const workflow = getWorkflow(id);
  if (!workflow) {
    throw new Error(
      `Unknown workflow: "${id}". Available workflows: ${ALL_WORKFLOWS.map((w) => w.id).join(", ")}`
    );
  }
  return workflow;
}

/**
 * Get all workflow IDs.
 */
export function getWorkflowIds(): string[] {
  return ALL_WORKFLOWS.map((w) => w.id);
}
