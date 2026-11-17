# Retired shared-AI catalog consumer

This source slice removes Notes' duplicate shared-AI stories, hidden shared-panel
constructors and persisted fixture settings, workspace demo registration, manual
controller attach bridge, root development dependencies, optimizer/cache inputs
and local plugin-archive requirement. Fourteen AI story files and the AI-only
structure state-matrix audit are retired with their implementation. Surviving
shell geometry, App ownership, inventory, placement and interaction assertions
remain; structure-audit regressions use retained Bases and Graph fixtures.

The root controller-only dependency-security suite is removed with its caller.
The separate PWA security tests remain. App Profile native chat and API
`@lapismd/ai-host/file-tools` are unchanged. The frozen desktop still declares its
controller contract and remains deferred to the host slice. No user data,
installed package, native runtime, standalone controller or public API is changed.

LN-CAT-123 enforces source, catalog, dependency and attach-input absence in the
normal and canonical checks and existing retired-tooling CI lane. Nineteen
catalog-only requirements and their old evidence are retained outside current
authority in `spec/archive/2026-11-17-shared-ai-catalog-before-removal.md`.
The remaining AI integration/data requirements need a caller-aware ownership
audit; old shared-controller evidence does not qualify native behavior.

## Regression and qualification history

- The absence regression initially had 1 failure and 1 pass; after removal,
  both cases pass. Combined source/tooling/routing/structure target: 25 passed.
- Cold History and Workspace target initially had 12 passes and 1 stale
  `Open Chat` assertion. It now asserts retired chat is absent while retaining
  the surviving shell assertions. The exact cold rerun passed all 13 cases in
  run `0d24619b-1430-45a7-a117-a45f09f535b9`; initial failure is retained in
  `653a2f66-7950-421f-b038-39e824f1d61b`.
- Before current-main version intake, the committed-source `ci:release` passed
  in `2062444b-5407-4ca9-9f1a-f638311e27a5`, including package checks/tests/builds,
  static Storybook and the development Specification Docs lane. The packing lane
  found no unpublished versions and selected no tarballs; this is not a new
  packed-package or publication receipt.
- That source also passed ordinary `check`, including all root audits and
  16 package tasks, in `2034d129-0083-4078-b468-ce85059ab315`.
- A forced full interaction invocation passed 178 cases before an unhandled
  browser transport closure (`birpc`/WebSocket), so it was incomplete. Passing
  `--force` selects the runner's explicit-argument path rather than its default
  four shards. No harness or assertion was weakened. The ordinary complete cold
  lane subsequently passed 239 cases across all 57 files and four shards in
  `981f3a29-a895-4ab1-a77f-fa4e1efe4b2f` (96 + 49 + 41 + 53).

## Current main and lock intake

The source was rebased onto launcher landing
`14d3138cb0f3c1d10996be650530376e4fbb877a`, preserving API 0.6.8, UI 0.2.3,
Workspace 0.4.8, their peers/changelogs, generated host schema and concurrent
canonical evidence. No incoming runtime implementation was discarded.

Rebased run `15ffa511-ec2e-4f29-b6eb-9699d47b06e9` passed all 27 package
check/test/build tasks, 196 release-tooling cases and 68 spec regressions.
There were 2,194 unique package tests: UI 17, Explorer 39, Language 18, API
1,832, Host Services 9, Workspace 44, App Profile 106, Deno Host Services 90
and Web 39. Deno's 90 cases repeat in its check/build tasks and are counted once.
Packaging then correctly stopped at the non-empty-JJ-working-copy guard.
The earlier uncommitted-source run also stopped at that guard; neither failure
is reported as a passing release lane.

Inspection of the retained failed container's JJ objects identified only a
generated `deno.lock` change. Its generated lock is now included: no npm versions
are added, 60 unreachable versions disappear, four references become unambiguous
and workspace metadata follows the existing root manifest changes. The frozen
desktop's own controller declarations are unchanged. This root-lock pruning is
not the later Deno host removal. The pnpm lock changes only the root importer,
removes 40 unreachable versions and adds no versions or overrides.

The committed-lock `ci:release` passed in
`928dda70-61d5-489b-b159-8f4a400dea1d`, including packing UI 0.2.3, API 0.6.8
and Workspace 0.4.8. Their tarball manifests were independently inspected and
contain no shared-AI dependency. Normal `check` passed all root audits and
16 package tasks in `a7b70d57-9dc7-4292-81e0-c232f2c0f700`.
The cold current-main interaction lane passed all 239 cases across 57 files in
`3dda40c5-9d74-4e6b-a765-9ae4bbeb09eb`. That runtime snapshot differs from the
final source only in the generated Deno lock and subsequent evidence documents.

Specification Docs separately passed 5 static and 7 development cases. The
pre-existing Forward-history quarantine remains skipped in both modes, and two
watcher-only cases are skipped for static output. No skip was added or changed.
[Exact invocation/source receipts and three packed-artifact hashes](2026-11-17-retired-ai-catalog-validation.json)
retain passing, incomplete and failed attempts separately. These checks qualify
source and package artifacts, not publication or native AI/data acceptance.

## Limits and next boundary

Existing API plugin-manager tests reject a colliding external package before its
evaluation while preserving the static owner, and cover optional-core Safe Mode.
Desktop owns the `ai` identity and reads saved disablement without writing it.
These observations do not complete actual native startup with an old external
AI installation, retained settings/conversations/memory, Safe Mode or cold
close/reopen acceptance. LD-PLUG-001 remains its host's product gate.

Host spec discovery initially lacked workspace dependencies. The provisioned
0.2.1 CLI was then used with a temporary module lookup path; doctor reported
the QMD native ABI mismatch and exact `LN-AI-001` search used the documented
text fallback. No loader, global installation or persistent configuration changed.
One extra host tooling invocation could not load `yaml`; the 25 dependency-free
source cases passed, and the owning cache tests pass in Docker's release lane.
Product qualification uses registry-only remote Docker throughout.

No visual baseline changed. Existing browser-CI quarantine is unchanged; local
cold interaction qualification is separate evidence. Registry signing,
deployment, npm deprecation and native/data acceptance remain separate gates.
The terminal migration remains the final removal after other changes land.
