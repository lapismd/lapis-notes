# Hosted native Tasks adoption

Base: Notes `866fc22b`, with owning Tasks `df758389`. This is a staged Rust-host
adoption of the source-qualified admitted port; the Node hosted default and
standalone browser implementation remain unchanged.

## Smallest slice and gates

1. Reproduce the missing hosted Task transport at the existing Rust backend
   boundary, then expose it only through its admitted `RustVaultClient`.
2. Attach the public native Tasks port to the owning vault session before App
   construction. Mark its observer detached before plugin teardown, drain
   accepted observation, and release the existing client last. Absent/disabled
   declarations use the shared startup reconciliation; passive detach never
   disables accepted service work.
3. Load the real owning Tasks plugin through configured installed persistence,
   never a static host import or replacement screen. Retain manifest/byte-hash
   verification and its `@lapis-notes/api/native-tasks` host module binding.
4. Exercise the real Tasks planner over the staged Rust server: source admission,
   one-file writes, daily-before-Task lifecycle, stale/dirty conflict refusal,
   observer detach, reload/cold recovery and explicit disable. Inspect actual
   vault bytes and typed admitted outcomes without replay or renderer writes.
5. Qualify the initial single-user operator policy with process `TZ` set to
   `Europe/London` and the matching browser timezone. Check native default-date
   observation and retain a private-clock boundary proof for midnight/DST.
   Unsupported operator/browser timezone mismatch remains explicit; add no
   multi-user timezone state, wire API or global OS setting.
6. Rebase once onto the final committed coherent API cohort before final host
   qualification. Run exact then affected hosted/source, cold browser and
   specification gates, refresh the UTC tracker and commit in this repository.

## Qualification boundaries

Actual browser/native/WebView, installed-plugin byte integrity and plugin release
signatures remain separate from app signing, which is deferred. No public plugin
release, default cutover or custom presentation is part of this slice. The host
gate stays **Working** until the real UI, admission/guards and detach/reload gates
pass. The source-qualified locale/provider gate remains complete independently.

## Current checkpoint

Inventory: the retained Web host forbids static Tasks registration under
LN-WEB-044. Rust already selects installation-owned Task storage and provides
same-client authenticated `/tasks`; only the hosted port/session wiring is
missing. Source `866fc22b` has no operator/vault timezone field; the native owner
uses the process local clock. The initial policy therefore uses explicit process
`TZ`, with matching-browser acceptance rather than a new configuration API.
Exact transport baseline and real installed-Tasks browser qualification follow.

The first two exact test attempts (`9d90d3ab`, `f51f7f85`) stopped at missing
compiled public API output before any test executed. The exact portable lane now
builds the existing API dependency graph first; this is required output refresh,
not a source alias or consumer workaround. The product baseline follows.

The repaired exact test setup (`15ffd921`) reproduces **four failures/zero
passes**, all because the prepared hosted resources expose no native Tasks port.
The thin client/resource/session wiring now uses the existing admitted endpoint;
no new schema or transport is introduced. Exact after-check follows the owning
Tasks public archive preparation in the serialized worker slot.

The exact hosted transport repair passes **four cases/zero failures**
(`745205de`). Qualified owning Tasks build/pack `fe3a4cc3` produces public
`@lapis-notes/lapis-plugin-tasks@0.1.0` bytes at SHA256
`d78e9ff4aa1067091b3501fd42dc20e0581669c4c9fc4b2724c8ff08a1537bb6`;
the clean packed tree equals source `df758389`.

The isolated browser artifact imports only that public package's default plugin
and stylesheet. Vite bundles ordinary dependencies, preserves the public API
and exact Svelte renderer ABI externals, and records full installed file hashes.
Fixture metadata uses explicit **development** provenance; it does not invent an
official signature or waive runtime validation. The unchanged configured plugin
loader and native hash-verifying asset reader are exercised. This is separate
from plugin release/signature and deferred application signing qualification.

The first real browser case (`24ac6e05`) builds and boots the retained application,
then fails **one case** because the test artifact externalized an unprovided
CodeMirror language package. The artifact now consults the existing public host
import map and bundles non-host language dependencies, failing before deployment
if any bare runtime import lacks a host binding. No production fallback or
runtime diagnostic is suppressed; the exact browser case is rerun.

After the artifact correction, the real Tasks view loads with zero Problems and
shows its native indexed Inbox count. The second browser attempt (`7b28f23f`)
fails one assertion because the fixture opens Today while its test Task belongs
to Inbox. The exact test now uses the real Inbox navigation before asserting the
same task and native write. This changes no product behavior or assertion.

The first real installed-Tasks completion/reload case now passes (`bf9bb919`).
The private native operator-clock case passes (`39139ceb`): twelve UTC instants
cover London midnight, the spring BST jump and autumn GMT fallback. The existing
owner publishes exact dated pending daily observations once, retains Task source
bytes and works with zero admitted clients. No production clock or API changes.

Installed-plugin lifecycle inventory also found that Web teardown only disabled
`corePlugins`, omitting development/community plugins. The host now releases all
configured plugin instances after native observation detaches, preserving configured plugin
lifecycle cleanup and shared service lifetime. The complete affected hosted
journeys remain required; foreign dirty-editor admission remains Working until
the independently owned shared claim bridge is connected.

## Recovery source and current coherent intake

The owning Tasks recovery fix is committed at
`26ded270c6574ab7306f811499e15d49d841d6eb`. It persists bounded request references
before native admission, exposes an existing Tasks command/menu for read-only
journal inspection and current-file navigation, preserves references through
settings changes/reload, and never retries automatically. Source qualification
passes 2,871 unit, 27 Rust and 63 cold catalog interaction/accessibility cases,
strict/check/build/publint/static and final specification gates. Public build
`aa04196a` produces 232,015 bytes with SHA-256
`c587f1feee1f421984b068a3cfd83c85bfaba109c27dcaf8f4855eb8c289a748`.
The prior five-case host run remains four passes/one lost-response presentation
failure until actual hosted recovery is rerun with this archive.

This host workspace rebased once onto committed coherent Notes `ac580dec`,
retaining its native metadata/History selection and all 90 parent progress rows.
Its API archive is the qualified `5d120637` cohort. No registry manifest or lock
changes to temporary source paths are committed. Native editing-intent transport
baseline `c10e5f7e` has four failures before binding; exact after-check `3041850e`
passes all four cases. The earlier `143a92c5` command ran only the existing four
Tasks cases and is not claimed as the editing-intent baseline. Actual editor
readiness/dirty/conflict/rearm qualification awaits its owning source cohort.

The real hosted family now includes eight cases, adding the existing
recoverable startup Retry and tampered-before-load selection fence to the normal
native/daily/conflict/recovery/integrity/vault-switch flows. Negative installed
plugin loading records and asserts the expected plugin failure; Svelte and
uncaught runtime diagnostics stay fatal without allowlisting. Partial Retry
reuses the live App observer; only final disposal detaches/drains it. Installed
plugin integrity is separate from app signing, which remains deferred.

Owning Tasks `703a88e09ac3bec67045a0b03e61a5b6c7a37f64` adds the existing
editing-registry handoff: source re-read and native admission stay within the
guard; lifecycle/daily/retry use all-file protection, single-file mutation uses
its path, and client-reference writes stay outside it. Local guard refusals do
not claim unknown native admission. Full source `dfd49021` passes 2,875 units,
27 native and 63 cold catalog cases plus all strict/build/package/static/spec
gates; final receipt spec `4068543c` passes. Public build archive is 232,143 bytes,
SHA-256 `9522bdb74d8b7489a92348563cf46d10a7fe905c62928c2166bcd8741b6dbefd`.

Real eight-case host run `9f6c99cb` uses coherent ac580/API5d and this qualified
Tasks archive. The actual editor-intent browser scenario is prepared separately
and remains unselected until its native/API/Markdown source cohort qualifies.
Only Tasks fixtures explicitly select Europe/London for the test-owned server;
other hosted tests preserve their inherited process timezone. No global/OS
setting changes.

## Coherent host selection and recoverable Retry repairs

Real run `9f6c99cb` finishes **one pass/seven failures**. Five cases expose an
uncaught generated-write authority error: native Tasks selected the shared
native writer while the hosted App retained renderer metadata ownership.
The exact host composition baseline `4e65791e` has **two failures/four passes**
for required native metadata and default-off Tasks selection. The repair makes
`VITE_LAPIS_NATIVE_TASKS` an explicit default-off staged selection and binds its
required native metadata owner and editor-intent transport together. The Tasks
lane declares native Tasks/metadata; Node and normal Rust-hosted defaults stay
unchanged. No native authority check or console guard is relaxed.

The same real run proves startup Retry incorrectly disposed its reused App's
controller and metadata cache, detaching Tasks irreversibly. Partial cleanup now
stops tracking and disables configured plugins while retaining those App-owned
observers; final disposal alone detaches/drains and disposes them. The tampered
load test also corrects its expected virtual path from `.lapis` to the actual
`/.lapis`; its expected single failure and zero Svelte/runtime errors remain.
The stale-source admission case passed before these repairs. All eight actual
cases are rerun, with the independent editor-intent cold/dirty/conflict gate
still waiting for its qualified owning source.

Composition after-check `1fe36507` passes all six exact Tasks transport/default
selection cases. Spec run `75c92f94` was refused by the global four-worker guard
before checks; run `00a04246` then passes canonical validation and governance
regressions but finds the missing mapped plugin-model chapter at spec-first.
The App ownership chapter now records the staged owner dependency and Retry
lifetime. The host workspace has rebased onto committed reader/current Tasks
`2e9ed95c`, preserving its complete reader SDK and History intake. Its ignored
installation uses the same twelve public dependency entries as current main,
plus only the qualified Tasks9522 package; no owning API override is used.

Run `f2d9fb0a` improves to **six passes/two failures** with a clean fatal runtime
and Svelte guard. Completion/cold recovery, daily lifecycle, stale source,
installed-byte integrity, same-App startup Retry and tampered-before-load fence
pass. The remaining two failures are exact fixture affordance mismatches:
production uses the `Open command palette` ribbon button, and the Create New
Vault accessible name includes its description. Captured page snapshots retain
both actual controls. The fixtures now use those real controls; the focused
registered `test:server:tasks:recovery` lane reruns the two exact cases without
weakening their identity, UI, cold-recovery, admission or detach assertions.

Focused run `dd1c2e22` passes vault switching; recovery reaches the production
palette, whose command filter is named Actions. After correcting that fixture
label, run `8051ce59` passes the semantic recovery checks (including the actual
persisted request reference and two read-only inspections), but the fixture
stops its backend while the page still has a debounced layout write, producing
a retained fetch error at teardown. The fixture now navigates its owned browser
realm away before cold restart and backend shutdown, preserving pre-teardown
failure snapshots and keeping every runtime diagnostic fatal. This shared
fixture change requires rerunning both the exact recovery pair and all eight
Task host cases; the existing six-case pass is not used to waive that gate.

Exact after-run `cec8eb28` passes both recovery/vault-switch cases with the
correct browser-before-server lifetime. The recovery test proves the actual
plugin-data reference contains the accepted UUID/path/action without replacement
bytes, then invokes the existing Actions palette command twice across reload
and cold restart. Both inspections are read-only, the journal contains one
accepted completion and no retry is sent. Vault switch retires the old client,
keeps native Tasks enabled and permits reopening the original vault.

The full eight-case family is rerun after shared fixture changes. Tamper recovery
also asserts the saved Tasks enabled choice is preserved while only the invalid
bytes are restored; no test reset of configured plugin state is needed.

## Current foundation and concurrent settings qualification

The complete real installed-plugin family `33d5d44e` passes all eight cases on
committed reader/current-Tasks `2e9ed95c` and Tasks archive `9522bdb7`: completion
and cold restart, matched London daily lifecycle, stale admission conflict,
unknown-response UUID inspection across reload/cold restart, verified installed
bytes, existing startup Retry, tampered-load fencing and vault switch.
Runtime/Svelte diagnostics remain strict; expected tampered-load failure is
asserted separately. This evidence does not qualify the newer editor foundation.

Current hosted work is rebased onto committed editor foundation `d89c0fbe`.
Additional actual two-App acceptance opens a second App before an interrupted
update and then saves its ordinary planner setting. The source storage repair
moves only inspection references to existing atomic App database metadata;
ordinary plugin settings and the native journal retain their existing roles.

Baseline `05ab8beb` on the retained Tasks archive does not reach submission:
its cached plugin-data save is refused with BUSY on `.lapis/app.json` and host
shutdown reaches its deadline. The fixture's settings assertion nesting is
corrected in the next run. This failed admission is not claimed as a completed
lost-reference reproduction. Source exact checks pass34/27; full source
qualification, new public pack and actual hosted requalification follow.
Actual dirty editor/conflict/rearm/recovery remains a separate Working gate.

The source repair is committed as `9551ce2a`; owning full run `1db3d180` passes
2,882 unit/27 native/63 cold catalog cases, strict/check/build/publint/static/spec
and public pack. Final receipt-spec `983b4cae` passes. Exact source pack SHA
`ff64c349777bb4331f87dc2e6f8412dc92c7e05e423572fdaad455434f995c6b`
is selected only in the ignored consumer validation manifest.

Earlier-cohort baseline `918cce4b` on frozen hosted `2670c143` (parent `2e9ed95c`)
reaches one completed native submission and unknown-response guidance. The stale
second App's ordinary settings save is refused with `File changed since it was
read`; collapsed navigation never persists, and the strict runtime guard fails.
The conditional host writer protects against an actual overwrite. This is an
unnecessary cross-App settings conflict; it is not evidence of erased references.
The exact after-check retains the same test/source cohort and substitutes only
the new qualified Tasks package.

Exact old-cohort after-run `564d0a35` passes the actual two-App case with source
`9551ce2a`/archive `ff64c349`. The stale second App persists its ordinary collapsed
planner setting; the first App's UUID remains inspectable through the production
command after reload. Exactly one native submission is accepted, no retry occurs,
the completed Task stays persisted, and runtime/Svelte diagnostics remain empty.
The intermediate after-run `c1eb6fcd` failed only because the fixture polled the
now-absent initial `data.json` without handling ENOENT; the repaired poll waits
only for first-file creation and still requires actual persisted settings.

Current editor-foundation host checks pass: six Tasks composition/transport cases
in `cf9c224f`, four editing-intent binding cases in `f4b01891` and full canonical
specification run `0dd87e69`. General strict Web preparation follows before the
coherent recovery parent and complete hosted/editor acceptance.

## Strict preparation and unattended clock tightening

Current editor-foundation strict run `3fa454b1` passes root routing/progress,
native boundaries/protocol/fmt/clippy, canonical/ownership checks and the complete
Web Svelte/types/e2e checks (nine successful Turbo tasks). It does not qualify
actual configuration-writer admission; that source repair remains separate.

The private London clock test now selects its provider only once. Twelve UTC
instants cross spring/autumn DST transitions and local midnight with no clients
or configuration/reindex signals between instants. Native timeout scheduling
retains one daily observation per task/date and leaves the authored Task
unchanged. Exact fully-qualified run `d98c5463` passes one selected native case.
An earlier selector `76b1af96` selected zero cases because `--exact` was combined
with a shortened name; it is not counted as qualification. Complete native and
actual coherent host gates remain required after final source intake.

Current hosted work is rebased onto committed recovery/main `029e2c22` over
qualified CORE025 `b55e03c5`. Conflict resolution retains all root recovery/restore
requirements, source statuses and evidence, plus the separate hosted Tasks row.
The default API remains built from the owning Notes tree; no older API archive
is substituted. Actual complete host/editor acceptance waits for the CORE026
configuration-writer source repair. Tooling run `75143d19` passes the complete
validation helper suite for the new portable native Tasks command registrations.

## Guarded leave preparation

The Root-owned CORE027 facade supplies native recovery preflight and existing
Problems actions. Hosted switch/archive/logout will await it before the
disposed fence, Tasks/chat detach, view/plugin/cache cleanup or client release.
Preflight refusal retains that App and Problems, notifies through the existing
App service and remains explicitly retryable. Concurrent callers join the full
leave promise. Later cleanup failures remain distinct from refusal.

Exact helper baseline `b42d217a` records one missing-module suite before the
private lifecycle gate exists. This is preparation against the agreed upstream
method; the current parent lacks the not-yet-qualified CORE027 signature. It is
not a qualified API/host cohort. Actual failed switch/archive/logout acceptance
with real dirty editors follows the committed CORE026/027 and Markdown/Mira pins.

Guarded leave exact after-run `d74d5321` passes all five private lifecycle cases,
including no destructive work before preflight, refusal identity/notification and
explicit retry, full concurrent join and distinct later cleanup failure. These
helper passes do not qualify the actual shared preflight or host behavior.

Current integration is rebased onto frozen Root candidate `cd781caf` containing
CORE026/027. Its exact current sixteen-archive input is read from the separate
`lapis-notes-editor-problems-20261026` workspace, with Markdown `d8e7bb59`,
protected Mira and Tasks `ff64c349`; owning API builds from the Notes tree. No
older API or Markdown fallback is selected. Both complete source closure and
actual full hosted/editor/leave acceptance remain unqualified until they pass.

The strengthened final-flush exact baseline `88487c07` has one failure/five
passes: a guard-time save failure before the disposed fence did not reach the
refusal notifier. The corrected gate treats any failure while the App remains
live as a recoverable refusal, awaits resumed watching and retains the original
error when resumption succeeds. Later cleanup failure stays distinct.

Web disposal now adapts Desktop's existing stop/drain/guard order: stop watching,
drain plugin/config/owned operations, inspect native recovery, then hold the
all-writer guard through final persistence and destructive view/plugin cleanup.
The disposed/Tasks/chat fence follows successful guarded writer flush. Registry
and session closure remain outside the queued guard; failed preparation restores
watching and retains App settings, Problems and compatibility resources.

Actual editor run `a4178e9b` passed every native dirty/refusal/owned handoff/rearm
and exact saved draft assertion, with two submits/no retries and zero diagnostics.
It timed out waiting for the hidden close control of an inactive Hosted tab; no
close click was dispatched. The fixture now activates/hovers the real tab before
closing. This is not evidence of a registry close deadlock; that initial theory
was withdrawn. Invocation `5f9f14c5` never started checks because SSH connection
was refused; reachability recovered and the actual run is retained separately.

## Real editor close and guarded leave checkpoint

The corrected real editor run `6bcccbe5` dispatches the physical close control,
then fails the exact native-state retirement assertion: one Hosted.md claim
remains active/clean at generation two, revision 37. Cross-browser dirty refusal,
owner flush, native completion, draft retention and same-ID rearm all pass before
that assertion. Native shutdown subsequently exceeds its existing fifteen-second
deadline; that cleanup failure does not replace the retained assertion evidence.
The shared editor owner is investigating the source lifecycle. The test now
asserts tab/editor DOM removal and retains the primary assertion and native states
before cleanup. No timeout or expected-retirement assertion is weakened.

Guarded-leave helper run `28ce1977` passes six cases after adding commit-time
writer failure before the disposed fence. A prior strengthened baseline
`88487c07` has one failure and five passes. Actual hosted switch, archive and
logout cases now create a real second-browser unsaved draft, detach its admitted
client, refuse leave without replacing the shell, expose existing Problems
actions, explicitly discard the captured claim and retry the original action.
Those browser cases and complete current-cohort checks remain pending.

Diagnostic-only source run `4ad4be4f` narrows the close refusal: accepted native
Tasks completes and rearms, then close settles zero operations and completes
layout persistence. Its guard protects all five writers; the four logical state
writers flush, while Hosted.md flush refuses before any second native Yield.
The tab and editor remain mounted; one existing Problems issue is visible. No
Editor destroy/unregister runs. The temporary source trace candidate is not an
adopted production change; current hosted work is on Root's `6da6bc8a` candidate.

Guarded-leave run `b4ac6604` passes the actual failed-local-save case: refusal
keeps the same shell and draft; explicit retry persists that draft and completes
logout. The remaining four failures are fixture defects (a missing held-write
flag and an editable-only locator used while asserting protected input), repaired
without weakening product expectations. Current five-case rerun `d5329d85` also
asserts saved bytes remain unchanged before simulating loss. Earlier `cad62e26`
reaches the existing Problems discard path in all three actions but lacked that
unsaved-write checkpoint; it does not qualify lost-draft preservation.

[Hosted editing and leave acceptance](2026-10-26-hosted-editing-leave.md) records
the repaired actual editor journey and all five guarded-leave passes, separates
fixture calibration and the stopped install, and tracks the final15-case cohort.

Final staged-host closure is qualified in the [current editing/leave receipt](2026-10-26-hosted-editing-leave.md):
39 actual hosted/local browser, seven exact leave, 563 Rust, 2,394 package and
263 cold catalog cases pass, alongside full strict/check/build/specification
gates. This isolated hosted slice retains explicit native opt-in; Desktop, main
cohort intake, the separate native-preview source repair and complete R3 remain
separately gated. No defaults, publication or app-signing work follows.
