# User-file watcher scope

## Cause and scope

On the deployed Server `43d6657`, selecting the personal vault took about 40 seconds
and produced 354 commands/230 database calls by 68.7 seconds. A further 20.7 idle seconds
added 56 filesystem list/stat calls and 20 editing-intent list calls, with no DB calls.
The hosted adapter advertised no native watcher, so DirectoryWatcher recursively
polled every five seconds, including configuration and registry caches.

This API slice excludes the configured app-state tree from user-file watching.
Initial discovery still admits configuration records but excludes installed
plugin payloads and plugin-registry-cache. Direct adapter access is unchanged.
The configuration owner gets one exact-file subscription. Its reload runs after
admitted mutations with materializeDefaults:false, preserving the existing
conditional writer and avoiding a nested mutation-queue deadlock. Normal explicit
reload retains default materialization. Renames crossing the observation boundary
project user-file create/delete hints; root callbacks do not duplicate config hints.

## Focused regression evidence

Two original app-state watcher regressions failed before the fix; a separate
registry-cache discovery regression also failed. Conditional configuration reload
then exposed one 5000 ms timeout because materializing defaults re-entered the same
mutation queue. After the read-only reload fix, the three focused files pass 8 cases,
including polling exclusions, direct config access, targeted native delivery,
cross-scope rename, default-materialization compatibility and lifecycle cleanup.

Exact command:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/vault-content-directory.test.ts \
  src/lib/__tests__/vault-config-leaf-watch.test.ts \
  src/lib/__tests__/configuration-read-only-reconciliation.test.ts
```

The complete API suite passes 1755 cases in 174 files; the additional native-filter
case passes in the final focused run. Root check and test pass 16 tasks each, and
root build passes 9 tasks. A first wider run hit ENOSPC; the exact 42-case native
sync-vault suite and complete root lanes pass after space was available. Tests
and budgets were not relaxed.

Six Search placement plays had obsolete result/copy-control accessible names;
one AI Search Tool Hits play also omitted the path from the released hit label.
They now assert the complete released names, retaining geometry, copy, navigation
and visible-chat checks. Exact Search and AI targets pass, followed by their
complete 6-case and 20-case families. The complete four-shard Chromium interaction/axe lane passes 275 cases in
62 files (102/70/46/57 across its four serial shards), with no failures.

## Server source-consumer evidence and release gate

A temporary API source archive is consumed only through an ignored pnpm hook and
separate lockfile in the Server checkout. The normal committed registry lock and
semver ranges remain unchanged. Its cold current-backend/current-frontend budget
passes 69 commands/77 DB with 600 dormant assets and the unchanged 20-second sample.
A real enabled Tasks/default-profile fixture also passes a separate 20-second idle
window with zero files:list/stat and zero database calls; external create, modify,
rename and delete update the real Explorer/clean editor. These are source-consumer
results, not published-package or public-image acceptance, and not every plugin
from the live vault is enabled.

Native stream transport, admission, replay, reset and lifecycle are Server-owned.
Editing-intent polling is a separate authorized-scope question and is unchanged.
API npm publication, released-semver consumer intake, exact-commit CI and actual
public-image acceptance remain separate gates. No npm publication occurred.

## Concurrent configuration observation follow-up

The complete Server hosted lane exposed a real two-App race in the original
Tasks recovery journey. The second App saved canonical settings successfully,
but immediate external reload in the first App asked PluginManager to rewrite
the same compatibility data file. Both native writers became dirty and the
mirror save was refused; the original data.json assertion and shutdown failed.
This is a runtime defect, not a stale persistence assertion.

Two source regressions fail before the fix (external canonical update/removal
must not modify/delete a compatibility mirror). PluginManager now leaves
external-reload events observational. Local configuration updates/removals and
Plugin.saveData still own their original compatibility writes. Exact source,
complete owner/consumer lanes and the original concurrent journey must pass
again before this follow-up is qualified. No assertion or deadline is changed.

The follow-up's exact two source regressions now pass, all 108 affected cases
pass, and the complete API suite passes 1758 cases. Root check/test/build pass
16/16/9 tasks. A fresh source archive and Server frontend rebuild then pass the
original two-App Tasks recovery journey unchanged (28.9 seconds), including its
legacy settings-file assertion, one submit, zero retries and clean shutdown.
The follow-up full Chromium interaction/axe lane passes all 275 cases again
across all four serial shards. The full Server hosted rerun remains a separate
consumer gate until its final receipt is recorded.
Changesets plans only the public API 0.2.8 patch; other public packages stay held.
