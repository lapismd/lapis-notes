# Native History index owner source qualification

R3.2.3 source work implements LN-CORE-003/005/006/007/008 through the retained
`jj-vault` historical Search engine. Notes owns the scheduler, not checkpoint
or index formats. Host selection and removal of the renderer scheduler remain
separate gates. The user explicitly approved the Rust-only
`BackupStorage::with_history_indexing(bool)` and
`VaultService::history_indexing_status()` contracts during this source slice.
No HTTP, renderer, operator or host-default change is made.

## Narrow boundary before implementation

The exact target is
`services::backup::history_tests::selected_history_index_publishes_without_a_client_or_renderer_step`.
It starts the real native backup with private History selection, detaches its
only client, and expects an existing background index to answer an immutable
query. The query helper refuses to create the cache before publication and
never calls `index_step`. The companion unselected case preserves the default.

The implementation baseline records a private selection flag but no scheduler.
The exact Docker command is
`pnpm validation:rust -- test -p lapis-app-core --lib services::backup::history_tests::selected_history_index_publishes_without_a_client_or_renderer_step --locked -- --exact`.
On source `05e804e1`, run `9950e6dd-72e7-45d3-9976-0ad232fe674b` reports
zero passes and one failure after 12 seconds: no service-owned History cache is
published. One unused test fixture field is also reported; it will be exercised
by cold-reopen qualification. No assertion is weakened.

The same exact command on `fcae7a70`, run
`9b01ab13-0aab-475f-b8a7-589d5a73cfff`, passes one case in 0.08 seconds.
The expanded real-checkpoint family on `8e596e07`, run
`ce583b83-491b-4611-a1e0-b2df6a1ec4c2`, passes seven cases with zero failures
in 5.35 seconds: initial publication, unchanged default, external capture after
detach, cold cache rebuild without a new checkpoint, disable/re-enable,
replaced-root failure/repaired close and independent vaults. The unused fixture
field is now exercised by cold recovery; no warning remains in that run.

## Worker abandonment regression

An accepted batch may retain the last vault Arc after its Runtime is abandoned.
Its final release can then drop the derived owner on its own worker. The exact
target is
`services::backup::history::tests::last_owner_dropped_on_its_worker_signals_stop_without_joining_itself`.
Run `3abecb4f-e7bd-4c09-88ba-30333a3ac5d9` on `992f085e` reports zero passes
and one failure: joining the current thread panics with OS error 35. The owner
now signals retirement but avoids joining itself; controlled external close
still joins normally. The exact repaired target and widened gates follow.

The exact abandonment target now passes one case with zero failures in run
`86da64ed-0dc5-420e-9a38-3ebb2aa59469`, source `3dacabf5`. The approved native
selection/status APIs are included in that compiled source. Expanded public-status,
backup-family and complete source checks follow before commit.

## Tracker authoring

The first local generator/check attempts could not import the absent Prettier
tool. A normal ignored node_modules directory now links only the pinned
documentation tools from Notes main; product validation remains Docker-only.
The next attempt correctly rejected the new task's chapter-only link without
an owning requirement anchor. It now links LN-CORE-003, retaining the dedicated
History chapter in the source record/navigation. No checker was changed.

## Expanded source gate

All nine backup-family unit cases pass on `f8ca3105` in run
`9608d216-624f-475f-b143-79d2ae0393a8`, including the seven real-checkpoint
cases, worker-abandonment regression and retained cancellation/drain case.
The approved cached status reports actual selected, unsupported and closed
states. No warnings are emitted.

The initial complete `pnpm check:all` run on `05b435b0`,
`d67a679b-aa47-4e73-b50b-8b5c0a48bace`, stops before product tests on two
specification findings: the new chapter lacks its metadata-only Storybook mirror
and generated navigation order. Run the existing `spec:mirrors` generator; do
not suppress either finding. This generated Storybook configuration change also
requires the complete cold interaction/accessibility lane before qualification.

The mirror/order generator repairs both findings. The first local validator
follow-up then stops because its linked CLI cannot resolve the scoped
spec-validator package; the ignored documentation-tool directory now also
links that pinned public package. Complete Docker `pnpm check:all` on
`cbb33cf93939d097f827d368e2ae950c43550e60`, run
`921febd6-57a6-4d90-aa3c-08675bb5695b`, passes all 364 Rust cases with zero
failures and six unchanged intentional ignores. Strict checks, protocol,
boundaries, formatting, package checks/tests/builds and native builds pass.
Unchanged package lanes reuse qualified Turbo results; these are not claimed
as freshly executed package cases.

## Dependency-cohort correction

The first cold catalog run `a1f99db9-fad4-4fe4-ad0e-ad6077415141` uses the
reused workspace's older eight-package `mira-dc-remount-20261025` cohort.
Shard two reports three failures: Bases Views / Editable Cells, Bases
Workflows / Query Controls and Backlinks / Middle Top Tabs. Their required
source repairs already belong to the qualified ten-package cohort documented
in the [dependency intake](2026-10-25-bits-runtime-intake.md). The obsolete
run is stopped during later shards; its log and partial results remain failed,
not an aggregate result.

The ignored validation configuration now selects
`final-admission-all-select-20261025/archives.json`. No product source,
assertion, manifest or lockfile changes for this correction. Exact affected
stories and complete cold catalog qualification follow against that admitted
cohort. The rebase onto R2 closure `0b5ab69f` changes only tracker/evidence and
verification documents; every implementation, fixture and tooling input
matches the passing native source snapshot.

The exact corrected-cohort follow-up is
`pnpm test:storybook -- stories/plugins/bases/BasesViews.stories.ts stories/plugins/bases/BasesWorkflows.stories.ts stories/plugins/markdown/panels/Backlinks.stories.ts -t 'Editable Cells|Query Controls|Middle Top Tabs'`.
Run `be74c404-c06a-498d-aef5-941e63e47eb1` passes four cases, including all
three originally failing targets, with zero failures. Twelve unselected cases
are skipped by the explicit name filter. The complete cold lane follows.

The minimal local documentation tool directory is not a product installation:
the later local validator first reports missing Svelte, then missing installed
plugin command sources. These authoring attempts do not qualify the product;
the required Docker specification lane installs the complete frozen cohort.
The direct tracker regression command is
`node --test scripts/spec-validation/migration-progress.test.mjs` and passes
all 11 cases. An initial attempt used the nonexistent root-level filename;
that invocation runs no tests and is not counted.

Complete cold `pnpm test:storybook` run
`dc7ea7d5-d2f1-4010-85d1-acee89a5bb81` passes all 261 catalog cases,
with four disjoint reports containing 93, 71, 42 and 55 cases. Every report
contains zero failures and errors. Source is
`323d59ccba7d2d86b4ce38ead1bb385ff0a887cb`; its receipt retains all ten
admitted archives. These results replace neither the original failed old-cohort
run nor the separate native source gate. Complete canonical, development and
static specification-browser gates follow before source completion.

Complete `pnpm spec:check` run `912e98de-0846-4d8a-9f96-ca71c19fe767`
passes configured validators and mdBook, then stops on one mapped spec-first
finding: the generated Storybook navigation change also requires its owning
catalog chapter update. The navigation contract and LN-CAT-021 verification row
now name the canonical History mirror. No requirement or checker is weakened;
the complete specification command and both browser modes are rerun.

The repaired complete `pnpm spec:check` passes in run
`a39cc10b-84dd-4a3c-bbc3-7c5be4801c11`, source
`9c7d4c9972239fbee108551850df09916f0dd4bc`, with the admitted ten-package
cohort. Canonical validation, mapped spec-first, mdBook, protocol/boundary,
metadata/App ownership and specification regression lanes all pass. Cold
development/static specification-browser checks remain the final navigation gate.

Cold `pnpm test:specification:dev` passes all eight cases in run
`12b0c0e1-5f4e-4822-9dbf-fdcb69a0367e` on that same source. The retained
main-workspace ignored validation profile also pointed to the obsolete cohort;
its archive selection is now corrected to the same qualified ten-package
manifest. Tracked dependencies remain unchanged.

Cold `pnpm test:specification:static` passes in run
`7f0385d9-150d-46dd-bd38-cb6a26e5918c`: the complete static build renders all
182 canonical chapters and six browser cases pass. Two development-only cases
retain their explicit static skips. Together with the eight development cases,
this completes the generated navigation gate.

## Source milestone review

R3.2.3.1 is Source complete. The source reuses the retained immutable engine,
owns bounded work without clients, repairs cold/disposable caches, observes
external captures, fences replaced roots, keeps vaults independent and drains
on close/disable, including worker abandonment. Nine exact backup cases, 364
complete Rust cases, 261 cold catalog cases, complete specification and both
navigation modes pass. Failed attempts remain above. Final changes after the
qualified product snapshots are documentation/tracker updates only.

R3.2.3 stays Working: Tauri/HTTP adoption, removal of renderer scheduling,
application feedback and original host acceptance are separate work. Native
selection remains off by default. R3, default cutover and release are not closed.
