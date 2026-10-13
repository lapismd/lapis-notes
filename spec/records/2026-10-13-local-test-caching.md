# Local test caching acceptance

The comparison with `lapis-plugins` confirmed that both repositories already
route package unit tests through the same bounded Turbo wrapper. Notes' local
Storybook, release-tooling, specification, and browser test entry points were
still direct execution paths, while CI's aggregate Storybook tasks were cached.

## Task behavior

Public test commands and `build-storybook` now invoke registered root tasks;
internal `:run` scripts retain the raw suite commands. CI's existing aggregate
Storybook tasks invoke those raw scripts, avoiding recursive orchestration and
retaining complete suite coverage. Specification-regression check lanes use the
new cached public commands. Package tests retain their existing Turbo graph.

Deterministic tasks cache successful results with tracked root/workspace sources,
configuration, dependency and local-install identities, and runtime/environment
inputs. Node version, OS, and architecture come from the executing runner;
cache-service credentials do not determine result identity. Cache hits suppress
replayed test/build logs so reused successes are clearly distinguished from new
execution; fresh runs and failures retain their output. The log now states
that the local disk cache remains available when remote credentials are absent.

`--force` bypasses successful result reuse. Forwarded test arguments remain
separate from Turbo options and participate in cache identity. Live controller,
terminal, or external Storybook configuration disables cache reads and writes.
Pointer tests that can reuse a live server, installed desktop smoke checks,
Web end-to-end acceptance, and visual staging/baseline mutation remain uncached
Turbo tasks. Their environment remains available to the raw runner.

## Focused verification

The public-entry routing regression failed once before the implementation and
passes afterward. Three focused tests pass: command/task routing, argument and
cache policy, and real public-command execution through pnpm/Turbo in a small
fixture. The real fixture proves:

- A second unchanged successful run is a cache hit without executing the test.
- Story, workspace source, and command-argument changes execute again.
- Repeating identical focused arguments reuses the matching result.
- A forced run executes again.
- Two identical failing runs both execute and report failure.
- Two live-configuration runs both execute with cache reads/writes disabled.

Command:

```sh
node --test --test-name-pattern='local public test routing|bounded runner preserves|local test entry points' scripts/storybook-turbo-cache.test.mjs
```

Four additional focused CI/routing/argument checks pass. The actual
`pnpm test:spec-validation` runs 37 passing tests on the first run (Turbo reports
3.183 seconds) and reuses the result unchanged on the second run (one cache hit,
Turbo reports 44 milliseconds). These are task timings, excluding pnpm startup.

The focused fixture run passes 3/3 tests; on this machine the fixture takes approximately
38 seconds. Full product and browser runs remain delegated to PR CI at the
user's request. This change adds LN-PKG-159 and LN-PKG-160, bringing the total to
1,375 requirements while preserving the original 1,365 product/documentation
contracts and their verification rows.

Final focused checks also pass `pnpm spec:check` (six configured lanes and 37
specification tests), two package-boundary tests, formatter checks, and the
original-contract preservation audit. Turbo dry plans confirm that local static
navigation depends on the cached Storybook build and that a filtered package
test selects its package and prerequisite build, without running other tests.
