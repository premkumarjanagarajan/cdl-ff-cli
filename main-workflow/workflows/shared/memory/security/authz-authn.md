# Authentication & Authorization Integrity

AI must treat authentication and authorization as security-critical.

AI must:
- Preserve existing authn/authz flows
- Explicitly state when access control is affected
- Avoid role or permission broadening

AI must not:
- Assume "internal" means trusted
- Replace fine-grained access with coarse roles
- Introduce default allow policies

Any change to authn/authz requires human (InfoSec) approval.
