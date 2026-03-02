# Directory Structure

This document describes the complete directory layout of Fluid Flow AI -- both the framework's own files and the output artifacts it generates in your workspace.

---

## Table of Contents

- [Framework Structure](#framework-structure)
- [Generated Artifacts](#generated-artifacts)
- [Code Location Rules](#code-location-rules)

---

## Framework Structure

The Fluid Flow AI framework is organised into four main areas: the Cursor rule trigger, workflow definitions, shared resources, and automation scripts.

```
fluid-flow-ai/
│
├── .cursor/
│   └── rules/
│       └── workflow.mdc                          # Cursor rule -- triggers on every message
│
├── .gitignore                                    # Git ignore patterns
│
├── README.md                                     # Project README
│
├── docs/                                         # Documentation
│   ├── ARCHITECTURE.md                           # System design and component relationships
│   ├── COMMANDS.md                               # Complete command reference
│   ├── DIRECTORY-STRUCTURE.md                    # This file
│   ├── GETTING-STARTED.md                        # Installation and first-run guide
│   ├── GOVERNANCE.md                             # Compliance, security, and review gates
│   ├── REVERSE-ENGINEERING.md                    # RE artifact reference with samples
│   ├── WORKFLOWS.md                              # Detailed workflow reference
│   └── reverse-engineering-samples/              # Sample output for each RE artifact
│       ├── business-overview.md
│       ├── architecture.md
│       ├── c4-architecture.md
│       ├── code-structure.md
│       ├── api-documentation.md
│       ├── component-inventory.md
│       ├── technology-stack.md
│       ├── dependencies.md
│       ├── code-quality-assessment.md
│       ├── test-coverage-analysis.md
│       └── reverse-engineering-timestamp.md
│
└── main-workflow/
    │
    ├── analytics/                                # Feature analytics files (one per feature)
    │   └── {BRANCH_NAME}.md                      # Per-feature analytics (timing, metrics, effort)
    │
    ├── Instructions/                             # Technology-specific guidelines
    │   └── technology/
    │       ├── csharp/
    │       │   └── general.md                    # C# coding standards
    │       ├── dotnet/
    │       │   └── general.md                    # .NET development rules
    │       └── terraform/
    │           └── general.md                    # Terraform guidelines
    │
    └── workflows/
        │
        ├── shared/                               # Shared across both workflows
        │   │
        │   ├── commands/
        │   │   ├── fluid-flow.md                 # Unified entry point orchestrator
        │   │   └── fluid-flow.update-docs.md     # Post-implementation documentation update
        │   │
        │   ├── memory/                           # Governance and rules (loaded at runtime)
        │   │   ├── ai-operating-contract.md      # AI role and decision authority
        │   │   ├── content-validation.md         # Mermaid and markdown validation rules
        │   │   ├── welcome-message.md            # User-facing welcome message
        │   │   │
        │   │   ├── review/
        │   │   │   ├── ai-self-review.md         # AI self-review checklist
        │   │   │   └── human-gate.md             # Human approval gate rules
        │   │   │
        │   │   ├── architecture/
        │   │   │   └── adr-integrity-gate.md         # ADR integrity enforcement
        │   │   │
        │   │   ├── meta/
        │   │   │   └── continuous-learning.md         # Continuous improvement rules
        │   │   │
        │   │   ├── overconfidence-prevention.md       # Overconfidence guardrails
        │   │   │
        │   │   ├── iso/
        │   │   │   ├── iso9001-quality-management.md  # ISO 9001 quality principles
        │   │   │   └── iso50001-energy-management.md  # ISO 50001 energy management
        │   │   │
        │   │   └── security/
        │   │       ├── authz-authn.md            # Authentication and authorisation
        │   │       ├── data-classification.md    # Data sensitivity and handling
        │   │       ├── dependencies.md           # Third-party dependency security
        │   │       ├── logging-security.md       # Audit logging security
        │   │       ├── network-boundaries.md     # Network segmentation
        │   │       ├── refusal-patterns.md       # When to refuse operations
        │   │       ├── secrets-management.md     # Secrets storage and rotation
        │   │       ├── security-self-review.md   # Security review checklist
        │   │       ├── threat-model.md           # Threat modelling approach
        │   │       └── iso27001/
        │   │           └── compliance.md         # ISO 27001 compliance rules
        │   │
        │   └── stages/                           # Shared workflow stages
        │       ├── analytics-update.md           # Feature analytics finalisation instructions
        │       ├── complexity-assessment.md      # Complexity scoring (not used in entry flow)
        │       ├── reverse-engineering.md         # Full codebase analysis (run-once)
        │       ├── reverse-engineering-update.md  # Incremental RE updates
        │       ├── shell-detection.md            # Bash vs PowerShell detection and script mapping
        │       ├── test-coverage-analysis.md     # Coverage baseline and delta
        │       └── workspace-detection.md        # Greenfield/brownfield detection
        │
        ├── spec-kit/                             # Spec-Kit workflow
        │   │
        │   ├── commands/                         # Slash commands
        │   │   ├── speckit.specify.md            # Create specification
        │   │   ├── speckit.clarify.md            # Clarify ambiguities
        │   │   ├── speckit.plan.md               # Create implementation plan
        │   │   ├── speckit.tasks.md              # Generate task list
        │   │   ├── speckit.checklist.md          # Generate quality checklists
        │   │   ├── speckit.implement.md          # Execute implementation
        │   │   ├── speckit.analyze.md            # Cross-artifact analysis
        │   │   ├── speckit.constitution.md       # Constitution management
        │   │   └── speckit.taskstoissues.md      # Convert tasks to GitHub issues
        │   │
        │   ├── memory/
        │   │   └── constitution.md               # Spec-Kit constitution template
        │   │
        │   ├── scripts/
        │   │   ├── bash/                         # Bash scripts (macOS, Linux, Git Bash)
        │   │   │   ├── common.sh                 # Shared utilities
        │   │   │   ├── check-prerequisites.sh    # Validate feature context
        │   │   │   ├── create-new-feature.sh     # Create feature branches
        │   │   │   ├── setup-plan.sh             # Prepare plan context
        │   │   │   └── update-agent-context.sh   # Update agent context
        │   │   │
        │   │   └── powershell/                   # PowerShell scripts (Windows, cross-platform)
        │   │       ├── common.ps1                # Shared utilities
        │   │       ├── check-prerequisites.ps1   # Validate feature context
        │   │       ├── create-new-feature.ps1    # Create feature branches
        │   │       ├── setup-plan.ps1            # Prepare plan context
        │   │       └── update-agent-context.ps1  # Update agent context
        │   │
        │   └── templates/                        # Output templates
        │       ├── agent-file-template.md        # Agent file template
        │       ├── checklist-template.md         # Checklist template
        │       ├── plan-template.md              # Implementation plan template
        │       ├── spec-template.md              # Specification template
        │       └── tasks-template.md             # Task list template
        │
        └── aws/                                  # AWS AI-DLC workflow
            │
            ├── commands/
            │   └── aws-rules.md                  # AWS workflow definition and rules
            │
            ├── inception/                        # Inception phase stage definitions
            │   ├── adrs-technical-principles.md  # ADR and technical principle rules
            │   ├── application-design.md         # Application design stage
            │   ├── onboarding-presentations.md   # Onboarding presentation generation
            │   ├── requirements-analysis.md      # Requirements analysis stage
            │   ├── units-generation.md           # Units generation stage
            │   ├── user-stories.md               # User story generation stage
            │   └── workflow-planning.md          # Workflow planning stage
            │
            ├── construction/                     # Construction phase stage definitions
            │   ├── build-and-test.md             # Build and test instructions
            │   ├── code-generation.md            # Code generation stage
            │   ├── functional-design.md          # Functional design stage
            │   ├── infrastructure-design.md      # Infrastructure design stage
            │   ├── nfr-design.md                 # NFR design stage
            │   ├── nfr-requirements.md           # NFR requirements stage
            │   └── onboarding-update.md          # Onboarding update stage
            │
            ├── memory/                           # AWS-specific memory files
            │   └── common/
            │       ├── depth-levels.md           # Adaptive depth level definitions
            │       ├── error-handling.md         # Error handling patterns
            │       ├── process-overview.md       # Workflow process overview
            │       ├── question-format-guide.md  # Question formatting rules
            │       ├── session-continuity.md     # Session resumption guidance
            │       ├── terminology.md            # Domain terminology
            │       ├── welcome-message.md        # AWS-specific welcome content
            │       └── workflow-changes.md       # Workflow change tracking
            │
            └── operations/                       # Operations phase definitions
                ├── failure-modes.md              # Failure mode analysis
                ├── oncall-impact.md              # On-call impact assessment
                └── operations.md                 # Operations stage (placeholder)
```

---

## Generated Artifacts

When you use Fluid Flow AI in a project, it generates artifacts in a `specs/` directory at your workspace root. Application code is always placed in the workspace root, never inside `specs/`.

### Feature-Level Artifacts

Each feature gets its own directory under `specs/`:

```
specs/{BRANCH_NAME}/                              # e.g., specs/001-proj-1234-add-user-auth/
│
├── state.md                                      # Progress tracking (includes JIRA ticket)
├── audit.md                                      # Full audit trail (includes JIRA ticket)
├── workspace-detection.md                        # Workspace scan results
│
├── spec.md                                       # Feature specification (Spec-Kit)
├── plan.md                                       # Implementation plan (Spec-Kit)
├── tasks.md                                      # Ordered task list (Spec-Kit)
├── data-model.md                                 # Entity definitions (if applicable)
├── research.md                                   # Research and decisions (if applicable)
│
├── checklists/                                   # Quality checklists (Spec-Kit)
│   ├── ux.md
│   ├── security.md
│   └── ...
│
├── contracts/                                    # API contracts (if applicable)
│   └── ...
│
├── inception/                                    # Inception phase (AWS AI-DLC)
│   ├── plans/
│   ├── requirements/
│   ├── user-stories/
│   ├── onboarding/
│   │   ├── engineers/
│   │   │   └── onboarding-engineers.md
│   │   └── product/
│   │       └── onboarding-product.md
│   └── application-design/
│
├── construction/                                 # Construction phase (AWS AI-DLC)
│   ├── plans/
│   ├── {unit-name}/                              # One directory per unit
│   │   ├── functional-design/
│   │   ├── nfr-requirements/
│   │   ├── nfr-design/
│   │   ├── infrastructure-design/
│   │   └── code/                                 # Markdown summaries only
│   ├── build-and-test/
│   │   ├── build-instructions.md
│   │   ├── unit-test-instructions.md
│   │   ├── integration-test-instructions.md
│   │   ├── performance-test-instructions.md
│   │   └── build-and-test-summary.md
│   └── coverage-improvement-plan.md
│
├── operations/                                   # Operations phase (placeholder)
│
└── features/
    └── features-registry.md                      # Feature registry
```

### Project-Level Artifacts

Shared across all features, stored at `specs/_project/`:

```
specs/_project/
│
└── reverse-engineering/                          # Generated once, updated incrementally
    ├── reverse-engineering-timestamp.md          # Metadata and update history
    ├── business-overview.md                      # Business context and transactions
    ├── architecture.md                           # System architecture and diagrams
    ├── c4-architecture.md                        # C4 model (Context, Container, Component, Code)
    ├── code-structure.md                         # Build system, file inventory, patterns
    ├── api-documentation.md                      # REST and internal API docs
    ├── component-inventory.md                    # Package inventory by category
    ├── technology-stack.md                       # Languages, frameworks, tools
    ├── dependencies.md                           # Internal and external dependency maps
    ├── code-quality-assessment.md                # Quality indicators and technical debt
    └── test-coverage-analysis.md                 # Coverage baseline and gap analysis
```

### Feature Analytics

Each feature gets an analytics file in the framework's analytics directory:

```
main-workflow/analytics/
│
├── 001-proj-1234-add-user-auth.md                # Analytics for feature 001
├── 002-proj-5678-fix-payment-bug.md              # Analytics for feature 002
└── ...                                           # One file per feature
```

Each analytics file tracks: start/end timestamps, stage timeline with durations, work metrics (interactions, approvals, change requests), effort breakdown by phase, and cycle summary.

---

## Code Location Rules

These rules are enforced throughout the workflow:

| Content Type | Location | Rule |
|-------------|----------|------|
| **Application code** | Workspace root | NEVER in `specs/` |
| **Feature documentation** | `specs/{BRANCH_NAME}/` | One directory per feature branch |
| **Project-level artifacts** | `specs/_project/` | Shared across features |
| **Reverse engineering** | `specs/_project/reverse-engineering/` | Run-once, updated post-implementation |
| **Feature analytics** | `main-workflow/analytics/` | One file per feature, tracks timing and metrics |
| **Framework files** | `fluid-flow-ai/` | Never modified by the workflow (except analytics) |

### Examples

```
your-project/                         # Workspace root
├── src/                              # Application code goes HERE
│   ├── controllers/
│   ├── services/
│   └── models/
├── tests/                            # Test code goes HERE
├── package.json
├── specs/                            # Workflow artifacts go HERE
│   ├── _project/
│   │   └── reverse-engineering/
│   ├── 001-add-user-auth/
│   │   ├── state.md
│   │   ├── audit.md
│   │   └── spec.md
│   └── 002-fix-payment-bug/
│       ├── state.md
│       ├── audit.md
│       └── spec.md
└── fluid-flow-ai/                   # Framework (read-only at runtime)
```
