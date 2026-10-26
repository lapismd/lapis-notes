# Staged hosted native metadata

**Qualified:** the complete combined source/catalogue/all-host gate passes at
`9c207ac5`. Only corrected public API archive `ce16a703` is admitted. Desktop
metadata-only intake is committed at `4bcb7e09`; defaults remain staged.

This slice starts on coherent Notes observer source `0bb90ba1` in isolated
workspace `hosted-native-metadata-20261026`. It stages the existing public App
observer on the same Rust HTTP client already admitted for files and database.
The ordinary Rust build, Node and standalone Web keep their current defaults.

`VITE_LAPIS_NATIVE_METADATA=1` opts the Rust build into metadata observation.
No new session factory, scheduler, native transport or path authority is added.
Native Search and complete Tasks/provider parity remain separate gates. The
temporary validation cohort retains the previously qualified Search archive
until the owning native Search adapter and its host acceptance are admitted.

## Qualification

The exact backend regression target is
`pnpm --filter @lapis-notes/web exec vitest run src/hosted/rust/native-metadata.test.ts`.
Its full Web/source gates and actual built hosted browser acceptance remain
separate from the focused owner evidence below.

The first isolated runner at `a10f72d2` reaches no tests because this fresh
checkout has no built API public `dist`. Adding the required API/UI build to
the ignored worker preserves the public package boundary; no alias or package
source change is used. Worker `lapis-hosted-native-metadata-exact-8cf09714` then
passes those builds and records one passing default-profile case and five
failing opt-in cases. All five lack the native metadata port. The first import
failure remains a separate harness receipt rather than a product baseline.

## Native metadata observation ordering

Desktop's staged native metadata acceptance exposed a source ordering defect:
the database could publish a committed Markdown row before the renderer Vault
created its `TFile`. The cache stored the row but skipped `changed`; its native
Vault-create branch never observed it again. Retained Search intentionally uses
metadata events for Markdown, so it never indexed the externally created file.
Modify and rename have the equivalent ordering boundary.

The exact owner target is
`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-metadata-observation.test.ts`.
Worker `lapis-hosted-native-metadata-api-order-e0108d56` at `01af47ab` records
two passing and four failing cases before the API repair. Database-first
create, source-late modify, database-first rename and the new pending read's
detach boundary fail. Reverse create order and stale-byte rejection already
pass. The repaired facade reuses one committed-row observation helper for
database and Vault events; it neither parses nor publishes metadata.

The exact six-case retry passes at `583a7294`, worker
`lapis-hosted-native-metadata-api-prepare-0024c572`, followed by formatting and
canonical validation. The native helper also fences a moved file identity after
its asynchronous read, retaining the original source hash guard and passive
detach behavior.

API owner worker `lapis-hosted-native-metadata-api-owner-af02aac6` at frozen
runtime `863f6b5008ecd154e96fd5f5a68a484b218fc147` passes all 28 native
background/Search/ordering cases, UI/API builds with publint and packed public
declarations, strict API checking with zero errors/warnings, all 1,619 API tests
across 153 files, App ownership and canonical validation. The hosted exact target
now passes all six cases, against its one-pass/five-failure baseline.

The public API pack has SHA-256
`6267439287616f51751c6c9d9769c3b2f389a59a37af51c3eabe5754a384ad74`.
Desktop may consume this explicitly documented temporary validation archive
while complete combined Notes/host qualification continues. No package is
published, no native sibling pin changes and no Tasks runtime source is adopted
through this repair.

The first actual hosted browser attempt at `d34f80b3`, worker
`lapis-hosted-native-metadata-focused-ece484e4`, passes startup selection,
native reads, editor persistence, writer fencing and Outline observation but
fails external-created Search (zero passing/one failing browser case). The
trace contains the committed `Observer.md` row and matching readable bytes.
The new identity fence wrongly assumes `Vault.getFileByPath()` returns a stable
object; its public implementation returns `TFile.copy()` on every call.

The exact fixture now uses that copied-facade behavior. At `1692d871`, worker
`lapis-hosted-native-metadata-api-order-88433bc4`, it exposes five failures and
one pass rather than concealing the mistake with stable test objects. The
source fence now checks path/presence, matching bytes and disposal; reference
identity is not a public Vault contract. The provisional `62674392` archive is
withdrawn from consumer admission pending the corrected owner pack.

Corrected owner worker `lapis-hosted-native-metadata-api-owner-5b1f956a` at
`4b15f37a7563814a1b0ee11cfdaf407896a7352b` passes all 28 exact cases with the
copied-facade fixture, all 1,619 API cases, strict zero errors/warnings,
UI/API build/publint/public declarations, ownership, canonical validation and
the six hosted adapter cases. Its replacement public archive has SHA-256
`ce16a703374eb634b8648fa9a001f52e2feb22e436ecc8cb6171215e53f20ee3`.
Actual hosted and native consumer acceptance remain distinct from this owner gate.

The corrected real hosted retry at `4024f1f3`, worker
`lapis-hosted-native-metadata-focused-5725ce1b`, passes the exact six adapter
cases, all 73 Web cases across 21 files, strict Web/Svelte/e2e declarations,
required package builds, the opt-in Rust renderer and native server build.
Its actual headless browser case passes native startup, read/edit persistence,
client writer rejection, external-created retained Search and native indexing
after detach. Final `spec:check` stops at `SPEC-FIRST-MISSING LN-GOV-003`:
the protected Web change also requires explicit architecture and packages
chapter updates. Those mapped source contracts are now updated; source
qualification must still pass the complete combined gate.

## Complete combined gate

Worker `lapis-hosted-native-metadata-full-642cdaa7` runs frozen source
`9c207ac58e19eae42ead696a0881058cd8f709bf` from 02:56:28 to 03:13:53 UTC on
2026-10-26. Its isolated 4 CPU/12 GiB Docker snapshot passes the following:

- Exact six hosted adapter cases, all 20 strict tasks and all 461 Rust tests.
- All 2,289 package cases, including 1,619 API and 73 Web; one retained Deno skip.
- All 11 package builds and four cold catalog shards: 261 cases across 59 files.
- Static Storybook with all 182 specification chapters.
- The opt-in native metadata browser journey, including external-create and
  indexing after detach; all eight ordinary Rust hosted cases; retained Node
  hosted acceptance; all 12 standalone Web cases. These are 22 passing cases.
- Full specification checks and all 78 governance regressions.

The runtime/input files remain byte-equivalent after rebasing only the latest
master tracker checkpoint `8898b028`. Native sibling pins and the temporary
Search archive remain unchanged. Desktop's matching corrected API acceptance is
committed separately at `4bcb7e09`, with all 14 native and 14 hidden API cases,
88 final affected catalog cases and complete prior 2,032-case catalog evidence.
Search writer adoption, Tasks runtime intake, provider parity and final default
cutover remain separate; this slice neither publishes nor replaces an app.

Final preparation `lapis-hosted-native-metadata-prepare-e08c5054` at
`2ed42a6e` passes formatting, generated progress, structural validation and
complete specification checks after the tracker-only rebase. All 82 task IDs
are preserved; only the R3 summary and completed metadata-only adoption gate
change. The corrected API and hosted product bytes remain the qualified runtime.

Final docs attempt `lapis-hosted-native-metadata-final-docs-c56a83cc` at
`0ff7c30a` finds one Markdown formatting issue in the authored status table after
a spacing correction. Adjusting its padding changes no runtime or assertion; the
exact retry `lapis-hosted-native-metadata-final-docs-e3b965bf` at `02d8e886`
passes formatting, generated progress and complete specification/78 governance
checks. Product bytes and the 82-row ledger dispositions remain unchanged.

## Next hosted seams

Search can use this same admitted indexing port and App observer after its
own native adapter archive qualifies. Provider/chunk selection and explicit
disable already belong there; hosted adoption needs no new scheduler or screen.

History source `05d0e8ab` instead uses Desktop-owned `RepositoryServices` and
`IndexedHistoryService { start, status, query, context }`. Its local
`history-index-controller.ts` observes status after one start and does not stop
native work on view close. Desktop's `history_owner.rs` projects the existing
core `start_history_indexing` and `history_indexing_status` operations. These
are not current shared Plugins/API exports; the inherited Plugins service still
has a renderer-driven `step` contract. The generated Rust HTTP protocol also
has no History control/read route yet. A following R3 slice must extract the
shared typed service/protocol and adapt the same admitted owner before hosted
selection. Importing Desktop internals, reviving the old scheduler or copying
its screens would bypass that source boundary.
