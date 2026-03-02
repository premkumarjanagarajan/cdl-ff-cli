# Workflow Retrospective

# This command is a STANDALONE entry point — NOT part of fluid-flow.update-docs.md.
# It should be run AFTER a workflow completes, in the SAME chat session where the workflow ran.
# The AI uses its conversational context (the full chat history) as the primary data source.

## Purpose

Perform a critical retrospective analysis of the workflow conversation that just completed.
Generate a feature-level retrospective and concrete improvement backlog items that propose
specific file edits to memory files, constitution files, prompts, templates, and workflow configuration.

This is the **continuous improvement engine** of Fluid Flow AI — every workflow execution
generates data that feeds back into making the framework better.

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

## Pre-Requisites

Before executing, verify:

1. **Same chat session**: This command must run in the same chat session where the workflow was executed. If the conversation context is not available (e.g., new chat session), warn the user and offer a degraded mode that analyzes only the audit.md file.

2. **Feature directory exists**: `specs/{BRANCH_NAME}/` must exist with `audit.md` and `state.md`

3. **Workflow has completed**: Check `specs/{BRANCH_NAME}/state.md` — the workflow should have reached its final stage. If the workflow is still in progress, warn the user and ask if they want to proceed with a partial retrospective.

### Resolving BRANCH_NAME

If BRANCH_NAME is not provided or available from conversation context:
1. Check current git branch: run `git branch --show-current`
2. If on a feature branch (matches `###-*` pattern, e.g., `001-proj-1234-add-user-auth` or `001-add-user-auth`), use that as BRANCH_NAME
3. If not on a feature branch, list recent feature directories in `specs/` and ask the user to confirm which feature to retrospect

---

## Execution

### Step 1: Log Retrospective Start

Append to `specs/{BRANCH_NAME}/audit.md`:

```markdown
## Workflow Retrospective - Start
**Timestamp**: [ISO timestamp]
**AI Response**: "Starting workflow retrospective analysis for {BRANCH_NAME}"
**Context**: Workflow Retrospective

---
```

Update `specs/{BRANCH_NAME}/state.md`:
- Add to the progress section: `- [ ] Workflow Retrospective`

### Step 2: Execute Retrospective Analysis

Load and execute all instructions from `../stages/workflow-retrospective.md`.

This will:
1. Gather context from conversation, audit.md, state.md, and analytics
2. Analyze the conversation across 8 dimensions
3. Generate `specs/{BRANCH_NAME}/retrospective.md`
4. Generate or append to `main-workflow/retrospectives/improvement-backlog.md`
5. Present a summary to the user

### Step 3: Log Retrospective Completion

Append to `specs/{BRANCH_NAME}/audit.md`:

```markdown
## Workflow Retrospective - Complete
**Timestamp**: [ISO timestamp]
**AI Response**: "Workflow retrospective complete. Generated [N] improvement items."
**Context**: Workflow Retrospective
**Summary**:
- Retrospective: specs/{BRANCH_NAME}/retrospective.md
- Improvement items generated: [N]
- Critical: [n], High: [n], Medium: [n], Low: [n]
- Backlog: main-workflow/retrospectives/improvement-backlog.md

---
```

Update `specs/{BRANCH_NAME}/state.md`:
- Mark: `- [x] Workflow Retrospective`

---

## Degraded Mode (Different Chat Session)

If the AI detects this is a new chat session (no workflow conversation in context):

1. Inform the user:
   ```markdown
   ⚠ **Limited Retrospective Mode**

   This appears to be a new chat session. The full conversation context from the workflow
   execution is not available. The retrospective will be based solely on:
   - `specs/{BRANCH_NAME}/audit.md` (structured interaction log)
   - `specs/{BRANCH_NAME}/state.md` (stage progression)
   - Generated artifacts in `specs/{BRANCH_NAME}/`

   **Note**: This produces a less detailed analysis. For best results, run the retrospective
   in the same chat session where the workflow completed.

   Proceed with limited retrospective?
   ```

2. If the user confirms, execute the retrospective using only the audit trail and artifacts
3. Mark the retrospective as `**Mode**: Limited (audit-only)` in the output

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
