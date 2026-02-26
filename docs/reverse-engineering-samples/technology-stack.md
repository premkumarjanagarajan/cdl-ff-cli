# Technology Stack

## Programming Languages

| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | 5.3 | Application services, infrastructure (CDK) |
| Java | 17 | Settlement engine |
| SQL | N/A | Database migrations and queries |

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| AWS CDK | 2.x | Infrastructure as Code |
| Express.js | 4.x | Local development API server |
| Middy | 5.x | Lambda middleware framework |

## Infrastructure

| Service | Purpose |
|---------|---------|
| AWS Lambda | Serverless compute for payment and dispute services |
| ECS Fargate | Container hosting for settlement engine |
| Aurora PostgreSQL | Primary relational database |
| ElastiCache Redis | Caching and idempotency storage |
| API Gateway | REST API management and routing |
| SQS | Asynchronous message queuing |
| EventBridge | Event-driven integration |
| S3 | Settlement file storage |
| CloudWatch | Monitoring, logging, and alerting |

## Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| npm | 10.x | Package management (workspaces monorepo) |
| esbuild | 0.20.x | TypeScript bundling for Lambda |
| Maven | 3.9.x | Java build (settlement engine) |

## Testing Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | 29.x | Unit and integration testing (TypeScript) |
| JUnit | 5.x | Unit testing (Java) |
| K6 | 0.50.x | Load and performance testing |
| Testcontainers | 3.x | Local database integration testing |
