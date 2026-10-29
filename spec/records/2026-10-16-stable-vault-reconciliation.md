# Stable complete Vault reconciliation

LN-PKG-180 through LN-PKG-182 source component. Vault scans privately and
commits only a complete validated snapshot, preserving live node identities,
parents, children arrays and filename indexes. Explicit rename hints preserve
folder descendants and emit their old paths for existing metadata owners.
Deleted descendants emit before their folder; changed bytes invalidate cache.
Internal rename, copy, trash, atomic writes and reload share this projection.
Existing text/binary writes preserve canonical children and update their stats.

Mutations and reconciliation share one App-admitted queue through IO and
projection. Private delegation avoids re-entering that queue. Failed work does
not poison its successor. Queued file mutations retain and revalidate their
original target path. A retired generation cannot commit a scanned snapshot.
The scanner bounds entries to 100,000 and accounted path storage to 16 MiB,
rejects invalid/duplicate children and requires every file/folder stat.

## Exact evidence

`pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/vault-reconciliation.test.ts` first fails six cases: the
reconciliation port is missing and internal rename replaces canonical nodes.
The before fixture initially names a nonexistent filename helper; replace it
with the real public case-sensitive glob/index query before the final before
run, which still fails all six cases. After projection, all six pass.

The additional `-t serializes` regression fails once: rename IO starts while a
scan is pending. After the shared mutation queue, all nine then-current cases
pass. `-t 'invalidates cached text'` exposes one existing binary-write cache
failure (`before` instead of new bytes); invalidate those cache entries in
their owning Vault methods. The final exact file passes all ten cases.

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/vault-reconciliation.test.ts \
  src/lib/__tests__/vault.test.ts \
  src/lib/__tests__/file-manager.test.ts \
  src/lib/__tests__/file-manager-trash.test.ts \
  src/lib/__tests__/file-editing-sessions.test.ts \
  src/lib/__tests__/pending-vault-operations.test.ts \
  src/lib/__tests__/pending-file-operations.test.ts \
  src/lib/__tests__/editor-rename-persistence.test.ts \
  src/lib/__tests__/new-file-creation.test.ts
```

All 61 affected cases in nine files pass. The additional metadata family
(`cache.test.ts`, `metadata-persistence.test.ts`,
`app-database-metadata-contract.test.ts`, `frontmatter-persistence.test.ts`)
passes all 58 cases in four files. API strict `check` passes with zero Svelte
diagnostics. Its normal public `build`, publint and built type contracts pass.
Spec-first, canonical validation, App ownership and changed-file formatting
pass before the source commit. Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11,
macOS ARM64. Logs are retained in ignored `.local/m5-reconcile`.

## Remaining boundaries

This is the shared tree owner, not active App watch ingestion. Native watch
registration, batching/error recovery, workspace clean/dirty view handling and
stop/drain/resume still require the App-owned service and consumer integration.
Native delivery alone does not establish this source contract; source tests do
not establish the actual WebView flow. Consumer acceptance follows a fresh
verified API archive.

Run all session-deferred full Notes, Storybook/accessibility, web and Desktop
lanes after M7 implementation. Original M4–M7 gates remain open. Deno host source
is frozen. Publication, signing, visual baselines and ordinary review profiles
remain unchanged.
