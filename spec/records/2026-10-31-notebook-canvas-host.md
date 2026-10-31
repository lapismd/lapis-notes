# Notebook canvas-table migration progress

## Delivery state

- Specified: complete contract written before runtime changes.
- Implemented: pending.
- Focused-tested: pending; no passing runtime evidence claimed.
- UI-approved: pending.
- Fully-qualified: deferred until UI approval.

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
