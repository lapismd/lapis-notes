# R2 and R3 live delivery status

Updated 2026-10-25 22:33:52 UTC. This supporting checkpoint changes no product source, API,
default or completion gate.

## R2: functionality qualified; combined intake remains

Native execution, service-owned conversations, typed HTTP/Tauri transports and
both existing chat screens are qualified. Hosted and Desktop actual-provider
composer/detach/reload/cold History journeys are committed; Desktop recovery is
`11e22c7f` with one native journal and unchanged complete transcript.

The combined Desktop dependency/catalog intake is still running. Its full test
run passes (498 governance/renderer, 744 AI and 240 native cases), as does the
renderer build; 79 exact tooling guards and final catalog shards 2 (452 cases) and
3 (536 cases) pass. Final shards 1/4, cold renderer/static builds, final
governance and the combined commit remain. The old immutable E-AI-109 formatting
exception remains explicitly accepted; no new functional failure is waived.
R2 and R2.3 stay Working until this intake and aggregate review close.

## R3: source and service ownership work remains

Native AppDatabase/Search engines, Markdown reconciliation and Tasks occurrence
publication are qualified. Complete Tasks parsing, recurrence, normalization,
structure, graph and index envelopes are qualified in Tasks `fcb2a8b5`.

Notes service integration now passes ten focused native cases, including the
repaired binary-target freshness case. Its final complete `check:all` run is in
progress after correcting two formatting findings; this is not a completed
source/host gate yet.

A separate lane has started private native Markdown Search ownership in
`native-search-owner-20261025`, reusing existing native engines and preserving
other providers. Complete provider parity and public/host selection remain.
History-index scheduling has not started. Tasks mutation/materialization,
Docs/supported custom processors and unattended writer adoption in both Tauri
and HTTP also remain. Renderer AI and existing indexing selections are unchanged.

The root tracker records these as active or waiting work; counts here are
qualified boundaries, not a claim that all R2/R3 tests or features are complete.

## Signed Bases consumer intake

Desktop `34909cfff41af6270660da97240f38762d117030` commits fresh
E-DEPENDENCY-003 for the repaired separately signed Bases bundle. The existing
actual native metadata/edit/watch/cold-restart case passes with exact signed
source and installed payloads; no product/helper code changes were necessary.
All four documentation specification lanes, final record/progress and changed
formatting pass. Combined UI intake and distribution remain separate.

## Tracker validation

The first attempted tracker-test command used the wrong path
`scripts/migration-progress.test.mjs` and found no file; it ran no tests.
The actual target `scripts/spec-validation/migration-progress.test.mjs` passes
all eleven tests with zero failures.
Generated progress and all eleven canonical validators pass.
