# Per-Step Analytics Update

# This instruction file is referenced by each Spec-Kit command (and can be used by AWS AI-DLC commands)
# to update the analytics file incrementally after each workflow step completes.
# This ensures the Stage Timeline is populated in real-time, not only at finalisation.

## Purpose

Update the feature analytics file after completing each workflow step so that:
- **Stage Timeline** shows real-time progress (not just populated at the end)
- **Work Metrics** are incremented as work happens
- **Effort Breakdown** reflects per-phase data as it accumulates

---

## When to Execute

Each workflow command (e.g., `/speckit.specify`, `/speckit.plan`, etc.) MUST execute this update at **two points**:

1. **At command START** — record the stage start timestamp
2. **At command END** — record the stage completion, duration, and update counters

---

## Parameters

Each calling command MUST provide:
- `{STAGE_NAME}` — The analytics stage name (must match a row in the Stage Timeline table)
- `{BRANCH_NAME}` — The feature branch name

### Stage Name Mapping (Spec-Kit)

| Command | Stage Name |
|---------|-----------|
| `/speckit.specify` | Specify |
| `/speckit.clarify` | Clarify |
| `/speckit.plan` | Plan |
| `/speckit.tasks` | Tasks |
| `/speckit.checklist` | Checklist |
| `/speckit.implement` | Implement |

### Stage Name Mapping (AWS AI-DLC)

**Inception Phase:**

| Stage | Stage Name |
|-------|-----------|
| Requirements Analysis | Requirements Analysis |
| Onboarding Presentations | Onboarding Presentations |
| User Stories | User Stories |
| Workflow Planning | Workflow Planning |
| Application Design | Application Design |
| Units Generation | Units Generation |

**Construction Phase (per-unit):**

| Stage | Stage Name |
|-------|-----------|
| Functional Design | Functional Design |
| NFR Requirements | NFR Requirements |
| NFR Design | NFR Design |
| Infrastructure Design | Infrastructure Design |
| Code Generation | Code Generation |
| Onboarding Update | Onboarding Update |

**Construction Phase (post-units):**

| Stage | Stage Name |
|-------|-----------|
| Build and Test | Build and Test |

---

## Step 1: Record Stage Start

At the **beginning** of the command (after setup/prerequisites, before main work):

1. Read `main-workflow/analytics/{BRANCH_NAME}.md`
   - If file does not exist: log a warning in audit.md and skip analytics (do not block the command)
2. Find the `{STAGE_NAME}` row in the **Stage Timeline** table
   - If the row does not exist: append it to the table with empty values
3. Set the `Started` column to the current ISO timestamp
4. Set the `Status` column to `In Progress`
5. Save the analytics file

---

## Step 2: Record Stage Completion

At the **end** of the command (after all main work is done, before reporting completion to the user):

1. Read `main-workflow/analytics/{BRANCH_NAME}.md`
   - If file does not exist: log a warning in audit.md and skip analytics
2. Find the `{STAGE_NAME}` row in the **Stage Timeline** table
3. Set the `Completed` column to the current ISO timestamp
4. Calculate `Duration` as the difference between `Completed` and `Started`
   - Format as human-readable (e.g., "2m 30s", "15m", "1h 5m")
5. Set the `Status` column to `Completed`
6. **Update Work Metrics**:
   - Increment `**Stages Executed**` by 1
   - Count all `.md` files in `specs/{BRANCH_NAME}/` recursively and update `**Artifacts Generated**`
   - Count all `**User Input**:` entries in `specs/{BRANCH_NAME}/audit.md` and update `**Total AI Interactions**`
7. Save the analytics file

---

## Step 3: Handle Skipped Steps

If a step is skipped (e.g., clarification was not needed):

1. Read the analytics file
2. Find the `{STAGE_NAME}` row
3. Set `Status` to `Skipped`
4. Set `Started` and `Completed` to the same current timestamp
5. Set `Duration` to `0s`
6. Increment `**Stages Skipped**` by 1
7. Save the analytics file

---

## Error Handling

- If the analytics file cannot be read or written, **do not block the command**
- Log a warning in `specs/{BRANCH_NAME}/audit.md`:
  ```markdown
  ## Analytics Warning
  **Timestamp**: [ISO timestamp]
  **AI Response**: "Could not update analytics for stage {STAGE_NAME}: [reason]"
  **Context**: Analytics Step Update - {STAGE_NAME}

  ---
  ```
- Continue with the command execution regardless

---

## Relationship to Final Analytics Update

The final analytics update (`analytics-update.md`, invoked by `fluid-flow.update-docs`) performs a comprehensive reconciliation:
- Fills any Stage Timeline rows that were missed
- Recalculates all Work Metrics from audit.md (authoritative source)
- Calculates Effort Breakdown per phase
- Calculates Cycle Summary durations

Per-step updates provide **real-time visibility** during the workflow. The final update provides **authoritative totals** at completion.
