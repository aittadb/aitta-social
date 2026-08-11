# TASK-166 Aitta terminology refinement

TASK-166 turns the owner decision to use **Aitta** into bounded implementation
work. It is a read-only planning outcome: no product source, protocol, schema,
migration, Site, hosted state, Hub, or sibling repository changed.

## Accepted vocabulary

| Term | Meaning |
| --- | --- |
| **Aitta** | The owner-controlled AittaSocial application and local authority. |
| **Aitta deployment** | A particular running installation of an Aitta. |
| **profile** | An Aitta's optional outward identity presentation. |
| **Hub connection** | The owner-authorized relationship between an Aitta and the AittaSocial Hub. |
| **AittaSocial Hub** | The network authority and coordination service. |

The canonical first-use explanation is:

> An Aitta is your independently controlled AittaSocial application. It remains
> authoritative for its identity, content, configuration, and locally stored
> data, whether it is publicly reachable, private, or disconnected from the
> AittaSocial Hub.

The current POC has no Hub connection. Current copy must not say that an Aitta
can already participate privately through the Hub. Public reads remain
Hub-independent, and the public verification challenge remains only a
deployment-control check.

Use **Aitta** and plural **Aittas** as branded nouns. Use **AittaSocial app**
when a first-time reader needs a generic explanation. Use **Aitta deployment**
only for a running installation, not for the act of packaging or releasing
software.

## Inventory and compatibility decision

The exact `develop` base
`14692334bbc0605a83bff82432bfe249ff6d30db` contains 445 word-level
`presence` or `presences` occurrences: 111 in runtime source or content, 177 in
tests, and 157 in living or historical documentation and trackers.

| Classification | Decision |
| --- | --- |
| Current human-facing UI, setup, and neutral metadata copy | Change only when `presence` means the owner-controlled application; use `profile` for outward presentation. |
| Living governance, setup, protocol explanation, security, privacy, operations, presentation, upgrade, roadmap, and backlog guidance | Adopt the five-term vocabulary while retaining exact compatibility names. |
| Protocol 1.0, API, storage, and routes | Preserve `accountType`, `account_type`, `profile`, `entry`, `entries`, `/entries/*`, `/api/v1/site`, manifest fields, envelopes, allowlists, and error codes. |
| Schema, migrations, and low-value internal identifiers | Preserve them; CSS classes, component/function names, test filenames, and fixture identifiers are not user terminology work. |
| Historical evidence | Preserve `CHANGELOG.md`, `docs/checkpoint.md`, and existing `docs/acceptance/**` records verbatim apart from the new TASK-166 completion record. |
| Deployment wording | Distinguish an Aitta deployment from a Sites packaging, save, or deploy operation. |

Configured metadata continues to use only bounded public profile and published
update fields. Neutral metadata must not imply that profile data, owner identity,
local configuration, D1 content, or a Hub connection is public. Every remote
Aitta remains untrusted, and no verification challenge becomes authentication.

## Follow-on slices and ownership

- TASK-167 owns living repository guidance and its direct documentation tests.
- TASK-168 owns only unconfigured setup, unavailable-state, prompt, and neutral
  metadata wording plus their direct tests and evidence.
- TASK-169 owns configured public frame, permalink, not-found, and configured
  metadata wording plus their direct tests and evidence.
- TASK-170 owns residual owner-shell, access-state, and owner-home wording after
  TASK-164 establishes the final owner-home source base.
- TASK-159 owns Identity/profile terminology in its profile route and form;
  TASK-160 owns composer and return-path wording; TASK-164 owns publication
  lifecycle wording; and TASK-165 owns deletion and recovery wording. TASK-161
  through TASK-163 inherit that accepted vocabulary in the same components.

TASK-168 depends on TASK-167 and TASK-169 depends on TASK-168 because their
source and tests overlap. TASK-170 depends on TASK-164 and TASK-169: the first
provides its owner-home base and the second completes the shared public
vocabulary. These tasks must not run concurrently with any task that declares
the same product, test, or documentation files.

## Refinement evidence

The inventory was read-only and classified source, tests, living guidance,
stable compatibility surfaces, and historical evidence separately. The four
follow-on rows have binary DoDs, direct dependencies, explicit negative
boundaries, validation gates, and no external-state target. TASK-166 completes
only when those rows replace it in `PLAN.md`, this record is committed, and
the agent, plan, and diff checks pass.
