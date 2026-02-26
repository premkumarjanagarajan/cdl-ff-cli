# Shared Memory Loading Manifest

**This is the single source of truth for all shared governance memory files.**

All paths below are relative to this file's directory (`main-workflow/workflows/shared/memory/`).
When loading these files, resolve each path relative to where this manifest is located.

---

## Always Load

These files MUST be loaded at the start of every command or workflow stage:

- Load `ai-operating-contract.md` -- AI role, authority boundaries, decision rules
- Load `content-validation.md` -- Mermaid validation, character escaping, fallback rules
- Load `review/ai-self-review.md` -- Self-review checklist before finalising output
- Load `review/human-gate.md` -- Human approval requirements and safe-to-proceed rules
- Load `iso/iso9001-quality-management.md` -- Process discipline, traceability, continuous improvement
- Load `architecture/adr-integrity-gate.md` -- ADR compliance checking and extension rules
- Load `meta/continuous-learning.md` -- Systemic issue detection, rule/ADR improvement proposals
- Load `overconfidence-prevention.md` -- Prevents confidence without evidence

---

## Conditional: Security, Data, Identity, or Infrastructure

Load these when the change affects security, data handling, identity, or infrastructure:

- Load `security/iso27001/compliance.md` -- ISO 27001 compliance framework
- Load `security/*.md` -- All security rules (authz-authn, data-classification, dependencies, logging-security, network-boundaries, refusal-patterns, secrets-management, security-self-review, threat-model)

---

## Conditional: Infrastructure, Performance, or Energy (SEU-Related)

Load when the change affects infrastructure, performance, or Significant Energy Use:

- Load `iso/iso50001-energy-management.md` -- ISO 50001 energy management
