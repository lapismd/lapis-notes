# App-owned Vault watch ingestion

LN-PKG-183 and LN-WS-097 source component. `App.vaultChanges` is explicitly
started by its host. It registers native/polling watching before the initial
complete reconciliation and awaits actual registration readiness. Hint storage
is bounded to 2,048 entries / 128 KiB; overflow or uncertainty requests a full
scan. Consecutive rename hints coalesce back to the original path. Failed scans
retain the complete tree, report through existing notifications and retry at
most four times after the first attempt, with bounded exponential delays.

Stop retires callbacks immediately and awaits registration, native cleanup,
active scans and view projection. Failed cleanup stays owned for retry. A
cancelled start cannot register after stop; restarting after a failed leave
registers afresh and reconciles changes missed while stopped.

Existing workspace file-change events refresh clean editors. FileView rename
and existing empty-view transitions reconcile clean moved/deleted views and
persist layout. The Workspace owner reconciles its remembered file reference.
Dirty or retired writers retain their original views and receive an existing
notification; reconciliation does not flush or retarget those writers. Dirty
getters fail closed. Existing text-conflict recovery remains authoritative.

## Before and after evidence

The exact target is `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/vault-changes.test.ts`. Before the service exists it reports
one import/collection error and executes zero cases. Initial transport code
passes four cases and fails the missing workspace projection case.

Two added view fixtures initially bypass Svelte class initialization with
`Object.create`, causing two fixture errors alongside that product failure.
The first projection run fixes the product case and retains those two fixture
errors. Instantiate a real FileView subclass; all seven then-current cases pass.
No shared fixture or behavioral assertion is weakened. Subsequent coverage adds
cancellation, cleanup failure/retry, overflow, retry limits, real Editor clean
refresh/dirty conflict recovery, retained failing getters and dirty deletion.

The complete affected command is:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/vault-changes.test.ts \
  src/lib/__tests__/vault-reconciliation.test.ts \
  src/lib/__tests__/directory-watcher.test.ts \
  src/lib/__tests__/file-editing-sessions.test.ts \
  src/lib/__tests__/editor-persistence.test.ts \
  src/lib/__tests__/editor-rename-persistence.test.ts \
  src/lib/__tests__/file-text-persistence.test.ts \
  src/lib/__tests__/workspace.test.ts \
  src/lib/__tests__/cache.test.ts
```

All 239 cases in nine files pass, including 14 service cases and the remembered
Workspace file regression. Earlier complete affected iterations pass 237 and
238 cases as coverage is added. API `check` initially reports two private-field
access errors: add the small source-owned Workspace method and its regression
instead of bypassing that boundary. The repaired strict check passes with zero
Svelte diagnostics; normal public build, publint and built type contracts pass.

Spec-first initially reports two mapped chapter omissions for Markdown and
Problems after App/workspace ownership changes. Add their integration
annotations; the exact gate, canonical validation (1,470 requirements), App
ownership audit and changed-file formatting pass before the source commit.
Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. Logs remain in ignored
`.local/m5-ingestion`.

## Consumer and remaining gates

Desktop must opt in during startup, stop/drain before teardown and restart the
same App's watcher when leaving fails. Actual WebView creation/modification,
clean/dirty rename/deletion, metadata, recovery and repeated switching remain
consumer qualification, following a fresh verified API archive. This record
does not mark the original M5 aggregate gate complete.

After M7 implementation, run all session-deferred full Notes, Storybook/axe,
web and Desktop lanes and original M4–M7 gates. Deno host source remains frozen;
publication, signing, visual baselines and review profiles remain unchanged.
