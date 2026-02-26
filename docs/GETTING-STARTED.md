# Getting Started

This guide walks you through setting up Fluid Flow AI and running your first workflow.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Cursor IDE** | [cursor.sh](https://cursor.sh/) -- Fluid Flow AI relies on Cursor's rules engine (`.mdc` files) |
| **Git** | Any recent version. Must be initialised in your workspace (`git init`) |
| **Bash or PowerShell** | Bash is available by default on macOS and Linux. PowerShell is available on Windows (also cross-platform via [PowerShell 7+](https://github.com/PowerShell/PowerShell)). The workflow auto-detects which shell to use. |
| **AI Model Access** | Cursor must be configured with an AI model (e.g., Claude, GPT-4) |

---

## Installation

### 1. Copy Fluid Flow AI into Your Project

Copy the `fluid-flow-ai/` directory into the root of your workspace:

```
your-project/
├── fluid-flow-ai/
│   ├── .cursor/
│   │   └── rules/
│   │       └── workflow.mdc
│   └── main-workflow/
│       └── ...
├── src/                    # Your application code
├── package.json            # Your project config
└── ...
```

### 2. Enable the Cursor Rule

The `workflow.mdc` file in `.cursor/rules/` has `alwaysApply: true`, which means Cursor will evaluate it on every message. If your project already has a `.cursor/rules/` directory, copy `workflow.mdc` into it.

Verify the rule is active by checking Cursor's rules panel -- you should see `fluid-flow-rules` listed.

### 3. Initialise Git (if not already)

```bash
git init
git add .
git commit -m "Initial commit"
```

Fluid Flow AI creates numbered feature branches, so Git must be initialised.

### 4. Make Scripts Executable

**macOS / Linux (Bash)**:
```bash
chmod +x fluid-flow-ai/main-workflow/workflows/spec-kit/scripts/bash/*.sh
```

**Windows (PowerShell)**: No extra step needed — `.ps1` scripts run natively in PowerShell. If execution policy blocks scripts, run once:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Your First Workflow

### Step 1: Make a Development Request

In Cursor's chat, type any development request. For example:

> "Add a user authentication system with JWT tokens and role-based access control"

### Step 2: Watch the Workflow Activate

You should see the activation banner:

```
═══════════════════════════════════════════════════
  FLUID-FLOW WORKFLOW ACTIVATED
  All development follows the unified lifecycle.
  Reading workflow instructions now...
═══════════════════════════════════════════════════
```

If you do not see this banner, the workflow did not trigger. Check that `workflow.mdc` is in `.cursor/rules/` and has `alwaysApply: true`.

### Step 3: Welcome Message

The AI displays a welcome message explaining the Fluid Flow AI process. This only appears once per workflow.

### Step 4: Branch Creation

The AI creates a numbered feature branch:

```
Branch created: 001-proj-1234-add-user-auth
Feature directory: specs/001-proj-1234-add-user-auth/
```

### Step 5: Workspace Detection

The AI scans your workspace and reports whether it is greenfield or brownfield:

```
Workspace Detection Complete
- Project Type: Brownfield
- Languages: TypeScript, JavaScript
- Build System: npm
- Next Step: Proceeding to Reverse Engineering...
```

### Step 6: Reverse Engineering (Brownfield Only)

If this is a brownfield project and no previous reverse engineering has been done, the AI analyses your codebase and generates architecture documentation. This runs once per project.

You will be asked to review and approve the findings before continuing.

### Step 7: Workflow Selection

You are presented with both workflow options and asked to choose:

```
Choose Your Workflow

Which workflow would you like to use for this feature?

1. Spec-Kit -- Lightweight specification-driven workflow.
   Best for: standard features, bug fixes, enhancements, CRUD operations,
   and work that doesn't require deep infrastructure or compliance design.

2. AWS AI-DLC -- Full Architecture Decision Lifecycle.
   Best for: complex infrastructure changes, multi-service integrations,
   projects requiring ADRs, NFR analysis, and formal architecture design.

Please reply with 1 or 2 (or the workflow name).
```

Reply **1** or **Spec-Kit** for the lightweight path, or **2** or **AWS** for the comprehensive path.

### Step 8: Execute the Workflow

The AI guides you through the chosen workflow with approval gates at each stage. You review, approve, request changes, or override at every checkpoint.

---

## Common Scenarios

### Scenario: Simple Bug Fix

1. Request: "Fix the null pointer exception in the payment processing module"
2. Workflow Selection: User chooses **Spec-Kit**
3. Flow: specify --> plan --> tasks --> implement

### Scenario: New Microservice

1. Request: "Build a notification service that handles email, SMS, and push notifications"
2. Workflow Selection: User chooses **AWS AI-DLC**
3. Flow: Requirements --> User Stories --> Workflow Planning --> Application Design --> Units Generation --> Per-unit Construction --> Build & Test

### Scenario: Brownfield Enhancement

1. Request: "Add caching to the product catalog API"
2. Reverse engineering runs on first request (or uses existing artifacts)
3. Workflow Selection: User chooses based on their understanding of the work
4. Flow depends on the chosen workflow

---

## Resuming Work

If you close Cursor and return later, the workflow can resume from where you left off:

1. The feature branch and `specs/{BRANCH_NAME}/` directory persist
2. `state.md` tracks the current stage and progress
3. `audit.md` contains the full interaction history
4. The AI reads these files to understand the current state and continue

---

## Troubleshooting

### Workflow Does Not Trigger

- Verify `workflow.mdc` is in `.cursor/rules/` relative to your workspace root
- Check that the file has `alwaysApply: true` in its frontmatter
- Ensure the request is classified as a development request (not a question or discussion)

### Branch Creation Fails

- Ensure Git is initialised in the workspace
- **macOS/Linux**: Check that the bash scripts are executable (`chmod +x`)
- **Windows**: Ensure PowerShell execution policy allows scripts (`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`)
- Verify no conflicting branch names exist

### Scripts Fail on Windows

Fluid Flow AI includes both Bash and PowerShell scripts. The workflow auto-detects your shell environment. If auto-detection fails:
- On native Windows, ensure PowerShell 5.1+ is available (pre-installed on Windows 10+)
- Alternatively, use WSL, Git Bash, or any Bash-compatible shell — the workflow will detect these as Bash environments

### AI Does Not Follow the Workflow

If the AI skips stages or ignores the workflow:
- Check that shared memory files exist at the expected paths
- Verify the path references in `workflow.mdc` and `fluid-flow.md` are correct relative to your workspace structure
- Ensure the AI model has sufficient context window for the workflow files

---

## Next Steps

- Read [Workflows](WORKFLOWS.md) for detailed workflow reference
- Read [Commands](COMMANDS.md) for complete command documentation
- Read [Reverse Engineering](REVERSE-ENGINEERING.md) for artifact descriptions and samples
- Read [Governance](GOVERNANCE.md) to understand the compliance and security framework
- Read [Architecture](ARCHITECTURE.md) for the system design
