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
