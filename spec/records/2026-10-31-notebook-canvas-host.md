# Notebook canvas-table migration progress

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
