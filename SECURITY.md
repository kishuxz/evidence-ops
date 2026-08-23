# Security

## Reporting

This repository may later hold research artifacts, audit logs, and tenant data. Do not
file security issues as public GitHub issues if they could expose tenant isolation,
auth, or secret-handling flaws.

Use GitHub's private vulnerability reporting on
[kishuxz/evidence-ops](https://github.com/kishuxz/evidence-ops/security), or contact the
maintainers privately.

## Current scope

There is no publicly deployed production service and no secret store in git.
Still:

- never commit `.env`, API tokens, or CourtListener credentials
- never log secrets in O1 fields
- never add privileged or client-confidential fixtures

Z1 found no critical tenant-isolation bypass. Unresolved items are I1, live
CourtListener, expert corpus review, and Z2 public deploy authorization.
