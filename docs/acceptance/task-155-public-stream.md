# TASK-155 identity-linked public stream acceptance

TASK-155 replaces the public homepage's editorial update previews and the
permalink's isolated article opening with one source-first update model inside
the TASK-154 shared public frame. It changes server-rendered public components,
public-scoped CSS, focused tests, and presentation documentation only.

## Homepage outcome

The existing published-only, newest-first query still returns at most twelve
rows in its established deterministic order. The rendered result is one
semantic ordered list, at most 700 CSS pixels wide, on one restrained surface:

- every update repeats a 40-pixel derived-initials tile, complete wrapping
  source name, and human-readable linked publication time;
- the source name links natively to the configured Identity, while historical
  rows without a profile use the neutral `Independent presence` source and the
  setup start point;
- notes lead with their complete body at 16 pixels, omit the redundant Note
  label, and show a saved title only afterward as a quiet permalink link;
- articles, announcements, and links use a 20–24-pixel title when one exists
  and a bounded Unicode-aware excerpt;
- link destinations remain complete, wrapping, native anchors with
  `noopener noreferrer`; and
- thin separators replace isolated cards, with no ordinal, Recent label,
  generic Read update action, invented note headline, fake engagement control,
  or inert menu.

The zero-update state is one compact bordered region beneath the Updates h2.
One update uses the same structure as many updates, and fixtures cover all four
supported kinds together. Missing titles and long unbroken bodies, names,
titles, and destination URLs do not create placeholder headings or source
fabrication.

## Permalink outcome

Every published permalink retains the shared compact header and footer. Its
source row repeats the same 40-pixel tile and source name, useful non-note kind,
and full human-readable publication time next to the content. Native actions in
the header and below the content return to the presence; `View as JSON` remains
available as the quiet secondary technical action.

An article title is a moderate sans-serif h1 and its body is bounded to a
comfortable 66-character reading measure. A note remains ordinary 16-pixel
text. Its one semantic h1 is visually hidden and reads
`Update from {display name}` so an untitled note remains meaningful without a
large invented title. A stored note title occurs once, after the body, as quiet
text rather than a second assistive or visual heading. An untitled non-note gets
the corresponding source-based hidden h1. Destinations preserve their complete
URL and safe relation.

Draft and unknown identifiers continue through the same not-found path and are
indistinguishable in HTML and JSON. The published permalink keeps its existing
metadata, canonical URL, cache policy, API resource, and stable identifier.

## Focused evidence

Focused server-rendered coverage proves zero, one, many, and all-kind states;
body-before-title note order; repeated source identity and time; moderate
article/announcement/link hierarchy; safe external destinations; neutral
unconfigured source identity; one meaningful untitled-note h1; native return
and JSON paths; draft/unknown parity; deterministic ordering; and absence of
private profile-row, draft, owner-setting, authentication, and credential
canaries.

Source contracts pin the 732-pixel padded container/700-pixel content measure,
40-pixel repeated tile, 44-pixel identity, time, title, destination, return, and
technical targets, anywhere wrapping, ordinary note scale, moderate title
scale, reduced-motion and forced-color behavior, and the standard
visually-hidden class. The complete TASK-156 rendered viewport and assistive
technology matrix remains a separate integration proof; source assertions here
do not claim browser geometry.

## Preserved boundaries

The owner workspace retains its markup, behavior, and owner-scoped typography.
Its shared `entry-meta`, action, form, and heading classes retain their existing
rules and behavior. There is no query, persistence, schema, migration, public
API, protocol, metadata, canonical, cache, CSP, authentication, authorization,
privacy, runtime-setting, package, or network change.

No Hub, sibling repository, Site, hosted data, protected setting, access, DNS,
domain, deployment, `main`, PLAN, or CHANGELOG operation is part of this task.
The candidate is based on the exact accepted prerequisite commit
`074ea5343c41fa5e25658fe67fa827f204311907`; the owner-reviewable feature commit
and complete gate results are recorded in the task handoff.
