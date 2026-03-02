
## MANDATORY: Shared Memory Loading
**CRITICAL**: At command start, load the shared memory manifest and follow ALL instructions within it:
- Load `../../shared/memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

## MANDATORY: State and Audit Logging
- Read and update `specs/{BRANCH_NAME}/state.md` with stage progress at start and completion of this command
- Append to `specs/{BRANCH_NAME}/audit.md` with user inputs and AI responses using ISO 8601 timestamps
- Use the same verbatim logging rules: capture COMPLETE RAW INPUT, never summarize
- ALWAYS append/edit audit.md, NEVER completely overwrite it

## MANDATORY: Per-Phase Analytics Updates
- Update `main-workflow/analytics/{BRANCH_NAME}.md` after each implementation phase completes.
- Load `../../shared/stages/analytics-update.md` and execute:
  - **Step 3: Phase Completion Update** after each phase (`Implement - Setup`, `Implement - Tests`, `Implement - Core`, `Implement - Integration`, `Implement - Polish`)
  - **Step 3: Phase Completion Update** for overall stage `Implement` at command completion
  - **Step 4: Final Totals Update** at the end of this command

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Resolve `SHELL_TYPE` — read the `**Shell**` field from `specs/{BRANCH_NAME}/state.md`; if missing, detect it per `../../shared/stages/shell-detection.md`. Run the appropriate script from repo root:
   - **bash**: `../scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` — For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **powershell**: `../scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`

   Parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be relative.

2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Implement`.

3. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

4. **Load brownfield context** (if available):
   - Check if `specs/_project/reverse-engineering/` exists
   - If found, load and reference these artifacts during implementation:
     - `architecture.md` - Ensure implementation aligns with existing architecture
     - `c4-architecture.md` - Reference C4 model for system context, containers, and component boundaries
     - `code-structure.md` - Follow existing code patterns and conventions
     - `technology-stack.md` - Use consistent technologies
     - `dependencies.md` - Understand existing dependencies
   - Use this context to generate code that is consistent with the existing codebase

5. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

6. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* exists → create/verify .eslintignore
   - Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `Makefile`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

7. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

8. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding
   - **Analytics checkpoint**: After each completed phase, run **Step 3: Phase Completion Update** from `../../shared/stages/analytics-update.md` with the matching stage name (`Implement - Setup`, `Implement - Tests`, `Implement - Core`, `Implement - Integration`, `Implement - Polish`)

9. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

10. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

11. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

12. **Final analytics update (MANDATORY)**:
   - Update `main-workflow/analytics/{BRANCH_NAME}.md` by loading `../../shared/stages/analytics-update.md`
   - Execute **Step 3: Phase Completion Update** for stage `Implement` with status `Completed`
   - Execute **Step 4: Final Totals Update** to finalise metadata, metrics, timeline, and cycle summary

13. **Post-Implementation Documentation**:
   - After implementation is complete, inform the user that remaining project-level documentation updates are available.
   - Present to the user:
     ```markdown
     ## Implementation Complete

     All tasks have been executed and analytics totals are now finalised at:
     `main-workflow/analytics/{BRANCH_NAME}.md`

     **Next step**: Update project-level documentation (test coverage delta, reverse engineering artifacts).

     Ready to proceed with documentation updates?
     ```
   - When the user confirms, load and execute `../../shared/commands/fluid-flow.update-docs.md`

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running speckit.tasks first (load `./speckit.tasks.md`) to regenerate the task list.
