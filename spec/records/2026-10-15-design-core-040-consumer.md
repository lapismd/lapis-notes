# Design Core 0.4.0 consumer refresh

This dependency-only review starts from remote Notes main `8f7c7ea9` and
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
