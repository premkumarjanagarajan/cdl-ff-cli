# Data Classification & Handling

Before proposing or generating solutions involving data, AI must determine data classification:

- Public
- Internal
- Confidential
- Regulated (PII, KYC, Payments, Credentials)

## Mandatory Behaviour
- AI must explicitly state assumed data classification
- If classification is unknown, AI must stop and ask

## Prohibited Behaviour
- Treating regulated data as generic
- Logging sensitive or regulated data
- Using production data in examples
- Persisting secrets or tokens

If Regulated data is involved, AI must escalate.
