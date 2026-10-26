# Combined backup controls and operation-scoped state

Status: **Complete for focused main intake**. Combined both-host R3 remains open.

This merge combines qualified backup controls `edf1d76f` with main `1dcc6d47`,
which adopts qualified operation-scoped state writers `2bfd032e`. Runtime
changes merge without conflict. Only authored tracking/architecture conflicts
needed resolution; all 102 main ledger rows and the R4/icon plans are retained.
The backup slot field/constructor remain the only two shared-state changes.

## Focused combined qualification

Frozen source `edf68cb6`, Docker receipt
`3b6444f2-1748-42a9-a36d-c9e488e7b140`, passes:

- Three accepted-turn order/cancellation/liveness cases and seven backup
  selection/status cases.
- Ten editor-intent and seven captured-recovery cases, one actual conditional
  HTTP writer case and three backup HTTP cases: 31 native cases overall.
- All 45 selected API registry, noninteractive state, file-session and
  read-only configuration cases; all 19 Web backup/restore/service/admission
  adapter cases.
- API strict checks/build and six public declaration cases, public pack,
  complete specification and all 78 governance regressions.

The private input cohort contains 16 checksum-verified owning archives,
including qualified Mira `e79ba9cd`/source `c5d1e4b6`, Markdown
`d8e7bb59`/source `40f8febb`, Tasks `ff64`/source `52270`, Design Core `6f33`,
Search `2e7f`, packed SDK `94bae0ae` and qualified History `e714935f`.
There is no override for the owning API source. Published package manifests and
lockfiles retain their existing portable ranges.

The resulting API tarball has SHA-256
`f85d22b4c06fa6ce4e992df6e04ab681b8254d734565a8fdc3d708e9b865d787`.
The first helper attempt called nonexistent `protocol:check` and stopped before
product checks. The helper was corrected to the existing `check:protocol`;
there was no product repair or assertion change.

## Qualification boundaries

The parents retain their full evidence: backup controls pass 575 Rust,
2,358 package, 261 cold catalog and 25 actual browser cases; state ownership
passes 562 Rust, 2,354 package and 261 cold catalog cases. These are separate
source cohorts, not one aggregate combined run. This focused merge proves their
composed backup/intent/configuration boundaries and newer qualified prerequisite
cohort. Actual Tasks/editor host adoption, Problems, original-source selection,
complete provider/timezone/unattended R3 and default cutover stay separate.
No publication, signing, installed-app replacement or Deno edits occur.
