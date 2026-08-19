# TASK-167 canonical Aitta guidance

TASK-167 establishes the accepted Aitta vocabulary in living repository
guidance without changing product source, runtime behavior, protocol 1.0,
storage, or external state.

## Definition of done audit

The task remains one bounded vertical documentation outcome. The five terms,
their first-use explanation, the application/profile distinction, the
deployment-language rule, and the current Hub boundary are one shared vocabulary
contract. Splitting any of them would leave the living guidance internally
inconsistent, while the product-copy changes remain independently owned by
TASK-168 through TASK-170.

## Accepted living vocabulary

| Term | Living-guidance meaning |
| --- | --- |
| **Aitta** / **Aittas** | The owner-controlled AittaSocial application and local authority; the branded singular and plural nouns. |
| **Aitta deployment** | A particular running installation of an Aitta. |
| **profile** | An Aitta's optional outward identity presentation. |
| **Hub connection** | The owner-authorized relationship between an Aitta and the AittaSocial Hub. |
| **AittaSocial Hub** | The network authority and coordination service. |

The exact safe first-use wording pinned in living guidance is:

> An Aitta is your independently controlled AittaSocial application. It remains
> authoritative for its identity, content, configuration, and locally stored
> data, whether it is publicly reachable, private, or disconnected from the
> AittaSocial Hub.

Living guidance uses **AittaSocial app** only when a first-time reader needs an
immediate generic explanation. It uses bare **deployment** for packaging,
release, or hosting operations, **Aitta deployment** for the running
installation, and **Aitta-owned** for local data and authority.

## Compatibility and scope evidence

- Protocol 1.0 still has the exact `accountType`, `profile`, `entry`, `entries`,
  `/entries/*`, `/api/v1/site`, manifest, envelope, allowlist, status, and error
  compatibility surfaces. No protocol version, route, schema, migration, or
  internal identifier changed.
- The current POC has no Hub connection. Public profile and published-update
  reads remain independent of AittaSocial Hub, and the optional public
  verification challenge remains only a control-of-deployment check.
- Existing runtime labels remain unchanged in this task. In particular, the
  neutral `Independent presence` fallback remains a TASK-169 product-copy
  outcome, while residual owner-shell terminology remains TASK-170 work.
- `CHANGELOG.md`, `docs/checkpoint.md`, and all pre-existing
  `docs/acceptance/**` records remain unchanged. This file is the only new
  acceptance record.
- No application, library, content, database, schema, migration, API, runtime,
  hosting binding, Site, data, setting, access, DNS, domain, Hub, or sibling
  repository state changed.

## Evidence

The living-document scan leaves application-level `presence` only where the
current exact runtime fallback is explicitly named as a pending compatibility
boundary; the unrelated ordinary phrase “Presence in the public API” is not a
product noun. Bare `deployment` occurrences were reviewed individually and
remain only where they describe an operation, a deployment credential, a
deployment prompt, or the accepted control-of-deployment wording.

Validation evidence for the completed branch includes the agent and plan
checks, focused documentation-sensitive tests, full `npm run validate`,
`npm audit --omit=dev`, and `git diff --check`. The protocol-document digest in
the direct conformance assertion is updated to the final reviewed document.
No hosted or other external mutation was performed.
