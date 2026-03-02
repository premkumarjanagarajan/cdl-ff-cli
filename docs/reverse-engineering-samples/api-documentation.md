# API Documentation

## REST APIs

### POST /payments

**Purpose**: Create a new payment transaction.

| Property | Value |
|----------|-------|
| Method | POST |
| Path | `/v1/payments` |
| Auth | Bearer token (JWT) |
| Rate Limit | 100 req/s per merchant |

**Request Body**:
```json
{
  "amount": 4999,
  "currency": "EUR",
  "card_token": "tok_abc123",
  "merchant_id": "mch_xyz",
  "idempotency_key": "idem_001",
  "metadata": {
    "order_id": "order_456"
  }
}
```

**Response (201)**:
```json
{
  "id": "txn_789",
  "status": "authorised",
  "amount": 4999,
  "currency": "EUR",
  "created_at": "2026-02-09T14:30:00Z"
}
```

### GET /payments/{id}

**Purpose**: Retrieve a payment transaction by ID.

| Property | Value |
|----------|-------|
| Method | GET |
| Path | `/v1/payments/{id}` |
| Auth | Bearer token (JWT) |

**Response (200)**:
```json
{
  "id": "txn_789",
  "status": "authorised",
  "amount": 4999,
  "currency": "EUR",
  "merchant_id": "mch_xyz",
  "created_at": "2026-02-09T14:30:00Z",
  "updated_at": "2026-02-09T14:30:00Z"
}
```

## Data Models

### Transaction

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Unique transaction identifier |
| status | enum | Yes | authorised, captured, refunded, failed |
| amount | integer | Yes | Amount in minor units (cents) |
| currency | string (ISO 4217) | Yes | Three-letter currency code |
| merchant_id | string | Yes | Merchant account identifier |
| card_token | string | Yes | Tokenised card reference |
| idempotency_key | string | Yes | Client-provided deduplication key |
| created_at | datetime | Yes | ISO 8601 creation timestamp |
| updated_at | datetime | Yes | ISO 8601 last update timestamp |
