# Component Inventory

## Application Packages

| Package | Purpose |
|---------|---------|
| payment-api | Payment processing Lambda functions |
| settlement-engine | Nightly batch settlement (ECS Fargate) |
| dispute-service | Chargeback handling Lambda functions |
| notification-worker | Transaction notification delivery |

## Infrastructure Packages

| Package | IaC Tool | Purpose |
|---------|----------|---------|
| infra-core | CDK (TypeScript) | VPC, networking, shared resources |
| infra-payment | CDK (TypeScript) | Payment service stack (Lambda, API GW) |
| infra-data | CDK (TypeScript) | Aurora, ElastiCache, S3 |

## Shared Packages

| Package | Type | Purpose |
|---------|------|---------|
| shared-models | Models | Transaction, merchant, and card type definitions |
| shared-utils | Utilities | Logging, error handling, date formatting |
| shared-clients | Clients | Bank API client, notification client |

## Test Packages

| Package | Type | Purpose |
|---------|------|---------|
| test-unit | Unit | Unit tests for all services |
| test-integration | Integration | API and database integration tests |
| test-load | Load | K6 load test scripts |

## Summary

| Category | Count |
|----------|-------|
| Application | 4 |
| Infrastructure | 3 |
| Shared | 3 |
| Test | 3 |
| **Total** | **13** |
