# Analytics Update Instructions

# This instruction file is referenced by BOTH workflows (Spec-Kit and AWS AI-DLC)
# directly during workflow execution and via the shared command fluid-flow.update-docs.md.
# It defines how to update the feature analytics file after each completed phase/stage
# and how to finalise totals by the end of implementation.

## Purpose

Keep the feature analytics file continuously accurate throughout workflow execution.
This instruction supports two update modes:
1. **Phase Completion Update**: Run after every phase/stage completes (executed or skipped)
2. **Final Totals Update**: Run at the end of implementation to finalise totals

This data enables understanding of:
- **Throughput**: How much work is completed using the workflow
- **Cycle Time**: How long it takes to complete the full development cycle (end-to-end)
- **Stage Efficiency**: Which stages take the longest and where bottlenecks occur
- **Rework Rate**: How often change requests occur (indicates requirement quality)
- **Workflow Comparison**: Compare Spec-Kit vs AWS AI-DLC effort for similar features

---

## Analytics File Location

```
main-workflow/analytics/{BRANCH_NAME}.md
```

This file is created during the entry point (Stage 1: Branch Creation), updated incrementally after each workflow step (via per-step hooks in each command referencing this file's Step 3), and finalised at the end of implementation (Step 4). The per-step updates provide real-time visibility; the finalisation reconciles all data and calculates authoritative totals. See also `analytics-step-update.md` for the stage name mapping tables used by each command.

---

## Step 1: Load Existing Analytics File

1. Read `main-workflow/analytics/{BRANCH_NAME}.md`
2. If the file does not exist, this is an error -- log in audit.md and create a minimal analytics file using the format from `../commands/fluid-flow.md` (Analytics File Format section)

---

## Step 2: Gather Source Data

Collect the following data from the feature directory (for both update modes):

### From `specs/{BRANCH_NAME}/state.md`:
- Current stage (should be final stage)
- All completed checkboxes (count stages executed vs skipped)
- Workflow type (Spec-Kit or AWS AI-DLC)

### From `specs/{BRANCH_NAME}/audit.md`:
- All timestamps (to calculate stage durations)
- Count of user interactions (total AI interactions)
- Count of approval entries (approval gates passed)
- Count of "Request Changes" or revision entries (change requests / rework cycles)
- Count of clarification questions asked (clarification rounds)

### From the feature directory (`specs/{BRANCH_NAME}/`):
- Count all `.md` files recursively (artifacts generated)
- List all stages that have output directories/files (stages executed)

---

## Step 3: Phase Completion Update (Run After EVERY Phase/Stage)

### Required Inputs
- **Stage Name**: Exact stage label to update (must match the timeline row name)
- **Stage Status**: `Completed` or `Skipped`
- **Workflow Type**: Spec-Kit or AWS AI-DLC

### Execution
1. Ensure the Stage Timeline includes all rows for the active workflow (see reference tables below). Append missing rows if needed.
2. Locate the row for the current stage:
   - If `Started` is empty, set it to:
     - The earliest stage-specific timestamp found in `audit.md`, or
     - Current ISO timestamp if a stage-specific start timestamp cannot be derived reliably
   - Set `Completed` to current ISO timestamp
   - Set `Duration` to `Completed - Started`
   - Set `Status` to the provided stage status (`Completed` or `Skipped`)
3. Refresh **running metrics** (do not wait for final implementation):
   - **Total AI Interactions**: Count all `**User Input**:` entries in audit.md
   - **Approval Gates Passed**: Count all approval-related entries in audit.md
   - **Change Requests**: Count entries where user chose "Request Changes" or equivalent revision action
   - **Clarification Rounds**: Count entries related to clarification questions
   - **Artifacts Generated**: Count all `.md` files in `specs/{BRANCH_NAME}/`
   - **Stages Executed**: Count stage rows currently marked `Completed`
   - **Stages Skipped**: Count stage rows currently marked `Skipped`
4. Update **Effort Breakdown** with current counts/durations for completed phases only. Leave future phases as in-progress placeholders.
5. Save `main-workflow/analytics/{BRANCH_NAME}.md`.
6. Keep `## Metadata` fields `Completed` and `Total Duration` unchanged during phase updates.

---

## Step 4: Final Totals Update (Run At End of Implementation)

**Note**: Per-step analytics updates (Step 3) will have already populated Stage Timeline rows and Work Metrics during the workflow. This finalisation step reconciles and overwrites with authoritative values calculated from the audit trail.

### Trigger Points
- **Spec-Kit**: At the end of `/speckit.implement`
- **AWS AI-DLC**: At the end of `Build and Test`

### Execution
1. Recompute timeline data for all stages:
   - Ensure each executed/skipped stage has final timestamps and duration
   - Ensure optional stages that were intentionally not executed are marked `Skipped`
   - Ensure pending rows are explicitly marked `Pending` only for required stages that were never reached due interruption/abort
2. Recompute full metrics and summaries:
   - **Entry Point Duration**: Branch Creation start to Workflow Routing completion
   - **Workflow Duration**: First workflow stage start to final implementation stage completion
   - **End-to-End Duration**: Branch Creation start to this final totals update
   - **Rework Cycles**: Total "Request Changes" count across all stages
   - **Rework Rate**: `Rework Cycles / max(Stages Executed, 1)` as a percentage
3. Finalise metadata:
   - Set `Completed` to current ISO timestamp
   - Set `Total Duration` to final end-to-end duration
4. Finalise the **Work Metrics**, **Effort Breakdown**, and **Cycle Summary** sections with totals (no placeholders remaining for completed work).
5. Save `main-workflow/analytics/{BRANCH_NAME}.md`.

---

## Step 5: Workflow-Specific Stage Rows Reference

### Workflow-Specific Stage Rows

**For Spec-Kit**, append these rows to the Stage Timeline:

| Stage | Started | Completed | Duration | Status |
|-------|---------|-----------|----------|--------|
| Specify | | | | |
| Clarify | | | | Completed / Skipped |
| Plan | | | | |
| Tasks | | | | |
| Checklist | | | | Completed / Skipped |
| Implement - Setup | | | | Completed / Skipped |
| Implement - Tests | | | | Completed / Skipped |
| Implement - Core | | | | Completed / Skipped |
| Implement - Integration | | | | Completed / Skipped |
| Implement - Polish | | | | Completed / Skipped |
| Implement | | | | |

**For AWS AI-DLC**, append these rows to the Stage Timeline:

| Stage | Started | Completed | Duration | Status |
|-------|---------|-----------|----------|--------|
| Requirements Analysis | | | | |
| Onboarding Presentations | | | | Completed / Skipped |
| User Stories | | | | Completed / Skipped |
| Workflow Planning | | | | |
| Application Design | | | | Completed / Skipped |
| Units Generation | | | | Completed / Skipped |
| Functional Design | | | | Completed / Skipped |
| NFR Requirements | | | | Completed / Skipped |
| NFR Design | | | | Completed / Skipped |
| Infrastructure Design | | | | Completed / Skipped |
| Code Generation | | | | |
| Onboarding Update | | | | Completed / Skipped |
| Build and Test | | | | |

### Effort Breakdown Per Phase

**For Spec-Kit**:

| Phase | Interactions | Approvals | Duration |
|-------|-------------|-----------|----------|
| Entry Point | [count] | [count] | [duration] |
| Specification | [count] | [count] | [duration] |
| Planning | [count] | [count] | [duration] |
| Implementation | [count] | [count] | [duration] |

**For AWS AI-DLC**:

| Phase | Interactions | Approvals | Duration |
|-------|-------------|-----------|----------|
| Entry Point | [count] | [count] | [duration] |
| Inception | [count] | [count] | [duration] |
| Construction | [count] | [count] | [duration] |

---

## Step 6: Log Analytics Update

1. **MANDATORY**: Log the analytics update in `specs/{BRANCH_NAME}/audit.md`:

```markdown
## Analytics Update
**Timestamp**: [ISO timestamp]
**AI Response**: "Updated feature analytics at main-workflow/analytics/{BRANCH_NAME}.md"
**Context**: [Phase Completion Update | Final Totals Update]
**Stage**: [Stage name, if phase update]
**Summary**:
- End-to-End Duration: [duration or N/A for phase update]
- Stages Executed: [count]
- Total AI Interactions: [count]
- Rework Cycles: [count]

---
```

---

## Suggested Analytics Insights

The analytics data collected enables the following insights when reviewed across multiple features:

### Individual Feature Insights
- **Bottleneck identification**: Which stages consistently take the longest?
- **Rework hotspots**: Which stages generate the most change requests?
- **Workflow fit**: Was the chosen workflow appropriate for the feature complexity?

### Cross-Feature Insights (manual review of `main-workflow/analytics/` folder)
- **Average cycle time** by workflow type
- **Average rework rate** across features
- **Stage duration trends** over time (are stages getting faster with practice?)
- **Workflow selection patterns**: Which workflow is chosen more often and for what types of work?
- **JIRA correlation**: Map analytics to JIRA tickets for project-level reporting

### Recommended Review Cadence
- After every 5 completed features, review the analytics folder for patterns
- Use the data to refine workflow selection guidance
- Identify stages that could be simplified or made optional
