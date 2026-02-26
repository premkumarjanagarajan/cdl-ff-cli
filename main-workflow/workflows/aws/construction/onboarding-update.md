# Onboarding Update (per-unit)

**Purpose**: Keep onboarding materials accurate as the system evolves, for both engineers and product managers.

**Primary outputs**:
- Feature registry: `specs/{BRANCH_NAME}/features/features-registry.md`
- Engineer onboarding: `specs/{BRANCH_NAME}/inception/onboarding/engineers/onboarding-engineers.md`
- Product onboarding: `specs/{BRANCH_NAME}/inception/onboarding/product/onboarding-product.md`

## Step 1: Load Inputs (Mandatory)
- The current unit context:
  - Requirements and user stories (if present)
  - Unit design outputs under `specs/{BRANCH_NAME}/construction/<unit-name>/`
  - Code changes (modified/created files)
- Current onboarding decks (if present)
- Reverse engineering artifacts if this is brownfield

## Step 2: Determine Update Scope (Mandatory)
Classify the unit change:
- Feature added or changed
- API/contract change (endpoints, events, schemas)
- User-visible workflow change
- Operational impact change (alerts, dashboards, runbooks)
- Pure refactor (candidate for skip, must justify)

Record the classification in the unit's documentation summary.

## Step 3: Update Feature Registry (Mandatory)
Update or add the feature entry in:
- `specs/{BRANCH_NAME}/features/features-registry.md`

Rules:
- Keep entries short and scannable
- Include impacted components and interfaces
- Update onboarding touchpoints for both decks
- Link to relevant unit docs and any updated artifacts

## Step 4: Update Engineer Onboarding Deck (Mandatory when not skipped)
Update only impacted sections. At minimum, ensure:
- Service inventory remains accurate
- Key flows updated if workflows changed (Mermaid + text alternative)
- Dev workflow updated if build/run/test changes
- Observability and on-call notes updated if operational impact changed
- Glossary updated for any new terms

## Step 5: Update Product Onboarding Deck (Mandatory when not skipped)
Update only impacted sections. At minimum, ensure:
- Capabilities reflect the change
- Journeys reflect the change
- Dependencies/constraints updated if relevant
- Release/operations notes updated if needed
- Glossary updated for new terms

## Step 6: Build sli-dev Outputs (Conditional)
If the repository includes sli-dev build scripts/config:
- Run the configured build to generate HTML/PDF outputs
- Store outputs under:
  - `specs/{BRANCH_NAME}/inception/onboarding/slides/engineers/`
  - `specs/{BRANCH_NAME}/inception/onboarding/slides/product/`

If build is not configured, document the recommended build commands in:
- `specs/{BRANCH_NAME}/inception/onboarding/README.md`

## Step 7: Content Validation (Mandatory)
Before writing updates:
- Validate Mermaid syntax
- Provide text alternatives for diagrams
- Ensure sli-dev Markdown compatibility
- Ensure internal links are relative and valid

## Step 8: Present Completion Message (Mandatory)
Present completion message in this structure:

```markdown
# 📚 Onboarding Update Complete - <unit-name>

## Updated
- Feature registry: `specs/{BRANCH_NAME}/features/features-registry.md`
- Engineer onboarding: `specs/{BRANCH_NAME}/inception/onboarding/engineers/onboarding-engineers.md`
- Product onboarding: `specs/{BRANCH_NAME}/inception/onboarding/product/onboarding-product.md`

## Summary
- What changed in this unit (1-5 bullets)
- Which sections were updated (1-5 bullets)
- Any follow-up recommendations (optional)

> **📋 <u>REVIEW REQUIRED:</u>**
> Please examine the updated onboarding materials at:
> - Engineer deck source: `specs/{BRANCH_NAME}/inception/onboarding/engineers/onboarding-engineers.md`
> - Product deck source: `specs/{BRANCH_NAME}/inception/onboarding/product/onboarding-product.md`

> **🚀 <u>WHAT'S NEXT?</u>**
>
> **You may:**
>
> 🔧 **Request Changes** - Ask for modifications to the onboarding updates based on your review
> ✅ **Continue to Next Stage** - Approve onboarding updates and proceed
```

## Step 9: Wait for Explicit Approval
Do not proceed until the user explicitly approves or requests changes.
Log the user's response in `audit.md` with timestamp and raw input.
Mark the stage as complete for this unit in `specs/{BRANCH_NAME}/state.md`.
