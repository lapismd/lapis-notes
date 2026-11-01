# Public Notes workspace session and hosted UI cohort

`@lapis-notes/app-profile/workspace-session` now publishes the Notes-owned
composition used by PWA and server. Browser storage, permissions, PWA registration
and host service attachment stay in the web adapter. Desktop retains its native
lifecycle adapter and public shared shell.

The session owns configured plugin loading, plugin settings/browser registration,
daily documents, metadata, database status, staged startup and Retry, layout
persistence and ordered teardown. App ownership and the public disposable legacy
lease remain explicit. A refused leave resumes repository backup/observation
without replacing the live workspace.

## Exact regression evidence

| Target                            | Before                                                        | After                                                                             |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `vault-startup-retry.test.ts`     | 1 failed                                                      | Combined Vault retry family: 4 passed.                                            |
| `sync-host-startup-retry.test.ts` | 1 failed                                                      | Combined Sync family: 36 passed.                                                  |
| Host attachment cleanup           | 2 failed / 2 passed                                           | Session lifecycle families: 11 passed.                                            |
| Native Repository registration    | 1 failed / 1 passed                                           | 2 passed; optional configured registration is retained.                           |
| Refused Repository leave          | 1 failed / 5 passed                                           | 6 passed, including observer/backup resumption.                                   |
| Session retained after play       | 3 failed post-play persistence cases                          | Cold Docker exact family: 3 passed with original deadlines.                       |
| Shared-session and Chat stories   | Startup/import failure and a later browser-connection failure | Fresh source run: 9 passed across the production session and six Chat placements. |

The complete older-cohort catalog attempt
`lapis-notes-validation-4250054f-e693-48af-9495-27b6887da4b6` retains one
browser-connection error in Chat; it is not a passing catalog receipt. The later
release intake includes the upstream composed Bits lifecycle repair and public
renderer host-module adapter. No failure or accessibility guard was disabled.

## Release and source boundary

The task was rebased onto released Notes source `ff088a42`, preserving API 0.2.4,
UI 0.1.6, Workspace 0.3.2 and File Explorer 0.2.1 plus their public renderer
admission. Root and web consume current released plugin/Core/Mira ranges.
Publishable profile exports resolve through built `dist`, include types, and have
portable dependency ranges. App Profile is now part of public package policy,
release planning and consumer packing. This task does not publish it.

## Combined archive qualification

The original 21-package prerequisite inventory is retained as
`.local/ui-parity/final-cohort-markdown-020.json`. Its remote Docker lanes pass:

- Check: `lapis-notes-validation-fa2e5463-35d8-43b5-8baf-e6fda99dd725`;
  all 16 tasks, types, App ownership and styling/specification checks pass.
- Unit: `lapis-notes-validation-b9fdd45a-9c61-4280-9525-5a059d13fa66`;
  API 1,745, App Profile 95, UI 15, Explorer 39, Workspace 38, Language Service
  18, host services 9, retained Deno services 90 and web 35 cases pass.
- Build: `lapis-notes-validation-fa7a53d0-6d90-4fa8-ad36-5acb849ea0c2`;
  all nine tasks, including the PWA build, pass.
- Specification: `lapis-notes-validation-20edaf97-29e3-412a-ad8f-e82e01b0011e`;
  canonical validation, mdBook, spec-first and ownership pass.
- Package/release policy: `lapis-notes-validation-01a50b1e-d8ba-455a-af23-81fccb54dd9f`.

The native focused story run and candidate public packing are explicit authoring
checks, not Docker parity. App Profile publint passes. Complete catalog, PWA and
final packed-export receipts follow the combined lane. Consumer receipts remain
owned by server and Desktop. Registry-only installation/image qualification
follows separately authorized source publication; visual review is pending and
no baselines are updated.

## Final lifecycle and catalog qualification

Story cleanup is now returned by `beforeEach`, so it runs at unmount instead of
removing the production session after play. PWA/fixture adapters retain their
imperative handles through asynchronous child disposal after Svelte clears the
presentation binding. Public runtime inputs are unchanged from candidate
`a235a2a500a1062f841ec23ab9917d97d7343a84`. App Profile package metadata now
requires Markdown 0.2.1; final source/packed equality is recorded after committing.

The post-binding Docker matrix passes check (`e7675dde`), units (`a53e8b51`),
build (`346761fd`) and specification (`b8443391`). The complete earlier coherent
cohort catalog is `0d9a99a1`; static build is `d83b725f`; PWA is `441ddc09`
(12 passed). Those receipts are kept distinct from the post-binding reruns.

The first newly wired full pointer run (`62602116-d82c-46b5-9035-d5fb50c3f5b7`)
ended with 4 failed, 4 flaky and 5 passed. Six browser workers shared four CPUs;
traces show unfinished source-module requests before story completion. The lane
now uses one worker without changing assertions or deadlines. The exact shared
session family passes 3/3 cold in
`823686fc-309e-4613-bd4d-1d2bdf4a6fda`; full pointer/catalog reruns follow.

No consumer CSS override, source alias, runtime fatal-error suppression,
accessibility waiver or visual-baseline change implements this repair.

The single-worker full run (`8612f053`) passes 12 cases and exposes one stale
popup failure hook: it replaces `vault.modify`, while editor persistence uses
`modifyIfUnchanged`. The exact failing assertion receives `closed` because no
write fails. Acceptance now injects at the conditional-write boundary, verifies
that the rejection ran and checks persisted bytes after explicit recovery; all
original close-refusal and popup/draft assertions remain.

The repaired popup target passes cold in `01fb9b02-c850-4ebb-a46f-e5606bfb0f4f`.
The complete workspace browser lane then passes 13/13 without retries in
`ffce0f2f-e5fd-4881-b672-b1ab606a3460`, retaining every prior pointer and popup
assertion. The catalog CI wiring policy is updated for the required pointer
lane: exact expected-command check 1 failed → 1 passed, complete nine-case Turbo
cache family passed. Final package-policy qualification repeats that guard.

The post-binding full catalog found one quoted-tag completion failure in
Search/Middle Top Tabs (expected `tag:"#project alpha"`, received `tag:#project`).
The earlier 272-case cohort run and focused native authoring run pass; the latter
uses the author's installed graph and is not Docker-cohort qualification. The
play held a list node returned from asynchronous completion readiness. It now
resolves the current named option at the mouse-action boundary; quoted query,
results and validity assertions remain unchanged, with no delay or retry added.
Final exact and complete Docker-cohort receipts follow.

The retained post-binding catalog attempt is
`dea78bc8-6d3b-46ad-b9bb-f075b9fff51f`: 269 cases pass, one Search assertion
fails and one browser RPC connection closes before the two Link Preview
Acceptance cases execute. The fatal-runtime guard still fails the run. This
resembles the already retained catalog transport diagnostic, but the attempt is
not a passing receipt; focused Link Preview and complete catalog repetition are
required. No runtime error is filtered or waived.

The repeated normal CI attempt (`9fa09284`) passes 270 cases but again loses
the two Link Preview cases to one RPC disconnect. Native shard 4 passes 57/57;
Docker with Playwright tracing passes 57/57 (`ec0d77b1`), and temporary browser
event diagnostics pass 57/57 (`ade6ebcb`) and all 272 (`daed4d5d`). No crash,
cgroup OOM or dependency reload was observed in that diagnostic full run. These
are diagnostic receipts, not a replacement normal CI pass.

The installed addon also reports duplicate manual annotation setup. The obsolete
manual bootstrap is removed in favor of its supported automatic initialization;
the fatal Svelte guard remains. A temporary unnamed-button story is rejected
with axe’s `button-name` rule, proving that the automatic accessibility hook is
active. The probe and all temporary browser diagnostics are removed afterward.
Normal CI is repeated without instrumentation or added delays.

The clean automatic-annotation shard still reports 55 passes plus one RPC
disconnect before two cases execute (`e9f20cd7`). Removing the obsolete setup is
correct but is not claimed to resolve the runner failure. Browser tooling moves
to the supported server cohort (Storybook 10.6.5, Vitest/browser 5.0.5 and Vite
7.3.7) for exact and complete qualification; no lifecycle assertion changes.

A final registry audit found Markdown 0.2.1 released from `f1b8823d`. Its npm
SHA-512 matches registry integrity; all runtime, style and declaration members
are byte-identical to the qualified 0.2.0 archive. Only package/manifest metadata,
README and changelog differ. The registry attestation names that source; no
independent Sigstore verification is claimed. The immutable latest inventory is
`.local/ui-parity/final-cohort-markdown-021.json`; older inventories remain intact.

The upgraded runner passes the original shard 4/4 with all 57 cases, including
both Link Preview Acceptance cases, in
`8b8b7452-0687-461b-a65c-094132900952`. The normal combined CI lanes are
qualified separately without diagnostic instrumentation. Obsolete Vitest 4
security overrides are removed so they cannot rewrite the addon’s supported
Vitest 4/5 peer range into an incompatible exact version. Workspace unit runners
retain their existing supported 4.1.11 version.

Release preparation initially rejects the new profile’s published Markdown
dependency as private: the exact packed-profile policy case fails once. The
tarball gate now shares the enumerated external Notes package boundary, while
unknown private packages and local protocols remain rejected. The exact case
and complete release-manifest family are rerun before final release checks.

The final dependency audit also raises API’s portable AI Host leaf to 0.3.0.
All 16 file-tools members are compared with the installed 0.1.0 input and the
registry-integrity-verified 0.3.0 tarball: JavaScript is identical, and six
declarations only add explicit `.js` module extensions. The ignored equivalence
receipt retains checksums; focused file-tools, full package and consumer checks
qualify the new minimum. No AI Host source change or transport migration occurs.

The first complete normal catalog CI run (`9fdfd11c`) passes all 272 catalog
and 13 workspace cases, then exposes one specification-history failure among
eight cases. The test advanced Forward before verifying restored iframe content.
It now checks exact saved URLs, the visible restored requirement and rendered
parent; the original URL/history assertions remain and no delay is added.

The stronger readiness assertions still fail (`d910e82a`), as do native chapter
links (`ed9386cd`); the native-link experiment is reverted. Temporary history
and channel diagnostics establish that Storybook’s globals restoration requests
replacement, but same-page hash dispatch drops that option and pushes a duplicate
entry after Back. Every diagnostic is removed from final first-party code.

The isolated Storybook source fix is `5c742f8b38e62588023730dcdd4b6fb707506cbb`,
based on release `4f0a7d27` (10.6.5). It forwards navigation options with the hash
event. Native owner qualification uses Node 22.22.3 / Yarn 4.18.0: exact 2 failed
+2 passed →4 passed; affected router/manager 416 passed; complete core 5,347
passed +16 existing skips, with type tests enabled. Production build, package
type check, format and lint pass; lint retains two warnings on unchanged lines.
The initial standalone commands exposed missing happy-dom selection, a missing
root tsconfig, then ten cwd-dependent filesystem-mock failures. Correct root
execution with explicit core tsconfig passes the complete suite; no test or
diagnostic is disabled. The lint plugin’s public build supplies its prerequisite.

The source archive and checksum live in ignored
`.local/ui-parity/storybook-router-archives/`; the immutable 22-package intake is
`final-cohort-storybook-router.json`. The original cold consumer history target
now passes in `1d702680-7591-4c13-afb2-92b15c6a4529`, without instrumentation or
additional delays. This is local source qualification, not a published Storybook
release. Registry-only CI must adopt the upstream fix before qualification.

## Qualified final source matrix

The normal Docker CI interaction lane passes in
`dd8e00d6-7888-452d-b351-938e21ca4e58`: 272 interaction/axe cases, 13 complete
workspace/popup/pointer cases and all eight specification navigation cases.
The normal static lane passes in `4edee61a-4cec-4962-b3db-ce7ace9ef044`: complete
static build and six browser cases, plus the two existing source-watcher skips
that apply only to the development server. PWA acceptance passes all 12 cases
in `8fe6b5ff-3688-4fab-a8a2-47b0e2d52e57`. Every process is fresh.

AI Host 0.3.0’s exact file-tools family passes 12/12 (`d5edd514`); full check
(`079ca2b3`), all 2,084 package unit tests (`45cc255a`), all nine build tasks
(`1274ce24`), specification (`e7d7a524`) and complete package/release policy
(`59666604`) pass on the admitted latest Lapis cohort. The packed-profile policy
regression is 1 failed →1 passed; its complete release-manifest family is 5/5.
Final checks also repeat against the source-built Storybook archive. Registry
publication, independent frozen installation/image acceptance and visual approval
remain outside these local qualifications. No baseline is updated.

The final source-built Storybook cohort also passes normal check
(`3cbf8518-5f52-4b69-80a0-cdbe17f1a08b`), specification
(`71e5c9eb-0aa2-4cdc-923e-3a7bca2a3aed`) and package/release checks
(`4333f4d9-0c16-40c1-ae1d-a37d8f11e3e9`). Changed-source formatting passes
for all 86 supported authored/generated paths selected from the final diff.

## Committed public exports

Implementation commit: `3d7bce209f11fe58933df05f14c3888c8cd34ba5`. Docker
consumer packing passes in `770d44d9-7dee-4635-b30b-5a997fc1e89e`; its producer
snapshot is `2d6896e1f548bd0a3b1da35f2c28379c86242372`, the empty child with
an identical tracked tree. The six immutable archives and provenance are retained
in `.local/ui-parity/notes-3d7bce20-archives/`. Publint passes against the freshly
extracted App Profile archive. The direct member comparison covers 884 files:
all runtime, styles, declarations, exports and package documentation match the
previous qualified candidate. Only API’s AI Host minimum and App Profile’s
Markdown minimum differ in their package manifests. The separate AI Host leaf
comparison proves unchanged JavaScript and declaration-only module extensions.

| Public archive                      | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| @lapis-notes/api 0.2.4              | `ef76bdbe08d9dea47dd3f8ff71890ad8922c6d4f2fa4f90f49a9a935506486b4` |
| @lapis-notes/ui 0.1.6               | `9f17cb8444f08f2a17ed13ff872bf81830467e55d70a0c9021fd96f606cac7fb` |
| @lapis-notes/workspace 0.3.2        | `f40e08c3ede4c47a369313ae9f2f906d293e92caa0ffa372271c407f0c199ff0` |
| @lapis-notes/file-explorer 0.2.1    | `53c8be115101e2c5323863d5125cc199b363d1bb6eaac6aac34688fa7f842b54` |
| @lapis-notes/language-service 0.1.2 | `202c8e2935cfc16e46dfa4b0acb5ecb5d5ffd7b0b5cbb73a4e5780615bdf9e2b` |
| @lapis-notes/app-profile 0.1.0      | `e7aeea336e3ceb0a70a49a690e9293f84445175e06225a60eab2ef9c636d0ef9` |

Server and Desktop own their final archive intake and consumer receipts. Source
packing creates no registry release, signed plugin publication or deployment.
