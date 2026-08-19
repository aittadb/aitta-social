# TASK-185 — Compiled-Worker response lifetimes

## Scope

This task changes only the affected compiled-Worker acceptance tests. It does
not change the Aitta application, Worker, schema, public contract, or runtime
configuration.

## Evidence

The affected upgrade-preservation, presentation-accent, and functional-matrix
tests now consume JSON and HTML response bodies immediately and explicitly
consume no-content or status-only responses before another Miniflare dispatch.
The response-lifetime guard is enabled with
`MINIFLARE_ASSERT_BODIES_CONSUMED=true`; a deferred Miniflare assertion would
fail if a dispatched response body were left unread at the next event-loop
turn.

Validation on the task branch recorded the following results:

- the guarded three-file suite: 10 passing tests;
- two additional guarded upgrade-preservation runs: one passing test each;
- `npm run db:generate`: no schema changes or migration drift;
- `npm run validate`: 211 passing tests, including build, type, lint, and
  repository boundary checks;
- `npm audit --omit=dev`: zero vulnerabilities; and
- `git diff --check`: clean.

These commands exercise the existing product assertions unchanged; this record
does not claim a product behavior change or hosted mutation.
