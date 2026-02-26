# Business Overview

## Business Context Diagram

```mermaid
C4Context
    title Payment Processing Platform - Business Context

    Person(customer, "Customer", "Makes purchases via web or mobile")
    Person(merchant, "Merchant", "Receives payments and manages products")
    Person(admin, "Platform Admin", "Manages system configuration")

    System(platform, "Payment Platform", "Processes payments, manages accounts, handles disputes")

    System_Ext(bank, "Acquiring Bank", "Processes card transactions")
    System_Ext(fraud, "Fraud Detection Service", "Real-time fraud scoring")
    System_Ext(notif, "Notification Service", "Email and SMS delivery")

    Rel(customer, platform, "Submits payments")
    Rel(merchant, platform, "Views transactions, manages refunds")
    Rel(admin, platform, "Configures rules, monitors health")
    Rel(platform, bank, "Submits authorisation requests")
    Rel(platform, fraud, "Requests fraud scores")
    Rel(platform, notif, "Sends transaction notifications")
```

## Business Description

The Payment Processing Platform handles end-to-end payment lifecycle management
for e-commerce merchants. Core business transactions include:

- **Payment Authorisation**: Customer initiates payment, platform validates,
  sends to acquiring bank, returns result
- **Settlement**: Batch processing of authorised transactions for merchant payout
- **Dispute Management**: Chargeback handling, evidence collection, resolution tracking

## Business Dictionary

| Term | Definition |
|------|-----------|
| Authorisation | Verification that funds are available and the transaction is legitimate |
| Settlement | Transfer of funds from acquiring bank to merchant account |
| Chargeback | Customer-initiated dispute reversing a completed transaction |
| PCI DSS | Payment Card Industry Data Security Standard |

## Component Business Descriptions

### payment-api
Handles inbound payment requests from merchant integrations. Validates request
format, applies business rules, and routes to the processing pipeline.

### settlement-engine
Runs nightly batch jobs to aggregate authorised transactions and submit
settlement files to the acquiring bank.
