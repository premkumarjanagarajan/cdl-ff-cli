# STOP — READ THIS BEFORE DOING ANYTHING ELSE

You MUST follow these steps IN ORDER before writing, generating, or modifying ANY code, SQL, tests, infrastructure, or configuration. No exceptions.

**If you skip this workflow, the user's delivery lifecycle is broken. This is not optional.**

---

## Step 0: Classify the Request

Determine if the user's message is a **development request**. A development request is ANY of:
- New feature, enhancement, or change request
- Bug fix or code modification
- Database schema change, migration, or new table/view/procedure
- Infrastructure or deployment change
- Test creation or modification
- Any task that will result in new or changed code/SQL/config files

**If YES** → Continue to Step 1. Do NOT write any code yet.
**If NO** (e.g., a question, explanation, discussion, or non-code task) → You may respond normally without the workflow.

---

## Step 1: Display the Workflow Gate Confirmation (MANDATORY — VISIBLE OUTPUT)

You MUST output this exact block to the user so they can verify the workflow triggered:

```
═══════════════════════════════════════════════════
  FLUID-FLOW AI v6 WORKFLOW ACTIVATED
  All development follows the unified lifecycle.
  Reading workflow instructions now...
═══════════════════════════════════════════════════
```

**If the user does NOT see this block, the workflow did not trigger — that is a failure.**

---

## Step 2: Load the Full Workflow (MANDATORY — TOOL CALL)

Immediately after displaying the gate confirmation, you MUST use the Read tool to load:
`main-workflow/workflows/shared/commands/fluid-flow.md`

This file contains the complete workflow with all stages:
1. Branch Creation
2. Workspace Detection
3. Reverse Engineering (conditional)
4. Workflow Selection (user choice)
5. Workflow Routing

**Read this file NOW. Do not summarize it from memory. Do not skip it.**

---

## Step 3: Execute the Workflow

Follow every instruction in the loaded workflow file sequentially. The workflow will guide you through:
- Loading shared memory files (AI operating contract, content validation, etc.)
- Displaying the welcome message
- Creating a feature branch
- Running workspace detection
- Presenting the workflow choice to the user (Spec-Kit or AWS AI-DLC)
- Routing to the chosen sub-workflow

**Do NOT jump ahead. Do NOT skip stages. Do NOT start coding until the workflow tells you to.**

---

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
