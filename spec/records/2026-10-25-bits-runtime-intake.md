# Unified published Bits UI runtime intake

Status: source repairs are committed and final consumer functional, static,
tooling and specification gates pass. No consumer package patch is added.

## Boundary

Final Design Core source declares Bits UI `^2.20.2`, including its released Link
Preview document-listener cleanup. Notes root, API and UI previously pin 2.19.5.
API combines Design Core Command compounds with a direct Bits GroupHeading, so
separate Bits runtimes could split component context. The cross-package compounds require one actual Bits runtime to share component
context correctly.

The three owning manifests now select published Bits UI 2.20.2. The normal
registry lock's three direct importers and Bits-only graph are refreshed from
an isolated pnpm registry resolution, retaining the existing transitive pins.
Nineteen bounded semantic changes remove the old patch references, add the
registry integrity/snapshot, and update those importers. Other prerequisite
lock differences are preserved; no complete frozen registry install is claimed.
The retired 2.19.5 patch and its configuration are removed. Temporary source
archives below are explicit qualification inputs, never tracked install paths.

## Exact before/after gate

```sh
pnpm test:storybook -- \
  stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts \
  stories/plugins/markdown/panels/Backlinks.stories.ts
```

Before: both cold families pass, **25 cases / zero failures** (18 editor demo,
seven Backlinks), on Design Core 944cd448 and the approved patched Bits 2.19.5.
Receipt `9af76135-17fd-4409-8c6a-367077ca05a1` preserves the source and inputs.
The new cache runner executes the real Docker browser lane successfully.

Candidate: final committed Design Core source `8318eb6d`, public archive
SHA-256 `567f022a5013d9d70a435fcd60751ada91ff6e68396976ccfb016bc265d8672c`.
Its complete source gate passes 922 unit cases, 974 stories and all browser,
build/check/specification lanes. The public archive matches the committed source.

Published, unpatched 2.20.2 on that candidate fails **one of 25 cases**, Backlinks
Middle Top Tabs, with one fatal `derived_inert` from the queued Link Preview
selection callback (`f76319a3-32c2-4314-b7a3-4d2a829e9e72`). Listener cleanup
does not cancel a timer already queued before teardown.

## Owning source repair

The upstream source checkout is Bits UI parent `33186c8c` (2.20.2), kept under
ignored `.local/source/bits-ui-20261025`. Local commit
`a27be8190fba7f77dcf2cd459595542749544070` owns and cancels the selection timer
on close/root destruction, refuses destroyed-owner reads and coalesces releases.
The public-component regression reads the selection while live and proves no
read after close/unmount. No public component API changes.

Before run `71aba025-b130-43dc-af26-1ccb70b6cf13`: all six new Chromium/WebKit
cases fail. After run `dcded260-5063-47ff-9772-09a17e34eff1`: six exact cases,
all 42 Link Preview browser cases, 151 package unit cases, package/test checks,
build/publint, Oxlint/ESLint and formatting pass. A first repaired run passed
all functional checks but exposed inherited Prettier 3.9 interface formatting;
the final run includes that formatting. Both runs are cold bounded Docker
workers (4 CPU/12 GiB), using the owner's Playwright 1.64.1 browsers.

Qualified source snapshot `47c467cf` is tree-identical to the local commit.
The retained `bits-ui-2.20.2.tgz` SHA-256 is
`7b0fea714ddc489a57340ba649276b9f23bbd91ffac38d62244e44d24b7a5109`.
This is a temporary source archive, not a published upstream fix. Full source
receipts and archive are retained under ignored `.local/validation/runs/`.

The same Notes families pass **25/25** on the final shared candidate at
`66b1ee23-b775-4b64-badc-78bb106b4992`, including the original failing Backlinks
Middle Top Tabs. There are zero functional, accessibility or fatal runtime
failures. The installed-runtime receipt in that run resolves root/API/UI/Design
Core/Mira to one physical Bits 2.20.2 entry. Its Link Preview source SHA-256
`84ceb64f136ffd57c08973ffa70cdcbe8875000d10262244f2fc5dd36b626d14` matches the
qualified upstream archive exactly.

The matching Mira source intake's core archive SHA-256 is
`85d80be38df1ddf358b2d6793e4fc9be211b6ac2545073a978a52fe808d555d3`;
its manifest declares ordinary Bits 2.20.2. Mira's owner admission is committed
at `fd2bcd15df6f9a7b511e46b400b9fa1204a2c343`: 499 units, 16 runner cases,
170 stories, 60 browser cases, 40 release cases, six-package packed-consumer
and all audit/build/type/lint/format/specification gates pass. Authored package
inputs are byte-equivalent to that source commit; all six archive hashes are
unchanged. Its default workspace is clean. The ignored `final-shared-20261025`
manifest retains
all nine archive identities and the distinction from released registry inputs.

Full Notes check/test/build passes at `1c52e431-fcf6-459b-9fb7-33edc1892cfd`:
344 Rust and 2,209 JavaScript cases, with all checks/builds. The 65-case final
Docker tooling gate also passes. The five fresh public consumer archives match
the passing source in every input except tracker-only updates. Guarded
catalog/static/specification lanes remain admission gates. Desktop, Tasks and Agent UI retain
separate consumer acceptance receipts.

## Full catalog findings

The final full guarded catalog `0f1d4d8e-57fa-4513-9cb2-95c45d0784a4`
reports **257 passes / four failures**: API Select's former button-role query,
and unnamed Bases group-type/operator Select controls in Editable Cells,
Query Controls and Desktop Shell. Bits now exposes the correct `combobox`
semantics; those controls need explicit accessible names. Notes owns the stale
story query and Plugins owns the Bases controls. These remain open functional/
accessibility gates; no rule, assertion or diagnostic is waived.

The exact Notes regression command
`pnpm test:storybook -- stories/api/Select.stories.ts -t '^Select$'` fails one
case at `b49723a4-c208-4bf5-b1c3-47f1a8840253`, with the named element correctly
exposed as a combobox. The story now queries that role and still selects Daily
and verifies the persisted selection. Its accessibility gate remains enabled.

After querying the native combobox role, that exact cold case passes at
`90db43b7-a719-46b1-be19-639e8ab5c029` with the same selection and axe assertions.
The remaining three failures await the source-owned Bases naming repair.

Design Core's subsequent SwipeItem lifetime repair is committed at
`4af345c4cfb7401d004b83a7a81ff7e9a812aa21` and integrated into its default
workspace with unrelated edits preserved. Its complete source gate `acf23771`
passes 922 units, 983 stories and all browser/check/build/specification lanes.
Audited archive `c77a3a83391b9fafd42c7f99f695af03b29941c1022a5a8bbacb3964d45e55c7`
matches all 1,557 public inputs. Compared with the preceding archive, 4,308 of
4,312 published files are identical; only the source/dist SwipeItem Action and
Context modules differ. Notes has no SwipeItem imports. Prior unrelated module
qualification is retained; final focused intake and source-owned Bases repair
acceptance will use this admitted archive before the final full catalog run.

## Final guarded consumer cohort

The source-owned Bases repair names all nine Select triggers across seven
production components. Its seven exact cases, all 284 catalog cases, 969 unit
cases / 45 package tasks, 140 release-tooling cases, npm/publint, public runtime
verification, reproduced test signatures and static build pass. The user
explicitly accepted the unchanged source baselines for this naming slice and its
separate CSV key-order prerequisite: one high Zod finding, four CSV styling
findings and two historical specification/coverage findings. Those exceptions
do not approve publication, other product changes or new failures.

The consumer installs Bases archive
`2c25bef8117dfe83c4ef1c435ed6d61e421de0f9f6dc24dbc8a17e043cae2ce9`.
The final source pack is separately identified as
`02b2392b2e9bb06f6a66c782c65369117a1729958183dea91884472d5c9df877`.
Its receipt compares all 157 public entry paths and bytes and finds them equal;
the compressed archive identities remain distinct. No consumer result is
relabeled as a run against the later archive.

The final ten-package cohort is retained under ignored
`.local/validation/final-admission-all-select-20261025/`. Exact five-case consumer
acceptance passes at `d1bd4b44-4677-416f-a34e-c48145645a58`. The complete cold
aggregate interaction run `218bbebd-b9e2-4265-b31c-decbb12037d7` passes all 261
catalog cases (93/71/42/55 across four bounded shards), then all eight development
specification-browser cases. Static aggregate `13a81f21-d52d-4ee0-8345-c23e6fdcbaf3`
passes its complete build and six static specification-browser cases. These
commands retain fatal runtime/accessibility failures and the existing assertions.

Desktop's independent signed Bases plugin bundle is not loaded by its 26-package
catalog cohort. Fresh signed-bundle admission, persistence/restart and changed
control accessibility remain a separate Desktop consumer gate.

Bases source is committed at `1faa35a130e35fc18ead748f17e21c93d85d951a` on the
separate CSV ordering prerequisite `aa71d8fc2b7176829edd39cbda9d96f286b44b96`.
Its final committed-equivalence receipt retains the original build source,
archive identities and every public entry hash; only evidence and verification
files differ from the frozen runtime build. No unrelated default-workspace
changes, publication or push are included. Final Notes tooling passes all 65
cases at `db9d1eab`; canonical/source and specification checks pass at `128b6d72`.
