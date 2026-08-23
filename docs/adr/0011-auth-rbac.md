# ADR 0011: In-process auth, RBAC, audit, and approval policy

- Node: A1
- Date: 2026-08-22

## Status

Accepted

## Context

Production OIDC is not in this node. Tenant/matter isolation still needs an
enforceable permission boundary and an audit/approval record for external actions.

## Decision

- `Authenticator` is an interface; `MemoryAuthenticator` is the test implementation.
  No production credentials, IdP, or hosted deployment.
- Roles bind per tenant and per matter. Cross-tenant access is denied. A matter
  binding does not grant other matters in the same tenant.
- External write, notify, publish, and release require a recorded approval.
- Audit events are append-only and tenant-filtered.

## Consequences

- U1 and W1 must call this policy before side effects.
- Replacing MemoryAuthenticator with OIDC needs a later ADR and still no secrets in git.
