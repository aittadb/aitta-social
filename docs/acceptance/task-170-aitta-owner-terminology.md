# TASK-170 Aitta owner terminology acceptance

TASK-170 completes the bounded owner-shell and owner-home terminology change.
It replaces only human-facing application references to “presence” owned by
those states with **Aitta**. `Identity` and `profile` remain the terms for
outward presentation, and Draft/Published/update wording is unchanged.

## Source outcome

- The private shell’s public destination is `View Aitta`; non-owner access says
  `This Aitta is not yours to administer` and returns to the public Aitta.
- Owner Home names `Your Aitta` and its `Aitta summary`. Its draft, published,
  and public-preview guidance now refers to this/public Aitta.
- No route, action, internal identifier, authorization path, D1 query,
  readiness derivation, count, profile form, composer, lifecycle or deletion
  behavior changed. In particular, the owner check still precedes every D1
  read on safe access states.

## Automated and local-browser evidence

Focused Worker-backed regression coverage exercises fresh and incomplete
Identity, complete empty/draft/published/many-update journeys, owner shell
navigation, non-owner and missing-owner safe states, and private-canary
exclusion. It asserts the revised Aitta labels while preserving existing
Identity, update-state, destination, count, and authorization behavior.

The rendered matrix used only the exact compiled Worker from commit
`3571ba17d5e3e81e517f782a9dc43edeeb1784a4` (parent
`f25b5a566b29a6a8b83e65de2bb016ef757397d6`), separate disposable local D1
fixtures, and synthetic owner/non-owner request headers. The compiled server
entry was SHA-256
`b74982c7c71ec62648deabef9955a1cf0cb3049f57de2b35a6f7543188e8cef1`.
Its served CSS was `/_next/static/css/index.DNMW_nIF.css`, 38,942 bytes,
SHA-256 `5b977280c20741e46781c06e9086b672b6b4235ee487b8fe2faf4102b7a84a34`.
No Site, hosted D1, hosting configuration, access setting, domain, or other
external state was read or changed.

| Local state | 320 CSS pixels | 390 CSS pixels | 1440 CSS pixels |
| --- | --- | --- | --- |
| Fresh owner | `Complete your identity`; `Your Aitta`, `Aitta summary`, and `View Aitta`; 305/305 client/scroll width | Same labels; 375/375 | Same labels; 1425/1425 |
| Incomplete owner | `Finish your identity`; same Aitta labels; 305/305 | Same labels; 375/375 | Same labels; 1425/1425 |
| Complete empty, draft, published, and many | `TASK-170 Complete Aitta`; same Aitta labels; 305/305 | Same labels; 375/375 | Same labels; 1425/1425 |
| Non-owner | `This Aitta is not yours to administer`; no entry actions; 320/320 | Same safe state; 390/390 | Same safe state; 1440/1440 |
| Missing owner | `Administration is safely disabled`; no entry actions; 320/320 | Same safe state; 390/390 | Same safe state; 1440/1440 |
| Anonymous unconfigured root | `Set up your own Aitta`; 320/320 | Same setup state; 390/390 | Same setup state; 1440/1440 |

Every row had no horizontal overflow or off-screen interactive control, with a
minimum interactive height of 44 CSS pixels. The many-update row contained 12
mixed Draft/Published entries and 63 controls at every tested width; its action
text remained exactly `Edit`/`Publish`/`Delete` for drafts and
`Edit`/`Permalink`/`Unpublish`/`Delete` for published updates. This confirms
the terminology change did not alter lifecycle controls or meanings.

Fresh and incomplete are distinct unconfigured-owner readiness states; the
anonymous root setup row is separately unconfigured. Authorized owner rows
contained no whole-word `presence` and no synthetic actor or private canary.
Non-owner and missing-owner rows contained no whole-word `presence`, entry
actions, private draft canary, or protected actor canary.

At DPR 4, the many-update review reported an inner 320-CSS-pixel / 1,280-
physical-pixel viewport, a 305/305 client/scroll width, 63 controls, a 44-pixel
minimum target, zero off-screen controls, and `Your Aitta`. With forced colors
and reduced motion both emulated at 320 pixels, both media queries matched and
the same width held. Direct native keyboard focus reached Publish for the long
update 11 row with a solid three-pixel outline and three-pixel offset; this is
not a claim of a complete sequential-Tab traversal.

With CDP touch emulation, a CUA pointer click at 320 pixels used the native
77.95-by-44 Identity target and navigated to `/owner/profile`; a separate
pointer click used the 65.27-by-44 View Aitta target and reached the fixture's
public root. The local proxy retained synthetic owner context through native
Referer navigation. CDP Log/Runtime console and exception capture remained
empty after reload and navigation.

## Boundaries

This task adds no schema or migration, API or protocol change, configuration,
public-frame change, hosted action, or external mutation. Internal `presence`
identifiers and terminology outside the specified owner shell, owner access,
and owner home surfaces remain intentionally untouched.
