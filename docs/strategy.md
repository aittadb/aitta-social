# AittaSocial strategy

This is a living direction document, not an implementation plan, public
protocol, or release commitment. `PLAN.md` remains the authority for accepted
near-term work; `ROADMAP.md` records the high-level future direction.

## Brand architecture

- **AittaSocial** is the software platform and product family.
- **Aitta** is one independently controlled top-level place. It is authoritative
  for its identity, content, configuration, and locally retained data.
- An **Aitta deployment** is one running installation of an Aitta. The current
  POC runs one Aitta per deployment.
- A **profile** is an Aitta's optional outward identity presentation.
- The future **Aitta Network** is the network of Aittas and members, with
  relationships coordinated only through accepted contracts.
- The **AittaSocial Hub** is a trusted identity, discovery, relationship,
  authorization, and coordination service within those accepted contracts.
  It is never content authority or shared content storage. A **Hub connection**
  is an owner-authorized relationship between an Aitta and that service; it is
  not present in the POC.
- A future **member** may participate in the network without owning or
  deploying an Aitta. Membership and ownership must remain separate.

Use *place*, *message*, *conversation*, *space*, and *app* in ordinary
language. Terms such as *event*, *deployment*, and *authority* explain the
technical model when needed, not the primary public value.

## Current POC and future vision

Today, AittaSocial is an independently controlled publishing POC. It supports
local Identity, public updates and permalinks, drafts, basic presentation
controls, and sole-owner administration. It has no Hub connection, network
membership, invitations, following, Your Network reader, member-authored
events, direct messaging, recursive app spaces, or App Idea process.

The future vision is a network of independently controlled places where a
shared item can grow into a structured space for communication, participation,
and useful trusted apps. A feed is only a projection; it is not the authority
or storage model. This vision is deliberately separate from current capability.

## Public message and launch unit

Working promise: **A place that grows around what people do together.**

Working campaign line: **Start with a message. Let it grow.**

Working current-state message: **Today, AittaSocial provides an independently
controlled identity and publishing place with local owner administration. The
networked participation vision is future work.**

The first audience is an organizer who already brings together a small group,
has a recurring shared purpose, and can invite people to one meaningful item.
The future launch unit is one Aitta, one organizer, a few invited people, one
meaningful shared item, and one real next need. Start with existing groups and
demonstrable usefulness, not an empty global feed. A participant should be
able to join a relevant future network context without needing to own an
Aitta.

## Future public direction (living, contract-dependent)

- **Category:** a network of adaptable social places for purposeful
  participation, not a generic social feed or app catalogue.
- **Campaign line:** *Start with a message. Let it grow.*
- **Audience and launch:** organizers with an existing small group; begin with
  one Aitta, one organizer, a few invited people, and one meaningful shared
  item.
- **Visual direction:** calm social utility with warm trust: restrained,
  typographic, place-first identity with clear boundaries between public
  presentation and private administration.
- **Success:** a small group returns to one shared purpose, can understand who
  controls what, and gets useful participation without requiring Aitta
  ownership for every member.

These are living future summaries, not current capability, launch promises, or
implementation contracts. The current POC remains local identity, publishing,
and sole-owner administration.

## Product doctrine

- An Aitta is the place, not one app or one feed; apps are trusted, versioned
  implementations installed in an Aitta.
- A future event may participate in one app space while rooting another, but
  nesting must remain bounded and understandable.
- A parent relationship never grants discovery, read access, write access,
  delivery, membership, or notification rights.
- Authority for each event, state, local draft, projection, and revocation
  rule must be explicit; a root owner does not become author of every child.
- Apps are trusted, versioned implementations installed independently by an
  Aitta. Executable code, arbitrary HTML, remote scripts, and automatic
  package installation never travel with events.
- Unknown app types must fail safely with bounded static information and no
  execution of a sender's implementation.
- AI assistance may prepare reviewed platform changes or configure accepted
  trusted capabilities. It must not publish arbitrary live code.
- Participation, ownership, following, joining, permissions, and notification
  choices are distinct concepts; no relationship silently grants another.
- Independent control and data authority support trust, but they are not the
  primary marketing headline.

## Staged direction

| Stage | Direction | Status |
| --- | --- | --- |
| 0 | Local identity, publishing, and sole-owner administration. | Current POC |
| 1 | Contract-first member Sign in with ChatGPT and participation without Aitta ownership: optional registration, verified discovery, direct invitations, Follow and Unfollow, Your Network, and safety foundations. | Future; requires accepted contracts |
| 2 | A versioned event and app foundation for public recursive spaces, explicit authority, access policy, and safe unknown types. | Future; contract-first |
| 3 | A narrow, consent-based direct-conversation app space. | Future direction |
| 4 | App Idea: a participatory space that can turn a real need into a visible decision, prototype, release, or closure. | Future direction |
| 5 | A trusted, human-reviewed app-development and release loop. | Future direction |
| 6 | Declarative creation from trusted, bounded capabilities. | Future direction |
| 7 | Narrow wider-network adapters after the internal event and trust model is stable. | Future direction |

Stages 1–7 proceed only through accepted, testable vertical increments. They
must not be represented as present capability, and no stage supplies an
implementation contract by implication.

Future member Sign in with ChatGPT is distinct from current Sites local
sole-owner sign-in. It must be contract-defined and must not independently grant
access to ChatGPT conversations, memory, files, tokens, or billing data.

The future north-star measure is **Weekly Participating Spaces**: a space with
at least two distinct people or Aittas, one meaningful child event or state
transition, and activity in the measured week. It is not a current POC metric.

## Guardrails for direction and messaging

Do not market an unbuilt catalogue, a global feed, arbitrary app generation,
or external-network compatibility. Do not equate ChatGPT sign-in with network
membership: in the POC it supports only possible sole-owner administration.
Future participation and external connections require their own accepted
identity, authorization, consent, safety, and privacy contracts. The product
should remain useful to a small group before it seeks scale, and every public
claim must distinguish the current POC from the intended destination.
