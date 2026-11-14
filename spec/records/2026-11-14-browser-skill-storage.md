# Protected browser skill storage

Standalone browser installation requires a real conditional storage port, not
only the memory adapter used in initial tests. The OPFS/file-system-access
adapter now implements `writeTextIfUnchanged`: it serializes a path, compares the
expected bytes/absence, stages an exclusive writable stream, checks again before
publication, aborts conflicts and never retries an uncertain commit. This also
supplies the existing conditional configuration-writer contract in browser hosts.

## Exact regressions

- `vitest run src/lib/__tests__/browser-storage.test.ts -t 'browser conditional text writes'`
  fails 2/2 against the committed adapter without the port, then passes 2/2.
  It checks complete shorter replacements, stale snapshots, simultaneous writers
  and an intervening edit after staging. Aborted bytes never replace that edit.
- The App regression initially failed 1/2 when an equal-size update shared the
  same timestamp as the previous file. Reconciliation now forces modification
  hints for already indexed `.agents` files, invalidating cached reads before
  completion. Both App cases and all 38 browser-storage cases pass together.
- The complete API suite passes 1,803 cases. API check, build, publint and packed
  type checks pass.

## Actual browser/public package boundary

`node --test scripts/test-browser-skills.mjs` bundles the built public API exports
with Vite and runs an isolated Chromium profile against real OPFS handles. It
passes fresh/repeated installs, clean upgrades, obsolete-reference removal,
local edits, competing conditional writes and a cold browser-process restart with the same
durable receipt. Separate adapters for the same vault initially failed one
Chromium case with writer contention. Vault-scoped Web Locks serialize those
clients across adapter instances; the exact case then passes. The adapter-local
queue remains available to non-browser test stores. Both adapter kind branches are exercised with OPFS handles;
this does not claim operating-system directory-picker qualification.

The first bundle attempt failed once before browser execution because the
new workspace lacked UI's public `dist` entry. Building the owning UI package
repairs that prerequisite; the same browser acceptance passes. No source alias,
dependency patch or source import substitutes for a public package export.

Re-run prerequisites are API and UI package builds, then the exact Node test
command above. Temporary Vite output and the isolated browser are disposed.
Root checks, tests, builds and cold Storybook qualification are recorded in
the enclosing source slice; publication remains a separate gate.
