# Reverse Engineering

**Purpose**: Analyze existing codebase and generate comprehensive design artifacts

**Execute when**: Brownfield project detected AND no existing reverse engineering artifacts found at `specs/_project/reverse-engineering/reverse-engineering-timestamp.md`

**Skip when**:
- Greenfield project (no existing code)
- Reverse engineering artifacts already exist at `specs/_project/reverse-engineering/`

**Run-once behavior**: Run ONCE per project. Skip if `specs/_project/reverse-engineering/reverse-engineering-timestamp.md` exists. Artifacts are updated post-implementation via `reverse-engineering-update.md`, not re-generated per feature.

## Step 1: Multi-Package Discovery

### 1.1 Scan Workspace
- All packages (not just mentioned ones)
- Package relationships via config files
- Package types: Application, CDK/Infrastructure, Models, Clients, Tests

### 1.2 Understand the Business Context
- The core business that the system is implementing overall
- The business overview of every package
- List of Business Transactions that are implemented in the system

### 1.3 Infrastructure Discovery
- CDK packages (package.json with CDK dependencies)
- Terraform (.tf files)
- CloudFormation (.yaml/.json templates)
- Deployment scripts

### 1.4 Build System Discovery
- Build systems: Brazil, Maven, Gradle, npm
- Config files for build-system declarations
- Build dependencies between packages

### 1.5 Service Architecture Discovery
- Lambda functions (handlers, triggers)
- Container services (Docker/ECS configs)
- API definitions (Smithy models, OpenAPI specs)
- Data stores (DynamoDB, S3, etc.)

### 1.6 Code Quality Analysis
- Programming languages and frameworks
- Test coverage indicators
- Linting configurations
- CI/CD pipelines

## Step 1: Generate Business Overview Documentation

Create `specs/_project/reverse-engineering/business-overview.md`:

```markdown
# Business Overview

## Business Context Diagram
[Mermaid diagram showing the Business Context]

## Business Description
- **Business Description**: [Overall Business description of what the system does]
- **Business Transactions**: [List of Business Transactions that the system implements and their descriptions]
- **Business Dictionary**: [Business dictionary terms that the system follows and their meaning]

## Component Level Business Descriptions
### [Package/Component Name]
- **Purpose**: [What it does from the business perspective]
- **Responsibilities**: [Key responsibilities]
```

## Step 2: Generate Architecture Documentation

Create `specs/_project/reverse-engineering/architecture.md`:

```markdown
# System Architecture

## System Overview
[High-level description of the system]

## Architecture Diagram
[Mermaid diagram showing all packages, services, data stores, relationships]

## Component Descriptions
### [Package/Component Name]
- **Purpose**: [What it does]
- **Responsibilities**: [Key responsibilities]
- **Dependencies**: [What it depends on]
- **Type**: [Application/Infrastructure/Model/Client/Test]

## Data Flow
[Mermaid sequence diagram of key workflows]

## Integration Points
- **External APIs**: [List with purposes]
- **Databases**: [List with purposes]
- **Third-party Services**: [List with purposes]

## Infrastructure Components
- **CDK Stacks**: [List with purposes]
- **Deployment Model**: [Description]
- **Networking**: [VPC, subnets, security groups]
```

## Step 3: Generate C4 Architecture Model

**Purpose**: Generate a structured, multi-level C4 architecture model that documents the system from the highest level of abstraction (system context) down to individual components. This provides a standardized, layered view of the software architecture that complements the general architecture documentation.

**C4 Model Reference**: The C4 model defines four levels of abstraction — Context, Containers, Components, and Code. Each level zooms in to provide progressively more detail. All diagrams MUST use Mermaid C4 diagram syntax.

Create `specs/_project/reverse-engineering/c4-architecture.md`:

```markdown
# C4 Architecture Model

> This document follows the [C4 model](https://c4model.com/) to describe the software architecture
> at four levels of abstraction: System Context, Containers, Components, and Code.
> All diagrams use Mermaid C4 syntax.

---

## Level 1: System Context

**What this shows**: The system as a whole and how it fits into the world around it — who uses it and what other systems it interacts with.

### System Context Diagram

[Mermaid C4Context diagram showing:
- The system under description (as System boundary)
- All actors/users who interact with the system (as Person)
- All external systems the software communicates with (as System_Ext)
- Relationships between them (as Rel)]

**Example structure**:
    C4Context
      title System Context Diagram - [System Name]

      Person(user, "User Role", "Description of user")
      System(system, "System Name", "High-level description")
      System_Ext(ext1, "External System", "What it provides")

      Rel(user, system, "Uses", "Protocol")
      Rel(system, ext1, "Sends/Receives", "Protocol")

### Context Description

| Element | Type | Description |
|---------|------|-------------|
| [System Name] | System | [Core purpose and value proposition] |
| [User/Actor] | Person | [Who they are and how they use the system] |
| [External System] | External System | [What it provides/receives and integration method] |

### Key System Interactions
- **Inbound**: [List of inbound interactions — who/what triggers the system and how]
- **Outbound**: [List of outbound interactions — what the system calls/pushes to and why]

---

## Level 2: Container Diagram

**What this shows**: The high-level technical building blocks of the system — applications, data stores, message brokers, file systems, etc.

### Container Diagram

[Mermaid C4Container diagram showing:
- The system boundary (as System_Boundary or Boundary)
- All containers within the system (as Container, ContainerDb, ContainerQueue)
- External systems and persons from Level 1 for context
- Relationships and communication protocols between containers (as Rel)]

**Example structure**:
    C4Container
      title Container Diagram - [System Name]

      Person(user, "User Role", "Description")

      System_Boundary(boundary, "System Name") {
        Container(api, "API Service", "Technology", "Purpose")
        Container(worker, "Worker Service", "Technology", "Purpose")
        ContainerDb(db, "Database", "Technology", "Stores what")
        ContainerQueue(queue, "Message Queue", "Technology", "Carries what")
      }

      System_Ext(ext1, "External System", "Purpose")

      Rel(user, api, "Uses", "HTTPS/JSON")
      Rel(api, db, "Reads/Writes", "SQL/TCP")
      Rel(api, queue, "Publishes to", "AMQP")
      Rel(worker, queue, "Subscribes to", "AMQP")
      Rel(api, ext1, "Calls", "HTTPS/REST")

### Container Inventory

| Container | Technology | Type | Purpose | Scaling Model |
|-----------|-----------|------|---------|---------------|
| [Name] | [Tech stack] | Application / Data Store / Message Broker / etc. | [What it does] | [How it scales] |

### Container Communication Map
- **Synchronous**: [List sync calls between containers with protocols]
- **Asynchronous**: [List async communication with message types]
- **Data Flows**: [List data movement patterns between containers]

---

## Level 3: Component Diagrams

**What this shows**: The internal structure of each significant container — the key logical components/modules and their interactions.

> Generate one Component diagram per significant container identified in Level 2.
> Skip trivial containers (e.g., simple static file servers).

### [Container Name] — Components

[Mermaid C4Component diagram showing:
- The container boundary (as Container_Boundary)
- Components inside the container (as Component)
- External containers/systems for context
- Internal relationships (as Rel)]

**Example structure**:
    C4Component
      title Component Diagram - [Container Name]

      Container_Boundary(container, "Container Name") {
        Component(comp1, "Component Name", "Technology/Pattern", "Responsibility")
        Component(comp2, "Component Name", "Technology/Pattern", "Responsibility")
      }

      ContainerDb(db, "Database", "Technology")
      Container_Ext(ext_api, "External API", "Technology")

      Rel(comp1, comp2, "Calls", "Method/Event")
      Rel(comp2, db, "Reads/Writes", "ORM/SQL")
      Rel(comp1, ext_api, "Sends requests to", "HTTPS")

#### Component Descriptions

| Component | Technology/Pattern | Responsibility | Interfaces Exposed |
|-----------|-------------------|----------------|-------------------|
| [Name] | [Tech/Pattern] | [What it does] | [APIs, Events, Contracts] |

#### Key Internal Flows
1. **[Flow Name]**: [Step-by-step description of how components interact for a key business transaction]

---

## Level 4: Code (Key Abstractions)

**What this shows**: The key classes, interfaces, and abstractions for the most critical components. This level is intentionally selective — only document components that are architecturally significant.

> Cross-reference with `code-structure.md` for the complete file inventory and design patterns.
> Only generate Level 4 detail for components flagged as architecturally critical.

### [Critical Component Name]

[Mermaid classDiagram showing:
- Key classes/interfaces within the component
- Inheritance and composition relationships
- Key methods (public API only)]

**Example structure**:
    classDiagram
      class InterfaceName {
        <<interface>>
        +methodA(param) ReturnType
        +methodB(param) ReturnType
      }
      class ImplementationName {
        -field: Type
        +methodA(param) ReturnType
        +methodB(param) ReturnType
      }
      InterfaceName <|.. ImplementationName

#### Architectural Decisions
- **Pattern**: [Design pattern used and why]
- **Trade-offs**: [Key trade-offs made at this level]
- **Extension Points**: [How this component can be extended]

---

## Supplementary Views (Optional)

### Dynamic Diagram — Key Business Transaction

[Mermaid sequence diagram or C4Dynamic diagram showing the runtime behaviour for the most important business transaction, tracing from person through containers and components]

### Deployment Diagram

[Mermaid C4Deployment diagram showing how containers are mapped to infrastructure nodes — servers, cloud services, containers, serverless functions]

**Example structure**:
    C4Deployment
      title Deployment Diagram - [Environment]

      Deployment_Node(cloud, "Cloud Provider", "e.g., AWS") {
        Deployment_Node(region, "Region", "e.g., eu-west-1") {
          Deployment_Node(vpc, "VPC") {
            Container(api, "API Service", "Technology")
            ContainerDb(db, "Database", "Technology")
          }
        }
      }

---

## C4 Model Maintenance Notes

- **Level 1 & 2**: Should be kept up-to-date with every significant architectural change
- **Level 3**: Update when components are added, removed, or significantly refactored
- **Level 4**: Update only for architecturally critical components; regenerate sparingly
- **Cross-references**: This document links to `architecture.md` for infrastructure details and `code-structure.md` for file-level inventory
```

### C4 Generation Guidance for AI

When generating the C4 model, follow these rules:

1. **Derive from code, not assumptions**: Every element in the diagrams MUST correspond to something discovered during Multi-Package Discovery (Step 1). Do not invent components.
2. **Level 1 first**: Start with System Context — identify the system boundary, actors, and external systems before diving deeper.
3. **One container per deployable unit**: Each independently deployable unit (Lambda, container, service, database, queue) is a separate container in Level 2.
4. **Component = logical grouping**: Components are logical groupings within a container (e.g., controllers, services, repositories, handlers). Map these from the actual code structure.
5. **Level 4 is selective**: Only generate Level 4 (Code) diagrams for the 2-3 most architecturally significant components. Reference `code-structure.md` for everything else.
6. **Use consistent naming**: Element names in C4 diagrams MUST match the names used in other reverse engineering artifacts (architecture.md, component-inventory.md, code-structure.md).
7. **Include all relationships**: Every arrow must have a label describing what is communicated and the protocol/mechanism used.
8. **Mermaid C4 syntax only**: Use Mermaid's built-in C4 diagram types (C4Context, C4Container, C4Component, C4Deployment). For Level 4, use standard Mermaid classDiagram. For dynamic views, use Mermaid sequence diagrams.

## Step 5: Generate Code Structure Documentation

Create `specs/_project/reverse-engineering/code-structure.md`:

```markdown
# Code Structure

## Build System
- **Type**: [Maven/Gradle/npm/Brazil]
- **Configuration**: [Key build files and settings]

## Key Classes/Modules
[Mermaid class diagram or module hierarchy]

### Existing Files Inventory
[List all source files with their purposes - these are candidates for modification in brownfield projects]

**Example format**:
- `[path/to/file]` - [Purpose/responsibility]

## Design Patterns
### [Pattern Name]
- **Location**: [Where used]
- **Purpose**: [Why used]
- **Implementation**: [How implemented]

## Critical Dependencies
### [Dependency Name]
- **Version**: [Version number]
- **Usage**: [How and where used]
- **Purpose**: [Why needed]
```

## Step 6: Generate API Documentation

Create `specs/_project/reverse-engineering/api-documentation.md`:

```markdown
# API Documentation

## REST APIs
### [Endpoint Name]
- **Method**: [GET/POST/PUT/DELETE]
- **Path**: [/api/path]
- **Purpose**: [What it does]
- **Request**: [Request format]
- **Response**: [Response format]

## Internal APIs
### [Interface/Class Name]
- **Methods**: [List with signatures]
- **Parameters**: [Parameter descriptions]
- **Return Types**: [Return type descriptions]

## Data Models
### [Model Name]
- **Fields**: [Field descriptions]
- **Relationships**: [Related models]
- **Validation**: [Validation rules]
```

## Step 7: Generate Component Inventory

Create `specs/_project/reverse-engineering/component-inventory.md`:

```markdown
# Component Inventory

## Application Packages
- [Package name] - [Purpose]

## Infrastructure Packages
- [Package name] - [CDK/Terraform] - [Purpose]

## Shared Packages
- [Package name] - [Models/Utilities/Clients] - [Purpose]

## Test Packages
- [Package name] - [Integration/Load/Unit] - [Purpose]

## Total Count
- **Total Packages**: [Number]
- **Application**: [Number]
- **Infrastructure**: [Number]
- **Shared**: [Number]
- **Test**: [Number]
```

## Step 8: Generate Technology Stack Documentation

Create `specs/_project/reverse-engineering/technology-stack.md`:

```markdown
# Technology Stack

## Programming Languages
- [Language] - [Version] - [Usage]

## Frameworks
- [Framework] - [Version] - [Purpose]

## Infrastructure
- [Service] - [Purpose]

## Build Tools
- [Tool] - [Version] - [Purpose]

## Testing Tools
- [Tool] - [Version] - [Purpose]
```

## Step 9: Generate Dependencies Documentation

Create `specs/_project/reverse-engineering/dependencies.md`:

```markdown
# Dependencies

## Internal Dependencies
[Mermaid diagram showing package dependencies]

### [Package A] depends on [Package B]
- **Type**: [Compile/Runtime/Test]
- **Reason**: [Why dependency exists]

## External Dependencies
### [Dependency Name]
- **Version**: [Version]
- **Purpose**: [Why used]
- **License**: [License type]
```

## Step 10: Generate Code Quality Assessment

Create `specs/_project/reverse-engineering/code-quality-assessment.md`:

```markdown
# Code Quality Assessment

## Code Quality Indicators
- **Linting**: [Configured/Not configured — list tools and config files]
- **Code Style**: [Consistent/Inconsistent — note formatters like Prettier, Black, etc.]
- **Documentation**: [Good/Fair/Poor — inline comments, JSDoc, docstrings]
- **Type Safety**: [Strong/Partial/None — TypeScript strict mode, mypy, etc.]

## Technical Debt
- [Issue description and location]

## Patterns and Anti-patterns
- **Good Patterns**: [List with locations]
- **Anti-patterns**: [List with locations]
```

## Step 10b: Generate Test Coverage Analysis (Baseline)

**Purpose**: Produce a comprehensive baseline of the project's test coverage state, correlated with business risk and production data.

1. Load **Phase 1** instructions from `test-coverage-analysis.md`
2. Execute Phase 1 Steps 1-6:
   - Step 1: Repository Discovery & Technology Assessment
   - Step 2: Current Coverage Assessment (run actual coverage commands)
   - Step 3: Test Pyramid Analysis
   - Step 4: Production-Correlated Coverage Gap Analysis
   - Step 5: Test Quality Assessment
   - Step 6: Business Flow Coverage Matrix
3. Cross-reference with other RE artifacts:
   - `business-overview.md` — to identify critical business flows
   - `architecture.md` and `c4-architecture.md` — to understand component boundaries
   - `code-structure.md` — for file inventory and complexity indicators
4. Generate the Phase 1 output artifact at `specs/_project/reverse-engineering/test-coverage-analysis.md` using the template in `test-coverage-analysis.md`

## Step 11: Create Timestamp File

Create `specs/_project/reverse-engineering/reverse-engineering-timestamp.md`:

```markdown
# Reverse Engineering Metadata

**Initial Analysis Date**: [ISO timestamp]
**Last Updated**: [ISO timestamp]
**Analyzer**: Fluid Flow AI - Reverse Engineering
**Workspace**: [Workspace path]
**Total Files Analyzed**: [Number]

## Update History
- [ISO timestamp] - Initial analysis

## Artifacts Generated
- [x] business-overview.md
- [x] architecture.md
- [x] c4-architecture.md
- [x] code-structure.md
- [x] api-documentation.md
- [x] component-inventory.md
- [x] technology-stack.md
- [x] dependencies.md
- [x] code-quality-assessment.md
- [x] test-coverage-analysis.md
```

## Step 12: Update State Tracking

Update `specs/{BRANCH_NAME}/state.md`:

```markdown
## Reverse Engineering Status
- [x] Reverse Engineering - Completed on [timestamp]
- **Artifacts Location**: specs/_project/reverse-engineering/
```

## Step 13: Present Completion Message to User

```markdown
# 🔍 Reverse Engineering Complete

[AI-generated summary of key findings from analysis in the form of bullet points]

> **📋 <u>**REVIEW REQUIRED:**</u>**  
> Please examine the reverse engineering artifacts at: `specs/_project/reverse-engineering/`

> **🚀 <u>**WHAT'S NEXT?**</u>**
>
> **You may:**
>
> 🔧 **Request Changes** - Ask for modifications to the reverse engineering analysis if required
> ✅ **Approve & Continue** - Approve analysis and proceed to **Complexity Assessment**
```

## Step 14: Wait for User Approval

- **MANDATORY**: Do not proceed until user explicitly approves
- **MANDATORY**: Log user's response in audit.md with complete raw input
