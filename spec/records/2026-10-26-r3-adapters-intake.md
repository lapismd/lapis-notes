# Current R3 native adapter intake

Status: coherent source/API integration qualified; actual host gates remain separate.
Requirements: LN-CORE-004/005/006/013/014/015 and LN-SRV-024/025.

The isolated r3-adapters-intake-20261026 workspace combines coherent shared
Search/History/Task source 790306bb with qualified native Tasks port d6e0427f.
The former source is completing its full application gates; the latter passes
480Rust/2264package/261 cold catalog plus static/protocol/strict/specification.

All selected command families and generated public exports must survive this
intake. A passive native metadata disposal still returns without renderer-owned
checkpoint persistence, but must first await its Tasks observer detach. Native
Task selection, writer/recovery semantics, current Search replacement lifecycle
and shared History transport remain source-owned and preserve their wire DTOs.

Exact combined regressions, generated outputs, complete source gates and the
single current API archive are pending. Source qualification does not imply
host selection, daily locale parity or final R3/provider/cutover acceptance.

## Exact metadata/Tasks disposal boundary

The naive merge put native metadata's early return before the new Task detach
await. A held accepted Task response then allowed MetadataCache disposal to
finish before that Task observer drained. The exact regression
`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-metadata-observation.test.ts -t "awaits native Tasks detach"`
fails once at `disposed === false` on frozen 452122a2, receipt
3939cd7f-dffd-4c03-a2d1-74d910dcb98a. This is an integration-before case, not a
new claim about either independently qualified parent.

Task detach is now awaited before the native metadata short circuit. The
regression also preserves synchronous detach, rejects a later call, retains
one accepted request without replay, and observes no metadata transport or
renderer snapshot write. Its exact after run and complete affected cases follow.

The exact corrected case passes on frozen 41a80597, receipt
2f58751a-10f0-4bfd-87bc-508fe5657903:1pass/0fail. Protocol/schema/host-module
generation and formatting pass on the same source, receipt096cd57a. The next
cohort also includes the separately qualified App/hosted History port 2d250f66
and latest main tracker fbb38652; all three admitted port families are retained.

Qualified daily locale source 866fc22b and owning Tasks adapter df758389 are now
part of the cohort. The source supports en-US7/4, declared legacy Intl en-US7/1
and en-GB1/4 without changing the original producer outcomes. These add no API
implementation or DTO changes. Actual host timezone/day-boundary and signed
acceptance remain separate. The native Tasks crate pin stays at qualified
da17eba0; the locale formatter belongs to Notes Core.

The first complete aggregate command stops before functional work at the native
300-line boundary for bin/export.rs (receipt c94f62d8). The combined declarations
made that existing responsibility oversized. Database TypeScript emission is
moved unchanged into the matching sibling bin/database module, following the
existing turn/indexing/History export layout. No DTO, declaration order or
generated output is intended to change. Exact protocol-output and boundary
checks precede the full rerun; the initial failed aggregate remains preserved.

Exporter source eebe1f79, receipt 4cc41b4c-dbeb-4034-9a53-dfa5efdb8dbc, passes
Rustfmt, exact protocol-output equality and the complete native boundary audit.
The full rerun 6110968e is active at that frozen source: 529 Rust with seven
retained asset/provider ignores and2,317 package cases pass; remaining cold
catalog/build/browser/specification gates are still in progress. Main's later
26dd314e parent changes only its two tracker files; runtime bytes are unchanged.

## Complete coherent qualification

Frozen eebe1f79, full receipt 6110968e-9053-4f3f-b173-7cb74a209948, passes all
529 Rust cases with seven retained asset/provider ignores,2,317 package cases,
261 cold catalog cases (93/71/42/55), static Storybook and22 actual browser cases
(1/8/1/12). Strict checks, all package/native/host builds and complete final
specification/all 78 governance regressions pass. The full failed attempt remains
recorded as failed; it is not relabelled by the passing rerun.

The frontend snapshot e18d2fce separately passes the exact disposal case, 48
affected observers, 1,641 API / 79 Web including 12 exact hosted metadata/History
cases, strict public declarations/build and App ownership. Its public API pack
SHA256 is 5d120637428d5518f979a526b10d2499b4a30ca30a7b158c68af4af8ee2def8d.
API production bytes are unchanged by the later database-export split.

The latest main-parent intake changes only tracking documents. Final record and
UTC/status updates undergo documentary checks before the integration commit.
Actual Tasks host/editor intent, the separately committed reader intake, legacy
History and complete R3/provider/default gates are not closed by this record.
