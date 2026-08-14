# Contributing and feedback

AittaSocial is an agentic coding project. Before suggesting work, please read
the [README](README.md), [AGENTS.md](AGENTS.md), and the relevant documents in
`docs/`. The repository's product boundaries, accepted plan, security model,
and accessibility requirements are part of the contribution context.

## What feedback is most useful?

“What feedback do you most want: vision clarity, landing-page messaging, technical architecture, source code, or potential contributors?”

The most useful feedback is currently vision clarity, landing-page messaging,
and potential contributors (for ideas):

- vision clarity;
- landing-page messaging; and
- potential contributors, for ideas about who the project should serve or what
  outcomes it should support.

Please describe the desired outcome, user need, or idea in a
[GitHub Issue](https://github.com/aittadb/aitta-social/issues). Include the
relevant product context, documentation or security concern, and accessibility
impact when applicable. A proposed change must still be accepted into
`PLAN.md` before implementation; the plan is the authority for current work.

## Source-code changes

The maintainer is not seeking source-code contributors or third-party pull
requests for this agentic coding workflow. Internal AI tools make implementing
changes faster and easier than reviewing and integrating external pull
requests, while the maintainer retains responsibility for product direction,
security, privacy, accessibility, and release decisions.

That is not a request to withhold useful technical observations: describe the
problem, desired behavior, constraints, evidence, and risks in an Issue. The
maintainer can then decide whether to accept the outcome and have it implemented
within the repository's documented workflow.

Later, we plan to use our own Aitta for discussing ideas. That capability does not exist today.

## Checks and boundaries

Documentation changes should preserve the product terminology and avoid
claiming unimplemented Aitta Network, Hub, member, or app capabilities. Run the
repository checks relevant to the change, at minimum:

```text
npm run agents:check
npm run plan:check
npm run validate
```

Do not include credentials, private hosting details, owner identity, or private
checkpoint data. Do not weaken authentication, authorization, privacy, security,
or accessibility boundaries to demonstrate an idea. Do not modify hosted Sites,
production data, DNS, custom domains, or sibling repositories as part of a
documentation proposal.
