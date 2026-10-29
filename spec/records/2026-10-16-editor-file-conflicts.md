# Document-owned editor conflicts

LN-ARCH-142 through LN-ARCH-144 add per-document conditional baselines, retained
App-owned conflict records and explicit snapshot-checked recovery for API
editors. LN-PKG-169 adds the public conditional Vault facade and success-only
projections. Only adapters advertising the optional capability use this path;
unsupported hosts retain their existing ordinary persistence and reject an
explicit conditional request before IO.

The original desktop M4 gate remains open. Editable Markdown previews use a
separate Mira writer and still require their own document-owned integration.
This record cannot qualify all desktop writers or complete LD-LIFE-004.
Application-wide `.lapis`, deferred publication and deferred signing are unchanged.

## Exact and affected regressions

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-file-conflicts.test.ts`
  initially fails all nine cases: ordinary saves overwrite external data or
  the retained recovery registry is missing. The same target then passes all
  nine. Its expanded fifteen-case target passes after adding failed disk reads,
  stale external-discard decisions, protected recovery, ordinary IO retry,
  capability loss and success-only Vault projections.
  The final sixteen-case target additionally proves that a second edit queued
  during an in-flight write uses the first acknowledged save as its baseline.
- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-persistence.test.ts src/lib/__tests__/editor-document-lifetime.test.ts src/lib/__tests__/editor-document-loading.test.ts src/lib/__tests__/editor-rename-persistence.test.ts src/lib/__tests__/sync-editor-flush.test.ts src/lib/__tests__/vault.test.ts`
  passes all sixty affected cases.

The first complete retry after adding that final regression reports one failure
and 1,007 API passes: the existing portable build-helper declaration test exceeds
its five-second limit while native and frontend compilers are active.
`pnpm --filter @lapis-notes/api exec vitest run src/lib/build-tools/vite-declarations.test.ts`
then passes unchanged in 879 ms. A complete `pnpm test` retry passes all 1,008
API cases and the full root lane. No assertion or timeout is changed.

## Qualification

Node 26.9.0 / pnpm 10.34.5; Rust 1.99.0; Tauri API/backend 2.12.4 and CLI
2.12.3; macOS ARM64.

- `pnpm build`: ten tasks pass, including publint and the new dist-facing
  conditional Vault and conflict-registry type contract.
- `pnpm check`: eighteen tasks pass with zero Svelte diagnostics.
- `pnpm test`: the final full run passes 1,585 cases, including 1,008 API tests,
  with one existing skip. The sixteen-case exact target and sixty-case affected
  editor/lifetime/Vault target pass separately.
- `pnpm test:storybook --force`: 249 interaction/accessibility cases pass in
  four fresh shards (90 + 65 + 40 + 54).
- `pnpm packages:check`: package policy, nine local-consumer cases and all 101
  release-tool tests pass.
- Rebuild both current Linux server image stages. Individually hash and copy
  all 445 host-built server frontend files. Then
  `LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e --force`
  passes all twelve browser/server cases, including OPFS persistence, database
  owner takeover, server editing/sharing and restart.
- Rebuild the existing ARM64 legacy application with
  `pnpm --filter @lapis-notes/desktop-deno package:app`. Both
  `pnpm test:desktop:packaged --force --core` and
  `pnpm test:desktop:packaged --force` pass. Its established local factory uses
  an ad-hoc launch signature; Developer ID, notarization and releases stay
  deferred.
- The Tauri consumer installs ten verified local archives while preserving
  tracked registry dependency files; Svelte check reports zero diagnostics.
  `pnpm test:desktop` passes 27 actual WebView cases and eleven cold lifecycle
  cases. Three new cases prove blocked Close, a fresh decision after another
  external edit, retained drafts and barriers after tab closure, accepting disk
  without writing discarded text, subsequent saving and cold restoration.
- The embedded keyboard driver does not activate an ordinary focused button
  from synthesized Enter. A unique temporary e2e bundle instead receives real
  macOS Return input through native UI automation: the public recovery action
  selects disk text, preserves disk bytes, clears the conflict and closes
  normally. No product keyboard workaround is added. Native accessibility
  acceptance reports no violations. Desktop E-CONFLICT-001 preserves the
  initial unsafe-write reproduction and all consumer qualification attempts.

The ordinary ARM64 application bundle passes `pnpm check:bundle`: 108.26 MiB,
216 renderer JavaScript files and zero automation markers, without a Node/Deno
runtime. `pnpm spec:check` passes all six lanes and 38 validator regressions;
changed authored sources, declarations and documents pass Prettier. No visual
baselines or package releases are included. These results qualify API editors
only; the enabled Mira preview writer remains part of the original uncompleted
M4 gate.
