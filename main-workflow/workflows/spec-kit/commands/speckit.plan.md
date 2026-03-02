
## MANDATORY: Shared Memory Loading
**CRITICAL**: At command start, load the shared memory manifest and follow ALL instructions within it:
- Load `../../shared/memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

## MANDATORY: State and Audit Logging
- Read and update `specs/{BRANCH_NAME}/state.md` with stage progress at start and completion of this command
- Append to `specs/{BRANCH_NAME}/audit.md` with user inputs and AI responses using ISO 8601 timestamps
- Use the same verbatim logging rules: capture COMPLETE RAW INPUT, never summarize
- ALWAYS append/edit audit.md, NEVER completely overwrite it

## MANDATORY: Per-Phase Analytics Update
- Update `main-workflow/analytics/{BRANCH_NAME}.md` when this command completes.
- Load `../../shared/stages/analytics-update.md` and execute **Step 3: Phase Completion Update**.
- Use stage name: `Plan`.
- Use status: `Completed`.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Resolve `SHELL_TYPE` — read the `**Shell**` field from `specs/{BRANCH_NAME}/state.md`; if missing, detect it per `../../shared/stages/shell-detection.md`. Run the appropriate script from repo root:
   - **bash**: `../scripts/bash/setup-plan.sh --json` — For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **powershell**: `../scripts/powershell/setup-plan.ps1 -Json`

   Parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH.

2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Plan`.

3. **Load context**: Read FEATURE_SPEC and `../memory/constitution.md`. Load IMPL_PLAN template (already copied).

4. **Load brownfield context** (if available):
   - Check if `specs/_project/reverse-engineering/` exists
   - If found, load and reference these artifacts to inform the plan:
     - `architecture.md` - Align plan with existing architecture
     - `code-structure.md` - Understand existing patterns and code organization
     - `technology-stack.md` - Use existing tech stack decisions
     - `dependencies.md` - Understand existing dependency landscape
     - `api-documentation.md` - Understand existing API patterns
   - Use this context to generate plans that are consistent with the existing codebase

5. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

6. **Analytics: Record stage completion**: Update `main-workflow/analytics/{BRANCH_NAME}.md` by following `../../shared/stages/analytics-update.md` **Step 3: Phase Completion Update** for stage `Plan` with status `Completed`.

7. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

8. **Continue to next stage**: Present the next stage option to the user and wait for confirmation. When the user confirms, load and execute `./speckit.tasks.md`.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update** (use `SHELL_TYPE` resolved earlier):
   - **bash**: Run `../scripts/bash/update-agent-context.sh cursor-agent`
   - **powershell**: Run `../scripts/powershell/update-agent-context.ps1 -AgentType cursor-agent`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use relative paths
- ERROR on gate failures or unresolved clarifications
