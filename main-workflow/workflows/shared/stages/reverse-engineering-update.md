# Reverse Engineering Update (Post-Implementation)

**Purpose**: Incrementally update existing reverse engineering artifacts after an implementation completes, ensuring they reflect the current state of the codebase.

**Execute when**: After implementation completes in either workflow (AWS AI-DLC Build & Test, or Spec-Kit `/speckit.implement`).

**Skip when**: `specs/_project/reverse-engineering/` does not exist (no prior reverse engineering has been done, meaning the project is greenfield).

## Step 1: Load Existing Artifacts

Read all current artifacts from `specs/_project/reverse-engineering/`:
- `business-overview.md`
- `architecture.md`
- `c4-architecture.md`
- `code-structure.md`
- `api-documentation.md`
- `component-inventory.md`
- `technology-stack.md`
- `dependencies.md`
- `code-quality-assessment.md`
- `test-coverage-analysis.md`
- `reverse-engineering-timestamp.md`

## Step 2: Identify Changes

Analyze what changed during the implementation by:
1. Reviewing the feature's implementation artifacts:
   - For AWS: `specs/{branch}/construction/` artifacts and code changes
   - For Spec-Kit: `specs/{branch}/plan.md`, `specs/{branch}/tasks.md`, and code changes
2. Scanning the workspace for new or modified source files since the last RE timestamp
3. Identifying:
   - New components or packages added
   - Modified APIs or endpoints
   - New or changed dependencies
   - New or modified data models
   - Changes to infrastructure or deployment
   - New business logic or transactions

## Step 3: Incremental Update

For each change identified, update ONLY the affected sections of the relevant artifact:

### business-overview.md
- Add new business transactions or capabilities
- Update component-level business descriptions for modified components
- Update the business context diagram if system boundaries changed

### architecture.md
- Add new components to the architecture diagram
- Update component descriptions for modified components
- Update data flow diagrams if new flows were introduced
- Update integration points if new external APIs or services were added

### c4-architecture.md
- **Level 1 (System Context)**: Update if new external systems or actors were introduced, or if the system boundary changed
- **Level 2 (Container)**: Add new containers (services, databases, queues) introduced by the feature; update relationships and communication protocols between containers
- **Level 3 (Component)**: Add new components to affected container diagrams; update component responsibilities and relationships if refactored; add new component diagrams if entirely new containers were introduced
- **Level 4 (Code)**: Update only if architecturally critical classes/interfaces were added or significantly changed; do not update for minor code changes
- **Supplementary views**: Update dynamic diagrams if key business transaction flows changed; update deployment diagrams if infrastructure topology changed
- **Consistency check**: Ensure element names in C4 diagrams still match names used in `architecture.md`, `component-inventory.md`, and `code-structure.md`

### code-structure.md
- Add new source files to the files inventory
- Update design patterns section if new patterns were introduced
- Update critical dependencies if new ones were added

### api-documentation.md
- Add new REST or internal API endpoints
- Update modified endpoint documentation
- Add new data models

### component-inventory.md
- Add new packages to the appropriate category
- Update total counts

### technology-stack.md
- Add new programming languages, frameworks, or tools
- Update versions if dependencies were upgraded

### dependencies.md
- Add new internal dependencies to the dependency diagram
- Add new external dependencies with version and license info
- Update existing dependency relationships if they changed

### code-quality-assessment.md
- Note any new patterns or anti-patterns introduced
- Update technical debt notes

### test-coverage-analysis.md
- Update coverage metrics (line, branch, function, statement) by re-running coverage commands
- Update coverage-by-module table for new or modified modules
- Update test pyramid distribution if new test types were added
- Update coverage gap analysis: re-assess priorities based on new coverage data
- Update business flow coverage matrix if new flows were introduced or existing flows were better covered
- Update test quality assessment if new tests were added
- **Note**: The feature-level coverage delta is captured separately in `specs/{branch}/construction/coverage-improvement-plan.md` (Phase 2 of test-coverage-analysis)

## Step 4: Update Timestamp

Update `specs/_project/reverse-engineering/reverse-engineering-timestamp.md`:

```markdown
# Reverse Engineering Metadata

**Initial Analysis Date**: [Original ISO timestamp - preserved]
**Last Updated**: [Current ISO timestamp]
**Updated By**: Reverse Engineering Update (Post-Implementation)
**Feature**: {BRANCH_NAME}

## Update History
- [ISO timestamp] - Initial analysis
- [ISO timestamp] - Updated after feature {BRANCH_NAME} implementation
  - Changes: [Brief summary of what was updated]

## Artifacts Status
- [x] business-overview.md [Updated/Unchanged]
- [x] architecture.md [Updated/Unchanged]
- [x] c4-architecture.md [Updated/Unchanged]
- [x] code-structure.md [Updated/Unchanged]
- [x] api-documentation.md [Updated/Unchanged]
- [x] component-inventory.md [Updated/Unchanged]
- [x] technology-stack.md [Updated/Unchanged]
- [x] dependencies.md [Updated/Unchanged]
- [x] code-quality-assessment.md [Updated/Unchanged]
- [x] test-coverage-analysis.md [Updated/Unchanged]
```

## Step 5: Log Update

Log the update in `specs/{BRANCH_NAME}/audit.md`:

```markdown
## Reverse Engineering Update
**Timestamp**: [ISO timestamp]
**AI Response**: "Updated reverse engineering artifacts in specs/_project/reverse-engineering/"
**Context**: Post-implementation update after feature {BRANCH_NAME}
**Artifacts Updated**: [List of updated artifacts]
**Changes Summary**: [Brief description of changes]

---
```

## Key Principles

- **Incremental, not regenerative**: Only update what changed; do not regenerate entire artifacts
- **Preserve existing content**: Never remove content that is still accurate
- **Additive by default**: Add new sections/entries rather than replacing
- **Minimal disruption**: Keep existing structure and formatting intact
- **Traceable updates**: Every update is logged with feature reference and timestamp
