# Native Task recovery through shared private record IO

Status: shared private IO source-qualified; typed Task recovery remains active.
Base: ordered lifecycle source `2296023f`, with all 442 Rust cases and full
source/specification gates passing. Recovery is still unselected in both hosts.

The existing native turn journal already owns capability-bound private profile
admission, exclusive writer locking, bounded typed records, byte-conditional
publication and retirement. This slice extracts that internal IO once and
updates turns directly. Its layout, wire records, dispatch claims and cold
recovery behavior remain unchanged. Typed Task stages reuse that IO rather than
inventing another note writer or repurposing ACP turn records.

Ordinary database submissions fence when close begins, so they cannot journal
later stages of an already accepted Task operation. The Task coordinator must
retain its own durable admitted authority through Work drain, pin its original
action/date and before/after bytes, and reconcile physical content on cold open.
Uncertain writes cannot be replayed. Same request identity can only observe or
explicitly retry its pinned stage; it cannot advance a rolling Task twice.

Exact shared-IO acceptance covers typed validation and conditional publication,
lock exclusivity/retirement, file and catalogue bounds, profile/content overlap
refusal and physical profile/lock replacement. Existing turn journal,
continuation and native execution tests retain their original acceptance gates.
Later Task acceptance adds first/second-stage loss and cold reconciliation;
generic IO qualification alone does not claim that recovery or either host.

## Coordinator acceptance after IO extraction

- Duplicate request lookup precedes a new original-version preflight. Otherwise
  a completed request could fail observation merely because its own Task write
  has already advanced that version. Reusing an ID with different action input
  remains an error; observing an existing record never creates fresh authority.
- Persist original action, occurrence date and exact replacement intent before
  the first daily mutation. Daily provider configuration is native installation/
  vault policy, not renderer authority; accepted retries cannot slide to a new
  local date or next-occurrence plan after restart.
- Keep the ensured-seed stage distinct from a recorded observation write.
  Retained quantitative validation can fail after ensure; an ensured seed alone
  is not proof that an observation or the original Task advanced.
- Before each note mutation, retain its physical before/after bytes and journal
  stage. Cold inspection classifies unchanged, desired and divergent content
  without replaying writes. An uncertain original write that already matches
  the pinned desired Task cannot create another advancement.
- Keep accepted private-record authority alive through existing Work drain.
  New admission remains fenced while Closing; background completion and a
  detached caller share the same native job, rather than creating a renderer
  queue or another indexed-file publisher.
- Preserve readable daily results and handwritten external changes on partial
  failure. Explicit retry reuses the recorded task/date observation identity;
  unsupported or divergent states remain visible instead of falling back to
  the retained TypeScript implementation.

## Shared IO extraction acceptance

- Before implementation, the exact `record_store::tests` target fails to compile
  with one unresolved-import diagnostic for the deliberately absent engine;
  no runtime cases run. Receipt `1ae178d5-fd15-4b5f-8a90-c4f5967d8efb`.
- The unchanged `turn_journal` and `turn_continuation` baseline passes 14 cases
  and retains one ignored crash-process helper. Receipt
  `59102fd9-b23d-47e4-9752-c5316036d749`.
- After extraction, all five exact private IO cases pass. Receipt
  `d23c2c3c-a62a-467a-9cdc-bab2d4a08363`. The catalogue case additionally
  covers malformed and non-v4 filenames; its final five-case pass is receipt
  `761404a7-225b-410f-8869-9d6b4091c2f5`.
- The existing Turn engine is moved into the private generic record store;
  no compatibility copy remains at the previous location. Turn validation
  implements the local typed contract without changing serialized records,
  request identity, 8 MiB / 4096-record limits, profile layout or diagnostics.
- Native IO is reused from Notes itself. This prerequisite changes no
  `lapis-ai`, Tasks source, browser package or application host selection.

## Complete source qualification

The unchanged Turn journal and continuation replay passes all 14 cases after
extraction, with the same ignored crash helper. Receipt
`7d9edd37-2e5f-4925-b9a1-b72225134bfc` includes actual process-loss recovery,
exclusive writers, unknown running outcomes and cold continuation head rules.

`pnpm check:all` passes all 447 Rust cases with six existing ignores, six
boundary-audit regressions, strict Clippy/fmt, native build and full package
check/test/build. Receipt `f05ccb5c-fdfb-44aa-9bb0-5bfce9ffdce2`. Retained
package/story/config inputs are unchanged; their existing valid Turbo receipts
supply the unchanged-input package tasks.

`pnpm spec:check` passes canonical validation, mdBook, spec-first, App ownership,
metadata query audit and all 78 governance cases. Receipt
`81d156bc-e5c6-43a0-af5d-5f1f6ec55bb9`. The final ledger/evidence refresh is
checked again before commit. Architecture remains within its 400-line bound.

This closes only the shared private IO prerequisite. Typed Task admission,
explicit retry/cold-stage reconciliation and tracked-today scheduling remain
active/waiting; neither application selects a new Task owner here.
