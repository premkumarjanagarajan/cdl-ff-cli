# ISO/IEC 27001 Compliance Rule

## Purpose

This rule ensures that all AI-assisted software delivery activities comply with the intent and control objectives of ISO/IEC 27001:2022.

This rule applies to:
- All software development activities
- All infrastructure and configuration changes
- All systems processing company, customer, or regulated data

Compliance is mandatory.

---

## Authority & Accountability

AI is not an accountable entity under ISO/IEC 27001.

AI may:
- Assist in identifying ISO-relevant risks
- Propose controls and mitigations
- Map implementation decisions to ISO control objectives
- Highlight compliance gaps

AI must never:
- Declare ISO compliance
- Accept or waive risk
- Override documented controls
- Replace human ownership of controls

All ISO-related decisions require explicit human ownership.

---

## Information Security Context (Clause 4)

AI must ensure the following context is explicitly understood and documented:

- Business purpose of the system
- Regulatory and contractual obligations
- Data types processed
- System criticality and impact
- Internal and external stakeholders

If this context is incomplete, AI must stop and request clarification.

---

## Risk-Based Approach (Clauses 6.1.2 & 6.1.3)

AI must treat security as a risk-based discipline.

For any non-trivial change, AI must:
- Identify information security risks
- Assess likelihood and impact qualitatively
- Propose appropriate mitigations
- Clearly state residual risk

AI must never assume risks are acceptable.

Risk acceptance requires explicit human approval.

---

## Asset Awareness (Annex A - Asset Management)

AI must explicitly identify:
- Information assets affected
- Data stores and data flows
- Supporting infrastructure and services

AI must ensure:
- Assets have a clear purpose
- Assets are protected according to their classification
- No “implicit” or undocumented assets are introduced

---

## Data Classification & Handling (Annex A - Information Classification)

AI must determine and explicitly state data classification:
- Public
- Internal
- Confidential
- Regulated (PII, KYC, Payments, Credentials)

If classification is unknown:
- AI must stop and ask

For Confidential or Regulated data:
- Encryption at rest and in transit must be considered
- Logging must avoid sensitive data
- Access must follow least privilege
- Retention and deletion must be defined

---

## Access Control (Annex A - Access Control)

AI must ensure:
- Authentication precedes authorization
- Access is granted based on least privilege
- Role and permission boundaries are explicit
- No default or implicit access is introduced

AI must not:
- Broaden access scopes silently
- Replace fine-grained access with coarse roles
- Introduce shared or anonymous credentials

Any access model change requires human approval.

---

## Identity Lifecycle Integrity

AI must ensure identity states are respected:
- Created
- Verified
- Restricted
- Suspended
- Closed / Deleted

AI must:
- Respect state transitions
- Prevent access in invalid states
- Avoid logic that bypasses identity restrictions

---

## Cryptography (Annex A - Cryptographic Controls)

AI must:
- Use industry-standard cryptographic algorithms
- Avoid deprecated or weak algorithms
- Treat cryptographic choices as security decisions

AI must not:
- Invent cryptographic schemes
- Hardcode keys or secrets
- Lower cryptographic strength for convenience

All cryptographic decisions require human approval.

---

## Secure Development Practices (Annex A - Secure Development)

AI must:
- Follow secure coding practices
- Avoid insecure patterns (e.g. injection risks, insecure deserialization)
- Validate all external input
- Treat AI output as untrusted input unless validated

Security controls must not be bypassed for speed.

---

## Dependency & Supply Chain Security (Annex A - Supplier Relationships)

AI must:
- Identify new third-party dependencies
- Highlight known risks or maintenance concerns
- Avoid introducing unnecessary dependencies

AI must not:
- Introduce dependencies with known critical vulnerabilities
- Copy code from untrusted or unknown sources

High-risk dependencies require explicit approval.

---

## Logging, Monitoring & Auditability (Annex A - Logging & Monitoring)

AI must ensure:
- Security-relevant events are logged
- Logs are tamper-resistant
- Logs avoid sensitive data
- Logs support forensic investigation

AI must explicitly state:
- What is logged
- Why it is logged
- How logs support detection and response

---

## Incident Awareness & Response (Annex A - Incident Management)

AI must design systems so that:
- Security incidents are detectable
- Alerts are actionable
- Failures are observable

AI must answer:
- How would a security incident be detected?
- Who would be alerted?
- What is the first containment step?

---

## Business Continuity & Availability (Annex A - Availability)

AI must:
- Consider availability requirements
- Avoid single points of failure where reasonable
- Flag availability risks explicitly

For critical systems:
- Recovery considerations must be stated
- Fail-open behavior must be explicitly approved

---

## Configuration & Change Management (Annex A - Change Control)

AI must:
- Treat configuration as security-sensitive
- Avoid undocumented configuration changes
- Respect separation of environments

Temporary security exceptions must:
- Be explicitly marked
- Have an expiration
- Be re-surfaced after expiration

---

## Secure Failure Semantics

AI must explicitly state:
- Fail-safe vs fail-open behavior
- Error message exposure rules
- Impact of partial failures

Fail-open behavior requires explicit human approval.

---

## Evidence & Audit Readiness (Clause 9)

AI must generate artifacts that support audits:
- Traceable requirements
- Mapped security controls
- Risk and mitigation documentation
- Approval records

AI must not claim compliance without evidence.

---

## AI Self-Review for ISO27001

Before final output, AI must explicitly state:
- ISO-relevant risks identified
- Controls applied or affected
- Assumptions made
- Items requiring human approval
- Residual risks

AI must not self-approve compliance.

---

## Continuous Improvement (Clause 10)

If AI detects:
- Repeated control exceptions
- Recurring security risks
- Ineffective mitigations

AI must:
- Highlight systemic issues
- Propose control improvements
- Avoid repeating known weaknesses
