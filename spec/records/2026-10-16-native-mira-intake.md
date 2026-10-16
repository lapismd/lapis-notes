# Native Mira intake

The desktop native editor found an accessibility defect in Mira block gutters. The owning Mira source repairs it under MIRA-MD-043. API runtime and peer ranges, plus the private qualification host, move from Mira 0.0.3 to released 0.0.5 so the native host can consume that verified source-owned archive.

LN-PKG-012 retains public built exports and portable registry ranges, with the user-approved migration archive exception. No package is published.

The first pnpm update rejected the unused bits-ui 2.18.1 patch after the old Mira dependency left the graph. Remove that obsolete patch entry/file; retain the unchanged active 2.19.5 patch. The subsequent pnpm install succeeds.

The API Design Core peer range matches its runtime dependency and the qualified
0.4.0 target. The independent default checkout's later 0.5.0 work is preserved.

## Direct database close ownership

Native session teardown also exposed a shared ownership risk: TursoAppDatabase
cleared its connection before awaiting the driver close. A rejection lost the
retry path. LN-DB-056 and LN-ARCH-034 now require retained ownership, accepted
mutation drain and shared completion for concurrent closes.

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/turso-app-database.test.ts -t 'retains connection ownership'`
  before: 1 failed, 12 skipped; reopening called the connection factory twice.
- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/turso-app-database.test.ts`
  after: 14 passed. This includes retrying the same injected driver, draining an
  accepted metadata write and waiting for a concurrent close to complete.

## Qualification

Node 26.9.0 / pnpm 10.34.5; macOS ARM64.

- Dependency-intake build/check/unit lanes passed before the lifecycle change:
  10 build tasks, 18 check tasks, 1,555 unit tests and one existing skip.
- The first check encountered a 405-line packages chapter. Removing the added
  explanatory paragraph retained the canonical contract and restored its limit.
- A competing cold build caused the unchanged TypeScript declaration-emission
  test's existing 5s deadline to expire: 977 API tests passed and one failed.
  Its exact retry passed in 739ms; the complete unit retry passed. No deadline
  or assertion changed.
- The initial dependency-only complete Storybook lane passed 249 interactions
  across four shards (90 + 65 + 40 + 54).
- After the close repair, `pnpm build` passes all 10 tasks, `pnpm check` all 18
  tasks, and `pnpm test` all 1,557 tests with the same existing skip. Svelte
  checks report zero errors and warnings.
- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/tauri-state-defaults.test.ts`
  passes all 14 shared-state/runtime cases.
- `pnpm spec:first` initially rejected the missing mapped Architecture chapter.
  Updating the owning provider requirement and its verification row restored
  the gate: six protected files, five mapped canonical chapters.
- The legacy macOS ARM64 application was rebuilt. Both `--core` and complete
  packaged smoke modes pass with isolated temporary state. Its existing factory
  applies a local ad-hoc launch signature; Developer ID and notarization remain
  unconfigured and no release is published.
- Post-lifecycle `pnpm test:storybook` passes all 249 interactions in four
  shards: 90 + 65 + 40 + 54, with a fresh process and public builds.
- `pnpm packages:check` passes package boundaries, local-archive consumer,
  release configuration and 101 release-tool tests. `pnpm spec:check` passes its
  configured lanes, App/metadata audits and 38 validator regression tests.
- `LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e`
  passes all 12 browser cases, including OPFS reload, database owner takeover,
  native server editing, sharing and restart. The frontend was built on the
  host with SHA256 records for every file, and the current Linux Deno dependency
  and runtime stages were rebuilt. Docker's 3 GiB all-in-container frontend
  build limit remains unchanged; this qualifies the application/runtime using
  the previously documented host-build method. No Docker settings or user data
  were reset. Native Tauri intake remains its own desktop gate.

The source libraries remain local during migration. No source alias, new
dependency patch, test-threshold change, or package publication is introduced.
