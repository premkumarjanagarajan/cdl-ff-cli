# Secrets & Credentials Management

AI must never:
- Generate real secrets, keys, passwords, or tokens
- Hardcode credentials
- Store secrets in source code
- Log secrets or sensitive tokens

AI must always:
- Use placeholders (e.g. ${SECRET_NAME})
- Recommend secure secret stores
- Apply least-privilege access

Any deviation requires explicit human approval.
