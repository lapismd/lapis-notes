# Native indexed-file facade intake

Date: 2026-10-24. Notes baseline `a3059133`. R1.3/R3 remains incomplete;
neither application selects this facade yet.

The existing direct-Turso implementation supplies the reference for metadata-first
upsert and atomic cross-domain rename/delete. New native operations reuse the
existing writers, transaction owner and committed event publication. Retained
source conformance, native failure/lifetime checks and broader qualification
are in progress.

Implementation and exact qualification:

- `IndexedFile` retains the public record shape and distinguishes missing task,
  explicit null and a full task record. Native admission reuses core identity
  and task numeric validation before entering the existing database actor.
- Core metadata publication still commits independently. Task work reuses the
  existing stages and committed-event queue; no second database owner is added.
- Rename/delete reuse normalized writes, scoped projection cleanup, Search
  records/chunks and notebook/task storage. The shared journal now stores rename
  pairs and bounds combined path/rename detail, converting overflow to reset.
- The retained direct-Turso fixture has **ten cases**, complete inputs, resulting
  read APIs and change events. The one-time capture helper is removed after
  asserting expected success/collision outcomes; source assertions remain.

Before/after history:

- The first capture reports **one failed case** because its harness calls the
  nonexistent `saveNotebookState`; use the public `setNotebookState`. The exact
  capture rerun passes. Logs `.local/rust-indexed-mutations-capture{,-pass}.log`.
- Initial native compilation reports **one** deserializer type diagnostic:
  `present` handles JSON Value, not a typed nullable TaskRecord. Use a local
  typed deserializer preserving missing/null distinction. No runtime case runs.
  Log `.local/rust-indexed-mutations-native-before.log`.
- The first native reference run reports **one failure** from invalid shared
  seed input missing required Search tag fields. Add those retained record fields
  to the input; keep full-result assertions. The exact rerun consumes all ten
  cases successfully. Logs `.local/rust-indexed-mutations-native-{first,valid}.log`.
- Four initial transaction/lifetime cases pass. Adding namespace isolation
  reveals **one fixture assertion failure / five passes**: query results project
  authored data only, so a row ID is not an implicit data property. Selecting
  that nonexistent field still fails once. Confirm the retained fixture and
  public selection contract; add the asserted ID to authored fixture data and
  retain the exact ID assertion. No product behavior or assertion is weakened.
  Logs `.local/rust-indexed-mutations-native-{final,pass,accepted}.log`.

The final exact native run passes **seven cases**: full ten-case reference with
cold reopen and persisted journal comparison; detached upsert/rename/delete;
later task-stage failure; complete rollback on exhausted revisions; admission
and bounded rename detail; malformed notebook recovery; projection namespace
isolation. Log `.local/rust-indexed-mutations-native-accepted.log`.

Both protocol cases pass, covering complete missing/null/task round-trips and
rejection of SQL, native authority, unknown task fields and invalid numeric
types. Generated schema/TypeScript and negative client fixtures are refreshed.
Logs `.local/rust-indexed-mutations-protocol-{generate,accepted}.log`.

The retained ten-case source rerun passes; four affected API targets pass
**74 cases**. Logs `.local/rust-indexed-mutations-reference-valid.log` and
`.local/rust-indexed-mutations-affected.log`. Native boundary audit and spec-first
pass **25 protected files / four chapters**. Logs use
`.local/rust-indexed-mutations-{boundaries,spec-first}.log`.

Full source check/test/build/specification now passes; Desktop compatibility
checks pass and their committed receipt is being finalized. No renderer production code, catalog helper, story family or UI is
changed; the previous **261-case cold catalog** receipt remains separately
qualified. This unused native-facade addition cannot qualify either host's
adoption, native UI/OS, semantic inference, R3 scheduling or later plan slices.

Broader qualification completed so far:

- Root `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm check` passes **20/20
  tasks**, all executed, protocol drift, boundaries, formatting and strict
  workspace Clippy. Log `.local/rust-indexed-mutations-root-check.log`.
- Root `pnpm test` with the same environment passes **169 Rust cases**, zero
  failed/ignored, **1,489 API cases / 142 files**, and **20/20 package tasks**,
  all executed. The retained opt-in Deno ACP integration remains skipped; it is
  not a native provider gate. Log `.local/rust-indexed-mutations-root-test.log`.
- Full `pnpm spec:check` passes its **nine stages**, ownership/metadata audits
  and **38** regressions. Log `.local/rust-indexed-mutations-spec.log`.

A name-only inventory of the **68** existing remote methods finds **60** direct
native name matches. Revision already exists under a shorter native name; schema
setup currently belongs to open. The other six names are Search provider/status,
batch and rebuild controls. Existing vector/hybrid modes remain unsupported.
This inventory does not prove return-shape or mode parity and cannot complete
facade adoption. Log `.local/rust-indexed-mutations-method-audit.json`. The live
tracker now separates those remaining parts of the existing Search scope.

Final source `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm build` passes
**11/11 tasks** (nine reused), including the native workspace build. Log
`.local/rust-indexed-mutations-root-build.log`. Changed authored Markdown,
TypeScript and JSON formatting passes; final specification validation retains
**175 chapters / 1,511 requirements**. Final commit checks use
`.local/rust-indexed-mutations-final-*`.

This closes LN-DB-061/062/063 source qualification. The migration tracker and its
UTC timestamp are refreshed in this slice commit; the consumer revision will be
recorded separately after its commit. R1.3/R3 and R2/R4–R7 remain incomplete.

Final spec-first passes **25 protected files / five chapters** after the Core
verification row joins this slice. No required source lane remains pending.
