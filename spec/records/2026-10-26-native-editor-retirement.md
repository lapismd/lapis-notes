# Native clean editor retirement — 2026-10-26

Desktop M16.7's original native writer cohort passes 23/40. Exact external
rename/delete reconciliation and immediate Properties close both fail (0/2):
the former retains old-path retirement after the saved file disappears; the
latter may preflight while normal clean retirement remains queued.

The isolated source repair starts from API `10051ac0`, then rebases its five-file
change onto qualified hosted cohort `85fcb0ee`. The three API implementation
files are byte-identical between those baselines before this repair. No hosted
transport or native writer policy is copied into Desktop.

## Exact regression

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-editor-retirement.test.ts
```

Before: **1 pass / 2 fail**, frozen `18a06c75`, receipt `9daa2a62`.
After: **3 pass / 0 fail**, frozen `a1e55881`, receipt `f992e9ae`.
The dirty failed writer stays fenced. Clean detached retirement observes the
current authoritative version or expected absence without a content write;
live guard handoffs retain their saved-baseline mismatch rejection. Recovery
preflight drains already admitted queue/transition work without retrying failed
persistence. A retired clean entry is harmless while its registry cleanup drains.

Several multi-connection SSH dispatch attempts refuse the connection before any
worker exists. A single bounded SSH batch dispatch executes both exact snapshots.
The first report extractor sees BSD tar's early end-marker closure after the
worker completes. Its workload receipt and all files are retained; subsequent
collection drains the complete archive to disk before extraction, matching the
tracked transport helper. No failed transport is relabelled as a clean runner.

API owner receipt `f3502397` passes all **31 native/state and 1,689 API cases**,
strict checks, public build/declarations, App ownership and public pack. API
archive SHA-256 is
`a1fc412fd6cc1e7f40d18d8eafd48c89a66a248ec84cec71f00e11bb704707cd`.
Full coherent source/catalog and actual host gates remain pending.

## Filesystem permission presentation

Native attachment-import permission acceptance also fails because Core's IO
conversion reports `Vault attachment is not valid` for an ordinary filesystem
permission error. The admitted vault client is still valid. The exact Core
regression fails **0/1**, receipt `6ce43a4b`, and preserves the unchanged typed
PermissionDenied code, denied-attachment wording and native-path redaction.
The source conversion now describes the denied file operation; no protocol code
or authority changes. Exact after passes **1/1**, receipt `4bcee559`. Complete
source and actual native permission acceptance remain open.

Full owning source, catalog, both actual hosts and final R3 gates remain pending. Publication, signing and default cutover stay deferred.

## Complete source cohort

Frozen `facca5b1`, receipt `aaeafa1a`, passes complete check/test/build with
**564 Rust and 2397 package cases**, all **263 cold catalog** cases and static
Storybook build. Final specification fails only the missing mapped Editor APIs
chapter. That canonical explanation is added before a fresh documentary/public
pack closure; no complete aggregate pass is claimed from the failed receipt.
Existing hosted/Node/local journeys and the 15 actual Tasks/editor journeys
remain separate current-cohort acceptance gates.

## Source closure

All current hosted journeys pass: **24/24** Rust/metadata/History/Node/local
Web cases in `675b8bec`, **15/15** actual Tasks/editor cases in `68a9be90`,
and **7/7** exact leave cases in `6733feae`. Runtime/native clean shutdown
remain checked. The complete source product is byte-identical across these
receipts and the full `aaeafa1a` qualification; only mapped Editor APIs/evidence
prose differs. Final documentary/public-pack `0844e10c` passes formatting,
progress, full specification and 78 governance cases, public build and pack.
Its API archive is byte-identical to the owner-qualified `a1fc412f` archive.
A separate read-only review finds no actionable lifetime, generation, protection
or queue-reentry issue. Internal settle adds no public API signature.

Source protected refresh/clean retirement is complete. Actual Desktop final
writer/window aggregate and current Properties/Core archive intake remain
consumer gates; six native retirement/preview and four provisional Properties
cases already pass. No full migration, main intake, cutover or release claim is
made. Failed SSH, report extraction, preparation and missing-map attempts remain
retained independently of the passing source/product and documentary receipts.
