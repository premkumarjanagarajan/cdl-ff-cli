# Shell Environment Detection

**Purpose**: Detect whether the current environment uses Bash or PowerShell, so the correct automation scripts are invoked throughout the workflow.

## When to Run

- **Entry point** (`fluid-flow.md`): Run once during Stage 1 (Branch Creation) and store the result in `state.md`.
- **Individual commands** (e.g., `/speckit.specify`): Read the stored `SHELL_TYPE` from `specs/{BRANCH_NAME}/state.md`. If the field is missing (e.g., feature was created before this detection existed), run the detection below and update `state.md`.

## Detection Method

Run the following command from the repo root:

```sh
uname -s 2>/dev/null || echo "WINDOWS"
```

**Interpret the result:**

| Output contains | SHELL_TYPE | Reason |
|-----------------|------------|--------|
| `Darwin` | `bash` | macOS — Bash/Zsh available natively |
| `Linux` | `bash` | Linux — Bash available natively |
| `MINGW` or `MSYS` or `CYGWIN` | `bash` | Windows running Git Bash / MSYS2 / Cygwin |
| `WINDOWS` (command failed) | `powershell` | Native Windows — use PowerShell scripts |

## Store the Result

Add or update the `**Shell**` field in `specs/{BRANCH_NAME}/state.md` under `## Feature Information`:

```markdown
- **Shell**: bash
```

or

```markdown
- **Shell**: powershell
```

## Script Invocation Reference

Once `SHELL_TYPE` is known, use the table below to select the correct script and argument syntax. All scripts live under `spec-kit/scripts/`.

### check-prerequisites

| SHELL_TYPE | Command |
|------------|---------|
| `bash` | `scripts/bash/check-prerequisites.sh --json [--require-tasks] [--include-tasks] [--paths-only]` |
| `powershell` | `scripts/powershell/check-prerequisites.ps1 -Json [-RequireTasks] [-IncludeTasks] [-PathsOnly]` |

### create-new-feature

| SHELL_TYPE | Command |
|------------|---------|
| `bash` | `scripts/bash/create-new-feature.sh --json --short-name "<name>" [--jira-ticket "<ticket>"] [--with-state] "<description>"` |
| `powershell` | `scripts/powershell/create-new-feature.ps1 -Json -ShortName "<name>" [-JiraTicket "<ticket>"] [-WithState] "<description>"` |

### setup-plan

| SHELL_TYPE | Command |
|------------|---------|
| `bash` | `scripts/bash/setup-plan.sh --json` |
| `powershell` | `scripts/powershell/setup-plan.ps1 -Json` |

### update-agent-context

| SHELL_TYPE | Command |
|------------|---------|
| `bash` | `scripts/bash/update-agent-context.sh <agent-type>` |
| `powershell` | `scripts/powershell/update-agent-context.ps1 -AgentType <agent-type>` |

## Quoting Rules

- **Bash**: For single quotes in args like "I'm Groot", use escape syntax: `'I'\''m Groot'` (or double-quote if possible: `"I'm Groot"`)
- **PowerShell**: Use double-quotes for strings containing single quotes: `"I'm Groot"`. PowerShell handles embedded single quotes inside double-quoted strings natively.
