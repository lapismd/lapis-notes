# Guarded native default daily-document IO

Status: guarded native default daily-document IO source qualified.
Last updated: 2026-10-26T01:23:31Z.
Migration task: R3.2.1.2.10.3. Requirements: LN-CORE-003/005/006.
Base: `220b5cd79d53dbb0d194be6d6a6842d85d3479ae`.

This follows the separately qualified API reference/native policy. It adds
explicit admitted Work lookup and ensure operations for the default provider;
it does not select either host or install provider-owner configuration.

Acceptance covers non-creating reads, exact canonical creation, former paths
after configuration changes, occupied and duplicate dates, dirty missing-file
claims, hidden/symlink admission, current-byte/inventory races, same-target
contention, no-op mtime/version retention, replaced roots and accepted close
drain after detach. Native snapshot reads reuse the existing manifest and
qualified Markdown parser; creation reuses the existing missing-file writer.

Combined daily observation processing, ordered Task advancement, retained
partial outcomes, cold recovery and existing-owner tracked-today work remain
separate acceptance steps in [the coordination record](2026-10-26-native-task-coordination.md).

## Exact regression and implementation

Before implementation, `pnpm validation:rust -- test -p lapis-app-core --test
service_daily_documents --locked` fails in receipt
`9f6ddc1f-5444-4a8b-b079-804f8aacfea8`. Compilation reaches the intended
missing native error/lookup/ensure boundary and reports five diagnostics; it
never runs the ten authored tests. No frozen fixture or dependency is changed.

The exact command after implementation passes all ten cases, zero failures, in
`f0f5e136-06f6-4094-b506-bbdc5e03e028`, source `f72f1d28`. New operations reuse
the admitted vault manifest, existing current-byte reader, physical-root
capability, dirty/alias guards and missing-file writer. Canonical existing
notes return exact source bytes without rewriting mtime or version; a missing
target is created only after inventory and current-byte revalidation. Parent
creation uses the existing root-safe directory mechanism and syncs directories.
Hidden/symlinked notes never gain authority, and target names excluded from the
native manifest are refused before mkdir. The complete retained Markdown
snapshot is bounded to 32 MiB. Accepted Work retains close/drain semantics.

Three internal acceptance cases additionally inject changed same-size/same-mtime
bytes, a new canonical file and a new dirty-editor claim between preparation
and publication. Their exact command is `pnpm validation:rust -- test -p
lapis-app-core services::daily::tests --locked`. All three pass in receipt `cfc1731a-8801-4e2c-8208-39fb729a9354`, zero
failures. The other integration targets are filtered in that focused command.

## Complete source gates

`pnpm check:all` passes in receipt
`1839c334-211c-4241-a787-3e66edd4b1ca`, finished 2026-10-26T01:21:39Z.
The exact product snapshot is `bb14be7267869c0db6b46a2a7742e27e7a9c6840`,
parent `220b5cd7`. It passes Rust architecture/protocol checks, formatting and
strict workspace/all-targets Clippy; all 422 Rust cases pass with six existing
ignored cases and zero failures. All 20 package check tasks, 20 package test
tasks and 11 production build tasks pass through unchanged-input Turbo cache
reuse. Both native workspace build and protocol/type lanes pass.

Cargo/pnpm locks, native source pins, production TypeScript and the frozen
provider/source fixtures are unchanged by this slice. Validation uses the same
explicit temporary Docker archive cohort as the preceding policy source gate;
this does not qualify publication, package intake or either application host.
Final `pnpm spec:check` passes in receipt
`933a1364-ea7a-46fc-a0cb-76922df62ce2`, including canonical validation,
mdBook, protected-source spec-first, ownership/query checks and all 78 governance
regressions. Only evidence/activity/ledger text differs from the complete
check/test/build product snapshot. The frozen daily-provider artifact remains
`f14ddc03d15d7e31903109ec7933a25dceef4f524dbf3fdc7f126d26c3d020ff`.

## Gate review

This physical source slice is qualified and ready for application integration.
R3.2.1.2.10.3 remains Working: daily observation processing, original Task
preflight, ordered Task persistence, explicit partial outcomes, durable/cold
recovery, tracked-today work on the existing owner, and both host selections
remain separate gates. Native-only default IO does not select provider-owner
configuration or expose renderer/HTTP request authority. No app default,
Storybook presentation, Deno code, visual baseline, publication or deployment
changes.
