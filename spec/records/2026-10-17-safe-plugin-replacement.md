# Signed plugin replacement foundation

This is source work for Desktop M9.1. It does not complete native installation
acceptance. Deno desktop remains frozen and no packages are published.

## Before state

- API `pnpm exec vitest run src/lib/__tests__/plugin-distribution.test.ts
src/lib/__tests__/plugin-installer.test.ts
src/lib/__tests__/plugin-distribution-manager.test.ts`: 44 cases pass.
- API `pnpm exec vitest run src/lib/__tests__/plugin-installer.test.ts -t
'registered static|exact plugin data|replacement teardown'`: four failures.
  A valid signed static-ID bundle installs; removing an obsolete static-ID copy
  disables the bundled owner; replacement overwrites retained data with release
  defaults; replacement loads/enables again without awaiting old teardown.
  Log: `/tmp/lapis-m91-installer-before.log`.
- API `pnpm exec vitest run src/lib/__tests__/plugin-manager.test.ts -t
'direct external load that collides'`: one pass. Existing preflight already
  rejects a registered ID before evaluation and retains the original instance.
  Log: `/tmp/lapis-m91-static-load-before.log`.

## Implementation and focused results

Static IDs reject signed installation before staging and evaluation. Removing an
obsolete installed copy preserves its static owner. Replacement stages and
verifies first, awaits teardown, preserves exact data bytes including the final
unload save, and keeps the saved startup choice. Loaded modules stay inactive
until a fresh owner starts; rollback restores the original files and runtime.
Metadata publication participates in that rollback. Uninstall retires runtime
registrations, contribution indexes and Problems diagnostics before deleting code.

- Original four installer regressions: 4 failures to 4 passes. The first after
  attempt had one invalid fixture setup (missing parent directories); fixed the
  setup without weakening assertions.
- Expanded replacement/cancellation: 1 failure and 7 passes to 8 passes.
- Uninstall ordering/failed cleanup: 2 failures to 2 passes.
- Pending restart and retired-owner checks: focused 3 passes, then 5 expanded
  passes covering evaluation failure, invalid constructor, mismatched version
  and unload/reinstall in the same owner.
- Failed-load Problems cleanup: 1 failure to 1 pass. The manager now emits the
  canonical plugin ID; the human message retains the source path.
- Installed metadata publication failure: 1 failure to 3 focused passes including
  directory publication failure and pre-publication cancellation.
- Registry listener lifetime: 1 failure to 1 pass after extending the assertion
  to prove all three subscriptions dispose exactly once. An earlier standalone
  run overlapped package rebuilding and failed import resolution before tests;
  the cold run after rebuilding reached the exact assertion.
- Two additional owner-boundary regressions (repeated replacement rollback and
  dormant static registration): 2 failures to 3 passes including the existing
  direct collision case.
- Required native services: 4 meaningful rejection failures to 5 passes including
  available service activation. The first positive fixture was invalid because
  it combined Tauri with a CommonJS-only test entry; the neutral execution-host
  fixture was corrected without weakening any admission assertion.
- Seven directly affected API files: final 149 cases pass, zero failures.

## Intermediate source qualification

- `TURBO_CONCURRENCY=1 pnpm check`: all 18 tasks pass.
- `TURBO_CONCURRENCY=1 pnpm test --task-args --maxWorkers=1`: all 18 tasks pass;
  1,728 unique cases, 1,854 executions including 126 build prerequisites. The
  pre-existing single skipped frozen desktop case remains skipped.
- `TURBO_CONCURRENCY=1 pnpm build`: all 10 tasks pass.
- Focused `PluginManagement.stories.ts`: 25 interactions/accessibility cases
  pass in a cold browser process.
- The initial broad catalog run was deliberately stopped after its first shard
  (93 passes) when the two additional owner-boundary defects were found. That
  incomplete run is supporting evidence only, not the final complete gate.
- The first specification check failed its workspace-shell change-map gate;
  adding the owning plugin-management contract resolved it. Specification
  validation, mdBook, ownership/metadata audits and 38 validator tests then pass.
- Complete final source/catalog, static specification navigation, Web/server
  qualification and consumer native installation remain pending.

Logs use `/tmp/lapis-m91-` prefixes, including `source-{check,unit,build}.log`,
`source-catalog-focused.log`, `metadata-{before,after}.log`,
`unload-diagnostics-{before,after}.log`, `restart-expanded.log` and
`registry-listener-{before-cold,after}.log`.

## Boundary and remaining work

No Deno desktop implementation changed. No package was published. Consumer M9
remains In progress until actual signed native install/update/uninstall,
capability restrictions and recovery qualify; packed fixture seeding is not
installation evidence. Verification rows retain that boundary.

## Final source qualification

- Root check: 18/18 tasks pass. Root tests: 18/18 tasks pass, 1,734 unique
  cases and 1,860 executions including the same 126 build prerequisites.
- Root build: 10/10 tasks pass. Focused public Plugin Management: 25/25 pass.
- Complete cold Storybook interaction/axe: 259/259 pass across four shards
  (93/71/40/55), zero functional or accessibility failures.
- Static Storybook renders all 172 canonical chapters. Static documentation
  navigation/axe: six pass; the two development-only watcher cases stay skipped.
- Final spec check, App-ownership/metadata audits and 38 validator tests pass.
  The added manifest field initially required its mapped Markdown and Problems
  unchanged-contract confirmations; those are present and spec-first passes.
- Web: 12/13 pass. The server browser case times out in its unchanged 60-second
  Docker setup hook before browser assertions. The fresh image built successfully
  as `lapis-server:desktop-m91-local`; Docker was stopped and restored to 3072 MiB.
  Timed exact reproduction identifies server exit 1: Docker's VM disk is full,
  so native startup cannot create `/data/control`. No browser assertion ran.
  Reclaimed only two unused, unshared records from this migration's preceding
  `.local/m82` build (73.63 MB and 2.268 GB); image, container and vault data are
  preserved. The unchanged exact server case then passes in 17.3 seconds at the
  original 3072 MiB limit. The complete 13-case rerun passes in 1.7 minutes, with unchanged deadlines
  and assertions. Docker returns to its original stopped state at 3072 MiB.
  Evidence: `/tmp/lapis-m91-source-web-runtime-after.log`; the ignored desktop
  `.local/m91/docker-cache-cleanup.json` records both exact cache IDs.

The source foundation is qualified. Desktop packaged installation remains a
separate consumer gate; LN-PLUG-116–121 retain In progress until that evidence is
available. Source production files do not depend on acceptance trust or fixtures.
