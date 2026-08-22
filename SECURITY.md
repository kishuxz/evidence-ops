# Security

## Reporting

This repository may later hold research artifacts, audit logs, and tenant data. Do not
file security issues as public GitHub issues if they could expose tenant isolation,
auth, or secret-handling flaws.

Use GitHub's private vulnerability reporting on
[kishuxz/evidence-ops](https://github.com/kishuxz/evidence-ops/security), or contact the
maintainers privately.

## Current scope

F0 contains no production service, no secret store, and no private legal data. Still:

- never commit `.env`, API tokens, or CourtListener credentials
- never log secrets
- never add privileged or client-confidential fixtures

Threat modeling for private-data ingestion is required before that ingestion (see
`docs/ARCHITECTURE.md`). Z1 tracks unresolved critical/high findings.
