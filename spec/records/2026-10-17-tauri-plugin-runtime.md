# Tauri portable plugin loader foundation

This is the source-owned runtime and asset-identity foundation for native
M8.3 portable-plugin qualification and later M9 dynamic installation. It does
not complete either desktop gate or change the frozen Deno host.

The API derives the explicit Tauri execution identity from its owned vault
session, with the existing native bridge runtime as compatibility fallback only
when no session is supplied. Tauri selects the portable workspace ESM entry and
never inherits an Electron/native entry, CommonJS entry or fallback. Other hosts
retain their existing selection. Public dependency contexts include the explicit
Tauri identity and admit only portable shared modules for it.

Installed asset fingerprints now sort normalized supported paths by UTF-16 code
units. This replaces locale-dependent comparison so Rust and JavaScript hosts
can validate one content-addressed installation without a locale dependency.

## Regression evidence

- Exact `plugin-runtime-entry.test.ts` plus `plugin-manager.test.ts -t Tauri`:
  five meaningful failures before the change, five passes after. The manager
  previously selected `electron.mjs` despite an explicit Tauri bridge.
- Expanded exact boundary: seven passes, including Electron/native-only rejection
  and removal of CommonJS fallback from a valid portable ESM selection.
- Exact `plugin-asset-server.test.ts -t "sorts portable fingerprints"`: one
  locale-order failure to one pass; includes mixed case, astral Unicode, a
  private-use code point and reversed input order.
- Initial full API suite after runtime changes: 1,133 passes. It predates the
  fingerprint change; final complete qualification is recorded below.

## Complete source lanes

- `TURBO_CONCURRENCY=1 pnpm check`: 18/18 tasks, zero errors/warnings.
- `TURBO_CONCURRENCY=1 pnpm test --task-args --maxWorkers=1`: 1,710 unique
  passes and one existing Deno integration skip. The 1,836 executions include
  repeated 98/28-test build prerequisites; API passes all 1,134 cases.
- `TURBO_CONCURRENCY=1 pnpm build`: 10/10 tasks pass.
- Cold forced full Storybook: all 259 interactions/axe cases pass in shards
  93/71/40/55. Static catalog passes with all 172 specification chapters.
- Initial spec-first reported three missing mapped architecture/package/workspace
  chapters. Added the owning runtime, persistence and diagnostic guidance;
  final `pnpm spec:check` passes all six lanes and 38 validator cases.
- `CI=1 LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-m83-local pnpm exec playwright test -c packages/web/playwright.config.ts`:
  13 cold cases pass, including real editing/sharing/restart in the fresh image.
  Image SHA-256: `620d662c8083b7dd24ddad3bac265a967f0ae1f077904968e423cf00b4822291`.
- The server image uses the unchanged verified Design Core public archive
  described by the M8.2 record. Tracked production dependency routes remain
  registry-based; no dependency patch or application fallback was added.

Docker used the previously approved temporary 8192 MiB limit. Its original
stopped/3072 MiB state was restored and verified in the desktop M8.3 journal.
The desktop archive refresh and packaged portable-plugin gate remain separate.
Publication and visual baseline changes remain deferred.
