
## MANDATORY: Shared Memory Loading
**CRITICAL**: At command start, load the shared memory manifest and follow ALL instructions within it:
- Load `../../shared/memory/load-shared-memory.md` -- resolve and load every file listed, using paths relative to the manifest's location

## MANDATORY: State and Audit Logging
- Read and update `specs/{BRANCH_NAME}/state.md` with stage progress at start and completion of this command
- Append to `specs/{BRANCH_NAME}/audit.md` with user inputs and AI responses using ISO 8601 timestamps
- Use the same verbatim logging rules: capture COMPLETE RAW INPUT, never summarize
- ALWAYS append/edit audit.md, NEVER completely overwrite it

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Resolve `SHELL_TYPE` — read the `**Shell**` field from `specs/{BRANCH_NAME}/state.md`; if missing, detect it per `../../shared/stages/shell-detection.md`. Run the appropriate script from repo root:
   - **bash**: `../scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` — For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **powershell**: `../scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`

   Parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be relative.
1. From the executed script, extract the path to **tasks**.
1. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL

1. For each task in the list, use the GitHub MCP server to create a new issue in the repository that is representative of the Git remote.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL
