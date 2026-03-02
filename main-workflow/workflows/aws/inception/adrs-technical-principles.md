# Architecture Design

## Purpose

All code changes/creation **must comply** with the defined **Technical Principles** and **Architecture Decision Records (ADRs)**.

The authoritative and continuously evolving list of ADRs is located at:
`../../../../docs-architecture-decision-records/**`

Before implementing any change, developers **must verify** that:
- The proposed solution aligns with existing Technical Principles
- The proposed solution is consistent with all relevant ADRs

## New or Conflicting Decisions

If a requirement introduces:
- A new architectural decision not covered by existing ADRs, or
- A potential conflict, deviation, or ambiguity with an existing ADR or Technical Principle

then the developer **must not silently diverge**.

Instead, the developer is **explicitly encouraged and expected** to:
- Raise the concern with the Architecture Team
- Propose an update, amendment, or new ADR where appropriate
- Pause or limit implementation to non-architectural work until a decision is reviewed

## Escalation Is Not a Failure

Raising architectural concerns is considered **good engineering practice**, not a blocker or failure.

Developers should assume that:
- ADRs are living documents
- Re-reviewing decisions is expected as requirements, scale, or constraints evolve

## Enforcement

Any change that introduces architectural impact **without alignment to an existing ADR or an approved review** may be:
- Flagged during Inception, Construction Phase or Operations Phase
- Required to include an ADR reference or proposal before merge

---

All code, designs, and architectural changes **must comply** with the defined **Technical Principles**.

The authoritative and maintained list of Technical Principles is located at:

`../../../../docs-technical-principles/docs`

Developers **must review and apply** the relevant Technical Principles before starting implementation, including but not limited to:
- System and service design
- Technology selection
- Data management and integration patterns
- Security, reliability, scalability, and operational concerns

## Non-Compliance or Unclear Guidance

If a requirement:
- Conflicts with one or more Technical Principles, or
- Is not clearly addressed by the existing principles

the developer **must not work around or ignore** the principles.

Instead, the developer is **expected and encouraged** to:
- Raise the concern with the Architecture Team
- Request clarification or refinement of the relevant principle
- Propose an update or extension to the Technical Principles where appropriate

## Principles Are Living

Technical Principles are **living guidelines**, intended to evolve as the platform, scale, and regulatory landscape change.

Constructive challenges and improvement proposals are **explicitly welcomed** and form part of good engineering practice.

## Enforcement

Any change that materially violates Technical Principles **without prior review and agreement** may be:
- Flagged during Inception, Construction Phase or Operations Phase
- Required to include documented justification and an agreed exception

---