# Architecture

## System Overview

The platform follows a microservices architecture deployed on AWS. Services
communicate via API Gateway (synchronous) and SQS/EventBridge (asynchronous).

## Architecture Diagram

```mermaid
flowchart TB
    subgraph API["API Layer"]
        GW["API Gateway"]
        AUTH["Authoriser Lambda"]
    end

    subgraph SERVICES["Service Layer"]
        PAY["Payment Service<br/><i>Lambda</i>"]
        SETTLE["Settlement Service<br/><i>ECS Fargate</i>"]
        DISPUTE["Dispute Service<br/><i>Lambda</i>"]
    end

    subgraph DATA["Data Layer"]
        DB[("Aurora PostgreSQL")]
        CACHE["ElastiCache Redis"]
        S3["S3<br/><i>Settlement Files</i>"]
    end

    subgraph ASYNC["Async Layer"]
        SQS["SQS Queues"]
        EB["EventBridge"]
    end

    GW --> AUTH --> PAY
    GW --> AUTH --> DISPUTE
    PAY --> DB
    PAY --> CACHE
    PAY --> SQS
    SQS --> SETTLE
    SETTLE --> DB
    SETTLE --> S3
    DISPUTE --> DB
    EB --> PAY
    EB --> DISPUTE

    style API fill:#90CAF9,stroke:#1565C0
    style SERVICES fill:#81C784,stroke:#2E7D32
    style DATA fill:#FFF176,stroke:#F9A825
    style ASYNC fill:#FFB74D,stroke:#E65100
```

## Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Auth as Authoriser
    participant Pay as Payment Service
    participant DB as Aurora DB
    participant Bank as Acquiring Bank

    Client->>Gateway: POST /payments
    Gateway->>Auth: Validate token
    Auth-->>Gateway: Authorised
    Gateway->>Pay: Process payment
    Pay->>DB: Check idempotency key
    DB-->>Pay: Not found (new request)
    Pay->>Bank: Authorisation request
    Bank-->>Pay: Approved
    Pay->>DB: Store transaction
    Pay-->>Gateway: 201 Created
    Gateway-->>Client: Payment confirmed
```

## Component Descriptions

| Component | Type | Purpose | Dependencies |
|-----------|------|---------|-------------|
| payment-api | Lambda | Processes payment requests | Aurora, Redis, SQS |
| settlement-engine | ECS Fargate | Nightly batch settlement | Aurora, S3 |
| dispute-service | Lambda | Handles chargebacks | Aurora, EventBridge |
| authoriser | Lambda | JWT token validation | Cognito |

## Integration Points

| External System | Protocol | Purpose |
|----------------|----------|---------|
| Acquiring Bank API | REST (HTTPS) | Card authorisation and settlement |
| Fraud Detection | gRPC | Real-time fraud scoring |
| SendGrid | REST | Transaction notification emails |
