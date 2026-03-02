# PRIORITY: This workflow is the SINGLE ENTRY POINT for all development work
# When a user requests software development, ALWAYS follow this workflow FIRST

## Authority & Accountability

AI is a non-accountable participant in the delivery lifecycle.

AI may:
- Propose designs, implementations, and alternatives
- Analyse risks, trade-offs, and impacts
- Generate code and documentation

AI must never:
- Make final architectural decisions
- Make compliance or regulatory decisions
- Assume jurisdictional constraints
- Modify security or data-handling models without approval

Final accountability always rests with humans.

## MANDATORY: Shared Memory Loading
**CRITICAL**: At workflow start, load the shared memory manifest and follow ALL instructions within it:
- Load `../memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

## MANDATORY: Custom Welcome Message
**CRITICAL**: When starting ANY software development request, you MUST display the welcome message.
1. Load the welcome message from `../memory/welcome-message.md`
2. Display the complete message to the user
3. This should only be done ONCE at the start of a new workflow
4. Do NOT load this file in subsequent interactions to save context space

---

# Unified Entry Flow

The shared entry point orchestrates the following stages before routing to a workflow:

0. **Shell Environment Detection** (ALWAYS - detects Bash vs PowerShell)
1. **Branch Creation** (ALWAYS - includes JIRA ticket prompt and analytics file creation)
2. **Workspace Detection** (ALWAYS)
3. **Reverse Engineering** (CONDITIONAL - Brownfield, run-once per project)
4. **Workflow Selection** (ALWAYS - user chooses Spec-Kit or AWS AI-DLC)
5. **Workflow Routing** (ALWAYS - routes to the chosen workflow)

---

## Stage 0: Shell Environment Detection (ALWAYS EXECUTE)

**Purpose**: Detect whether the user's environment supports Bash or PowerShell so the correct automation scripts are used throughout the workflow.

1. Run the detection command from the repo root:
   ```sh
   uname -s 2>/dev/null || echo "WINDOWS"
   ```
2. Interpret the result to determine `SHELL_TYPE`:
   - Output contains `Darwin` or `Linux` → `SHELL_TYPE = bash`
   - Output contains `MINGW`, `MSYS`, or `CYGWIN` → `SHELL_TYPE = bash` (Git Bash on Windows)
   - Command fails or output is `WINDOWS` → `SHELL_TYPE = powershell`
3. Store `SHELL_TYPE` in memory — it will be persisted into `state.md` during Stage 1.

> **Reference**: See `../stages/shell-detection.md` for the full script invocation mapping between Bash and PowerShell.

---

## Stage 1: Branch Creation (ALWAYS EXECUTE)

**Purpose**: Create a numbered feature branch and initialize the feature directory.

1. Parse the user's request to extract the feature description
2. **Ask for the JIRA Ticket Number**:
   - Prompt the user: "Please provide the **JIRA Ticket Number** that will be the parent for this initiative (or type `null` / press enter to skip):"
   - **Wait for User Response**: Do NOT proceed until the user responds
   - Store the response as `JIRA_TICKET`:
     - If the user provides a ticket number (e.g., `PROJ-1234`), store it as-is
     - If the user provides `null`, empty, or skips, store as `null`
   - The JIRA ticket will be included in the branch name (lowercased) and recorded in `state.md`, `audit.md`, and `analytics` for this feature
3. **Generate a concise short name** (2-4 words) for the branch:
   - Analyze the feature description and extract meaningful keywords
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms
4. **Confirm branch naming components** if unclear:
   - If the JIRA ticket format is ambiguous (not matching a recognizable pattern like `PROJ-1234`), ask the user to confirm or correct it
   - If the short description is ambiguous or too generic, propose a name and ask the user to confirm
   - Branch naming pattern: `###-jira-ticket-short-description` (e.g., `001-proj-1234-add-user-auth`)
   - When JIRA is null: `###-short-description` (e.g., `001-add-user-auth`)
5. **Create the feature branch** using the script that matches `SHELL_TYPE` (detected in Stage 0):

   - **If SHELL_TYPE is `bash`**: Run `../../spec-kit/scripts/bash/create-new-feature.sh`
     - Pass `--json` for structured output
     - Pass `--short-name "<name>"` with the generated short name
     - If JIRA_TICKET is not null, pass `--jira-ticket "<ticket>"` with the JIRA ticket number
     - Pass the feature description as positional argument
     - For single quotes in args, use escape syntax: e.g `"I'm Groot"` (double-quote)

   - **If SHELL_TYPE is `powershell`**: Run `../../spec-kit/scripts/powershell/create-new-feature.ps1`
     - Pass `-Json` for structured output
     - Pass `-ShortName "<name>"` with the generated short name
     - If JIRA_TICKET is not null, pass `-JiraTicket "<ticket>"` with the JIRA ticket number
     - Pass the feature description as positional argument
     - PowerShell handles embedded single quotes in double-quoted strings natively

   - Parse the JSON output for BRANCH_NAME, SPEC_FILE, FEATURE_NUM, JIRA_TICKET
6. **Initialize state tracking** in the feature directory (`specs/{BRANCH_NAME}/`):
   - Create `state.md` with initial state (see State File Format below)
   - Create `audit.md` with header (see Audit File Format below)
7. **Create project directory** if it does not exist: `specs/_project/`
8. **Create analytics file** for this feature (see Analytics File section below):
   - Create `main-workflow/analytics/{BRANCH_NAME}.md` with initial analytics data
   - Record the feature start timestamp, description, JIRA ticket, and branch name
   - The analytics folder (`main-workflow/analytics/`) must be created if it does not exist
9. **MANDATORY**: Log the initial user request in `audit.md` with complete raw input
10. **MANDATORY: Verify Initiative Folder Requirements**:
   - After all creation steps, validate that every required artifact exists and is well-formed:

   | Check | Path | Validation |
   |-------|------|------------|
   | Feature directory | `specs/{BRANCH_NAME}/` | Directory exists |
   | State file | `specs/{BRANCH_NAME}/state.md` | File exists, contains `## Feature Information` with Branch, JIRA Ticket, Shell, Created, Current Stage, Workflow fields |
   | Audit file | `specs/{BRANCH_NAME}/audit.md` | File exists, contains `# Feature Audit Trail` header with Branch, JIRA Ticket, Created fields and Branch Creation entry |
   | Project directory | `specs/_project/` | Directory exists |
   | Analytics file | `main-workflow/analytics/{BRANCH_NAME}.md` | File exists, contains `## Metadata` with Feature, Branch, JIRA Ticket, Workflow, Created fields |

   - **If any check fails**: Log the failure in audit.md, attempt to create/fix the missing artifact, and re-verify
   - **If all checks pass**: Log verification success in audit.md and proceed
   - Present a brief verification summary to the user:

   ```markdown
   ## Initiative Folder Verified

   | Artifact | Status |
   |----------|--------|
   | Feature directory (`specs/{BRANCH_NAME}/`) | ✓ |
   | State tracking (`state.md`) | ✓ |
   | Audit trail (`audit.md`) | ✓ |
   | Project directory (`specs/_project/`) | ✓ |
   | Analytics file (`analytics/{BRANCH_NAME}.md`) | ✓ |
   ```

11. Mark checkbox in state.md: `[x] Branch Creation`

### State File Format

Create `specs/{BRANCH_NAME}/state.md`:

```markdown
# Feature State Tracking

## Feature Information
- **Branch**: {BRANCH_NAME}
- **JIRA Ticket**: {JIRA_TICKET | null}
- **Shell**: {SHELL_TYPE}
- **Created**: [ISO timestamp]
- **Current Stage**: Entry Point - Branch Creation
- **Workflow**: Pending (awaiting user selection)

## Entry Point Progress
- [ ] Branch Creation
- [ ] Workspace Detection
- [ ] Reverse Engineering (if brownfield)
- [ ] Workflow Selection
- [ ] Workflow Routing

## Workspace State
[Populated by Workspace Detection]

## Workflow Progress
[Populated by chosen workflow]
```

### Audit File Format

Create `specs/{BRANCH_NAME}/audit.md`:

```markdown
# Feature Audit Trail

**Branch**: {BRANCH_NAME}
**JIRA Ticket**: {JIRA_TICKET | null}
**Created**: [ISO timestamp]

---

## Branch Creation
**Timestamp**: [ISO timestamp]
**User Input**: "[Complete raw user input - never summarized]"
**JIRA Ticket**: {JIRA_TICKET | null}
**AI Response**: "Created feature branch {BRANCH_NAME}"
**Context**: Entry Point - Branch Creation

---
```

---

## Stage 2: Workspace Detection (ALWAYS EXECUTE)

1. **MANDATORY**: Log start of workspace detection in audit.md
2. Load all steps from `../stages/workspace-detection.md`
3. Execute workspace detection:
   - Check for existing `specs/{BRANCH_NAME}/state.md` (resume if found with populated state)
   - Scan workspace for existing code
   - Determine if brownfield or greenfield
   - Check for existing reverse engineering artifacts at `specs/_project/reverse-engineering/`
4. Update `specs/{BRANCH_NAME}/state.md` with workspace findings
5. Update `specs/{BRANCH_NAME}/workspace-detection.md` with detailed findings
6. Mark checkbox in state.md: `[x] Workspace Detection`
7. Present completion message to user (see workspace-detection.md for message formats)
8. Automatically proceed to next stage

---

## Stage 3: Reverse Engineering (CONDITIONAL - Brownfield, Run-Once)

**Execute IF**:
- Existing codebase detected (brownfield)
- No previous reverse engineering artifacts found at `specs/_project/reverse-engineering/reverse-engineering-timestamp.md`

**Skip IF**:
- Greenfield project (no existing code)
- Previous reverse engineering artifacts exist at `specs/_project/reverse-engineering/`
  - Log: "Using existing reverse engineering artifacts from [timestamp]"
  - Load artifacts as context for complexity assessment

**Execution**:
1. **MANDATORY**: Log start of reverse engineering in audit.md
2. Load all steps from `../stages/reverse-engineering.md`
3. Execute reverse engineering:
   - Analyze all packages and components
   - Generate business overview, architecture documentation, C4 architecture model, code structure, API docs, component inventory, technology stack, dependencies, code quality assessment, test coverage analysis
   - Write ALL artifacts to `specs/_project/reverse-engineering/`
4. **Wait for Explicit Approval**: Present detailed completion message - DO NOT PROCEED until user confirms
5. **MANDATORY**: Log user's response in audit.md with complete raw input
6. Mark checkbox in state.md: `[x] Reverse Engineering`

---

## Stage 4: Workflow Selection (ALWAYS EXECUTE)

**Purpose**: Present the available workflows and let the user choose which one to follow.

1. **MANDATORY**: Log start of workflow selection in audit.md
2. Present the following choice to the user:

   ```markdown
   ## Choose Your Workflow

   Which workflow would you like to use for this feature?

   **1. Spec-Kit** — Lightweight specification-driven workflow.
      Best for: standard features, bug fixes, enhancements, CRUD operations,
      and work that doesn't require deep infrastructure or compliance design.

   **2. AWS AI-DLC** — Full Architecture Decision Lifecycle.
      Best for: complex infrastructure changes, multi-service integrations,
      projects requiring ADRs, NFR analysis, and formal architecture design.

   Please reply with **1** or **2** (or the workflow name).
   ```

3. **Wait for User Response**: Do NOT proceed until the user has made their choice
4. **MANDATORY**: Log the user's choice in audit.md with complete raw input
5. Update `specs/{BRANCH_NAME}/state.md` with the selected workflow
6. Mark checkbox in state.md: `[x] Workflow Selection`

---

## Stage 5: Workflow Routing (ALWAYS EXECUTE)

Based on the user's chosen workflow:

### If Spec-Kit was chosen:

1. Update `specs/{BRANCH_NAME}/state.md`: Set `**Workflow**: Spec-Kit`
2. Log routing decision in audit.md
3. **Initialize Spec-Kit analytics rows**: Read `main-workflow/analytics/{BRANCH_NAME}.md` and:
   - Set `**Workflow**` in the Metadata section to `Spec-Kit`
   - Append the Spec-Kit stage rows to the **Stage Timeline** table (after the entry point rows):

     | Stage | Started | Completed | Duration | Status |
     |-------|---------|-----------|----------|--------|
     | Specify | | | | Pending |
     | Clarify | | | | Pending |
     | Plan | | | | Pending |
     | Tasks | | | | Pending |
     | Checklist | | | | Pending |
     | Implement | | | | Pending |

   - Update the **Effort Breakdown** table to include Spec-Kit phases:

     | Phase | Interactions | Approvals | Duration |
     |-------|-------------|-----------|----------|
     | Entry Point | [count] | [count] | [duration] |
     | Specification | 0 | 0 | |
     | Planning | 0 | 0 | |
     | Implementation | 0 | 0 | |

4. Inform the user:
   ```markdown
   ## Workflow: Spec-Kit

   Your feature will follow the Spec-Kit workflow. The stages are:

   1. **Specify** — Create the feature specification
   2. **Clarify** — (optional) Clarify ambiguities
   3. **Plan** — Create the implementation plan
   4. **Tasks** — Generate ordered tasks
   5. **Checklist** — (optional) Generate quality checklist
   6. **Implement** — Execute the implementation

   The feature directory is ready at: `specs/{BRANCH_NAME}/`

   **Ready to proceed with specification?**
   ```

5. **Begin Spec-Kit execution**: When the user confirms they're ready to proceed:
   - Load the Spec-Kit specification command from `../../spec-kit/commands/speckit.specify.md`
   - Execute the specification workflow using the original feature description as input
   - The Spec-Kit workflow is stage-driven; after each stage completes, load and execute the next stage command as indicated by the completion instructions within each command
6. **Spec-Kit stage chain** (load each file in sequence as stages complete):
   - Specify: `../../spec-kit/commands/speckit.specify.md`
   - Clarify (optional): `../../spec-kit/commands/speckit.clarify.md`
   - Plan: `../../spec-kit/commands/speckit.plan.md`
   - Tasks: `../../spec-kit/commands/speckit.tasks.md`
   - Checklist (optional): `../../spec-kit/commands/speckit.checklist.md`
   - Implement: `../../spec-kit/commands/speckit.implement.md`

### If AWS AI-DLC was chosen:

1. Update `specs/{BRANCH_NAME}/state.md`: Set `**Workflow**: AWS AI-DLC`
2. Log routing decision in audit.md
3. **Initialize AWS AI-DLC analytics rows**: Read `main-workflow/analytics/{BRANCH_NAME}.md` and:
   - Set `**Workflow**` in the Metadata section to `AWS AI-DLC`
   - Append the AWS AI-DLC stage rows to the **Stage Timeline** table (after the entry point rows):

     | Stage | Started | Completed | Duration | Status |
     |-------|---------|-----------|----------|--------|
     | Requirements Analysis | | | | Pending |
     | Onboarding Presentations | | | | Pending |
     | User Stories | | | | Pending |
     | Workflow Planning | | | | Pending |
     | Application Design | | | | Pending |
     | Units Generation | | | | Pending |
     | Functional Design | | | | Pending |
     | NFR Requirements | | | | Pending |
     | NFR Design | | | | Pending |
     | Infrastructure Design | | | | Pending |
     | Code Generation | | | | Pending |
     | Onboarding Update | | | | Pending |
     | Build and Test | | | | Pending |

   - Update the **Effort Breakdown** table to include AWS AI-DLC phases:

     | Phase | Interactions | Approvals | Duration |
     |-------|-------------|-----------|----------|
     | Entry Point | [count] | [count] | [duration] |
     | Inception | 0 | 0 | |
     | Construction | 0 | 0 | |

4. The AWS workflow begins from **Requirements Analysis** (workspace detection and reverse engineering are already complete)
5. Load the AWS workflow rules from `../../aws/commands/aws-rules.md`
6. Execute the AWS workflow starting from Requirements Analysis

---

## Analytics File

### Purpose

Track workflow usage metrics across features to understand how much work is done using the workflow and how long each cycle takes. The analytics file is created at the entry point, updated after each workflow phase/stage, and finalised with totals at the end of implementation.

### Analytics File Format

Create `main-workflow/analytics/{BRANCH_NAME}.md`:

```markdown
# Feature Analytics: {BRANCH_NAME}

## Metadata
- **Feature**: {feature_description}
- **Branch**: {BRANCH_NAME}
- **JIRA Ticket**: {JIRA_TICKET | null}
- **Workflow**: Pending
- **Created**: [ISO timestamp]
- **Completed**: [Populated at workflow end]
- **Total Duration**: [Calculated at workflow end]

## Stage Timeline

| Stage | Started | Completed | Duration | Status |
|-------|---------|-----------|----------|--------|
| Branch Creation | [ISO timestamp] | [ISO timestamp] | [duration] | Completed |
| Workspace Detection | | | | Pending |
| Reverse Engineering | | | | Pending / Skipped |
| Workflow Selection | | | | Pending |
| Workflow Routing | | | | Pending |

> Workflow-specific stages are appended by the chosen workflow (Spec-Kit or AWS AI-DLC).

## Work Metrics
- **Total AI Interactions**: 0
- **Approval Gates Passed**: 0
- **Change Requests**: 0
- **Clarification Rounds**: 0
- **Artifacts Generated**: 0
- **Stages Executed**: 1
- **Stages Skipped**: 0

## Effort Breakdown

| Phase | Interactions | Approvals | Duration |
|-------|-------------|-----------|----------|
| Entry Point | 0 | 0 | |
| [Workflow Phase] | 0 | 0 | |

## Cycle Summary
- **Entry Point Duration**: [Calculated after routing]
- **Workflow Duration**: [Calculated at workflow end]
- **End-to-End Duration**: [Calculated at workflow end]
- **Rework Cycles**: 0 (count of "Request Changes" choices across all stages)
```

### Analytics Update Instructions

After **every** completed workflow phase/stage, and again at implementation completion for final totals, the analytics file **MUST** be updated by following `../stages/analytics-update.md`. Both Spec-Kit and AWS AI-DLC reference this shared instruction file.

---

## Key Principles

- **Single Entry Point**: All development work starts here
- **User-Driven Routing**: User directly chooses Spec-Kit or AWS AI-DLC for each feature
- **Standardized Branching**: All features use `###-jira-ticket-short-description` numbered branches (or `###-short-description` when JIRA ticket is null)
- **Standardized Artifacts**: All features write to `specs/{branch}/`
- **Project-Level RE**: Reverse engineering runs once, stored at `specs/_project/`, updated after implementations
- **Full Audit Trail**: Every interaction logged in `specs/{branch}/audit.md`
- **Complete State Tracking**: Progress tracked in `specs/{branch}/state.md`

## Prompts Logging Requirements
- **MANDATORY**: Log EVERY user input (prompts, questions, responses) with timestamp in audit.md
- **MANDATORY**: Capture user's COMPLETE RAW INPUT exactly as provided (never summarize)
- **MANDATORY**: Log every approval prompt with timestamp before asking the user
- **MANDATORY**: Record every user response with timestamp after receiving it
- **CRITICAL**: ALWAYS append changes to EDIT audit.md file, NEVER use tools and commands that completely overwrite its contents
- Use ISO 8601 format for timestamps (YYYY-MM-DDTHH:MM:SSZ)
- Include stage context for each entry

### Audit Log Format:
```markdown
## [Stage Name or Interaction Type]
**Timestamp**: [ISO timestamp]
**User Input**: "[Complete raw user input - never summarized]"
**AI Response**: "[AI's response or action taken]"
**Context**: [Stage, action, or decision made]

---
```

### Correct Tool Usage for audit.md

✅ CORRECT:

1. Read the audit.md file
2. Append/Edit the file to make changes

❌ WRONG:

1. Read the audit.md file
2. Completely overwrite the audit.md with the contents of what you read, plus the new changes you want to add to it

## MANDATORY: Content Validation
**CRITICAL**: Before creating ANY file, you MUST validate content according to `../memory/content-validation.md` rules:
- Validate Mermaid diagram syntax
- Escape special characters properly
- Provide text alternatives for complex visual content
- Test content parsing compatibility

## AI Self-Review Gate

Before finalising output, the AI must explicitly state:
- Key assumptions made
- Known risks and unknowns
- Operational and on-call impact
- Rollback or mitigation strategy
- What was intentionally not addressed

The AI must not self-approve its own output.
