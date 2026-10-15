# Design Core 0.4.0 consumer refresh

This review starts from remote Notes main `8f7c7ea9` and
consumes the published `@lapismd/design-core@0.4.0` release from Design Core
PR #26. Root, framework and private host ranges use `^0.4.0`; the four public
framework consumers carry patch Changesets. Notes also declares its existing
Prettier 3.3.3 tool and the JSDoc plugin referenced by its API formatter config
instead of relying on Design Core's former runtime authoring dependencies.

The install and lockfile use `--ignore-pnpmfile`; no local tarballs, hooks,
application data or private Sync commits are included in this review. The
previous local main remains preserved at `local/notes-before-design-core040`.

## Evidence and CI handoff

- Frozen registry install, dependency audit under the existing QMD exception,
  specification validation and the mapped spec-first gate pass.
- The owning UI and API builds/publint passed before the aggregate run stopped.
- The first API test run passed 963 cases and timed out its portable Vite
  declaration test at five seconds. Its focused rerun also timed out (6.85s).
  Assertions and timeouts are unchanged; this remains for CI qualification.
- On the user's memory-pressure instruction, local aggregate check/build/test
  work was stopped. Full package, browser, packaging and host acceptance are
  delegated to the normal required CI gates, not claimed as locally passing.
- No visual baselines, Sync activation, host behavior or package publication
  changes. API/UI peer compatibility must be released before downstream
  Plugins can claim a fully compatible published Design Core 0.4.0 graph.

## PR #36 interaction repair

The first CI run (`38795954714`) passed quality, unit, static Storybook, release
artifacts, web acceptance and desktop packaging/native lanes, including the
portable declaration test that timed out locally. Storybook shard 1 reported
87 passing and three failing stories; the aggregate gate correctly failed.

- `Category Details And Install` now checks the named media dialog and visible
  image. Its title is intentionally visually hidden by the prepared CSS.
- `Markdown Problems` waits for the severity menu to be visible and reach the
  existing 224–288px bounds before checking alignment and semantic icon colours.
- `Editor Settings` waits for persisted Doodle Dividers enablement and reveals
  the virtualized divider through the public editor API before checking its SVG.
  It also waits for all four existing language options to be visible.

Cold focused browser commands, run serially:

```sh
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/workspace/Plugins.stories.ts stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Category Details And Install|Markdown Problems|Editor Settings'
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Markdown Problems'
```

The first run passed two stories and exposed the severity-menu animation
measurement (one failure). The final exact Problems rerun passes. All three
original failing stories now pass, with zero interaction or axe failures in
those targets. Specification validation passes (1439 requirements). Full suites
remain delegated to required CI because of the user's memory-pressure request.
No timeout, width tolerance, accessibility gate or visual baseline was relaxed.

## PR #36 second-shard follow-up

Run `38809562555` passes all 90 first-shard stories. Its next shard reports
five failures (60 passed): the retained AI Agent Trace, Bases Editable Cells,
Bases Query Controls, Bases Schema And View Settings and Graph Middle Top Tabs.
These consumer stories are independent of the plugin repository's catalog.

The exact five-target cold local reproduction reports five failures. Updating
only Notes-owned menu readiness, public tool-summary selection and current
pointer geometry reduces that to one failure (five other selected cases pass).
Schema And View Settings still correctly fails axe against published Bases
0.1.3 for input/list, button-name and nested-interactive violations. Its
assertions and accessibility gate remain unchanged. The source fix is split
into a standalone Bases 0.1.4 candidate on Plugins main so it can be published
before the Notes API/UI refresh. Notes must then consume that registry release
and rerun the exact scenario; no local source patch qualifies this boundary.

```sh
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/ai/AiChat.stories.ts stories/plugins/bases/BasesViews.stories.ts stories/plugins/bases/BasesWorkflows.stories.ts stories/plugins/graph/panels/Graph.stories.ts -t 'Agent Trace|Editable Cells|Query Controls|Schema And View Settings|Middle Top Tabs'
```

### Retained AI shell impact check

The same AI shell file retained in Notes independently reproduces the four
final-shard failures seen in Plugins #26. The exact cold four-story command
reports four failures before the same Notes-owned overlay-readiness repair.
This proactively checks the later consumer shard while Bases publication still
blocks the schema accessibility case.

```sh
CI=1 pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/ai/shell/Shell.stories.ts -t 'Desktop|Community Tool Opt In|Local Conversations|Follow Scope'
```

The final retained-shell cold rerun passes all four selected stories with axe
enabled. No broad local catalog or host suites were started. The one remaining
known Notes failure is the unchanged published-Bases schema accessibility case.
