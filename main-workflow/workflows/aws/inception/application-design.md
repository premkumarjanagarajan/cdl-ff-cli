# Application Design - Detailed Steps

## Purpose
**High-level component identification and service layer design**

Application Design focuses on:
- Identifying main functional components and their responsibilities
- Defining component interfaces (not detailed business logic)
- Designing service layer for orchestration
- Establishing component dependencies and communication patterns

**Note**: Detailed business logic design happens later in Functional Design (per-unit, CONSTRUCTION phase)

## Architecture Escalation
If design crosses:
- Domain boundaries
- Data ownership boundaries
- Regulatory boundaries

AI must escalate and invoke the ADR Integrity Gate.

## Prerequisites
- Context Assessment must be complete
- Requirements Assessment recommended (provides functional context)
- Story Development recommended (user stories guide design decisions)
- Execution plan must indicate Application Design stage should execute

## Step-by-Step Execution

### 1. Analyze Context
- Read `specs/{BRANCH_NAME}/inception/requirements/requirements.md` and `specs/{BRANCH_NAME}/inception/user-stories/stories.md`
- Identify key business capabilities and functional areas
- Determine design scope and complexity

### 2. Create Application Design Plan
- Generate plan with checkboxes [] for application design
- Focus on components, responsibilities, methods, business rules, and services
- Each step and sub-step should have a checkbox []

### 3. Include Mandatory Design Artifacts in Plan
- **ALWAYS** include these mandatory artifacts in the design plan:
  - [ ] Generate components.md with component definitions and high-level responsibilities
  - [ ] Generate component-methods.md with method signatures (business rules detailed later in Functional Design)
  - [ ] Generate services.md with service definitions and orchestration patterns
  - [ ] Generate component-dependency.md with dependency relationships and communication patterns
  - [ ] Validate design completeness and consistency

### 4. Generate Context-Appropriate Questions
**DIRECTIVE**: Analyze the requirements and stories to generate ONLY questions relevant to THIS specific application design. Use the categories below as inspiration, NOT as a mandatory checklist. Skip entire categories if not applicable.

- EMBED questions using [Answer]: tag format
- Focus on ambiguities and missing information specific to this context
- Generate questions only where user input is needed for design decisions

**Example question categories** (adapt as needed):
- **Component Identification** - Only if component boundaries or organization is unclear
- **Component Methods** - Only if method signatures need clarification (detailed business rules come later)
- **Service Layer Design** - Only if service orchestration or boundaries are ambiguous
- **Component Dependencies** - Only if communication patterns or dependency management is unclear
- **Design Patterns** - Only if architectural style or pattern choice needs user input

### 5. Store Application Design Plan
- Save as `specs/{BRANCH_NAME}/inception/plans/application-design-plan.md`
- Include all [Answer]: tags for user input
- Ensure plan covers all design aspects

### 6. Request User Input
- **MANDATORY**: Offer the user the choice between **Answer Manually** or **AI Best Judgement** mode (see `../memory/common/question-format-guide.md` for full details):
  - **Answer Manually**: Ask user to fill [Answer]: tags directly in the plan document
  - **AI Best Judgement**: AI fills all [Answer]: tags with best judgement, adds [Reasoning]: for each, flags low-confidence answers; user reviews and overrides as needed
- Emphasize importance of design decisions
- Provide clear instructions on completing the [Answer]: tags (or how to review AI-generated answers)

### 7. Collect Answers
- **Answer Manually**: Wait for user to provide answers to all questions using [Answer]: tags in the document
- **AI Best Judgement**: Wait for user to confirm review of AI-generated answers is complete
- Do not proceed until ALL [Answer]: tags are completed
- Review the document to ensure no [Answer]: tags are left blank

### 8. ANALYZE ANSWERS (MANDATORY)
Before proceeding, you MUST carefully review all user answers for:
- **Vague or ambiguous responses**: "mix of", "somewhere between", "not sure", "depends"
- **Undefined criteria or terms**: References to concepts without clear definitions
- **Contradictory answers**: Responses that conflict with each other
- **Missing design details**: Answers that lack specific guidance
- **Answers that combine options**: Responses that merge different approaches without clear decision rules

### 9. MANDATORY Follow-up Questions
If the analysis in step 8 reveals ANY ambiguous answers, you MUST:
- Add specific follow-up questions to the plan document using [Answer]: tags
- DO NOT proceed to approval until all ambiguities are resolved
- Examples of required follow-ups:
  - "You mentioned 'mix of A and B' - what specific criteria should determine when to use A vs B?"
  - "You said 'somewhere between A and B' - can you define the exact middle ground approach?"
  - "You indicated 'not sure' - what additional information would help you decide?"
  - "You mentioned 'depends on complexity' - how do you define complexity levels?"

### 10. Generate Application Design Artifacts
- Execute the approved plan to generate design artifacts
- Create `specs/{BRANCH_NAME}/inception/application-design/components.md` with:
  - Component name and purpose
  - Component responsibilities
  - Component interfaces
- Create `specs/{BRANCH_NAME}/inception/application-design/component-methods.md` with:
  - Method signatures for each component
  - High-level purpose of each method
  - Input/output types
  - Note: Detailed business rules will be defined in Functional Design (per-unit, CONSTRUCTION phase)
- Create `specs/{BRANCH_NAME}/inception/application-design/services.md` with:
  - Service definitions
  - Service responsibilities
  - Service interactions and orchestration
- Create `specs/{BRANCH_NAME}/inception/application-design/component-dependency.md` with:
  - Dependency matrix showing relationships
  - Communication patterns between components
  - Data flow diagrams

### 11. Log Approval
- Log approval prompt with timestamp in `specs/{BRANCH_NAME}/audit.md`
- Include complete approval prompt text
- Use ISO 8601 timestamp format

### 12. Present Completion Message

```markdown
# 🏗️ Application Design Complete

[AI-generated summary of application design artifacts created in bullet points]

> **📋 <u>**REVIEW REQUIRED:**</u>**  
> Please examine the application design artifacts at: `specs/{BRANCH_NAME}/inception/application-design/`

> **🚀 <u>**WHAT'S NEXT?**</u>**
>
> **You may:**
>
> 🔧 **Request Changes** - Ask for modifications to the application design if required
> [IF Units Generation is skipped:]
> 📝 **Add Units Generation** - Choose to include **Units Generation** stage (currently skipped)
> ✅ **Approve & Continue** - Approve design and proceed to **[Units Generation/CONSTRUCTION PHASE]**
```

### 13. Wait for Explicit Approval
- Do not proceed until the user explicitly approves the application design
- Approval must be clear and unambiguous
- If user requests changes, update the design and repeat the approval process

### 14. Record Approval Response
- Log the user's approval response with timestamp in `specs/{BRANCH_NAME}/audit.md`
- Include the exact user response text
- Mark the approval status clearly

### 15. Update Progress
- Mark Application Design stage complete in `specs/{BRANCH_NAME}/state.md`
- Update the "Current Status" section
- Prepare for transition to next stage
