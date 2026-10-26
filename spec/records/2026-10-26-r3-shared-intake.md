# Coherent R3 Search, Tasks and History source intake

Status: coherent shared source qualified; adapter and host gates remain separate.
Requirements: LN-CORE-001/003/004/005/006/007/008/011/012.

This isolated `r3-shared-intake-20261026` workspace combines four committed
parents without rewriting any qualified source history:

- master tracker `9c24d9d3`;
- hosted native Search / shared App lifecycle `2a6f938a` / `a1b0dfde`;
- ordered Task writes, typed recovery and tracked-today `ad968536`;
- shared indexed History controls and HTTP source `7cbb8713`.

The merge initially has twelve conflicted paths, including four native files.
The qualified Tasks branch extends native indexing status with tracked-today
observations; the newer transport branch already owns the shared protocol
progress DTO and native refresh/search reporting. Their combination cannot
retain two independently defined progress models or silently drop tracking.

The native status now composes the single generated protocol progress with its
native tracked observation. Existing native field access delegates to that
progress; the HTTP control projects only its existing wire DTO. The exact new
`native_tracking_and_shared_wire_progress_retain_separate_contracts` case guards
both native materialization and flat unchanged wire progress. Owner/reconcile
retains both explicit refresh/search reporting and tracked-today publication
through the same existing worker and admitted Work.

Task recovery evidence comes from its latest committed source record. Canonical
contracts and verification preserve both hosted Search and indexed History;
structured task ledgers are unioned by stable task IDs. No new application
feature, renderer scheduler, dependency publication or default cutover is added.

First exact targets are the new status composition case, all native indexing
cases, and actual HTTP indexing/History cases. Their before/after outcomes and
full combined qualification will be recorded here; independent source receipts
are prerequisites, not a substitute for testing this combined candidate.

The automatic canonical merge also yields 408 lines in the indexing chapter.
The complete daily Task coordination topic is moved to its own canonical
chapter, keeping the original section as a direct topic link. SUMMARY, mirrors
and navigation are regenerated; no requirement or historical evidence is
removed and the 400-line limit remains unchanged.

## Combined exact qualification

First frozen candidate b3ee59b0 failed at compilation with five library and
seven library-test unresolved Task lifecycle imports. The exported Tasks source
da17eba0 and SHA a1e7ddce match the qualified prerequisite and contain those
exports. Clearing only the inactive package cache repairs that stale artifact
without changing source pins or introducing a replacement API.

The next compilation exposes one Search integration-test serialization error:
the native wrapper intentionally carries tracking separately from the shared
progress DTO. That regression now serializes status.progress explicitly and
retains all completed Search/wire assertions.

Frozen bebe9e3f, receipt a71de211-85f8-4dd8-bd72-6c260511bd2f, passes the exact
new status composition case, the complete native indexing family, all six
Search control cases and all 40 HTTP file/control cases. Both original failed
receipts remain retained. The subsequent main tracker parent update changes
documentation only; complete combined source/application gates follow.

## Full functional qualification and final governance repair

Frozen source 790306bb, receipt 28a1d6b2-54d1-4d7f-a9f2-ff357976cb15, passes
507 Rust cases with seven intentional ignores, 2,295 package cases, all 261 cold
catalog cases, static Storybook and all22 actual hosted/standalone browser cases.
Full strict checks and all package/native builds pass. The four catalog shards
retain 93/71/42/55 cases; browser lanes retain 1/8/1/12 cases.

That full command remains recorded as failed because its final specification
gate finds one SPEC-FIRST-MISSING for the catalog chapter mapped to generated
preview navigation. The catalog documentation/navigation chapter now states
the new canonical Task topic and mirror ordering. No runtime, assertion or
source pin changes accompany this documentation repair. Final specification,
progress, formatting and generated-mirror checks are rerun at the final source.

Final repaired source 01f3284a, receipt 6a2b34d8-de7e-4512-9058-444fd0fd8ced,
passes formatting, progress generation/drift, protocol/boundary checks, complete
specification/mdBook/spec-first and all 78 governance cases. The runtime/native
source and assertions are byte-identical to the functional 790306bb snapshot;
only four documentation/tracker paths differ. This final record/status refresh
undergoes the same documentary checks before commit. The original failed full
receipt is not relabelled as passed.
