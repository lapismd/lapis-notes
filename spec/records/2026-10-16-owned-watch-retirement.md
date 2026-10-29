# Owned watcher retirement

LN-PKG-176 source component for the Tauri migration. The shared API owns
portable events and generation retirement; native subscriptions retain host
resource ownership. Deno desktop remains frozen. App tree ingestion and native
consumer qualification are separate work, and this record does not complete M5.

## Targeted evidence

- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/directory-watcher.test.ts`: four exact before failures: a
  retired callback dispatches, native close is not awaited, array options are
  lost, and a pending initial poll survives close. The first fixture attempt
  imports a nonexistent memory module (one suite failure, zero executed cases);
  correcting the import to the existing test adapter establishes this baseline.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/directory-watcher.test.ts -t 'registration callback'`:
  one later regression fails because a callback can retire its owner before the
  returned native subscription is assigned. Cleanup now waits for registration
  in that case. Ordinary native close still retires synchronously.
- `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/directory-watcher.test.ts
src/lib/__tests__/native-watch-adapter.test.ts
src/lib/__tests__/browser-storage.test.ts
src/lib/__tests__/desktop-native-storage.test.ts`: 49 cases pass in four files.
  This includes all six owned-retirement cases, failed-stop retry, stale
  callbacks, array option/cleanup preservation, complete polling snapshots,
  registration reentry, the original watcher family and all affected native
  storage cases. No filters, new skips or relaxed assertions in this final run.
- `pnpm --filter @lapis-notes/api check`: native CSS, strict Svelte and types
  pass; zero errors and warnings.
- `pnpm --filter @lapis-notes/api build`: normal svelte-package, publint and
  built-package type contracts pass. The public fs export retains
  DirectoryWatcher while its implementation moves to its own module.
- `pnpm spec:first` and `pnpm spec:validate` pass. The first specification
  attempt exposed two missing mapped annotations and a verification row placed
  outside its Markdown table. Correcting those documents preserves the existing
  mapping and validation rules. Final validation finds 172 chapters and 1,459
  requirements; no IDs are reassigned.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. Consumer archives will be
recorded with their own source revision and SHA-256 in Desktop evidence.

## Deferred session lanes

Run full Notes check/test/build, full affected Storybook/accessibility and web
consumer qualification after M7 implementation, together with the full Design
Core and Tauri lanes already deferred in this session. Preserve original M4–M7
gates. This component record is targeted evidence only; it does not claim full
repository or host acceptance. Signing, publication and baselines stay deferred.
