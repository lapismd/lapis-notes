# Rust managed-vault intake

Baseline: Notes `99e88191`. R1.3.9.1 connects the retained hosted chooser's
Create, Rename, Archive and Restore actions to Rust. No replacement screen,
Node fallback, public npm API or lapis-ai change is introduced. Existing
transfer and installation scope is explicit in R1.3.9.2/.3, not newly added.

## Native and transport acceptance

The exact native HTTP regression is
`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm rust:core -- test -p lapis-server --test managed_vaults creates_a_host_owned_vault_and_admits_its_existing_file_service --locked`.
It moves one HTTP 405 failure to one pass. The initial implementation encounters
four error-conversion and two module-visibility diagnostics, repaired without
suppressions. The complete managed-vault target passes all seven cases, including
real file publication, empty-profile startup, persisted configured-vault names,
cold archive/restore, stale-client fencing and dirty-editor protection.

The initial family has six passes and one test-contract error: an unknown JSON
field already returns 422 through the retained parser, while invalid names return 400. The repaired exact case asserts both 422 and `INVALID_REQUEST`, then passes.
The final seven-case family passes again after attachment admission and archive
fencing share a short catalogue lock. This prevents a client registration from
being inserted between archive's fence and retirement.

The separate library case
`accepted_catalogue_work_survives_a_cancelled_caller_and_drains_before_shutdown`
passes using real Control storage and native directory creation. It holds the
private operation gate after acceptance, cancels the caller, starts shutdown,
verifies shutdown waits, releases the gate and checks published bytes/catalogue
identity through a cold Control reopen. No production instrumentation is added.

Native paths remain installation inputs. Created roots use host-generated UUIDs
beneath private `vaults/<id>/content`; control Turso persists names, archive state
and physical identity. Missing/replaced storage fails explicitly. Names do not
select directories. Archive drains the shared file/database/backup owner, and
Restore preserves the original root, vault ID and history identity. Failed dirty
preflight keeps the original owner usable. Catalogue tasks outlive response
waiters and drain before application shutdown.

## Retained application acceptance

`pnpm --filter @lapis-notes/web exec vitest run src/hosted/rust/backend.test.ts`
moves two failures to two passes. The selected host advertises management;
Create/Rename/Archive/Restore use only versioned Rust routes and preserve archive
state. Transfer and installation remain explicitly unavailable on this profile.
All 52 Web unit cases and Web source/e2e type checks pass with no warnings.

`pnpm --filter @lapis-notes/web test:e2e:rust-server` first builds the retained
production renderer and real Rust executable. Configured-vault login/edit/save
passes. The new management journey exposes a test-only ambiguous New tab selector,
then a second test-only assumption that the generic empty view has the separate
Lapis landing view's action. The trace shows the real Explorer `Create File`
control; using that actual product action repairs the journey without changing
screens, assertions or timeouts. The exact management journey passes in 12.3s;
the complete two-case family passes in 14.7s against fresh isolated profiles.

The journey creates a vault through the existing chooser, creates and edits a
real note, renames/archives the active vault, verifies bytes, restarts the actual
Rust process and owned static preview, then restores/reopens the same note.
Archive of the displayed vault awaits its existing workspace/plugin disposal
before retiring native admission, preserving final file writes.

The retained Node 24 acceptance also passes its complete editing, sharing/events
and process-restart scenario (one case, 19.8s):
`PATH="/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH" pnpm test:server:e2e:host`.
This remains separate from Linux/container qualification. All fixtures use owned
temporary roots; no user vault, deployed service or installed app is modified.

## Source and governance qualification

The complete source unit run passes 259 ordinary Rust cases with five existing
real-model cases ignored, followed by all 20 package tasks. All 261 catalog
functional/accessibility cases pass in four cold shards (93/71/42/55).
Full source check passes all 20 tasks, with generated protocol drift, Rust
boundaries, normal all-target strict Clippy and source types checked. The first
check reports two missing specification-mirror/order diagnostics. Adding the
metadata-only mirror and regenerating from SUMMARY repairs them. A subsequent
topic-index diagnostic is repaired through `pnpm spec:mirrors`; the original
`check:specification-docs` target then passes. No checker is weakened.

All ten specification lanes and 49 validator regressions pass. Full source build
passes all eleven package tasks and native workspace build. After the final admission fence, the complete source unit run again passes
259 Rust cases (five existing model cases ignored) and all 20 package tasks.
The native workspace plus all eleven package builds pass. Both final cold Rust
browser journeys pass (15.7s). Logs remain under `.local/rust-managed-*`.

The final cutover is still open. R1.3.9 retains transfers/installation, R1.3.11
retains both-shell file actions, and R2-R7 retain the agreed service migration.
Desktop backup intake separately passes all 2,000 catalog cases and its original
native lifecycle surface; its consumer commit remains gated by disposition or
source-qualified repair of the earlier Markdown image failure. M11 is Deferred.

## Desktop dependency compatibility

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked`
passes both original Desktop file-service cases against this source after a
1m51s dependency rebuild. The existing compact-unwind linker warning remains
visible and is not suppressed. Lapis AI is verified clean at qualified revision
`6548afe0`; this slice changes no AI source. This proves native dependency
compatibility, not a new packaged Desktop UI/bundle qualification. Its earlier
backup evidence retains Notes `6f637449` and its recorded source/artifact scope.

R1.3.9.1's original source, transport and retained-screen gates are complete in
the enclosing commit. Root MIGRATION remains timestamped, grouped, sorted and
spec-linked. No publication, deployment, installed-app replacement or signing
acceptance is claimed.
