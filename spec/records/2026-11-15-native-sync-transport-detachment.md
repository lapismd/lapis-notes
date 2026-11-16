# Awaited native Sync presentation transport detachment

15 November 2026. LN-PKG-189/193. Source qualified above Notes main
295776210a84f8048ce67f2a43785f7785bfb525.

Desktop integration needs App teardown to await release of its native view
handle/channel before closing the admitted vault. Existing NativeSyncService
only stops synchronous observation and drains active leases; a supplied async
transport-detachment hook is never called. The exact real-App MetadataCache
disposal case fails0/1 with the detachment callback called0times, after an
accepted native-call reply is drained and correctly rejected as revoked.

Command: pnpm test -- --filter=@lapis-notes/api --task-args
src/lib/**tests**/native-sync-service.test.ts -t 'App disposal awaits transport
detachment after accepted native Sync calls drain'. Report
lapis-notes-validation-4ab2ea5f-be6d-4317-b7db-3f17e3622f74. The eight other
cases are filtered out, not qualification. An initial invocation omitted the
runner's --task-args marker and failed Turbo argument parsing; reportbf6664f9
retains that infrastructure attempt, not a functional before count.

The portable optional NativeSyncPort.detach hook revokes presentation resources
only. It cannot close the native service or cancel accepted durable work. App
NativeSyncService awaits it after call drain, propagates errors and retains
single-flight disposal. Existing resource-free ports remain valid. Source and
packed consumer qualification follow; actual Tauri/OS custody, scheduler,
enrollment/transfer and complete Sync remain the owning native gates.

Managed Docker is explicitly selected through the existing omarchy/ssh-cli
context at4CPUs/12GiB/2GiBshm. No host fallback or policy change is used.
Source, fixture observations and actual native qualification remain distinct.

The exact first regression passes1/1 after the optional awaited hook, report
69e56ef3-6f8c-4bd9-9135-0ee0e58f4fe6. Expanded lifecycle coverage then exposes a
retired-lease call omitted from App drain and an unhandled Sync cleanup rejection
while an accepted Task call remains pending. The first expanded run reports
12passed/1failed and2unhandled errors; one secondary error came from the test's
eager rejected expectation. The fixture now attaches that expectation only when
awaiting it, retaining its original ordering assertions. The unchanged expanded
source recheck reports12passed/1failed and1unhandled rejection, report
36b49b90-e322-49cc-83d0-035a46ff749c. No assertion or error-fatal policy changed.

NativeSyncService now tracks accepted invoke promises independently of active
observation leases. Disposal drains those same promises before transport detach;
command failures stay on their original calls. MetadataCache observes all
started native service drains through one all-settled join before reporting
single or aggregate cleanup failures, preventing a fast rejection from becoming
unhandled behind a slower owner. Neither join schedules work or retries a
mutation. Lease invocation additionally requires the service's own live selected
lease. Complete source, artifact and consumer qualification remain open.

## Source qualification before leave-fence integration

The complete detachment API suite passes 14/14 (04a7135f-b71b-4b3f-bd9c-0ae730b0ffc3), and the directly affected lifecycle lane passes 89 cases in eight files (b12b4b7c-ad5c-4721-899f-8252cb199d3b). Root check passes 16 tasks with types 0 errors/0 warnings (e6e0e6f1-e7f6-4ff5-b6a8-6510fd586713); root test passes 2,283 cases in 252 files across nine packages (a669c029-1477-4488-bc97-066d3ce5d973). Root build passes (87b3ba53-953d-4bf1-b539-0a77820e1556). Full cold Storybook passes 288 cases in 63 files through four sequential shards (105 + 73 + 48 + 62; report 15e6d644-b6f9-4253-b09d-106c4c578d81).

The subsequent specification gate fails SPEC-FIRST-MISSING LN-GOV-003: the API lifecycle change also requires its canonical architecture chapter (9c8e83d5-03a1-4309-9bf5-99f01df8fe5a). The ownership chapter now describes this same boundary; no mapping or gate is weakened. These passes precede the additional leave preparation below and do not qualify its changes.

## Recoverable leave preparation

Inspection of shared App Profile teardown identifies a possible cycle: teardown holds the whole-vault writer guard while waiting for MetadataCache to drain native Sync, and a previously accepted apply may be queued behind that guard. LN-PKG-193 adds preparation that fences new calls/selections synchronously and drains existing calls before writer-guard entry. Observation and the same lease remain live. Refused leave idempotently releases the fence; an old release cannot clear a newer preparation, and releasing after disposal cannot revive the service. No native work is cancelled or retried.

The exact new regression `refused App leave restores the same native Sync lease and live observation` fails 0/1 because `prepareLeave` does not exist (f5b96233-14ba-4f10-a191-5d702c980e05). After implementation it passes 1/1 (6450db18-c7cd-4bea-bda2-1ba3825f3715). Expanded API coverage passes 18/18 in two files (9c28efe8-55d6-4aef-aa39-777eecfc5bb0), including a queued real writer-guard apply draining before teardown, overlapping preparation rejection, retained observation, stale release safety, permanent disposal and original command-error ownership.

App Profile acquires preparation before its other preflights and releases it on refusal or in a teardown finally block. Shared lifecycle, complete source, public artifact and Desktop consumer qualification follow. Actual Tauri/OS custody and complete Sync remain unqualified by these fixture transports.

The first shared App Profile lifecycle run reports seven passes/two failures (7cc16469-17ad-4668-b9dc-7cf1002e2a66): the new fence release ran after compatibility release, violating the existing last-owner assertions. Source now releases the fence before final compatibility release, with an idempotent finally fallback for failures. The unchanged nine-case lifecycle suite passes 9/9 (827d3440-587b-4cf3-a276-7fa821516543). No assertion was weakened.

QMD discovery of LN-PKG-132 resolves the owning package/lifecycle chapters. `spec-validator doctor` reports ten passes and the existing script-alias warning; live npm confirms 0.2.0 remains the current Deno-free validator. The first search invocation incorrectly supplied an extra `--` to the pnpm script and failed argument parsing; the corrected query succeeds.

Expanded API lifecycle qualification passes 93 cases in nine files (e7567cbc-c143-44da-86bf-9047e9f03d80). The first root check fails SPEC-VERIFY-UNMAPPED LN-GOV-002 because the new LN-PKG-193 row was appended after the verification table (bc5e2587-9d00-431b-8e54-a31c07140aca). The row now belongs to the existing table; the validator is unchanged.

A second check (b34cdb3b-71a4-4e27-b2f0-390a2491d0a3) retains the same unmapped-row failure: a remaining blank line still separated the row from the table. The source correction now inserts LN-PKG-193 directly after LN-PKG-192 with no intervening paragraph or blank row.

## Complete source lanes after leave integration

Root `pnpm check` passes all 16 tasks, including public built types, all affected host/package checks and App ownership (412ec7e0-10ed-4c65-bcc1-a949280456e8). Root `pnpm test` passes 2,290 cases in 253 files across nine packages (6b5831f5-9024-46e3-9b09-c7cbc909c73a): API 1,832/184 files, App Profile 102/19, UI 17/4, Language Service 18/3, File Explorer 39/9, Workspace 44/10, Host Services 9/3, Web 39/11 and frozen Deno Host Services 90/10. The root run records 16 successful tasks including seven cached prerequisite builds; these are not additional tests.

Root `pnpm build` passes all nine tasks (6275b8cd-002e-41f6-bce6-5cb07d95cb06), retaining the existing frozen Deno Host Services no-output advisory. `pnpm spec:check` passes canonical validation, mdBook, protected-change mapping, App/metadata ownership audits and 69 specification-tool cases (d2bd9d4d-332f-418b-be63-e45f50e0a7ab). Complete cold Storybook interaction/accessibility is still running; public archive and Desktop consumer gates follow separately.

Full cold `pnpm test:storybook` passes all 288 interaction/accessibility cases in 63 files across four sequential fresh-browser shards (105 + 73 + 48 + 62; report 08735578-c46f-43c9-bb45-424a0833ccaa). No skipped cases, assertion changes, visual baseline updates or native-provider fallback qualify this slice. Public archive production and Desktop integration retain separate provenance and acceptance gates.
