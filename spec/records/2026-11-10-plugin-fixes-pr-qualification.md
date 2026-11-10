# Plugin fixes PR qualification on current main

The startup/install and native AI repairs are reconciled with Notes main
`78831306cd9ff93bef4b729297d4885e4940a8c6`. The PR preserves newer API/workspace
versions, dependency automation, the production PWA and the private App Profile.
It excludes the older unmerged shared-session/export migration from the
original qualification branch.

The API reuses the paged identity inventory, excludes only installed-plugin
assets from content discovery/watch reconciliation, and diagnoses the eager
ESM import graph. Plugin installs share an App-owned FIFO with separate
progress and cancellation, while other plugin rows remain actionable.

The current Web workspace owns runtime registration: a supplied native Chat
host is optional and default enabled only for `rust-server`. The same default
regression changes from one failure to two passing host-policy cases. Re-enable
creates a fresh native Chat feature session and preserves the retired fence.
Passive startup Retry prepares detach before plugin retirement; its regression
fails with feature-disable semantics and passes after repair. The real plugin
lifecycle test also proves detach followed by a later explicit disable retains
the respective native leave reasons.

Fresh locked installation and source verification pass:

- 141 focused API cases, seven install-controller cases, three Web startup/AI
  policy cases, and the App Profile activation case pass.
- Root check passes all 16 tasks; root tests pass all 16 tasks (2,093 package
  cases, including unchanged cached suites); build passes nine tasks.
- Canonical specification/67 governance regressions and ownership checks pass.
- All 275 cold interaction/accessibility cases pass across four fresh shards.

Only package changesets are added; no public package is published by this PR.
The existing Notes main workflow automatically validates and deploys the PWA to
`app.lapis.md`. That deployment effect is separate from explicit npm publication.
