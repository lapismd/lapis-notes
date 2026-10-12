# Static registry host qualification

Community's application remains parked. Desktop and Web ship Source Editor,
Markdown, File Explorer and Search as their four optional defaults. The shared
Community schema library remains a registry dependency. Nostr publication and
relay acceptance remain deferred.

## Source repairs

The API exports explicit CodeMirror and versioned Svelte renderer contracts.
Web and desktop generate their plugin import maps from the same canonical host
module catalogue. Development Svelte resolves to exactly 5.56.10 throughout the
Notes workspace so shared Design Core classes retain one identity.

The Web asset server waits for service-worker control after mirroring verified
plugin bytes. Its exact delayed-controller regression changes from one failure
to one pass. Four asset-server tests cover readiness, bounded failure, and
listener and timer cleanup. Cold installed Bases proves queries, frontmatter
editing, and document restoration after a full PWA reload.

Spellcheck warmup initially returned empty diagnostics without refreshing an
already-open note. Registered providers can now invalidate their matching
diagnostics. Editors subscribe through their owning manager, dispatch a private
CodeMirror refresh effect, and dispose the subscription with the view. A manager
regression and real unchanged-document editor regression pass; the manager
family has 13 passing tests. The signed installed Spellcheck Web scenario passes
without changing its diagnostic or WASM response assertions.

Packaged desktop acceptance needed complete installed-plugin fixture metadata
and atomic report publication. The atomic-report regression changes from one
failure to one pass. The subsequent packaged run exposed an incorrect array
assumption for the controller's `tools.list` response. Acceptance now derives
that response type from the public controller contract and checks availability
and definitions before confirming the registered tool. The exact cold packaged
smoke passes with all four default-plugin assertions intact.

The installed Markdown Lint probe then exposed a missing Web transport header.
Chromium rejected its cached module worker with
`coep-frame-resource-needs-coep-header`. Verified cached assets now retain
`Cross-Origin-Embedder-Policy: require-corp` and
`Cross-Origin-Resource-Policy: same-origin`. The cached-response regression and
cold signed installed-worker regression each change from one failure to one
pass. Diagnostics and provider timeouts remain unchanged.

Native proxy responses now remove stale content encoding and length headers
when Fetch has decoded the upstream body, retaining headers for raw responses.
The exact decoded-body regression changes from one failure to one pass and the
header family passes five tests. Native range-read errors recover serialized
filesystem codes without replacing error identity. Startup identity scans treat
a path removed while opening or streaming as a deletion while preserving
unexpected failures. Four missing-path and lost-code regressions change from
failure to pass; the complete filesystem/sync family passes 37 tests.

The public metadata fingerprint accepts an optional file predicate. Two API
regressions verify selected parser/input invalidation, excluded-file stability
and unchanged full default semantics; the metadata-cache family passes 31 tests.
Search uses that contract to rebuild after metadata removes its derived rows,
while retaining checkpoints for files without Search providers. Both Search
regressions and the exact previously failing native Search lifecycle pass.

## Verification

- Notes package qualification: all 30 build, check and test tasks pass, including
  815 API tests, eight App Profile tests and 55 Web tests.
- Desktop's later complete package run: 204 tests pass and one existing test
  remains skipped; its type checks and renderer build pass.
- Root `pnpm check`: all 18 tasks pass, including specification and source audits.
- Full Notes Storybook: 212 interaction and accessibility scenarios pass across
  four shards: 62, 58, 40 and 52.
- Cold Web acceptance: all nine scenarios pass, including installed Bases and
  Spellcheck, OPFS reload, secondary-tab database ownership and Search.
- Server acceptance: one scenario passes against a fresh current-source image,
  exercising editing, sharing events and a container restart. Its local image
  digest is `b4ea2befbd35ae49cf8e86cb9c21ce10cf0ede1c03956f1add7457fa3db50800`.
- Cold packaged desktop: one smoke passes, including native services, verified
  plugin assets, controller tool registration, application activation and
  renderer-coordinated clean shutdown.

An earlier heavily concurrent package run hit an unchanged five-second Turso
timeout. Its exact target passed in a fresh process. The complete rerun uses four
Vitest workers; no timeout or assertion was weakened.

The acceptance Web build requires Vite's explicit `registry-acceptance` mode.
Production and server modes deliberately ignore ephemeral fixture trust.

## Publication boundary and remaining work

Development acceptance uses ignored, digest-pinned public framework tarballs.
Portable manifests and lockfiles retain registry coordinates. A wider installed
plugin probe exposed the older released language-service package's inline
worker; the owning Notes 0.1.1 source already has the emitted module-worker
repair. The published 0.1.1 npm tarball was inspected and has that same module-worker
constructor. Plugins now require at least that released version rather than
relying on a temporary language-service tarball.

The Web matrix passes all nine optional plugins through installation, defining
behavior, disable, re-enable, persisted reload, uninstall and another reload.
The three bundled Plugins packages pass defining behavior and disable/re-enable
persistence across reload. These Web probes verify all 12 active Plugins packages;
File Explorer remains the fourth Notes-owned default. The bundled probe waits
for the documented debounced core-plugin state write before reloading.

Native qualification now passes all 12 active Plugins packages. The nine
optional plugins each pass installation, behavior, disable/re-enable, reload
and uninstall. Source Editor, Markdown and Search pass behavior and disabled
and enabled persistence across reload. The fresh combined native scenario
installs all nine optional plugins, exercises them together before and after
reload, then uninstalls them and reloads cleanly. Every native probe reports
zero page errors. Community remains absent.

Earlier HMR loader, renderer startup, CEF SIGTRAP and packaged readiness attempts
are retained as failed diagnostics. The current non-HMR renderer reaches
readiness, the complete combined native scenario passes, and the freshly built
ad-hoc-signed WebKit package passes its original smoke assertions. No timeout
or result assertion was loosened; notarization remains outside this local lane.

Final portable prerequisite versions and production release candidates remain
separate gates. Exploratory
fixture signatures do not authorize publication. No production npm publication,
registry deployment, Nostr publication or visual-baseline update has occurred.
