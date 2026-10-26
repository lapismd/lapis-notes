# Shared native Search observer source intake

Working in isolated Notes workspace `native-search-observer-20261026`, this
source intake combines qualified native indexing/Search source `19cd103a` and
daily Task observations `20263848`. Rust Search selection, authority, rebuild
and generated DTOs belong to the separate root lane. Both application defaults
remain unchanged.

## Contract

`App.backgroundIndexing` exposes the one observer/declaration session already
owned by MetadataCache. It does not construct a second session or scheduler.
The host still supplies `VaultSession.backgroundIndexing`; its absence retains
standalone browser behavior. Search receives generated provider identities,
versions, priorities and chunk settings, never callbacks or source bodies.
Selected-service failure remains fatal to that operation, without a JavaScript
writer fallback.

Search refresh and status share the existing progress observer. A pass with
pending convergence is not ready. MetadataCache disposal detaches every shared
observer and makes later plugin unload passive. Explicit plugin disable is the
separate native Search drain; an uncertain selection response cannot prevent
that distinct disable request. No selection is replayed.

## Before and after evidence

The real-App exact target is
`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-search-observer.test.ts`.
At `4715b3b8`, it has one pass and one failure: standalone absence passes, while
the explicitly selected App has no public observer. Worker
`lapis-native-search-observer-exact-be029ab1` records that baseline. The minimal
shared getter retry at `0239132d` passes 2/2; all seven initial declaration,
disable, passive detach, failure and progress cases pass at `b9c53af8`.

The uncertainty-disable and pending-progress regressions at `ae3cac7b` have
seven passes and two failures; both pass with the complete 9/9 target at
`ce141082` (`lapis-native-search-observer-exact-7c957db8`). The failed-status
progress case at `46a61885` has nine passes and one failure: it briefly
announces Search ready before throwing. Preserving the native error in the
shared progress report passes 10/10 at `7804938e`, worker
`lapis-native-search-observer-exact-8394cedf`.

Initial API owner qualification at `7101cd6e`, worker
`lapis-native-search-observer-api-owner-6d87a474`, passes all 21 focused tests,
the API/UI build, publint and packed public declarations. Strict API checking
then fails once because generated indexing DTOs import `SearchChunkingSettings`
without a generated database facade export. The root source generator owns
that repair; no adapter shim or manual generated-type change is used.

With the root-owned generated facade repaired, owner worker
`lapis-native-search-observer-api-owner-0af99c45` at `c7786ebb` passes 22/22
focused tests, UI/API builds and publint, packed public declarations, strict
API checks with zero errors/warnings, all 1,612 API tests across 151 files,
App ownership and structural specification validation. Its public API archive
has SHA-256 `ae589c0d13e7f0eec47e67d62b5dbf95908ed82ff6ec0ec9d1cefac3a686e35e`.
Generated indexing/database DTO checksums are respectively
`d22d2b749cecfdbd06deee928a7ee82a415e18d04d6a94a3185cac2d8756f777` and
`203441fbb05e1d3d8767a04e8cfac4278513f93b3fd2af929e930f22a78b740a`.

The public archive supports isolated Search adapter acceptance. That owner
qualification is separate from the coherent complete Notes gate below and does
not itself qualify either application's selection or default cutover.

## Coherent source intake

The observer branch now integrates qualified core `19cd103a` and qualified
daily Task observation source `20263848` as separate parents. The latter's
native daily/task implementation remains byte-identical to its qualified
source. API runtime/product bytes remain identical to owner snapshot `c7786ebb`;
only three already-qualified native-daily reference test fixtures arrive from
the new core base. Generated DTOs are inherited directly from that qualified
core. The latest root master ledger is preserved pending serialized refresh.

Documentation conflicts retain both native Search and combined daily Task
observation contracts. The first coherent full attempt, worker
`lapis-native-search-observer-full-131b2f51` at `f1f0c80d`, passes all 22 exact
cases and API/UI build/public declarations, then stops in `pnpm check:all`:
`SPEC-FILE-LINES LN-GOV-048` reports the merged Rust architecture chapter at
404 physical lines. Reflowing only its merged introduction preserves every
contract and brings the chapter to exactly 400 lines. No product code changes
or validator exemption is involved.

Complete retry `lapis-native-search-observer-full-1860da7c` at frozen coherent
snapshot `126b38a162bcec3023b9ae45802100505455fc4f` passes:

- The exact observer/background target, 22/22 cases.
- All 20 strict/check tasks, including public declaration and App ownership
  checks; strict Svelte lanes report zero errors/warnings.
- All 461 Rust tests and 2,277 package tests; one existing Deno test remains
  skipped. The API contributes 1,613 cases across 152 files.
- All 11 production builds, including retained Web and frozen Deno bundles.
- The complete cold Storybook interaction/accessibility lane, 261/261 cases
  across 59 files in four fresh shards (93, 71, 42 and 55 cases).
- Static Storybook with every one of the 182 specification chapters rendered.
- Final `pnpm spec:check`, including protocol drift, specification-first,
  source ownership and all 78 governance tests.

Its checksummed source receipt records both qualified parents, exact native
sibling revisions and the isolated ten-archive package overlay. Committed npm
manifests and lockfiles remain unchanged. The master progress ledger is restored
from root checkpoint `dc84f6a1` before serialized final documentation closure.

The initial generated Search command contract was copied verbatim from root's
source-owned output after its five command, three authority and two protocol
cases passed in receipt `39d3d22a-d58f-4658-b868-6524c6f12882`. This is an
implementation prerequisite, not final cross-package consumer qualification.

Qualification uses isolated four-CPU/12-GiB slot4 Docker workers and new scope
caches, never root's mutable caches. The complete coherent Notes source gate
above qualifies this observer with the merged native source. Owning Search
adapter acceptance, actual host adoption and default cutover remain separate
gates. No package is published and no visual baseline is approved.
