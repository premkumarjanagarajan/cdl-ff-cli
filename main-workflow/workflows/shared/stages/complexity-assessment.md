# Complexity Assessment

**Purpose**: Evaluate the complexity of the user's request and recommend the appropriate workflow path (Spec-Kit or AWS AI-DLC).

**Execute when**: Always, after Workspace Detection and Reverse Engineering (if applicable).

## Step 1: Gather Assessment Context

Load the following inputs:
- User's original request (from `audit.md`)
- Workspace detection findings (from `specs/{BRANCH_NAME}/workspace-detection.md`)
- Reverse engineering artifacts (from `specs/_project/reverse-engineering/` if they exist)
- Any existing ADRs or technical principles in the workspace

## Step 2: Evaluate Complexity Factors

Assess each factor and assign a score: **Low**, **Medium**, or **High**.

### Factor 1: Scope
- **Low**: Single feature, isolated change, one component affected
- **Medium**: Multiple components, moderate integration points
- **High**: System-wide changes, multiple services, cross-domain impact

### Factor 2: Risk
- **Low**: No security/compliance impact, easily reversible
- **Medium**: Some security considerations, moderate business impact
- **High**: Regulatory/compliance implications, high business impact, data handling changes

### Factor 3: Architectural Impact
- **Low**: No new components, within existing patterns, no ADR implications
- **Medium**: Minor extensions to existing architecture, possible ADR updates
- **High**: New architectural decisions, new services/infrastructure, ADR violations or extensions

### Factor 4: Requirements Clarity
- **Low complexity indicator**: Clear, well-defined requirements, few unknowns
- **Medium**: Some ambiguity, moderate number of unknowns
- **High complexity indicator**: Significant ambiguity, many unknowns, multiple stakeholders needed

### Factor 5: Infrastructure
- **Low**: No infrastructure changes
- **Medium**: Minor configuration changes to existing infrastructure
- **High**: New infrastructure provisioning, deployment architecture changes, cloud resource specification

### Factor 6: Units of Work
- **Low**: Single unit of work, straightforward implementation
- **Medium**: 2-3 units, moderate decomposition needed
- **High**: Multiple units, complex dependencies, requires structured breakdown

## Step 3: Calculate Recommendation

### Route to Spec-Kit when:
- Majority of factors score **Low** or **Medium**
- No factors score **High** in Risk or Architectural Impact
- No infrastructure provisioning required
- No ADR implications
- No regulatory/compliance changes
- Single or few units of work

### Route to AWS AI-DLC when:
- Any factor scores **High** in Risk, Architectural Impact, or Infrastructure
- Multiple factors score **High**
- Security/compliance/regulatory implications exist
- Multiple units of work with complex dependencies
- ADR impacts or new architectural decisions needed
- Cross-domain or cross-platform changes
- Multiple stakeholders required for decisions

### Borderline Cases
When the assessment is ambiguous (mix of Medium scores, or one High with otherwise Low):
- Default to **Spec-Kit** if the user's request is clear and self-contained
- Default to **AWS AI-DLC** if there are unknowns that need structured exploration
- Always present both options and let the human decide

## Step 4: Present Recommendation

Present the assessment to the user in the following format:

```markdown
## Complexity Assessment Results

### Factor Scores

| Factor | Score | Rationale |
|--------|-------|-----------|
| Scope | [Low/Medium/High] | [Brief justification] |
| Risk | [Low/Medium/High] | [Brief justification] |
| Architectural Impact | [Low/Medium/High] | [Brief justification] |
| Requirements Clarity | [Low/Medium/High] | [Brief justification] |
| Infrastructure | [Low/Medium/High] | [Brief justification] |
| Units of Work | [Low/Medium/High] | [Brief justification] |

### Recommendation: **[Spec-Kit / AWS AI-DLC]**

**Reasoning**: [2-3 sentences explaining why this workflow is recommended]

### What this means:

**If Spec-Kit**: Your feature will follow a streamlined specification-to-implementation pipeline. You'll create a spec, plan, tasks, and implement -- with shared governance rules (security, quality, review gates) applied throughout.

**If AWS AI-DLC**: Your feature will follow a comprehensive enterprise SDLC with full requirements analysis, user stories, application design, per-unit functional and NFR design, and structured code generation with build and test.

> **Your choice**: You can accept this recommendation or choose the other workflow. Reply with **"accept"** or specify **"Spec-Kit"** / **"AWS"**.
```

## Step 5: Record Decision

After the user confirms:
1. Update `specs/{BRANCH_NAME}/state.md` with the chosen workflow
2. Log the decision in `specs/{BRANCH_NAME}/audit.md`:
   - The factor scores
   - The AI recommendation
   - The user's choice (accept or override)
   - Reasoning for override (if applicable)
