# Notebook canvas-table migration progress

## Release watch — 1 November 2026

The user authorized watching, merging and releasing the four migration PRs.
Notes PR #60 head b12c89c0 passed registry-fixture and build-cache; governance
then failed spec-first with two missing canonical mappings (UI and Workspace).
The workflow cancelled remaining jobs after that failure. The exact local
`LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:first --base main@origin --head @`
reproduced both findings. Owning UI and Workspace chapters now document the
existing compatibility changes; no gate, test or runtime behavior was weakened.
Released Core 0.9 dependency refresh and complete exact-head CI remain required
before merge/release. Existing main-workspace edits and Storybooks are preserved.

Exact rerun: spec-first passed 25 protected files/23 canonical chapters (0
findings); `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm spec:validate` passed
11 validators/194 chapters/1567 requirements; changed-document Prettier passed.
Latest validator is 0.2.0; doctor passed with the documented wrapper warning and
QMD specification searches succeeded under Node 24.

## Delivery state

- Specified: complete contract written before runtime changes.
- Implemented: pending.
- Focused-tested: pending; no passing runtime evidence claimed.
- UI-approved: approved by the user on 31 October 2026.
- Fully-qualified: in progress; full lanes authorized after UI approval.

## Source and ownership

Isolated workspaces: design-core-notebook-tables, lapis-plugin-notebook-canvas-tables,
lapis-notes-notebook-canvas-host and lapis-plugins-notebook-canvas-compat.
Bases: Design Core f16631c7; Notebook 04c858d7; Notes 6ffa9caf; Plugins be302f37.
Existing workspaces and Storybook 10329 are preserved. No push/merge/publication.

## Implementation slices

1. Specification and exact-command evidence, committed before runtime.
2. Generic column snippets, measured details, density/chrome and selection scope;
   custom operator validation; focused shared regression checks.
3. Notebook typed adapter/evaluator, result/dataframe/input/preview integration,
   focused stories, public types and lifecycle checks.
4. Host explicit module exposure and minimal package compatibility preparation.
5. Docker review server with verified archived dependencies; integrated UI review.
6. Only after approval: full shared/host/package qualification, authorized releases,
   registry refresh and final Notebook Docker validation:all and packed host intake.

## Verification matrix

| Boundary           | Before UI approval                                                       | After UI approval                                 |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Geometry/selection | Exact units, scrolled/resized overlays, scoped select-all                | Full Design Core checks                           |
| Rich content       | Headers, histograms, custom cells, measured details, a11y                | Full interaction/accessibility and static catalog |
| Typed filters      | Null/blank, regex/errors, range, dates, precise numbers, nested groups   | Full units and package consumers                  |
| Inputs             | Values/defaults/required/disabled, no sort/filter input, repeated embeds | Full Notebook validation:all                      |
| Lifecycle          | Fresh Docker browser, focus, portal, teardown, large bounded dataset     | Cold packed plugin in supported hosts             |
| Public contracts   | Strict focused types, exports, size/native-CSS audits                    | Packed-consumer and release checks                |
| Governance         | spec:first/spec:check, formatter, doctor/search                          | Complete evidence and release disposition         |

## Commands and observations

- `jj git fetch --remote codex-https --branch main`: four owners succeeded.
- `pnpm view @lapismd/spec-validator version --json`: latest Deno-free 0.2.0.
- Initial searches under unintended Node 26 ABI 147: QMD native mismatch;
  supported fallback is rg. Repeat doctor/search under explicit Node 24 PATH.
- Notebook `pnpm install --frozen-lockfile`: one configuration failure because
  the local hook checksum was active. `pnpm install --frozen-lockfile --ignore-pnpmfile`
  succeeds with registry resolution; no tracked lock mutation.
- All runtime test counts are pending. No screenshot comparisons/baseline updates.

## Resume

Read the owning canonical requirements and this record, inspect each workspace
with jj st, run focused exact targets and append their failure counts. Archive
provenance and actual installed lock belong to the Docker receipt. Do not run
broad suites, static catalog or publication until the user approves both UIs.
After approval run Design Core spec:first/spec:check/checks and packed acceptance;
complete affected host/package lanes; obtain release authorization; consume
published registry versions; run Notebook validation:all and real plugin loading.

## Segmented density shared-module intake

Specified and implemented; focused host-map test passed. UI approval and full
qualification remain pending. Added public `shadcn/toggle-group` to the canonical
host catalog and regenerated 118 public records, preserving fail-closed imports
and the shared renderer. Existing uncommitted cohort work is preserved in parent
change `tmnvzxno`; this follow-up contains only the additional module intake.

- `pnpm exec vitest run packages/app-profile/src/plugin-host-build.test.ts`: 1 startup/config failure, no tests collected (root Storybook config requires unbuilt API dist).
- Correct owning target: `pnpm --filter @lapis-notes/app-profile exec vitest run src/plugin-host-build.test.ts`: 5 passed/0 failed; repeated after formatting, 5 passed/0 failed.
- `node scripts/generate-plugin-host-modules.mjs`: generated 118 records.
- `pnpm exec spec-validator doctor`: 10 passed/1 alias warning/0 failures under Node 24; QMD `pnpm spec:search "Notebook shared module"` succeeded. Latest Deno-free validator remains 0.2.0.
- `pnpm spec:first`: 1 invocation error (`--head requires --base`, Docker projection). Explicit `pnpm spec:first -- --base f75dfb07`: initially 4 mapped-chapter findings, then 0 after canonical owner notes; final rerun passed 2 protected files/6 canonical chapters.
- `pnpm spec:validate`: initially 1 chapter line-limit finding; moved the new package note into its shorter core-contract chapter; exact rerun passed 11 validators/194 chapters/1567 requirements.
- Focused Prettier on the changed host-map test passed.

These are focused preparation checks; full host build/plugin loading and cohort
qualification remain deferred. No push, merge or publication.

## UI approved — full qualification resumed (31 October 2026)

The user approved the integrated UI and requested the remaining plan work. Full
qualification, remaining migration cleanup and release preparation are authorized.
Keep stories visual-pending; no screenshot comparisons or baseline updates.
Publication, pushing and merging still require separate authorization. Historical
UI-pending statements above describe their original checkpoints. The current
fully-qualified state remains incomplete until all required evidence passes.

## Post-approval host qualification

- `pnpm build`: first failed Web's CanvasTable import because Web's Core range
  was still ^0.7.0. Web and frozen Deno package ranges now match ^0.8.0.
  Exact rerun: 9/9 Turbo tasks passed. Receipt:
  lapis-notes-validation-f31d75c8-275d-4b44-b337-3c6d678ee600.
- `pnpm validation:consumer-pack`: passed, producing five checksummed public
  archives (API/UI/Workspace/File Explorer/Language Service) with provenance.
  Receipt: lapis-notes-validation-5ca43635-1d00-411a-9a6e-a34b225297d9.
- First concurrent `pnpm check` and `pnpm test` stopped before execution on the
  workspace's exclusive Docker lease. They were rerun sequentially.
- `pnpm spec:check`: first 1 stale topic-index finding; `pnpm spec:mirrors`
  regenerated the index. Next run reported 4 mapped-chapter findings; owning
  qualification contracts were added. Final exact rerun passed, including
  67 governance tests. Receipt: lapis-notes-validation-e2a3c79f-a08e-40e5-b615-4f5b7c4ca5d4.
- `pnpm check`: 16/16 tasks passed; receipt
  lapis-notes-validation-e5f1ab94-989f-4781-8028-329fa2f18237.
- `pnpm test`: 16/16 tasks passed, 2,159 unit assertions across the packages
  (including 1,729 API tests), 0 failures; receipt
  lapis-notes-validation-fc479b11-d6ce-4ff0-b754-7c1fb30695cc.
- Full Storybook, static build and package policy lanes are in progress.

No runtime behavior was added to Deno; its source stays frozen. The root Web
import-map generation consumes public modules and preserves fail-closed imports
and one Svelte runtime. Final cold plugin and registry cohort acceptance remain
open. Changesets status cannot inspect Git HEAD in this JJ workspace; no refs
were moved to work around that tooling limitation.

The proposed API release intent is patch (0.2.4), not minor (0.3.0): the diff
from fetched main changes only generated host admission metadata and dependency
ranges in API. Its public runtime interface is unchanged. Keeping the 0.2 peer
cohort avoids requiring unrelated plugin migrations. Core retains its minor
Changeset for the actual new public table/filter contracts.

Full Storybook first attempt: shards 1–3 passed 99+67+46 stories; shard 4
passed 55 assertions but lost its browser connection before
`stories/plugins/markdown/panels/LinkPreviewAcceptance.stories.ts` completed.
This is 1 infrastructure error, not a pass. Exact fresh target and full retry
remain required. Full static Storybook passed.

The exact cold LinkPreviewAcceptance family passed 2/0; the complete
`pnpm test:storybook` retry passed all four shards, 99+67+46+57 = 269
interaction/accessibility stories, 0 failures or infrastructure errors. Receipt:
lapis-notes-validation-cc774d72-4613-4c33-b8d6-0a1db8ddf380.

After the patch release intent update, `pnpm spec:check` passed again (including
67 governance tests); `pnpm packages:check` passed public boundaries, local
consumer routing and all release/workflow contracts. Receipts:
lapis-notes-validation-23532d23-401b-4ace-92d5-4992bd9c21b7 and
lapis-notes-validation-221ef9e2-037a-4496-ad2c-3250d5207e45.

This verifies the source host compatibility slice. Final Core minor registry
refresh and packed Notebook admission remain separate release-cohort gates.
The subsequent read-only row-selection feedback belongs to Design Core/Notebook
and adds no host module or runtime dependency to this slice.

## Packed-plugin renderer admission follow-up

Real packed Notebook loading exposed missing CodeMirror Markdown admission and
unversioned Svelte producer imports. The owning API now exports
`rendererHostModulePlugin` through `@lapis-notes/api/build/vite` for producer and
host resolution. It derives providers from the public generated renderer catalog,
requires the exact compiler version and rejects unlisted modules. No private
sibling build helper, bare private alias or separate Svelte runtime was added.

- Exact renderer/Vite unit targets: 16 passed, 0 failed.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm --filter @lapis-notes/app-profile
exec vitest run src/plugin-host-build.test.ts`: Markdown root regression
  1 failed/6 passed before correction; exact rerun 7 passed/0 failed.
- `pnpm check`: 1 canonical page-size failure (402 lines). Consolidated the
  adjacent Notebook qualification contract without dropping constraints; the
  chapter is now 400 physical lines. Exact full rerun remains required.
- `pnpm validation:consumer-pack`: five archives passed with renderer declarations
  at receipt lapis-notes-validation-5399ce1c-7ab0-4e01-886d-1dff4c692bd3.
- `pnpm test`: 16/16 tasks passed; `pnpm build`: 9/9 tasks passed before the
  final Markdown-root import-map correction. Final affected host checks remain
  in progress. Source archives do not prove released-registry qualification.

Latest Deno-free spec-validator remains 0.2.0. Doctor and QMD search ran under
Node 24; doctor reports the intentional Docker script-wrapper warning. No push,
merge, publication or visual-baseline changes.

## Final renderer qualification receipts

The renderer adapter also excludes admitted ABI identifiers from Vite's package
optimizer so development resolves them through the same host provider as
production. Exact optimizer regression: 1 failed/13 passed before, 16 passed
across renderer/Vite targets after the fix. Root strict checking then exposed
1 test-helper type error from an obsolete union hook; the helper now invokes
the adapter's precise function contract. Exact root check rerun passed 16/16
tasks, and full tests passed 16/16 tasks (including 1,743 API tests). Full build
passed 9/9 tasks. Native changed-source formatting passed through the owning
formatter. No runtime App interface or plugin permission was widened.

The first final archive run built all five candidates successfully but report
collection used the wrong default Docker context. Collection was recovered from
the verified completed worker with explicit omarchy/SSH transport; the ignored
workspace config now fixes that context. The owning lease helper released only
this completed workspace lease. No sibling container/cache cleanup was applied.
Archive receipt: lapis-notes-validation-31d23ef2-c3a0-43e0-8c6d-524c1b084119.

Final Storybook qualification remains open: two complete attempts and the exact
fourth-shard run each passed 55 assertions in that shard but lost the browser
connection while admitting LinkPreviewAcceptance (1 infrastructure error per
run). The exact family passed 2/0. The same full fourth shard with browser tracing
passed all 57/0; this is diagnostic evidence, not a waiver of the normal lane.
A fresh normal full run is in progress. The guard, assertions, tests and catalog
configuration were not weakened or changed. Exact commands/receipts:

- `pnpm test:storybook`: `storybook-renderer.log`, `storybook-final.log`.
- `pnpm test:storybook -- stories/plugins/markdown/panels/LinkPreviewAcceptance.stories.ts`:
  `link-preview-exact-final.log`, 2 passed/0 failed.
- `pnpm test:storybook -- --shard=4/4`: `storybook-shard4-exact.log`, 55 passed,
  1 infrastructure error.
- `pnpm test:storybook -- --shard=4/4 --browser.trace=on`:
  `storybook-shard4-trace.log`, 57 passed/0 failed; receipt
  lapis-notes-validation-36fcf019-dec1-49e4-97b4-98b61cd31bf9.

The first final spec run found 2 missing mapped Web/desktop chapters; their
shared renderer admission contracts now explicitly document both development
optimization and production. Final exact spec and static host checks remain
required. State: specified/implemented/focused-tested yes; migration UI-approved;
complete qualification pending normal host Storybook and released cohort gates.
No push, merge, publication or baseline update.

## Verified host checkpoint

The normal full `pnpm test:storybook` retry passed all four shards (99 + 67 +
46 + 57 = 269 interaction/accessibility cases), with no infrastructure errors.
Passing unchanged shards used their normal Turbo cache; the previously failing
fourth shard ran successfully without tracing. Receipt:
lapis-notes-validation-0f7fd3cf-6edb-46e9-b838-11f030028e92. Earlier disconnect
receipts remain retained; no source/test exclusion or threshold change was used.

- `pnpm build-storybook`: passed, receipt
  lapis-notes-validation-eb3c591a-e3d0-48dd-ac21-01c746762b1c.
- Exact final `pnpm spec:check`: passed validation, mdBook, mapped spec-first and
  governance checks, receipt
  lapis-notes-validation-2ff80e8e-9394-47d3-9894-4c97483eff85.
- `pnpm check` 16/16, `pnpm test` 16/16, `pnpm build` 9/9 and public candidate
  archives passed as recorded above. Notebook's strict cold development and
  production public consumers also passed against the refreshed API archive.

This checkpoint is source-qualified. Specified, implemented and focused-tested
states are complete; the integrated migration UI is user-approved. Final
released-registry dependency refresh and supported-host acceptance still require
the separately authorized release cohort. Preserve the known intermittent
browser-startup receipts when resuming. No push, merge or publication.
