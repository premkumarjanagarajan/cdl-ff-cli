# Workflow Retrospective Analysis

**Purpose**: Perform a meta-analysis of the workflow conversation that just completed. Identify concrete improvements to memory files, constitution files, stage prompts, and agent configurations to make future workflow executions more effective.

**Execute when**: After a workflow completes (Spec-Kit or AWS AI-DLC), in the same chat session where the workflow ran.

---

## Analysis Philosophy

This is a **self-improvement loop**. The AI must critically examine its own performance during the workflow — not to justify what happened, but to find what could work better next time.

**Ground rules for analysis:**
- Be specific — cite actual moments from the conversation, not generalities
- Be honest — if a prompt caused confusion, say so even if the AI "wrote" the prompt
- Be actionable — every finding must map to a concrete file edit, not vague advice
- Be evidence-based — every recommendation must reference a specific interaction or pattern
- Do NOT be self-congratulatory — "the workflow worked well overall" is not useful output
- Do NOT invent problems — if a dimension has no issues, skip it rather than stretching

---

## Step 1: Gather Context

Load the following inputs for the current feature:

1. **Conversation context**: The AI already has the full conversation in its context window. This is the PRIMARY data source.
2. **Audit trail**: Read `specs/{BRANCH_NAME}/audit.md` for structured interaction history with timestamps
3. **State file**: Read `specs/{BRANCH_NAME}/state.md` for stage progression and completion data
4. **Analytics file**: Read `main-workflow/analytics/{BRANCH_NAME}.md` for metrics (if already updated)
5. **Workflow artifacts**: Scan `specs/{BRANCH_NAME}/` for all generated artifacts

---

## Step 2: Conversation Analysis

Review the entire conversation across the following dimensions. For each dimension, identify specific moments, patterns, or gaps.

### Dimension 1: Workflow Friction Points

Identify where the workflow slowed down or caused unnecessary friction:

- Stages that took disproportionately long (compare to expected complexity)
- Moments where the user expressed confusion, frustration, or had to repeat themselves
- Stages where the AI asked for information it should have already had
- Transitions between stages that felt abrupt or lost context
- Places where the user had to correct the AI's understanding of the workflow itself

### Dimension 2: Memory File Gaps

Identify situations where the loaded memory files did not provide sufficient guidance:

- Decisions the AI made without consulting governance rules (but should have)
- Topics where the memory files were silent but the user expected guidance
- Cases where the AI had to "wing it" because no memory file covered the scenario
- Domains or patterns that came up repeatedly but have no memory file coverage

### Dimension 3: Memory File Conflicts

Identify contradictions or tension between memory files:

- Moments where following one memory file conflicted with another
- Cases where the AI had to prioritize between competing guidance
- Situations where memory file instructions were ambiguous or open to interpretation
- Overlapping guidance from different files that could confuse future executions

### Dimension 4: Constitution Gaps

Identify decisions that needed constitution-level guidance but had none:

- Architectural or design decisions that were made ad-hoc
- Quality standards that were assumed but not codified
- Technology choices that should be governed by constitution principles
- Patterns or anti-patterns that emerged but aren't captured anywhere

### Dimension 5: Prompt Effectiveness

Evaluate each stage/command prompt that was executed during the workflow:

- Which prompts produced clean, usable output on the first attempt?
- Which prompts required rework, clarification, or user correction?
- Were any prompt instructions unclear, causing the AI to interpret them inconsistently?
- Were any prompt instructions overly rigid, preventing appropriate flexibility?
- Were any prompt instructions too vague, leaving too much to AI interpretation?

### Dimension 6: Clarification Patterns

Analyze clarification interactions:

- What questions did the AI need to ask that could have been anticipated by better prompts?
- What questions did the user ask that the workflow should have proactively addressed?
- Were there repeated clarification cycles that indicate a structural gap?
- Could any clarification loops be eliminated by better templates or memory files?

### Dimension 7: Rework Patterns

Analyze all instances where work was redone:

- What artifacts needed revision and why?
- Were rework cycles caused by unclear requirements, bad assumptions, or prompt gaps?
- Could the rework have been prevented with better memory files or prompts?
- Were there approval gate failures that indicate the self-review checklist is incomplete?

### Dimension 8: Missing Capabilities

Identify needs the workflow doesn't currently address:

- Did the user request something the workflow has no stage or command for?
- Were there manual steps the user had to perform that could be automated?
- Were there cross-cutting concerns that no stage addresses?
- Did the AI identify patterns that suggest a new memory file, stage, or command?

---

## Step 3: Generate Feature Retrospective

Create `specs/{BRANCH_NAME}/retrospective.md` with the following structure:

```markdown
# Workflow Retrospective: {BRANCH_NAME}

**Feature**: {feature_description}
**Branch**: {BRANCH_NAME}
**Workflow**: {Spec-Kit / AWS AI-DLC}
**Date**: [ISO timestamp]
**Total Interactions**: [count from audit.md]
**Rework Cycles**: [count from audit.md]

---

## Executive Summary

[2-4 sentences summarising the key findings. What went well? What needs improvement? What is the single most impactful change that could be made?]

---

## Analysis by Dimension

### Workflow Friction
[Findings or "No significant friction identified"]

### Memory File Gaps
[Findings or "No gaps identified"]

### Memory File Conflicts
[Findings or "No conflicts identified"]

### Constitution Gaps
[Findings or "No gaps identified"]

### Prompt Effectiveness
[Findings with specific prompt/stage references]

### Clarification Patterns
[Findings or "No patterns identified"]

### Rework Patterns
[Findings or "No rework occurred"]

### Missing Capabilities
[Findings or "No gaps identified"]

---

## Improvement Items Generated

| ID | Category | Priority | Target File | Summary |
|----|----------|----------|-------------|---------|
| [IDs] | [Category] | [Priority] | [File path] | [Brief description] |

These items have been added to the improvement backlog at `main-workflow/retrospectives/improvement-backlog.md`.
```

**Content rules:**
- Only include dimensions that have actual findings — skip empty dimensions with a brief note
- Every finding must reference a specific moment or pattern from the conversation
- Keep the retrospective focused and actionable — not a rehash of the entire workflow

---

## Step 4: Generate Improvement Backlog Items

For each concrete improvement identified in Step 2, create a backlog item.

### Priority Assignment

- **Critical**: Issue caused workflow failure, data loss, or security/compliance gap
- **High**: Issue caused significant rework, user frustration, or consistently poor output
- **Medium**: Issue caused minor friction, could improve efficiency or clarity
- **Low**: Cosmetic improvement, minor wording change, or edge case

### Category Classification

- **Memory File Gap**: Missing guidance in an existing or new memory file
- **Memory File Conflict**: Contradiction between memory files
- **Memory File Enhancement**: Existing memory file needs additional content
- **Constitution Gap**: Missing constitution principle or rule
- **Constitution Enhancement**: Existing constitution principle needs refinement
- **Prompt Improvement**: Stage or command prompt needs better instructions
- **Template Improvement**: Output template needs structural changes
- **New Capability**: Entirely new stage, command, or memory file needed
- **Workflow Flow**: Changes to stage ordering, conditions, or transitions

### Backlog Item Format

Each item MUST follow this exact format:

```markdown
---

## {ID}: {Brief descriptive title}

- **Status**: Pending
- **Source Feature**: {BRANCH_NAME}
- **Date Identified**: [ISO timestamp]
- **Priority**: {Critical / High / Medium / Low}
- **Category**: {Category from list above}
- **Target File**: {relative path from repo root to the file to change}
- **Evidence**: {Specific description of what happened in the conversation that triggered this finding. Reference stage names, interaction numbers, or quote the relevant exchange.}
- **Proposed Edit**:

\```diff
- [existing line(s) to change — use actual content from the target file]
+ [proposed replacement line(s)]
\```

- **Applied**: [ ]
- **Applied Date**:
```

### ID Generation

1. Read the existing `main-workflow/retrospectives/improvement-backlog.md` file (if it exists)
2. Find the highest existing `RETRO-NNN` ID number
3. Continue incrementing from there (e.g., if RETRO-012 is the highest, next is RETRO-013)
4. If the file does not exist, start from RETRO-001

### Proposed Edit Rules

- **MANDATORY**: The `diff` block must contain actual content from the target file, not placeholders
- Read the target file to get the current content before writing the diff
- For new content to be added (no existing content to replace), use only `+` lines
- For content to be removed, use only `-` lines
- For modifications, show both `-` (old) and `+` (new) lines
- Include 1-2 lines of surrounding context (without +/-) for positioning
- If the change requires creating a new file, note `**Target File**: [NEW FILE] {path}` and show only `+` lines

---

## Step 5: Write Improvement Backlog

### If `main-workflow/retrospectives/improvement-backlog.md` does NOT exist:

1. Create the directory `main-workflow/retrospectives/` if it does not exist
2. Create the file with the following header:

```markdown
# Fluid Flow Improvement Backlog

This file is a cumulative, append-only backlog of improvement items generated by workflow retrospectives. Each item proposes a concrete change to memory files, constitution files, prompts, or workflow configuration.

## How to Use This Backlog

- **Review**: Read through pending items to understand improvement opportunities
- **Apply**: Run the `fluid-flow.apply-improvements` command to apply selected items
- **Manual Apply**: Apply items manually by editing the target file as described in the proposed edit
- **Dismiss**: Change status from `Pending` to `Dismissed` with a reason if an item is not applicable

## Backlog Statistics

- **Total Items**: 0
- **Pending**: 0
- **Applied**: 0
- **Dismissed**: 0
- **Last Updated**: [ISO timestamp]

---

# Improvement Items

[Items are appended below in reverse chronological order by source feature]
```

3. Append the new items below the `# Improvement Items` heading

### If the file already exists:

1. Read the existing file
2. Update the **Backlog Statistics** section with new counts
3. Append the new items below the most recent existing item
4. Separate feature batches with a clear heading:

```markdown

---

## From Feature: {BRANCH_NAME} ({ISO date})
```

---

## Step 6: Present Summary to User

After generating both files, present a summary:

```markdown
## Workflow Retrospective Complete

**Feature**: {BRANCH_NAME}
**Retrospective**: `specs/{BRANCH_NAME}/retrospective.md`
**Improvement Backlog**: `main-workflow/retrospectives/improvement-backlog.md`

### Items Generated

| Priority | Count |
|----------|-------|
| Critical | [n] |
| High | [n] |
| Medium | [n] |
| Low | [n] |
| **Total** | **[n]** |

### Top Recommendations

1. [Highest priority item summary]
2. [Second highest priority item summary]
3. [Third highest priority item summary]

### Next Steps

To review and apply improvements, run the **fluid-flow.apply-improvements** command.
You can apply improvements individually or in batches, with approval required for each change.
```
