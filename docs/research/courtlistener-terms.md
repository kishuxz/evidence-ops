# CourtListener / RECAP terms notes (read-only)

Retrieved: 2026-08-22. This is research for D1, not a connector and not legal advice.
Agents must not ingest CourtListener data or store API tokens in this node.

## Candidate source

Architecture names CourtListener/RECAP or another authorized public federal opinion
source as the first connector. CourtListener is operated by Free Law Project
(U.S. 501(c)(3)).

## Public facts (as of retrieval)

| Topic | Note | Source |
| --- | --- | --- |
| API | REST v4 at `https://www.courtlistener.com/api/rest/v4/` | [REST API v4.7](https://wiki.free.law/c/courtlistener/help/api/rest/v4/overview) |
| Auth | Token, cookie, or HTTP basic. Unauthenticated experimentation is possible; production use must authenticate. | same |
| Default authenticated rate | 5 requests/minute, 50/hour, 125/day, rolling windows, all throttles concurrent. Multiple accounts per project/person/org are forbidden. | same |
| Membership | As of 2026-05-07, members can access the full API including PACER/RECAP APIs. Membership-based access is described as personal, educational, research, journalistic, and exploratory. Commercial agreements are offered. | [FLP announcement](https://free.law/2026/05/07/api-included-in-memberships/), [startups](https://free.law/startups/) |
| Credentials | Do not share, resell, pool, or transfer API tokens. Product/team access should use a commercial agreement. | [Terms](https://wiki.free.law/c/terms/courtlistener/courtlistenercom-terms-of-service-and-policies) |
| Content | Judicial opinions, motions, and other filings are generally in the public domain; other filings may contain third-party copyrighted works. | same |
| FCRA | CourtListener is not a consumer reporting agency; FCRA uses are prohibited. | same |
| AI clients | Caller is responsible for agent requests made with their credentials. Do not present republished data as if Free Law Project produced, endorsed, or verified an AI-generated analysis. | same |
| Maintenance | Weekly window Thursday 21:00–23:59 PT. | REST API overview |
| Bulk data | Bulk objects exist; FLP describes them as updated quarterly and heavier to load. | [startups](https://free.law/startups/) |

Terms last modified dates observed: Terms of Service 2026-08-05; Privacy Policy 2026-07-29.

## Open questions (human direction before D1)

1. Is EvidenceOps' intended hosted demo and product use inside membership "exploratory/research" use, or does it require a Free Law Project commercial/partnership agreement?
2. Which CourtListener datasets are in scope for v0.1 (opinion clusters/opinions only vs RECAP PACER documents)?
3. Attribution and branding requirements for snapshots shown in the reviewer UI.
4. Deletion, sealed, and take-down handling: how connector failure and source deletion map to graph `ChangeEvent`s.
5. Rate-limit budget for CI vs production; CI must not hit the live API (evaluation is offline from fixtures).

Until those are answered, D1 must not assume unlimited commercial API access and must not commit secrets.

## What D1 still has to document

Licensing, rate limits, coverage, version semantics, deletion handling, and failure
behavior for the chosen connector, with tests for partial ingestion as an explicit
failure state rather than empty success.
