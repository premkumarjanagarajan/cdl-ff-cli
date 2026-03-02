# Post-Implementation Documentation Update

# This command is invoked AFTER the final implementation step of either workflow (Spec-Kit or AWS AI-DLC).
# It is a SEPARATE agent/command — not part of the implementation flow itself.
# The feature branch and directory already exist at specs/{BRANCH_NAME}/.
# state.md and audit.md already exist in the feature directory.

## Purpose

Update project-level documentation artifacts after implementation is complete. This includes:
1. Test Coverage Delta & Improvement Plan (conditional)
2. Reverse Engineering Update (conditional)
3. Analytics Reconciliation (always, idempotent)

This command consolidates all post-implementation documentation steps into a single entry point, ensuring consistency regardless of which workflow was used.

---

## MANDATORY: Shared Memory Loading
**CRITICAL**: At command start, load the shared memory manifest and follow ALL instructions within it:
- Load `../memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

## MANDATORY: State and Audit Logging
- Read and update `specs/{BRANCH_NAME}/state.md` with stage progress at start and completion of this command
- Append to `specs/{BRANCH_NAME}/audit.md` with user inputs and AI responses using ISO 8601 timestamps
- Use the same verbatim logging rules: capture COMPLETE RAW INPUT, never summarize
- ALWAYS append/edit audit.md, NEVER completely overwrite it

---

## Step 1: Test Coverage Delta & Improvement Plan (CONDITIONAL)

**Execute IF**: Baseline exists at `specs/_project/reverse-engineering/test-coverage-analysis.md`

**Skip IF**: No test coverage baseline exists (greenfield project or test-coverage-analysis.md not generated)

**Purpose**: Compare current coverage against the Phase 1 baseline and generate a feature-level improvement plan.

**Execution**:
1. **MANDATORY**: Log start of coverage analysis in audit.md
2. Load **Phase 2** instructions (Steps 7-11) from `../stages/test-coverage-analysis.md`
3. Load the Phase 1 baseline from `specs/_project/reverse-engineering/test-coverage-analysis.md`
4. Re-run coverage commands to get current metrics (post-implementation)
5. Execute Phase 2:
   - Step 7: Generate Coverage Delta Report (compare baseline vs current)
   - Step 8: Generate Coverage Improvement Plan (quick wins, high-value, systematic)
   - Step 9: Generate Test Templates (for top priority gaps)
   - Step 10: Quality Gate Recommendations
   - Step 11: Continuous Coverage Improvement Loop
6. Generate the Phase 2 output artifact at `specs/{BRANCH_NAME}/construction/coverage-improvement-plan.md`
7. **MANDATORY**: Log the coverage delta summary in `specs/{BRANCH_NAME}/audit.md`

---

## Step 2: Reverse Engineering Update (CONDITIONAL)

**Execute IF**: Reverse engineering artifacts exist at `specs/_project/reverse-engineering/`

**Skip IF**: No reverse engineering artifacts (greenfield project)

**Purpose**: Keep all reverse engineering artifacts — including the C4 architecture model and test coverage analysis — up to date after every implementation cycle. This must not be skipped when RE artifacts exist.

**Execution**:
1. **MANDATORY**: Log start of RE update in audit.md
2. Load all steps from `../stages/reverse-engineering-update.md`
3. Execute incremental update of ALL `specs/_project/reverse-engineering/` artifacts based on changes made during this feature's implementation, including:
   - `business-overview.md` - Update business transactions and component descriptions
   - `architecture.md` - Update architecture diagrams and integration points
   - `c4-architecture.md` - Update C4 model at all affected levels (System Context, Container, Component, Code) to reflect new or changed containers, components, relationships, and deployment topology
   - `code-structure.md` - Update file inventory and design patterns
   - `api-documentation.md` - Update API endpoints and data models
   - `component-inventory.md` - Update package counts and categories
   - `technology-stack.md` - Update languages, frameworks, and tools
   - `dependencies.md` - Update internal and external dependency maps
   - `code-quality-assessment.md` - Update quality indicators and technical debt
   - `test-coverage-analysis.md` - Update baseline coverage metrics, gap analysis, and business flow coverage with post-implementation data
4. Update `reverse-engineering-timestamp.md` with feature reference and change summary
5. **MANDATORY**: Log the update summary in `specs/{BRANCH_NAME}/audit.md`

---

## Step 3: Analytics Reconciliation (ALWAYS)

**Purpose**: Reconcile the feature analytics file to ensure metrics remain accurate after documentation updates.

**Execution**:
1. Load the analytics update instructions from `../stages/analytics-update.md`
2. Execute **Step 4: Final Totals Update** from that instruction file (idempotent)
3. Update `main-workflow/analytics/{BRANCH_NAME}.md` with:
   - Completion timestamp
   - Total duration (end-to-end)
   - Final work metrics (interactions, approvals, artifacts, etc.)
   - Final stage timeline with all durations
   - Cycle summary

---

## Completion

After all steps are complete:
1. Update `specs/{BRANCH_NAME}/state.md` to reflect documentation update completion
2. Log completion in `specs/{BRANCH_NAME}/audit.md`
3. Present a summary to the user:

```markdown
## Post-Implementation Documentation Update Complete

| Step | Status |
|------|--------|
| Test Coverage Delta | [Executed / Skipped (reason)] |
| Reverse Engineering Update | [Executed / Skipped (reason)] |
| Analytics Reconciliation | Completed |

**Feature analytics**: `main-workflow/analytics/{BRANCH_NAME}.md`

All project-level documentation has been updated to reflect the implementation changes.

---

### Recommended: Run Workflow Retrospective

To generate continuous improvement insights, run the **fluid-flow.retrospective** command
now (in this same chat session) to analyse the workflow and generate actionable improvement items.

This produces:
- A feature retrospective at `specs/{BRANCH_NAME}/retrospective.md`
- Concrete improvement items in the backlog at `main-workflow/retrospectives/improvement-backlog.md`
```

---

## Prompts Logging Requirements
- **MANDATORY**: Log EVERY user input (prompts, questions, responses) with timestamp in audit.md
- **MANDATORY**: Capture user's COMPLETE RAW INPUT exactly as provided (never summarize)
- **CRITICAL**: ALWAYS append changes to EDIT audit.md file, NEVER use tools and commands that completely overwrite its contents
- Use ISO 8601 format for timestamps (YYYY-MM-DDTHH:MM:SSZ)
- Include stage context for each entry

### Correct Tool Usage for audit.md

✅ CORRECT:

1. Read the audit.md file
2. Append/Edit the file to make changes

❌ WRONG:

1. Read the audit.md file
2. Completely overwrite the audit.md with the contents of what you read, plus the new changes you want to add to it
