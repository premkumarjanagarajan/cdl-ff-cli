# AWS AI-DLC Memory Loading Manifest

**This is the single source of truth for all AWS workflow-specific memory files.**

All paths below are relative to this file's directory (`main-workflow/workflows/aws/memory/`).
When loading these files, resolve each path relative to where this manifest is located.

> **Note**: Shared governance memory (AI operating contract, content validation, review gates, ISO standards, security rules, etc.) is loaded separately via the shared memory manifest at `../../shared/memory/load-shared-memory.md`. This manifest covers only the AWS-specific files.

---

## Always Load

These files MUST be loaded at the start of the AWS AI-DLC workflow:

- Load `common/process-overview.md` -- Workflow overview and phase structure
- Load `common/session-continuity.md` -- Session resumption and recovery guidance
- Load `common/question-format-guide.md` -- Question formatting rules and AI Best Judgement mode
- Load `common/depth-levels.md` -- Adaptive depth explanation (minimal/standard/comprehensive)
- Load `common/error-handling.md` -- Error severity levels and recovery procedures
- Load `common/terminology.md` -- AI-DLC glossary (phase vs stage, unit, etc.)
- Load `common/workflow-changes.md` -- Mid-workflow change handling and phase management
