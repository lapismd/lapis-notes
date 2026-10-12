# Desktop registry presentation and cold startup

This slice keeps Community and Nostr discovery parked. The plugin detail panel
uses the Community presentation as a reference without importing Community.

## Changes

- Screenshot previews use a horizontal carousel instead of stacked full images.
  Banner, logo, overview image, gallery, and metadata have distinct placements.
  The viewer contains large images, uses shared Light/Dark/Split controls, supports
  keyboard navigation, and restores focus to its opener. Author identity shares
  one row and failed avatars fall back to initials.
- The desktop maps its full 65px native-controls clearance into Design Core's
  maximized-group overlay token. Native traffic lights select the visible
  transparent-titlebar window and derive their position from the actual parent
  bounds to place their centre 20px below the window top. Load, resize, and focus
  restore alignment; teardown cancels delayed work.
- Settings section headings inherit the corrected Design Core weight of 700.
- The native database host queues requests until its worker installs its message
  handler and announces readiness. A 30-second readiness deadline reports failed
  startup. Shutdown and worker failure reject queued callers and ignore stale
  worker messages. This handshake is desktop-local; the shared server protocol
  remains unchanged. The native-worker smoke exercises the production host.

## Regression evidence

- Registry carousel regression: one failure before, one pass after. The author
  avatar fallback regression also changed from one failure to one pass.
- Native traffic-light parent-container scenarios: three failures before;
  traffic-light and host-style regression files passed 14 tests after the fix.
- Worker readiness regression: one failure before, one pass after. The complete
  worker-boundary file passed six tests, including close-before-ready, startup
  failure/retry, and readiness timeout. Four focused desktop files passed 21 tests.
- Affected UI stories passed 29/29; full Storybook interaction and accessibility
  shards passed 62 + 58 + 40 + 52 = 212/212. Static Storybook build passed.
- Native database source smoke passed. A newly compiled WebView application passed
  the full packaged cold-start smoke, including native database access, plugins,
  second-instance forwarding, controller tools, signature validation, and clean
  renderer-coordinated shutdown. Earlier new binaries stalled at database open;
  disabling traffic-light alignment did not repair that failure.

Logs and review screenshots are local under `.local/desktop-ui-evidence/`.
Final readiness qualification passed `TURBO_CONCURRENCY=1 pnpm build` (10/10
Turbo tasks), `TURBO_CONCURRENCY=1 pnpm check` (18/18), and
`TURBO_CONCURRENCY=1 pnpm test` (18/18). Desktop tests passed 216 with one
pre-existing skip; API passed 826, UI 13, workspace 2, language service 18,
File Explorer 28, host services 29, App Profile 6, server 28, and Web 55.
`pnpm spec:check` passed with 36 chapters and the mapped spec-first gate.

An initial concurrent check/test attempt timed out once in the API declaration
emission test and exposed missing API output in the language-service check.
The unchanged declaration test passed in isolation (1/1), the language-service
check passed after a serial build, and both full lanes passed serially.
The global pnpm launcher subsequently stalled before command execution; using
this repository's already installed pinned pnpm 10.34.5 completed qualification
without changing package-manager configuration or dependency versions.

A newly compiled CEF package also passed the full cold packaged smoke. The
previous secondary-instance SIGSEGV did not reproduce in that final run;
this evidence does not independently establish the cause of that earlier crash.

## Dependency and release boundaries

Design Core commit `bdcc7141` owns the bold-heading and maximized-overlay token
changes. This checkout temporarily consumes its verified local 0.3.1 tarball
(SHA256 `9fb593ab2488566da63ce144a53feae7f51cef33b23bccf2a93d4b241b02c232`)
through an ignored pnpm hook. Committed npm ranges remain portable. Publication
and subsequent consumer refresh are separate release steps.

Visual stories remain pending. Design Core's focused visual build succeeded,
but comparison failed while persisting its canonical build cache with EACCES.
No baselines were updated and no functional gate was waived.

The review preserves `.local/desktop-static-matrix/vault` and user data.
No publication, production signing, deployment, or release activation is
performed by this slice. The earlier release handoff remains applicable except
where newer source or live evidence explicitly supersedes it.

## Final local review

A second cold WebView packaged smoke passed after the serial rebuild. Together
with the CEF run, the final native qualification has three passing packaged
runs (two WebView and one CEF) and zero failures. The review renderer was then
rebuilt in registry-acceptance mode and launched with the preserved review vault.
The workspace opened without refreshing and reported zero Problems.

The final native UI shows the AI carousel, distinct banner and overview, bounded
previews, and linked author identity with an initials fallback. Traffic-light
centres align with the 40px toolbar. The detail screenshot is saved locally as
`registry-details-final.png`. Earlier native viewer inspection confirmed the
shared theme controls and image navigation; focused Storybook verifies all modes,
keyboard navigation, containment, and opener focus. Final native maximize/sidebar
and viewer replay remain visual-pending: the capture service failed once, and
subsequent automation actions were interrupted by changing window state. Existing
functional evidence remains valid; no visual baseline was approved.

The running review still displays `Controller exited before readiness` in the
AI panel. Packaged acceptance qualifies its separate controlled controller
fixture, not that existing live review-controller installation. The installed
registry currently lists nine optional bundles, with seven enabled; Markdown
Lint and Spell Check are disabled. Zero Problems therefore does not qualify the
earlier disabled Markdown Lint startup failure. Native HMR import resolution,
live controller readiness, framework/Design Core publication, portable registry
consumption, final plugin artifacts, production catalogue signing, and approved
registry deployment remain release follow-ups from the preceding handoff.
Community and relay discovery remain deferred, not release prerequisites.

Changed source and record files pass Prettier with the installed Svelte formatter.
The existing whole-table formatting drift in `verification.md` was reproduced
against the parent and retained to avoid unrelated table churn. Specification
validation passes after final documentation formatting.
