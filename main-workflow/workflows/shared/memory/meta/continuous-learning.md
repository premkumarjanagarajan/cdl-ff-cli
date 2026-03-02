# Continuous Learning Loop

## In-Flight Detection

If AI detects during any workflow stage:
- Repeated workarounds
- Recurring exceptions
- Conflicting principles
- ADR friction

AI must:
- Highlight systemic issues
- Propose rule or ADR improvements
- Avoid local-only fixes when root causes exist

## Post-Workflow Retrospective

After every workflow completion, the AI should recommend running a formal retrospective:

### Workflow Retrospective (`fluid-flow.retrospective`)
- **When**: After a workflow completes, in the same chat session
- **What**: Analyses the full conversation across 8 dimensions (workflow friction, memory gaps, memory conflicts, constitution gaps, prompt effectiveness, clarification patterns, rework patterns, missing capabilities)
- **Output**: Feature retrospective (`specs/{BRANCH_NAME}/retrospective.md`) and concrete improvement items appended to the cumulative backlog
- **Location**: `main-workflow/workflows/shared/commands/fluid-flow.retrospective.md`

### Apply Improvements (`fluid-flow.apply-improvements`)
- **When**: Anytime — can be a different chat session
- **What**: Reads the improvement backlog and applies selected items with user approval
- **Output**: Concrete edits to memory files, constitution files, prompts, templates, and workflow configuration
- **Location**: `main-workflow/workflows/shared/commands/fluid-flow.apply-improvements.md`

### Improvement Backlog
- **Location**: `main-workflow/retrospectives/improvement-backlog.md`
- **Nature**: Cumulative, append-only across all features
- **Items**: Each item includes priority, category, evidence, target file, and a concrete diff-format proposed edit
- **Statuses**: Pending → Applied or Dismissed

### Recommended Cadence
- Run retrospective after **every** workflow completion
- Review and apply backlog items after every 3-5 completed features (or when critical items accumulate)
- Use the backlog to track the evolution of the framework over time
