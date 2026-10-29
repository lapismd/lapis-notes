# Native Task recovery through shared private record IO

Status: shared private IO and native Task recovery are source-qualified.
Source base: ordered lifecycle `2296023f` and shared IO extraction `86f360f8`.
Neither application selects the new Task owner in this slice. Native default
daily policy is qualified; tracked-today scheduling and host adoption remain
separate gates.

## Authority and persistence

The existing native turn store is extracted once into private `record_store`.
It retains capability-bound profile admission outside vault content, exclusive
writer locking with inode verification, bounded catalogues, byte-conditional
publication and retirement. TurnJournal uses the typed IO directly; no copy or
compatibility module remains at its old location. Turn layout, serialized
records, diagnostics, 8 MiB / 4096-record limits and dispatch/recovery semantics
remain unchanged. Task records do not masquerade as turns.

The native Task journal binds to one admitted vault and consumes an existing
Work lease. New submissions serialize through the existing lifecycle gate.
Duplicate request lookup precedes fresh original-version preflight, so observing
a completed request cannot advance it again or fail on its own changed version.
Different inputs cannot reuse that identity. Original snapshots, source plans,
actions, occurrence dates and native policy are pinned before daily mutation.

Task records separately retain accepted, ensuring, observing, advancing and
completed stages. Ensure and observation intents remain distinct: retained
quantitative validation may fail after ensure, leaving a readable seed without
an observation or Task advancement. Each intent pins physical before/desired
bytes. Both daily and original mutations reuse existing guards/writers; no-op
content retains writer checks without rewriting unchanged bytes.

Cold inspect changes neither notes nor records. It classifies before, desired
and divergent physical content. Explicit retry reuses the accepted task/date
identity and policy; it never selects a new date or next occurrence. A desired
original after uncertain publication is reconciled without another write or
advancement. Handwritten changes and readable daily partials remain intact.

Known failures retain a bounded 128-byte code / 2048-byte message for cold
inspection. Explicit retry clears that failure before starting another attempt.
Unrecorded process loss has no fabricated domain failure. Task records are
bounded to 16 MiB / 4096 requests. Existing case-insensitive `md` and `markdown`
paths reuse the authoritative inventory predicate.

Accepted Work remains valid through detach and close drain, while new Work
admission fences. Private journaling does not reopen the fenced database for
later stages. Application adoption must put journal construction/retirement in
the native vault service, never a view. No timer, renderer queue, second note
writer or extra database publisher is introduced. No `lapis-ai` or Tasks
algorithm changes are needed for this slice.

## Exact shared IO qualification

- The absent-engine baseline fails the exact `record_store::tests` target with
  one unresolved-import diagnostic and no runtime cases:
  `1ae178d5-fd15-4b5f-8a90-c4f5967d8efb`.
- The unchanged Turn journal/continuation baseline passes 14 cases, with one
  isolated crash helper ignored: `59102fd9-b23d-47e4-9752-c5316036d749`.
- All five shared IO cases pass after extraction, including typed validation,
  stale publication, locks/retirement, profile replacement and catalogue bounds:
  `761404a7-225b-410f-8869-9d6b4091c2f5`.
- The unchanged Turn replay passes all 14 after extraction, including actual
  process loss and cold continuation heads:
  `7d9edd37-2e5f-4925-b9a1-b72225134bfc`.
- Extraction-wide check/test/build passes all 447 Rust cases with six prior
  ignores plus strict/native/package lanes:
  `f05ccb5c-fdfb-44aa-9bb0-5bfce9ffdce2`.
- Extraction's final specification/78-governance gate passes:
  `090a7a2b-a588-4155-a3ff-dc134a8c6e30`.

## Exact Task recovery qualification

The absent-coordinator baseline has one unresolved-import diagnostic and no
runtime cases at `5aa67a04-2130-427c-9bb5-6a617e21eb39`. Test-channel capture
and diagnostic helper-signature compile diagnostics were corrected before the
complete focused pass; no assertion or fixture was weakened.

The first four exact recovery cases pass at
`17c2ce02-79ec-40c4-af2b-30c076c5e611`. They cover duplicate observation,
seven interrupted boundaries with read-only cold inspection/explicit retry,
handwritten Task/daily preservation and accepted detach/close drain.

Expanded acceptance passes eleven cases plus one isolated crash helper at
`25aa672b-824f-4024-bb47-bf794cb14d63`. It includes all 110 retained lifecycle
attempts (92 original plus 18 valid-duration), quantitative ensured-seed failure,
dirty original/hardlink partials and known failure details across cold inspect.
Actual process loss after original publication retains the same Task inode,
unchanged daily bytes and one advancement through explicit retry. Its child
crash helper is invoked by that passing parent case.

Two further exact regressions are repaired at their owning source boundary:

| Regression                                             | Before                                              | After                                                           |
| ------------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| Daily dirty admission precedes quantitative validation | One failure: `138523aa-8e8b-44c2-a658-5aec1e3f1818` | One pass: `792a0336-23d7-4732-afc9-3a5da88cab45`                |
| All supported existing daily Markdown extensions       | One failure: `5f49d0bd-0500-46de-8b18-df51aad3431e` | One pass/four spellings: `ad7f9463-fb0f-4d58-97c6-c3b12ebdd603` |

The wider source boundary initially found one oversized private test file. Its
fixture is now a separate test-only feature module, retaining every assertion
and the audit's 300-line `src` bound. Exact audit qualification passes at
`834a5f35-01e6-4520-9953-1a3049956c7b`.

## Complete native/source qualification

The final `pnpm check:all` passes **459 Rust cases**, seven ignores (six retained
plus the invoked child-only Task crash peer), six boundary regressions, strict
Clippy/fmt, native build and complete package check/test/build. Receipt
`73be9116-aaa7-4fb7-af05-14a4c3de97af` includes the repaired daily-extension
contract and every existing Turn/native execution case, including all twelve recovery
cases. Earlier checkpoint
`d1d7e420-4241-460f-b282-9916ea2491e8` passed 458 before that added regression.

Retained package/story/config inputs are unchanged; their valid Turbo receipts
supply the unchanged-input package tasks. The root architecture chapter remains
exactly 400 physical lines. Complete canonical specification, mdBook, spec-first, App ownership, metadata
query audit and all 78 governance cases pass at
`498715c3-e968-441e-88bd-849c63905e17`. The initial specification run found one
root-chapter mapping omission; the existing routing lines now reflect typed
recovery while retaining exactly 400 lines. Final ledger/evidence formatting
and complete specification are rechecked before commit.

## Remaining application work

This is source qualification, not either host's native Task selection. Tracked-
today materialization must reuse the existing indexing owner and local-date
refresh. Default/provider selection, native service-owned lifetime and both
host adapters retain their separate application acceptance. No historical Deno
code, default host, publication or distribution setting changes here.
