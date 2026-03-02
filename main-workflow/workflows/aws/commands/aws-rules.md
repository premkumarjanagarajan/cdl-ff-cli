# AWS AI-DLC Workflow
# This workflow is invoked from the shared entry point (fluid-flow-rules.md) after complexity assessment.
# The feature branch and directory already exist at specs/{BRANCH_NAME}/.
# Workspace Detection and Reverse Engineering have already been completed by the shared entry point.
# state.md and audit.md already exist in the feature directory.

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


## ADR Enforcement

All architectural decisions must be evaluated against existing ADRs.

For each relevant ADR, the AI must state:
- Whether the solution complies
- Whether it extends the ADR
- Whether it violates the ADR

If an ADR must be extended or violated, the AI must:
- Propose an ADR update
- Escalate for human approval
- Avoid implementation until approved


## Mandatory Stop Conditions

The AI must stop and request clarification if:
- Jurisdiction is unknown
- Regulatory scope is unclear
- ADRs are missing, ambiguous, or conflicting
- Requirements contradict technical principles
- Cross-domain or cross-platform changes are implied

Proceeding under uncertainty is not allowed.

## Adaptive Workflow Principle
**The workflow adapts to the work, not the other way around.**

The AI model intelligently assesses what stages are needed based on:
1. User's stated intent and clarity
2. Existing codebase state (if any)
3. Complexity and scope of change
4. Risk and impact assessment

## MANDATORY: Shared Memory Loading
**CRITICAL**: At workflow start, load the shared memory manifest and follow ALL instructions within it:
- Load `../../shared/memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

## MANDATORY: AWS-Specific Memory Loading
**CRITICAL**: In addition to shared memory, load the AWS memory manifest and follow ALL instructions within it:
- Load `../memory/load-aws-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location
- Reference these throughout the workflow execution

## MANDATORY: Architecture Decisions Records, Technical Principles and Code Guidelines
**CRITICAL**:
- Load `../inception/adrs-technical-principles.md` for ADRs and Technical Principles
- Load `../../../Instructions/technology/dotnet/general.md` for C# guidelines
- Load `../../../Instructions/technology/csharp/general.md` for dotnet guidelines
- Load `../../../Instructions/technology/terraform/general.md` for terraform guidelines

## MANDATORY: Content Validation
**CRITICAL**: Before creating ANY file, you MUST validate content according to the content-validation rules loaded from the shared memory manifest:
- Validate Mermaid diagram syntax
- Escape special characters properly
- Provide text alternatives for complex visual content
- Test content parsing compatibility

## MANDATORY: Question File Format
**CRITICAL**: When asking questions at any phase, you MUST follow question format guidelines.

**See `../memory/common/question-format-guide.md` for complete question formatting rules including**:
- Multiple choice format (A, B, C, D, E options)
- [Answer]: tag usage
- Answer validation and ambiguity resolution
- **AI Best Judgement mode**: For every question iteration, offer the user the choice between answering manually or letting the AI use its best judgement. See the "AI Best Judgement Mode" section in the question format guide for full details.

## MANDATORY: Per-Phase Analytics Updates
**CRITICAL**: Update `main-workflow/analytics/{BRANCH_NAME}.md` after every stage completes (executed or skipped).
- Load `../../shared/stages/analytics-update.md`
- Execute **Step 3: Phase Completion Update** with the exact AWS stage name after each stage
- For conditional stages that are skipped, still execute **Step 3** with status `Skipped`
- At the end of Build and Test, execute **Step 4: Final Totals Update** so totals are finalised by implementation completion

## NOTE: Welcome Message
The welcome message is displayed by the shared entry point (fluid-flow-rules.md) before this workflow is invoked. Do NOT display a separate welcome message.

# Adaptive Software Development Workflow

---

# INCEPTION PHASE

**Purpose**: Planning, requirements gathering, and architectural decisions

**Focus**: Determine WHAT to build and WHY

**Note**: Workspace Detection and Reverse Engineering are handled by the shared entry point (fluid-flow-rules.md) before this workflow is invoked. Their artifacts are available at:
- `specs/{BRANCH_NAME}/workspace-detection.md` (workspace findings)
- `specs/_project/reverse-engineering/` (reverse engineering artifacts, if brownfield)

**Stages in INCEPTION PHASE**:
- Onboarding Presentations (CONDITIONAL)
- Requirements Analysis (ALWAYS - Adaptive depth)
- User Stories (CONDITIONAL)
- Workflow Planning (ALWAYS)
- Application Design (CONDITIONAL)
- Units Generation (CONDITIONAL)
- **MANDATORY**: After each stage above completes (or is skipped), run `../../shared/stages/analytics-update.md` Step 3 for that stage name.

---

## Requirements Analysis (ALWAYS EXECUTE - Adaptive Depth)

**Always executes** but depth varies based on request clarity and complexity:
- **Minimal**: Simple, clear request - just document intent analysis
- **Standard**: Normal complexity - gather functional and non-functional requirements
- **Comprehensive**: Complex, high-risk - detailed requirements with traceability

**Execution**:
1. **MANDATORY**: Log any user input during this phase in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Requirements Analysis`
3. Load all steps from `../inception/requirements-analysis.md`
3. Execute requirements analysis:
   - Load reverse engineering artifacts from `specs/_project/reverse-engineering/` (if brownfield)
   - Analyze user request (intent analysis)
   - Determine requirements depth needed
   - Assess current requirements
   - Ask clarifying questions (if needed)
   - Generate requirements document
4. Execute at appropriate depth (minimal/standard/comprehensive)
5. **Wait for Explicit Approval**: Follow approval format from requirements-analysis.md detailed steps - DO NOT PROCEED until user confirms
6. **MANDATORY**: Log user's response in audit.md with complete raw input
7. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Requirements Analysis`


## Onboarding Presentations (CONDITIONAL)

**Execute IF**:
- Reverse engineering executed (brownfield), OR
- Onboarding presentations do not exist yet, OR
- Existing onboarding presentations are stale (key artifacts have changed since last generation)

**Purpose**:
Generate and maintain two sli-dev onboarding presentations derived from reverse engineering artifacts:
1. **Engineer Onboarding**: Technical onboarding for software engineers
2. **Product Onboarding**: Product manager onboarding (less technical, capability and journey focused)

**Execution**:
1. **MANDATORY**: Log start of onboarding presentations generation in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Onboarding Presentations`
3. Load all steps from `../inception/onboarding-presentations.md`
4. Generate the two sli-dev sources:
   - `specs/{BRANCH_NAME}/inception/onboarding/engineers/onboarding-engineers.md`
   - `specs/{BRANCH_NAME}/inception/onboarding/product/onboarding-product.md`
5. **MANDATORY**: Validate content before file creation per `../../shared/memory/content-validation.md`
6. **Wait for Explicit Approval**: Present completion message (see onboarding-presentations.md for message format) - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Onboarding Presentations`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Onboarding Presentations`

## User Stories (CONDITIONAL)

**INTELLIGENT ASSESSMENT**: Use multi-factor analysis to determine if user stories add value:

**ALWAYS Execute IF** (High Priority Indicators):
- New user-facing features or functionality
- Changes affecting user workflows or interactions
- Multiple user types or personas involved
- Complex business requirements with acceptance criteria needs
- Cross-functional team collaboration required
- Customer-facing API or service changes
- New product capabilities or enhancements

**LIKELY Execute IF** (Medium Priority - Assess Complexity):
- Modifications to existing user-facing features
- Backend changes that indirectly affect user experience
- Integration work that impacts user workflows
- Performance improvements with user-visible benefits
- Security enhancements affecting user interactions
- Data model changes affecting user data or reports

**COMPLEXITY-BASED ASSESSMENT**: For medium priority cases, execute user stories if:
- Request involves multiple components or services
- Changes span multiple user touchpoints
- Business logic is complex or has multiple scenarios
- Requirements have ambiguity that stories could clarify
- Implementation affects multiple user journeys
- Change has significant business impact or risk

**SKIP ONLY IF** (Low Priority - Simple Cases):
- Pure internal refactoring with zero user impact
- Simple bug fixes with clear, isolated scope
- Infrastructure changes with no user-facing effects
- Technical debt cleanup with no functional changes
- Developer tooling or build process improvements
- Documentation-only updates

**ASSESSMENT CRITERIA**: When in doubt, favor inclusion of user stories for:
- Requests with business stakeholder involvement
- Changes requiring user acceptance testing
- Features with multiple implementation approaches
- Work that benefits from shared team understanding
- Projects where requirements clarity is valuable

**ASSESSMENT PROCESS**:
1. Analyze request complexity and scope
2. Identify user impact (direct or indirect)
3. Evaluate business context and stakeholder needs
4. Consider team collaboration benefits
5. Default to inclusion for borderline cases

**Note**: If Requirements Analysis executed, Stories can reference and build upon those requirements.

**User Stories has two parts within one stage**:
1. **Part 1 - Planning**: Create story plan with questions, collect answers, analyze for ambiguities, get approval
2. **Part 2 - Generation**: Execute approved plan to generate stories and personas

**Execution**:
1. **MANDATORY**: Log any user input during this phase in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = User Stories`
3. Load all steps from `../inception/user-stories.md`
4. **MANDATORY**: Perform intelligent assessment (Step 1 in user-stories.md) to validate user stories are needed
5. Load reverse engineering artifacts from `specs/_project/reverse-engineering/` (if brownfield)
6. If Requirements exist, reference them when creating stories
7. Execute at appropriate depth (minimal/standard/comprehensive)
8. **PART 1 - Planning**: Create story plan with questions, wait for user answers, analyze for ambiguities, get approval
9. **PART 2 - Generation**: Execute approved plan to generate stories and personas
10. **Wait for Explicit Approval**: Follow approval format from user-stories.md detailed steps - DO NOT PROCEED until user confirms
11. **MANDATORY**: Log user's response in audit.md with complete raw input
12. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = User Stories`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = User Stories`

## Workflow Planning (ALWAYS EXECUTE)

1. **MANDATORY**: Log any user input during this phase in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Workflow Planning`
3. Load all steps from `../inception/workflow-planning.md`
4. **MANDATORY**: Load content validation rules from `../../shared/memory/content-validation.md`
5. Load all prior context:
   - Reverse engineering artifacts from `specs/_project/reverse-engineering/` (if brownfield)
   - Intent analysis
   - Requirements (if executed)
   - User stories (if executed)
6. Execute workflow planning:
   - Determine which phases to execute
   - Determine depth level for each phase
   - Create multi-package change sequence (if brownfield)
   - Generate workflow visualization (VALIDATE Mermaid syntax before writing)
7. **MANDATORY**: Validate all content before file creation per content-validation.md rules
8. **Wait for Explicit Approval**: Present recommendations using language from workflow-planning.md Step 9, emphasizing user control to override recommendations - DO NOT PROCEED until user confirms
9. **MANDATORY**: Log user's response in audit.md with complete raw input
10. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Workflow Planning`

## Application Design (CONDITIONAL)

**Execute IF**:
- New components or services needed
- Component methods and business rules need definition
- Service layer design required
- Component dependencies need clarification

**Skip IF**:
- Changes within existing component boundaries
- No new components or methods
- Pure implementation changes

**Execution**:
1. **MANDATORY**: Log any user input during this phase in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Application Design`
3. Load all steps from `../inception/application-design.md`
4. Load an follow the instructions from `../inception/adrs-technical-principles.md`
5. Load reverse engineering artifacts from `specs/_project/reverse-engineering/` (if brownfield)
6. Execute at appropriate depth (minimal/standard/comprehensive)
7. **Wait for Explicit Approval**: Present detailed completion message (see application-design.md for message format) - DO NOT PROCEED until user confirms
8. **MANDATORY**: Log user's response in audit.md with complete raw input
9. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Application Design`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Application Design`

## Units Generation (CONDITIONAL)

**Execute IF**:
- System needs decomposition into multiple units of work
- Multiple services or modules required
- Complex system requiring structured breakdown

**Skip IF**:
- Single simple unit
- No decomposition needed
- Straightforward single-component implementation

**Execution**:
1. **MANDATORY**: Log any user input during this phase in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Units Generation`
3. Load all steps from `../inception/units-generation.md`
4. Load reverse engineering artifacts from `specs/_project/reverse-engineering/` (if brownfield)
5. Execute at appropriate depth (minimal/standard/comprehensive)
6. **Wait for Explicit Approval**: Present detailed completion message (see units-generation.md for message format) - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Units Generation`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Units Generation`

---

# 🟢 CONSTRUCTION PHASE

**Purpose**: Detailed design, NFR implementation, and code generation

**Focus**: Determine HOW to build it

**Stages in CONSTRUCTION PHASE**:
- Per-Unit Loop (executes for each unit):
  - Functional Design (CONDITIONAL, per-unit)
  - NFR Requirements (CONDITIONAL, per-unit)
  - NFR Design (CONDITIONAL, per-unit)
  - Infrastructure Design (CONDITIONAL, per-unit)
  - Code Generation (ALWAYS, per-unit)
  - Onboarding Update (CONDITIONAL, per-unit)
- Build and Test (ALWAYS - after all units complete)
- **MANDATORY**: After each stage above completes (or is skipped), run `../../shared/stages/analytics-update.md` Step 3 for that stage name.

**Note**: Each unit is completed fully (design + code) before moving to the next unit.

---

## Per-Unit Loop (Executes for Each Unit)

**For each unit of work, execute the following stages in sequence:**
- **MANDATORY**: After each stage in this loop (executed or skipped), update analytics before advancing to the next stage/unit.

### Functional Design (CONDITIONAL, per-unit)

**Execute IF**:
- New data models or schemas
- Complex business logic
- Business rules need detailed design

**Skip IF**:
- Simple logic changes
- No new business logic

**Execution**:
1. **MANDATORY**: Log any user input during this stage in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Functional Design`
3. Load all steps from `../construction/functional-design.md`
4. Execute functional design for this unit
5. **MANDATORY**: Present standardized 2-option completion message as defined in functional-design.md - DO NOT use emergent 3-option behavior
6. **Wait for Explicit Approval**: User must choose between "Request Changes" or "Continue to Next Stage" - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Functional Design`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Functional Design`

### NFR Requirements (CONDITIONAL, per-unit)

**Execute IF**:
- Performance requirements exist
- Security considerations needed
- Scalability concerns present
- Tech stack selection required

**Skip IF**:
- No NFR requirements
- Tech stack already determined

**Execution**:
1. **MANDATORY**: Log any user input during this stage in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = NFR Requirements`
3. Load all steps from `../construction/nfr-requirements.md`
4. Execute NFR assessment for this unit
5. **MANDATORY**: Present standardized 2-option completion message as defined in nfr-requirements.md - DO NOT use emergent behavior
6. **Wait for Explicit Approval**: User must choose between "Request Changes" or "Continue to Next Stage" - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = NFR Requirements`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = NFR Requirements`

### NFR Design (CONDITIONAL, per-unit)

**Execute IF**:
- NFR Requirements was executed
- NFR patterns need to be incorporated

**Skip IF**:
- No NFR requirements
- NFR Requirements Assessment was skipped

**Execution**:
1. **MANDATORY**: Log any user input during this stage in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = NFR Design`
3. Load all steps from `../construction/nfr-design.md`
4. Execute NFR design for this unit
5. **MANDATORY**: Present standardized 2-option completion message as defined in nfr-design.md - DO NOT use emergent behavior
6. **Wait for Explicit Approval**: User must choose between "Request Changes" or "Continue to Next Stage" - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = NFR Design`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = NFR Design`

### Infrastructure Design (CONDITIONAL, per-unit)

**Execute IF**:
- Infrastructure services need mapping
- Deployment architecture required
- Cloud resources need specification

**Skip IF**:
- No infrastructure changes
- Infrastructure already defined

**Execution**:
1. **MANDATORY**: Log any user input during this stage in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Infrastructure Design`
3. Load all steps from `../construction/infrastructure-design.md`
4. Execute infrastructure design for this unit
5. **MANDATORY**: Present standardized 2-option completion message as defined in infrastructure-design.md - DO NOT use emergent behavior
6. **Wait for Explicit Approval**: User must choose between "Request Changes" or "Continue to Next Stage" - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Infrastructure Design`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Infrastructure Design`

### Code Generation (ALWAYS EXECUTE, per-unit)

**Always executes for each unit**

**Code Generation has two parts within one stage**:
1. **Part 1 - Planning**: Create detailed code generation plan with explicit steps
2. **Part 2 - Generation**: Execute approved plan to generate code, tests, and artifacts

**Execution**:
1. **MANDATORY**: Log any user input during this stage in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Code Generation`
3. Load all steps from `../construction/code-generation.md`
4. **PART 1 - Planning**: Create code generation plan with checkboxes, get user approval
5. **PART 2 - Generation**: Execute approved plan to generate code for this unit
6. **MANDATORY**: Present standardized 2-option completion message as defined in code-generation.md - DO NOT use emergent behavior
7. **Wait for Explicit Approval**: User must choose between "Request Changes" or "Continue to Next Stage" - DO NOT PROCEED until user confirms
8. **MANDATORY**: Log user's response in audit.md with complete raw input
9. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Code Generation`


### Onboarding Update (CONDITIONAL, per-unit)

**Execute IF**:
- The unit adds or changes a feature, OR
- The unit changes APIs, events, data contracts, or user-visible behavior, OR
- The unit introduces or modifies operational impact (runbooks, on-call, observability), OR
- The unit introduces new concepts that affect shared understanding (new service, new workflow, new domain term)

**Skip IF**:
- Pure refactor with no behavior change, no API/contract changes, and no operational impact (must be explicitly justified)

**Execution**:
1. **MANDATORY**: Log any user input during this stage in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Onboarding Update`
3. Load all steps from `../construction/onboarding-update.md`
4. Update the feature registry entry for this unit:
   - `specs/{BRANCH_NAME}/features/features-registry.md`
5. Update both onboarding presentations:
   - `specs/{BRANCH_NAME}/inception/onboarding/engineers/onboarding-engineers.md`
   - `specs/{BRANCH_NAME}/inception/onboarding/product/onboarding-product.md`
6. Run sli-dev build (if configured in the repo) and validate outputs
7. **MANDATORY**: Present standardized 2-option completion message as defined in onboarding-update.md - DO NOT use emergent behavior
8. **Wait for Explicit Approval**: User must choose between "Request Changes" or "Continue to Next Stage" - DO NOT PROCEED until user confirms
9. **MANDATORY**: Log user's response in audit.md with complete raw input
10. **Analytics: Record stage completion**: Follow Step 2 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Onboarding Update`

**If skipped**: Follow Step 3 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Onboarding Update`

---

## Build and Test (ALWAYS EXECUTE)

1. **MANDATORY**: Log any user input during this phase in audit.md
2. **Analytics: Record stage start**: Follow Step 1 of `../../shared/stages/analytics-step-update.md` with `STAGE_NAME = Build and Test`
3. Load all steps from `../construction/build-and-test.md`
4. Generate comprehensive build and test instructions:
   - Build instructions for all units
   - Unit test execution instructions
   - Integration test instructions (test interactions between units)
   - Performance test instructions (if applicable)
   - Additional test instructions as needed (contract tests, security tests, e2e tests)
5. Create instruction files in build-and-test/ subdirectory: build-instructions.md, unit-test-instructions.md, integration-test-instructions.md, performance-test-instructions.md, build-and-test-summary.md
6. **Wait for Explicit Approval**: Ask: "**Build and test instructions complete. Ready to proceed to Operations stage?**" - DO NOT PROCEED until user confirms
7. **MANDATORY**: Log user's response in audit.md with complete raw input
8. **Analytics: Record stage completion**: Update `main-workflow/analytics/{BRANCH_NAME}.md` by following `../../shared/stages/analytics-update.md` **Step 3: Phase Completion Update** for stage `Build and Test` with status `Completed`
9. **Analytics: Final totals**: Execute `../../shared/stages/analytics-update.md` **Step 4: Final Totals Update** to finalise metadata, metrics, timeline, and cycle summary

## Post-Implementation Documentation (SEPARATE COMMAND)

**NOTE**: Test Coverage Delta and Reverse Engineering Update are handled by a **separate shared command**. Analytics is already updated throughout this workflow and finalised by the end of Build and Test.

After the Build and Test stage completes, inform the user:

```markdown
## Construction Phase Complete

All construction stages have been executed, and analytics totals are finalised at:
`main-workflow/analytics/{BRANCH_NAME}.md`

To update remaining project-level documentation, run:

**`/fluid-flow.update-docs`**

This will:
- Generate the Test Coverage Delta & Improvement Plan (if baseline exists)
- Update all Reverse Engineering artifacts (if they exist)

See: `../../shared/commands/fluid-flow.update-docs.md`
```

---

# 🟡 OPERATIONS PHASE

**Purpose**: Placeholder for future deployment and monitoring workflows

**Focus**: How to DEPLOY and RUN it (future expansion)

**Stages in OPERATIONS PHASE**:
- Operations (PLACEHOLDER)

---

## Operations (PLACEHOLDER)

**Status**: This stage is currently a placeholder for future expansion.

The Operations stage will eventually include:
- Deployment planning and execution
- Monitoring and observability setup
- Incident response procedures
- Maintenance and support workflows
- Production readiness checklists

**Current State**: All build and test activities are handled in the CONSTRUCTION phase.

## Key Principles

- **Adaptive Execution**: Only execute stages that add value
- **Transparent Planning**: Always show execution plan before starting
- **User Control**: User can request stage inclusion/exclusion
- **Progress Tracking**: Update `specs/{BRANCH_NAME}/state.md` with executed and skipped stages
- **Complete Audit Trail**: Log ALL user inputs and AI responses in audit.md with timestamps
  - **CRITICAL**: Capture user's COMPLETE RAW INPUT exactly as provided
  - **CRITICAL**: Never summarize or paraphrase user input in audit log
  - **CRITICAL**: Log every interaction, not just approvals
- **Quality Focus**: Complex changes get full treatment, simple changes stay efficient
- **Content Validation**: Always validate content before file creation per `../../shared/memory/content-validation.md` rules
- **NO EMERGENT BEHAVIOR**: Construction phases MUST use standardized 2-option completion messages as defined in their respective rule files. DO NOT create 3-option menus or other emergent navigation patterns.

## MANDATORY: Plan-Level Checkbox Enforcement

### MANDATORY RULES FOR PLAN EXECUTION
1. **NEVER complete any work without updating plan checkboxes**
2. **IMMEDIATELY after completing ANY step described in a plan file, mark that step [x]**
3. **This must happen in the SAME interaction where the work is completed**
4. **NO EXCEPTIONS**: Every plan step completion MUST be tracked with checkbox updates

### Two-Level Checkbox Tracking System
- **Plan-Level**: Track detailed execution progress within each stage
- **Stage-Level**: Track overall workflow progress in `specs/{BRANCH_NAME}/state.md`
- **Update immediately**: All progress updates in SAME interaction where work is completed

## Prompts Logging Requirements
- **MANDATORY**: Log EVERY user input (prompts, questions, responses) with timestamp in audit.md
- **MANDATORY**: Capture user's COMPLETE RAW INPUT exactly as provided (never summarize)
- **MANDATORY**: Log every approval prompt with timestamp before asking the user
- **MANDATORY**: Record every user response with timestamp after receiving it
- **CRITICAL**: ALWAYS append changes to EDIT audit.md file, NEVER use tools and commands that completely overwrite its contents
- **CRITICAL**: Using file writing tools and commands that overwrite contents of the entire audit.md and cause duplication
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


## AI Self-Review Gate

Before finalising output, the AI must explicitly state:
- Key assumptions made
- Known risks and unknowns
- Operational and on-call impact
- Rollback or mitigation strategy
- What was intentionally not addressed

The AI must not self-approve its own output.

## Continuous Improvement

If repeated friction, workarounds, or conflicts are detected,
the AI must:
- Highlight systemic issues
- Propose updates to ADRs, principles, or rules
- Avoid repeating known suboptimal patterns

## Directory Structure

```text
<WORKSPACE-ROOT>/                        # ⚠️ APPLICATION CODE HERE
├── [project-specific structure]         # Varies by project (see code-generation.md)
│
├── specs/
│   ├── _project/                        # PROJECT-LEVEL (shared across features)
│   │   └── reverse-engineering/         # Brownfield only - run once, updated post-impl
│   │
│   └── {BRANCH_NAME}/                   # FEATURE-LEVEL (per feature)
│       ├── state.md                     # Unified state tracking
│       ├── audit.md                     # Full audit trail
│       ├── workspace-detection.md       # Shared entry point output
│       ├── inception/                   # 🔵 INCEPTION PHASE
│       │   ├── plans/
│       │   ├── requirements/
│       │   ├── user-stories/
│       │   ├── onboarding/
│       │   └── application-design/
│       ├── construction/                # 🟢 CONSTRUCTION PHASE
│       │   ├── plans/
│       │   ├── {unit-name}/
│       │   │   ├── functional-design/
│       │   │   ├── nfr-requirements/
│       │   │   ├── nfr-design/
│       │   │   ├── infrastructure-design/
│       │   │   └── code/                # Markdown summaries only
│       │   └── build-and-test/
│       ├── operations/                  # 🟡 OPERATIONS PHASE (placeholder)
│       └── features/
│           └── features-registry.md
```

**CRITICAL RULE**:
- Application code: Workspace root (NEVER in specs/)
- Feature documentation: `specs/{BRANCH_NAME}/` only
- Project-level artifacts: `specs/_project/` only
- Project structure: See code-generation.md for patterns by project type
