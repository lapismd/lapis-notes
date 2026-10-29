# Guarded hosted Repository restore — 2026-10-26

Status: **Complete**. R3.2.3.6.1; LN-CORE-023, LN-SRV-027, LN-WEB-072.

## Scope and reused authority

The Desktop audit uses its qualified `fa13c1ce` source. Its four-plugin base
profile does not import the optional database-only HistoryPlugin. Installed
legacy History still captures client file events and writes AppDatabase
revisions in both hosts. Native ownership of that optional plugin is additional
functionality and explicitly Deferred at R3.2.3.6.4; it is not a current Desktop
parity blocker. Native backup controls and original-source selection remain
mandatory Waiting children. The canonical remaining-History chapter and saved
implementation plan persist this distinction.

Core exposes a bounded typed command facade that borrows `Client::with_backup`;
`jj-vault` remains the sole checkpoint, preview, conditional-restore, safety
checkpoint and receipt engine. No capture scheduler, writer or query engine is
copied. Root/storage/source authority remains installation-owned. Existing dirty
and physical-root/file-order guards remain in the backup provider.

Authenticated HTTP reuses the admitted client and shared protocol/Origin/CSRF
middleware; its route accepts at most 16 KiB and rejects unknown DTO fields. It
rechecks client authority after awaiting an accepted operation. Retiring the
client fences delivery while the native operation completes. Native refusal
returns bounded conflict/recovery guidance without parsing human engine errors
or inferring whether publication ran.

The selected hosted RepositoryFactory provides the existing public RestoreService.
Its adapters preserve pending request IDs, validate previews and drain accepted
observation before client teardown. The existing public RestoreController and
file/vault review dialog own confirmation, persistence and explicit recovery.
Ordinary Node, Rust and standalone profiles retain their previous defaults.

## Exact regression checkpoints

- `pnpm rust:core -- test -p lapis-server --test http_files repository_restore`:
  before **0 pass/4 fail** (missing route), then **4 pass/0 fail**.
- `pnpm --filter @lapis-notes/web exec vitest run src/hosted/rust/repository.test.ts -t 'binds retained restore'`:
  before **1 fail** (missing service); the complete affected three-file adapter
  lane subsequently passes **13 cases**.
- `pnpm rust:core -- test -p lapis-app-core --test repository_restore`:
  **1 pass**, covering admitted restore, abandoned reply, detach, vault drain and
  explicit exact retry after cold reopen without overwriting newer saved bytes.
- Added deterministic server retirement test: one setup failure from a missing
  physical profile directory was corrected with a test-owned TempDir; latest
  exact run passes. It proves accepted mutation, post-await delivery refusal and
  retained receipt retry through the Host facade.

The first implementation run exposed one product failure: file SHA-256 length
was incorrectly imposed on native vault tree identity. Bounded hex identity
validation now delegates exact backend format to the existing engine. A separate
HTTP assertion initially expected 400 for unknown enum/DTO fields; it now asserts
the existing shared JsonRejection contract's 422 while lexical failures remain 400.
Strict Clippy's one collapsible-if finding was repaired without suppression.
The first broad check found the protocol export exceeded 300 counted lines;
the initial source split its schema declarations instead of relaxing the
boundary. Its one visibility/dead-code finding was also repaired without a lint
allowance. Main subsequently landed a database-generator split; after rebasing,
the temporary schema helper was removed and the final exporter adds only the
restore family. Neither refactor changes generated DTO semantics.

## Current coherent qualification

The source is rebased conflict-free onto `2e9ed95c`, retaining current
Tasks/API/reader source. Product qualification snapshot is
`92fb48c2acb0e20d64feda97b521775dba15a8a9`; formatter/generator outputs are
retained and all 24 changed product/config/protocol/runtime-test inputs match the qualified
worker outputs byte-for-byte. Final documentation closure remains separate.

| Lane             | Passed                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| Exact native     | 4 HTTP, 1 Core cancelled-waiter/cold-receipt, 1 Host retirement case           |
| Retained adapter | All 13 cases across three files                                                |
| Full native      | 543 Rust cases; 7 existing intentional ignores unchanged                       |
| Full packages    | 2,332 cases; 1 existing Deno skip unchanged                                    |
| Root checks      | Complete check/test/build, strict Clippy, public types and protocol generation |
| Cold catalog     | 261 interaction/accessibility cases across all four shards                     |
| Static output    | Complete catalog and each application build                                    |
| Actual browser   | 24: 2 History/restore, 1 metadata, 8 ordinary Rust, 1 Node, 12 standalone      |

Both retained browser journeys use the real Rust service. File/vault restore
uses the existing review dialog. The second journey completes a native apply,
deliberately loses its acknowledgement, persists the original pending intent,
cold-restarts the service/App, then explicitly retries that same request. The
native receipt is reused and newer saved files remain unchanged; no automatic
restore request is sent after recovery.

The final product run stopped on two `SPEC-FIRST-MISSING LN-GOV-003` findings:
the Web adapter needed its mapped package and plugin-profile chapter updates.
Those source-owned references are added without changing product inputs or
weakening the gate. The next closure exposes one governance assertion that
hard-coded the real ledger's old four-group set: 77 pass/1 fail. The first actual
Deferred task correctly adds the existing Deferred group; that exact expected
set is updated to include it, preserving strict equality, ordering, links and
synthetic empty-group assertions. This governance-only change runs its exact
case and all 78 regressions separately. Canonical closure passes all ten lanes and all 78 governance regressions. Final status refreshed 2026-10-26 14:44:39 UTC.

The worker uses the existing History cache family, 4 CPUs, 12 GiB and two
Cargo/Turbo jobs, with pinned native sources and current-r3's twelve verified
public archives. This is the same cohort as
[reader/current Tasks intake](2026-10-26-reader-current-intake.md): History
`0fa89766`, private SDK `94bae0ae`, Design Core `6f33` and Search `2e7f`. The owning
API source is built rather than overridden. No package is published.

The earlier frozen source `1185052e` passes 520 Rust and 2,319 package cases,
complete check/test/build and the original restore/browser journey. Its remaining
catalog work was stopped when coherent main landed; it is supporting evidence,
not a complete catalog or final qualification claim.

## Remaining scope

This closes the hosted/source restore slice only. Backup settings/passive status
and original repository selection remain Waiting; optional legacy database
capture ownership is Deferred. Combined both-host R3 acceptance, default cutover,
publication and distribution remain separate. Seven stopped owned validation
containers were removed after evidence collection; shared caches, images and
other jobs were preserved.
