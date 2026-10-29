# Explicit native hosted delivery source

This isolated R7.3 lane starts on main `7fbc935c`, preserving the completed
skill/participant union and all 127 master task IDs. R5/R6 remain Deferred.
Ordinary build/start/container/CI paths remain on the retained serving baseline
until native static delivery and the coordinated cutover pass.

## Reproduction and source changes

`node --test scripts/server-runtime.test.mjs` initially reports zero pass/one
missing-module failure: no explicit native runtime launcher existed. The new
script builds the Rust release executable and existing Web renderer with native
metadata/History/Tasks together. It removes stale profile certification before
building and writes a public, credential-free certificate only on success.

Startup validates the certificate, native executable, renderer index and explicit
operator config/data settings before spawning only the native executable. It
retains provider/authentication environment and propagates exit/shutdown.
The pnpm wrapper is development tooling, not a deployed Node application server.

The first implementation has four passes/one failure because macOS `/var` fixture
paths canonicalize to `/private/var`. Canonicalizing the fixture root fixes that
independent path oracle; exact five cases then pass. Real fixture processes prove
exit 19 and SIGTERM forwarding with exit 23. Native/bootstrap authority and
persisted data stay outside the private test fixture.

Adding the test entrypoint first exposes a separate zero-pass/one-failure bounded
routing assertion. The new entrypoint now uses the existing Docker/Turbo route
and declares its uncached root task; that exact regression passes unchanged.
Combined local focused checks pass six cases. Scripts stay within 300 production
and 500 test lines; no public npm dependency, lock or application source changes.

## Pending qualification

A frozen Docker packet will run exact/private delivery and routing, complete
release tooling, the real native release/Web build and canonical/progress/format
gates on the selected six native pins and 16 qualified public archives. Static
HTTP delivery, real native startup, container delivery, cross-host acceptance and
ordinary default replacement retain separate R7 gates. No passing build is
inferred from private executor-fixture tests.

The first frozen packet `dfcc6c04` / `87f68552` stops before product tests on
`SPEC-FIRST-MISSING LN-GOV-003`: generated Storybook sidebar navigation needs
its mapped catalog chapter. The chapter now documents the metadata-only native
delivery mirror. The original failed aggregate remains retained; no product or
release-build success is claimed from it. An earlier unfired packet `29e6d59a`
had stale generated progress after local dependency resolution failed; it was
never dispatched. The owning main generator then regenerated the isolated
ledger through its explicit root API without changing tooling or dependencies.

## Cutover-first integration order

The user now explicitly prioritizes landing focused source slices, merging this
migration's temporary workspaces into each owning main and running final broad
validation on the final landed cohort. Focused regressions remain required;
unrun broad gates stay pending, never passing. After cutover and final validation,
retain source/evidence and remove only integrated migration workspaces. Commits
use signing disabled as requested.

Frozen `5295c40f` / `cbcc2ccb` passes delivery5 and routing1 before complete
release tooling reports98pass/3fail. One stale workflow assertion still assumes
a scalar standalone testIgnore despite the current Node/Rust exclusion array.
It now asserts both actual exclusions. Two actual unsafe-Git guards expose a
private install defect: package-level archive overrides shadow the workspace
security policy, selecting simple-git3.36 instead of the tracked4.0.1 override.
The guards remain unchanged. The shared worker projection now captures pnpm's
effective overrides before adding archive identities, retains untouched source
metadata and rejects malformed policy. Exact new projection suite improves
missing-module0/1 to3/0; delivery/routing/projection totals9pass locally.
The final landed-worker run must prove the original two real Git guards and
complete validation infrastructure with that corrected dependency resolution.
