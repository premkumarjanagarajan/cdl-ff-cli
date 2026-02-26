# AI-DLC Welcome Message

**Purpose**: This file contains the user-facing welcome message that should be displayed ONCE at the start of any AI-DLC workflow.

---

# 👋 Welcome to Betsson Group AI-DLC (AI-Driven Development Life Cycle)! 👋

I'll guide you through an adaptive software development workflow that intelligently tailors itself to your specific needs.

## What is the Betsson Group AI-DLC?

AI-DLC is a structured yet flexible software development process that adapts to your project's needs. Think of it as having an experienced software architect who:

- **Analyzes your requirements** and asks clarifying questions when needed
- **Plans the optimal approach** based on complexity and risk
- **Skips unnecessary steps** for simple changes while providing comprehensive coverage for complex projects
- **Documents everything** so you have a complete record of decisions and rationale
- **Guides you through each phase** with clear checkpoints and approval gates

## The Three-Phase Lifecycle

```mermaid
flowchart TD
    Request(["User Request"])

    subgraph INCEPTION["🔵 INCEPTION PHASE<br/>Planning & Application Design"]
        I1["Workspace Detection (ALWAYS)"]
        I2["Reverse Engineering (CONDITIONAL)"]
        I3["Requirements Analysis (ALWAYS)"]
        I4["User Stories (CONDITIONAL)"]
        I5["Workflow Planning (ALWAYS)"]
        I6["Application Design (CONDITIONAL)"]
        I7["Units Generation (CONDITIONAL)"]
    end

    subgraph CONSTRUCTION["🟢 CONSTRUCTION PHASE<br/>Design, Implementation & Test"]
        C0["Per-Unit Loop:"]
        C1["Functional Design (CONDITIONAL)"]
        C2["NFR Requirements Assess (CONDITIONAL)"]
        C3["NFR Design (CONDITIONAL)"]
        C4["Infrastructure Design (CONDITIONAL)"]
        C5["Code Generation (ALWAYS)"]
        C6["Build and Test (ALWAYS)"]
    end

    subgraph OPERATIONS["🟡 OPERATIONS PHASE<br/>Placeholder for Future"]
        O1["Operations (PLACEHOLDER)"]
    end

    Request --> I1
    I7 --> C0
    C6 --> O1
    O1 --> Complete(["Complete"])

    style INCEPTION fill:#90CAF9,stroke:#1565C0,stroke-width:3px
    style CONSTRUCTION fill:#81C784,stroke:#2E7D32,stroke-width:3px
    style OPERATIONS fill:#FFF176,stroke:#F57F17,stroke-width:3px
    style Request fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px
    style Complete fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px
```

### Phase Breakdown:

**INCEPTION PHASE** - *Planning & Application Design*
- **Purpose**: Determines WHAT to build and WHY
- **Activities**: Understanding requirements, analyzing existing code (if any), planning the approach
- **Output**: Clear requirements, execution plan, decisions on the number of units of work for parallel development
- **Your Role**: Answer questions, review plans, approve direction

**CONSTRUCTION PHASE** - *Detailed Design, Implementation & Test*
- **Purpose**: Determines HOW to build it
- **Activities**: Detailed design (when needed), code generation, comprehensive testing
- **Output**: Working code, tests, build instructions
- **Your Role**: Review designs, approve implementation plans, validate results

**OPERATIONS PHASE** - *Deployment & Monitoring (Future)*
- **Purpose**: How to DEPLOY and RUN it
- **Status**: Placeholder for future deployment and monitoring workflows
- **Current State**: Build and test activities handled in CONSTRUCTION phase

## Key Principles:

- ⚡ **Fully Adaptive**: Each stage independently evaluated based on your needs
- 🎯 **Efficient**: Simple changes execute only essential stages
- 📋 **Comprehensive**: Complex changes get full treatment with all safeguards
- 🔍 **Transparent**: You see and approve the execution plan before work begins
- 📝 **Documented**: Complete audit trail of all decisions and changes
- 🎛️ **User Control**: You can request stages be included or excluded

## What Happens Next:

1. **I'll analyze your workspace** to understand if this is a new or existing project
2. **I'll gather requirements** and ask clarifying questions if needed
3. **I'll create an execution plan** showing which stages I propose to run and why
4. **You'll review and approve** the plan (or request changes)
5. **We'll execute the plan** with checkpoints at each major stage
6. **You'll get working code** with complete documentation and tests

The AI-DLC process adapts to:
- 📋 Your intent clarity and complexity
- 🔍 Existing codebase state
- 🎯 Scope and impact of changes
- ⚡ Risk and quality requirements

Let's begin!
