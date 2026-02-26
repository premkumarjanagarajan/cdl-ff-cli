# Apply Improvements from Retrospective Backlog

# This command is a STANDALONE entry point.
# It can be run at ANY time, in ANY chat session — it does not depend on conversation context.
# It reads the improvement backlog and applies selected items with user approval.

## Purpose

Review and apply concrete improvement items from the Fluid Flow improvement backlog.
Each item proposes a specific file edit to memory files, constitution files, prompts,
templates, or workflow configuration. This command enables the continuous improvement
loop by turning retrospective insights into actual framework changes.

---

## MANDATORY: Shared Memory Loading
**CRITICAL**: At command start, load the shared memory manifest and follow ALL instructions within it:
- Load `../memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

---

## Pre-Requisites

1. The improvement backlog must exist at `main-workflow/retrospectives/improvement-backlog.md`
2. If the file does not exist, inform the user:
   ```markdown
   ## No Improvement Backlog Found

   The improvement backlog at `main-workflow/retrospectives/improvement-backlog.md` does not exist.

   To generate improvement items, run a **workflow retrospective** after completing a workflow:
   - Execute the `fluid-flow.retrospective` command in the same chat session where the workflow ran

   No items to apply.
   ```

---

## Execution

### Step 1: Load and Parse the Backlog

1. Read `main-workflow/retrospectives/improvement-backlog.md`
2. Parse all improvement items, extracting for each:
   - ID (RETRO-NNN)
   - Status (Pending / Applied / Dismissed)
   - Source Feature
   - Date Identified
   - Priority (Critical / High / Medium / Low)
   - Category
   - Target File
   - Evidence
   - Proposed Edit (the diff block)
3. Filter to only **Pending** items
4. If no pending items exist, inform the user:
   ```markdown
   ## Backlog Up to Date

   All items in the improvement backlog have been processed (applied or dismissed).

   | Status | Count |
   |--------|-------|
   | Applied | [n] |
   | Dismissed | [n] |
   | **Total** | **[n]** |

   New items will be generated when the next workflow retrospective runs.
   ```

### Step 2: Present Pending Items

Present all pending items to the user, grouped by priority:

```markdown
## Improvement Backlog — Pending Items

### Critical Priority
| ID | Category | Target File | Summary |
|----|----------|-------------|---------|
| RETRO-NNN | [Category] | [File] | [Brief title] |

### High Priority
| ID | Category | Target File | Summary |
|----|----------|-------------|---------|
| RETRO-NNN | [Category] | [File] | [Brief title] |

### Medium Priority
| ID | Category | Target File | Summary |
|----|----------|-------------|---------|
| RETRO-NNN | [Category] | [File] | [Brief title] |

### Low Priority
| ID | Category | Target File | Summary |
|----|----------|-------------|---------|
| RETRO-NNN | [Category] | [File] | [Brief title] |

---

**Total Pending**: [n] items

### How to Proceed

Choose one of the following:
1. **Apply all** — Apply all pending items (you will approve each one individually)
2. **Apply by priority** — Apply all items of a specific priority (e.g., "apply all Critical and High")
3. **Apply specific items** — Apply specific items by ID (e.g., "apply RETRO-003, RETRO-007")
4. **Review first** — Show full details of specific items before deciding (e.g., "show RETRO-003")
5. **Dismiss items** — Mark specific items as not applicable (e.g., "dismiss RETRO-005")
```

### Step 3: Process User Selection

Based on the user's response:

#### If "Apply all" or "Apply by priority" or "Apply specific items":

For each selected item, execute the **Apply Sequence** (Step 4) one at a time.

#### If "Review first":

Show the full details of the requested items:

```markdown
## RETRO-NNN: {Title}

- **Priority**: {Priority}
- **Category**: {Category}
- **Source Feature**: {BRANCH_NAME}
- **Date Identified**: {Date}
- **Target File**: {File path}

### Evidence
{Evidence text — what happened in the workflow that triggered this}

### Proposed Edit

\```diff
{The full diff block}
\```

---

**Action**: Apply / Dismiss / Skip for now?
```

#### If "Dismiss items":

For each dismissed item, update the backlog:
- Change `- **Status**: Pending` to `- **Status**: Dismissed`
- Add `- **Dismissed Date**: [ISO timestamp]`
- Add `- **Dismissed Reason**: [User's reason if provided, otherwise "User dismissed"]`

---

### Step 4: Apply Sequence (Per Item)

For each item being applied:

#### 4a. Validate Target File

1. Check if the target file exists at the specified path
2. **If the file exists**: Read its current content
3. **If the file does NOT exist** and the item specifies `[NEW FILE]`:
   - The proposed edit will create the file (all `+` lines)
4. **If the file does NOT exist** and the item does NOT specify `[NEW FILE]`:
   - Warn the user: "Target file `{path}` no longer exists. This item may be outdated."
   - Ask: Apply anyway (create file) / Dismiss / Skip?

#### 4b. Verify Proposed Edit Applicability

1. Check that the `-` lines in the diff block match actual content in the target file
2. **If they match**: Proceed to apply
3. **If they do NOT match** (file has been modified since the item was generated):
   - Show the user the discrepancy:
     ```markdown
     ⚠ **Content Mismatch for RETRO-NNN**

     The target file has changed since this improvement was proposed.

     **Expected (from backlog)**:
     ```
     [the - lines from the diff]
     ```

     **Actual (current file)**:
     ```
     [the actual content at the expected location]
     ```

     **Options**:
     1. **Adapt** — I'll adjust the edit to fit the current file content
     2. **Force** — Apply the proposed edit as-is (may cause issues)
     3. **Skip** — Skip this item for now
     4. **Dismiss** — Mark as no longer applicable
     ```

#### 4c. Present Edit for Approval

Show the user exactly what will change:

```markdown
## Applying RETRO-NNN: {Title}

**File**: {target file path}

### Change Preview

\```diff
{The diff block with surrounding context from the actual file}
\```

**Approve this change?** (yes / no / modify)
```

- **If "yes"**: Apply the edit and proceed to 4d
- **If "no"**: Skip this item (leave as Pending)
- **If "modify"**: Ask the user what they want to change about the proposed edit, then re-present

#### 4d. Apply the Edit

1. Read the target file
2. Apply the changes described in the diff block:
   - Remove lines marked with `-`
   - Add lines marked with `+`
   - Preserve surrounding context and file structure
3. Write the updated file
4. Verify the edit was applied correctly (re-read and check)

#### 4e. Update the Backlog

Update the item in `main-workflow/retrospectives/improvement-backlog.md`:
- Change `- **Status**: Pending` to `- **Status**: Applied`
- Change `- **Applied**: [ ]` to `- **Applied**: [x]`
- Set `- **Applied Date**: [ISO timestamp]`

#### 4f. Update Backlog Statistics

After processing all selected items, update the **Backlog Statistics** section at the top of the backlog file with new counts for Total, Pending, Applied, and Dismissed.

---

### Step 5: Present Completion Summary

After all selected items have been processed:

```markdown
## Apply Improvements — Complete

### Results

| Action | Count | Items |
|--------|-------|-------|
| Applied | [n] | [comma-separated IDs] |
| Skipped | [n] | [comma-separated IDs] |
| Dismissed | [n] | [comma-separated IDs] |
| Failed | [n] | [comma-separated IDs] |

### Files Modified

| File | Changes |
|------|---------|
| [file path] | [brief description of what changed] |

### Remaining Backlog

- **Pending items**: [n] remaining
- **Next recommended action**: [suggestion based on remaining items]
```

---

## Batch Operations

For efficiency, the AI may batch consecutive edits to the same target file:

1. If multiple pending items target the same file, present them together
2. Show all proposed edits for that file in a single diff preview
3. Let the user approve the combined edit as one operation
4. Update all related backlog items together

---

## Safety Rules

- **NEVER** apply an edit without user approval
- **NEVER** modify the backlog file structure (only update item fields and statistics)
- **NEVER** delete items from the backlog (only change their status)
- **ALWAYS** verify the edit was applied correctly by re-reading the file
- **ALWAYS** preserve the append-only nature of the backlog
- If an edit fails (file write error, unexpected content), mark the item with a note and move on
