# Workspace Detection

**Purpose**: Determine workspace state and check for existing projects

## Step 1: Check for Existing Feature State

Check if `specs/{BRANCH_NAME}/state.md` already has populated workspace state:
- **If populated**: Resume from last stage (load context from previous stages)
- **If not populated**: Continue with new project assessment

## Step 2: Scan Workspace for Existing Code

**Determine if workspace has existing code:**
- Scan workspace for source code files (.java, .py, .js, .ts, .jsx, .tsx, .kt, .kts, .scala, .groovy, .go, .rs, .rb, .php, .c, .h, .cpp, .hpp, .cc, .cs, .fs, etc.)
- Check for build files (pom.xml, package.json, build.gradle, etc.)
- Look for project structure indicators
- Identify workspace root directory (NOT specs/)

**Record findings:**
```markdown
## Workspace State
- **Existing Code**: [Yes/No]
- **Programming Languages**: [List if found]
- **Build System**: [Maven/Gradle/npm/etc. if found]
- **Project Structure**: [Monolith/Microservices/Library/Empty]
- **Workspace Root**: [Absolute path]
```

## Step 3: Determine Next Stage

**IF workspace is empty (no existing code)**:
- Set flag: `brownfield = false`
- Next stage: Complexity Assessment

**IF workspace has existing code**:
- Set flag: `brownfield = true`
- Check for existing reverse engineering artifacts at `specs/_project/reverse-engineering/reverse-engineering-timestamp.md`
- **IF reverse engineering artifacts exist**: Load them as context, skip to Complexity Assessment
- **IF no reverse engineering artifacts**: Next stage is Reverse Engineering

## Step 4: Update State File

Update `specs/{BRANCH_NAME}/state.md` Workspace State section:

```markdown
## Workspace State
- **Project Type**: [Greenfield/Brownfield]
- **Existing Code**: [Yes/No]
- **Reverse Engineering Needed**: [Yes/No - based on brownfield and artifact existence]
- **Reverse Engineering Artifacts**: [Exist at specs/_project/reverse-engineering/ / Not found]
- **Workspace Root**: [Absolute path]
```

## Step 5: Write Workspace Detection Artifact

Create `specs/{BRANCH_NAME}/workspace-detection.md`:

```markdown
# Workspace Detection Results

**Feature**: {BRANCH_NAME}
**Date**: [ISO timestamp]

## Workspace State
- **Existing Code**: [Yes/No]
- **Programming Languages**: [List if found]
- **Build System**: [Maven/Gradle/npm/etc. if found]
- **Project Structure**: [Monolith/Microservices/Library/Empty]
- **Workspace Root**: [Absolute path]
- **Project Type**: [Greenfield/Brownfield]

## Code Location Rules
- **Application Code**: Workspace root (NEVER in specs/)
- **Feature Documentation**: specs/{BRANCH_NAME}/ only
- **Project-Level Artifacts**: specs/_project/ only
```

## Step 6: Present Completion Message

**For Brownfield Projects (no RE artifacts):**
```markdown
# Workspace Detection Complete

Workspace analysis findings:
- **Project Type**: Brownfield project
- [AI-generated summary of workspace findings in bullet points]
- **Next Step**: Proceeding to **Reverse Engineering** to analyze existing codebase...
```

**For Brownfield Projects (RE artifacts exist):**
```markdown
# Workspace Detection Complete

Workspace analysis findings:
- **Project Type**: Brownfield project
- [AI-generated summary of workspace findings in bullet points]
- **Reverse Engineering**: Using existing artifacts from [timestamp]
- **Next Step**: Proceeding to **Complexity Assessment**...
```

**For Greenfield Projects:**
```markdown
# Workspace Detection Complete

Workspace analysis findings:
- **Project Type**: Greenfield project
- **Next Step**: Proceeding to **Complexity Assessment**...
```

## Step 7: Automatically Proceed

- **No user approval required** - this is informational only
- Automatically proceed to next stage:
  - **Brownfield (no RE artifacts)**: Reverse Engineering
  - **Brownfield (RE artifacts exist)**: Complexity Assessment
  - **Greenfield**: Complexity Assessment
