# Node server migration — verification record

Completed 2026-10-19. The [full plan](../archive/2026-10-19-server-node-migration.md)
is archived; [MIGRATION.md](../../MIGRATION.md#node-server-migration-2026-10-19)
remains the living ledger.

## Evidence

The initial plan claimed no product acceptance. The completed slices below
retain their commands, counts, failures, repairs and final verification.

### N0 — Plan and baseline

- Isolated Jujutsu workspace: `server-node` (`../lapis-notes-server-node`).
- `pnpm install --frozen-lockfile --ignore-pnpmfile --ignore-scripts`: passed.
- Prettier checks on this record and `MIGRATION.md`, plus `pnpm spec:validate`:
  passed; 172 chapters, 1,439 requirements.
- Initial tests could not load unbuilt public exports: server 8 failed suites;
  portable helpers 1 failed suite, 6 passed tests. Building existing public
  package outputs resolved those startup failures without product changes.
- `pnpm exec turbo run build --filter=@lapis-notes/api... --filter=@lapis-notes/language-service...`:
  5 successful package builds.
- `pnpm --filter @lapis-notes/server-deno test`: 8 files / 28 tests passed.
- `pnpm --filter @lapis-notes/deno-host-services exec vitest run src/paths.test.ts src/app-database-worker-runtime.test.ts src/language-service.test.ts`:
  3 files / 9 tests passed.
- `deno run --no-check --no-prompt --sloppy-imports --unstable-no-legacy-abort --allow-read --allow-write --allow-net --allow-env --allow-ffi --config packages/server-deno/deno.json packages/server-deno/src/server.smoke.ts`:
  original native server smoke passed.
- Development runtime: Node 26.9.0. Deployment target: Node 24 LTS. Docker
  currently has approximately 3 GiB RAM.
- Canonical mappings: LN-ARCH-096, LN-SRV-001–019, shared AppDatabase and Web
  host requirements. Product status is unchanged by this planning slice.

### N1 — Portable services

- Extracted the five portable modules to the private host-services package.
  Existing Deno source subpaths forward the canonical implementation, preserving
  frozen desktop imports. Built Node ESM and declarations use public dependencies.
- Portable build/check and 9 tests pass. The retained Deno package passes its
  Deno check and 90 tests, including exact compatibility-export identity.
- Plain Node imports of built portable services round-trip metadata through
  native Turso. The original Deno server smoke and 28 server tests still pass.
- `pnpm spec:check`: all six lanes and 38 validator tests pass.
- `pnpm check`: 20 successful tasks. `pnpm build`: 11 successful tasks.
- `pnpm test`: 20 successful tasks after a serial rerun. A first attempt
  overlapped a separate build that was replacing API output; five unresolved
  bundle imports and one workspace suite load failure were eliminated by
  finishing builds before the exact aggregate rerun.
- During extraction, the initial NodeNext declaration build reported 11 import
  errors; Bundler resolution plus bundled ESM fixed the actual package boundary.
  A new compatibility test initially compared built/source identities (1 failure);
  it now verifies that both retained subpaths and canonical source share the
  same implementation. No assertions were removed.
- The lockfile retains unrelated existing resolutions; a frozen install passes.

### N2 — Node runtime and rename

- Renamed the package and canonical server chapter, retaining requirement IDs
  and old documentation relocations. Added LN-SRV-020 for Deno-free delivery.
- Replaced Deno process/filesystem/server APIs with Node 24, the Hono Fetch
  listener adapter and worker threads. Added correlated worker-failure handling,
  streaming cancellation and ordered shutdown. The browser uses `node-server`;
  deprecated `deno-server` remains accepted by the public API.
- Initial native filesystem regression: 3 failures (`Deno is not defined`), now
  3 passing. Worker lifecycle: 4 passing; HTTP lifecycle: 3 passing. Server total:
  11 files / 39 passing tests. API provider compatibility: 4 passing; focused Web
  identity/startup: 4 passing.
- Built-output native server smoke passes on Node 24.15.0 and Node 26.9.0,
  including bootstrap, login, files, ETags, remote database and worker shutdown.
  An initial ad-hoc `--input-type=module` launcher passed an incompatible flag to
  workers; invoking the actual emitted smoke file passes without a workaround.
- Node 24.15.0 serial qualification: `pnpm check` (20 tasks), `pnpm test`
  (1,557 passing tests, 1 existing skip; 20 tasks), `pnpm build` (11 tasks),
  `pnpm test:storybook` (54 files / 249 passing interaction/accessibility tests)
  and `pnpm spec:check` (all six lanes, 38 validator tests) pass.
- Container delivery is deliberately tracked under N3. The first candidate
  stopped at dependency installation because Docker's disk is full; no
  container/browser acceptance is claimed by N2.

### N3 — Delivery and browser parity

- Node 24.15.0 multi-stage image builds the server dependency closure, runs
  portable/server tests and the native worker smoke without Deno, then builds
  the server-mode browser. Production files are read-only, data is explicit,
  and UID/GID 1993 is retained for existing volumes.
- Compose supplies a read-only root, temporary `/tmp`, a mounted secret and a
  twenty-second stop allowance. The guide explains prior Compose project names
  and the Node/container replacement for Deno permission flags.
- Root build/start/dev/native/headless commands are present. Both live server
  test tasks are uncached. A dedicated required CI job uses Node without Deno
  setup; server browser coverage moves to its dedicated Playwright config.
- Declared the externalized transformer dependency in both private packages.
  Private package file lists and runtime staging exclude secrets; local
  development data is excluded from Docker contexts. Frozen installation passes.
- Workflow regression: 1 failure before the dedicated job, then 22 passing
  workflow/setup tests. Root command-contract regression: 1 failure before the
  bounded root task, then its exact target passes. No assertion was relaxed.
- `pnpm test:server` on Node 24 passes 9 portable tests, 44 server tests and the
  built native smoke. Full `pnpm check` and `pnpm test` pass (20 tasks each).
  An initial concurrent dependency check/test run hit one existing FTS test's
  five-second timeout; its exact test passed on rerun. The server command now
  builds its dependencies before its focused checks; broader lanes run serially.
- Initial image qualification hit Docker disk exhaustion. User-approved cache
  cleanup left 19 GiB free. A second attempt built the server but exhausted the
  renderer's 2 GiB heap. User approved a temporary Docker increase from 3 GiB to
  8 GiB; the image reuses the existing Web command with its 8 GiB heap budget.
  An overlapping host/image build was cancelled and rerun serially to avoid
  memory contention on the 16 GiB host.
- The image's initial `pnpm deploy --legacy` reached packaging but attempted to
  fetch unpublished API 0.1.5 through a workspace dependency's registry range.
  Runtime staging now copies the compiled bundle and selects only its two
  declared externals from the frozen lockfile. It preserves root pnpm, integrity,
  override and patch metadata without changing published package ranges.
- Runtime packaging regression: one missing-module suite before implementation;
  5 packaging tests now pass, including absent/unpinned toolchain rejection.
  An initial standalone install selected the host's default pnpm because its
  manifest lacked a package-manager pin; the generated package now copies the
  root pin. An offline frozen install succeeds with pnpm 10.34.5, followed by
  native server smoke and an actual transformer-runtime import outside the
  workspace.

- Fresh Node image `sha256:5f61f60a61eb6b210785e7135a2b777530fa1def47b5a3d8290241c89b6c08ff`
  builds successfully. Its Deno-free build passes 9 portable tests, 44 server
  tests and the compiled native worker smoke.
- `pnpm test:server:e2e`: 1/1 hosted browser case passes against that image,
  including Node 24/UID/GID 1993, absence of Deno, actual transformer import,
  editing, peer events/Search, imports/exports, plugin loading, clean process
  shutdown and retained data across container recreation. Temporary containers
  and named/anonymous test volumes are removed.
- Complete independent Web browser acceptance passes 11/11 against fresh output.
  Final post-packaging qualification on Node 24.15.0 passes: `pnpm build`
  (11 tasks), `pnpm check` (20 tasks), `pnpm test` (1,562 passed, 1 existing skip;
  20 tasks), `pnpm packages:policy` (2 regressions), `pnpm release:test`
  (101 tests), `pnpm test:server` (53 tests and native smoke), and
  `pnpm spec:check` (six lanes and 38 validator tests).
- Docker Desktop is restored to `MemoryMiB=3072`; the running daemon reports
  3,052,138,496 bytes. No deployment, push or publication has been performed.

- The spec-first gate initially found eight missing mapped chapters. Delivery
  contracts and verification notes now cover the complete protected surface; the
  bounded release chapter remains within 400 physical lines. The final gate
  passes without exclusions or weakened rules.
- Original workspace `default` remains clean at `9336837d`. The migration is
  isolated in workspace `server-node`; no frozen desktop application code,
  lapis-ai implementation, public deployment or publication was changed.

## Local review stack

| Slice | Jujutsu change | Result                                                               |
| ----- | -------------- | -------------------------------------------------------------------- |
| N0    | `vlmkrtxr`     | Save the approved plan and baseline.                                 |
| N1    | `novloxzl`     | Extract portable host services with retained Deno compatibility.     |
| N2    | `omxyklzr`     | Rename and port the server, worker and browser runtime identity.     |
| N3    | `msxosqnx`     | Deliver and verify Node containers, commands, CI and browser parity. |
