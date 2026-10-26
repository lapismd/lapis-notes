# Coherent Search and Bases source intake

Status: source-qualified; unchanged repository baseline findings remain recorded.
No publication or default-host cutover.

## Scope and ancestry

This source snapshot combines frozen native Search adapter `5d0397f4` with the
already-qualified Bases accessibility fix `1faa35a1` and its CSV key-order
prerequisite `aa71d8fc`. Native Markdown/Canvas services remain those of
`5e0dffc3`. The independent default checkout and its dirty lockfile are preserved.

Only CSV chapter prose/format conflicted. Resolution preserves the current CSV
behavior from `5e0dffc3` and the prerequisite's metadata-order explanation.
All 176 Search/native/Markdown/CSV product inputs match `5d0397f4`; all 112
Bases product/story and CSV-manifest inputs match `1faa35a1` byte for byte.

The existing Search, Bases and distribution contracts are unchanged by this
integration. The existing source records retain their own implementation proofs:

- `2026-10-26-native-search-adapter.md`.
- `2026-10-25-bases-filter-names.md`.
- `2026-10-25-csv-metadata-order.md`.

## Original cold baseline

Corrected baseline receipt `5e4f52c5-923b-42f9-9b48-5e31a7ff51d0`, frozen
snapshot `711c1770e0b050d3f328ddd0e0f751bd37efd120`, uses unchanged parent
`5e0dffc3` and the same 13 checksummed public dependency archives as Search.
The temporary predecessor worker had omitted the private Sync install already
present in the tracked Docker worker. Restoring that exact standalone frozen
install removes the failed scan and late optimizer reloads without code edits.

- `node --test scripts/oidc-publishing.test.mjs`: nine pass, one existing
  committed-lockfile policy failure (`pnpmfileChecksum`/machine-local entries).
- `pnpm test:storybook stories/plugins/search`: all 16 pass cold; no late
  dependency optimizer reloads.
- Unsharded `pnpm test:storybook`: 198 pass, six Bases failures and one browser
  connection closure; only 204 cases execute. This is not full-catalog success.
- `pnpm build-storybook`: passes with the corrected Sync dependency install.

The six failures are Editable Cells, Query Controls, Schema And View Settings,
Filter options, Grouped list and Shell/Desktop. The known qualified Bases source
fix is integrated rather than reimplemented or treated as an avoidable waiver.
The final complete catalog uses the repository's four bounded cold shards.

## Combined gate

Exact Search, exact Bases, the first three catalog shards, static catalog,
all package check/test/build, specification and public Search artifacts pass.
Final complete-catalog qualification is recorded below.
The runner records each command and retains failures; it never relabels a failed
aggregate as passing. Existing audit/style/release-policy failures remain
separately owned repair work. Visual baselines and publication are unchanged.

## Browser lifecycle regression

Combined full receipt `be42089b-4f1c-4c9f-9d3d-7510ff6c22f7` passes
Search 22/22, cold Search 16/16, Bases 7/7, and the first three cold catalog
shards (60, 98 and 55). The fourth passes 69 cases then closes the browser before
Link Preview Acceptance runs its two cases. All package checks/tests/builds,
static catalog, specification, package policies and public Search artifacts pass;
existing audit/style/release-lockfile failures remain separate.

Exact cold receipt `03b1a62a-617c-4279-acf6-cf4fb18ce98a` passes both missing
Link Preview Acceptance cases, but repeating shard four reproduces the same
69 passes plus final-suite browser closure. No functional assertion fails.
The original combined worker's cgroup reports zero memory/OOM events, with
8.50 GB peak below its 12.88 GB cap.

The explicit Node/browser serialization experiment at `d32a18fb`, receipt
`379ad29c-d4f0-425e-b905-2d56a8cf9ec7`, reproduces the exact same 69-pass
final-suite closure. It does not repair the regression and both configuration
changes are reverted. No failed experiment is retained as a purported fix.
Unchanged-parent receipt `5feba2be-95b4-4490-9dcf-5903161552c1` explicitly
checks out `5e0dffc3` with the same archives. It completes all 71 fourth-shard
cases: 70 pass and the known Bases/Desktop accessibility assertion fails.
Both final Link Preview cases pass. This does not reproduce the candidate's
disconnect, so that failure remains unexplained and the gate stays open.

Diagnostic receipt `ec05ab02-2451-4849-b0d3-e155a9cdba86` has 61 passes
before both tester and orchestrator disconnect while importing Bookmarks media.
Chromium remains alive until ordinary provider teardown; no browser-process
crash or cgroup OOM is reported. Socket diagnostic receipt
`5dc78b9e-184e-49a0-ad62-57e89a042a77` again passes 69 cases, then receives
client-end events for the tester and orchestrator before normal server closure.
These ignored probes change no product, assertions or tracked runner settings.
Page diagnostics `2b3c81a0` and `f6006a2c` again retain 69 passes before the
disconnect. They report no page crash, main-page navigation or explicit client
WebSocket close before the failure. The final sampled JavaScript heap is about
625 MB; no resource limit is relaxed. A failed initial diagnostic provider setup
executes zero cases and is retained separately.

## Complete current-headless qualification

Receipt `e7c95a68-e6e5-4274-b74e-64872673f44c`, snapshot `2d03a11b`, selects
Playwright's `chromium` channel in the isolated Vitest configuration. The exact
previously failing fourth shard passes all 71 cases with no disconnect, followed
by all three other cold shards: 60, 98 and 55 passes. All **284 catalogue cases**
pass across 56 files. The four commands retain their full assertions,
accessibility checks, isolation, tags and test selection. No probes, timeout
changes or failed serialization experiment are retained in tracked settings.

The permanent Vitest configuration selects that same current headless channel.
Runtime packages, stories, scripts and Storybook inputs remain byte-identical
to the fully checked/built/packed functional snapshot `f0649bc3`. Only the test
browser selection and specification/evidence change. The old-headless failed
commands remain failed in their receipts rather than being relabelled.

The source-built Search npm archive has SHA-256
`aa1caa1edfa3a77bbb7a9a90ef032538f99a49997869c22db77c03cb1a164b5c`;
the verified plugin payload has SHA-256
`7026ab08095ba3340e0214dd1428e93de96ddab7252e04b854b9fd3c05fd00d8`.
Both are private artifacts from the unchanged functional snapshot. Host adoption,
registry publication, distribution and visual baseline approval remain separate.

Final governance receipt `abda5f6a-e093-4250-a1b1-1bc7de92266c`, source
snapshot `1dfd2018`, passes all 47 runner/composition regressions, complete
specification/App ownership and Storybook parity (57 families, zero findings)
against the tracked current-headless setting. The patch Changeset records the
native Search behavior for future release; it does not authorize publication.
The separately reproduced audit, CSV styling and committed-lockfile findings
are preserved; this does not claim a clean audit or aggregate release command.
