# Current Node server integration (H01)

Reconciles qualified Node port `953d673b` with current Notes baseline `ce1a786e`
and the saved parity plan. Keeps newer App/workspace APIs, portable Node host
services, server authentication and managed-vault behavior. This slice enables
no hosted AI or repository-history endpoint.

## Repairs and dependency boundary

- Two asset regressions used `.obsidian/installed-plugins.json`; browser and
  authenticated server lookups now use the shared `.lapis` default. Both exact
  tests failed before the repair and pass afterward.
- Current API calls require Design Core close guards, plugin flush and centered
  bottom panels. Released Design Core 0.6.0 supplies those public contracts.
  Active package ranges and the frozen registry lock consume `^0.6.0` without
  source aliases, shims or patches. The frozen Deno application stays unchanged.
  Final diff review preserves its existing Deno resolution graph; only root
  manifest metadata and the retired server workspace entry are reconciled.
- Six Search placement assertions used superseded command-picker accessible
  names. Exact names now include their selected values. Six targeted plays pass.
- API Date Setting used the superseded `Choose date` name. The initial full
  catalog run reported one failure; the repaired exact story passes and asserts
  both empty and retained legacy date names.
- Three Plugin Management plays likewise used superseded filter/sort names.
  Exact selected-value names retain the real actions and result ordering; all
  25 family plays pass.
- Workspace Shell incorrectly reported total adapter writes as workspace-file
  writes. One focused failure reproduced configuration writes inflating the
  counter. File-scoped instrumentation repairs it while retaining the exactly-one
  resize-persistence assertion; all six shell plays pass.
- The existing hosted E2E flow has an optional host-runtime profile. It launches
  built Node output with isolated data and a private bootstrap secret, then
  reuses the container flow's editing, subscriptions, plugin and restart checks.
  Default container acceptance retains its image and service-identity checks.

## Qualification

macOS ARM64; pnpm 10.34.5. Server/native-worker and hosted-browser acceptance use
Node 24.15.0; ordinary workspace lanes use the installed Node 26.9.0.

| Lane                                          | Result                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Exact `.lapis` regressions                    | 2 failures before; 2 passed after                                                        |
| `pnpm test:server`                            | 9 portable + 46 server tests and native Turso worker smoke pass                          |
| `pnpm check`                                  | 20/20 tasks pass                                                                         |
| `pnpm test`                                   | 20/20 tasks pass; API 1186, Workspace 32, frozen desktop 296 plus 1 existing skip        |
| `pnpm build`                                  | 11/11 tasks pass                                                                         |
| `pnpm --filter @lapis-notes/web build:server` | Fresh server profile passes                                                              |
| `pnpm test:server:e2e:host`                   | Equivalent built-output Node24 host flow passes 1/1; cold data and retained-data restart |
| Complete Web/PWA Playwright                   | 12/12 pass                                                                               |
| Exact Search placement stories                | 6/6 pass after repairing 6 stale names                                                   |
| Exact API Date Setting story                  | 1/1 pass after repairing 1 stale name                                                    |
| `pnpm test:storybook`                         | 261/261 pass in four fresh sequential shards: 93, 71, 42, 55                             |
| `pnpm spec:check`                             | All six lanes, ownership/query audits and 38 validator regressions pass                  |

One overlapping catalog attempt was deliberately cancelled while package output
was rebuilding. It is not counted as qualification. Full reruns exposed the
11 catalog findings above (ten stale names and one fixture counter); none were
waived or loosened. The final full catalog passes without functional or
accessibility failures.

## Limits and next work

The Docker daemon is stopped. This integration reuses the prior Node port's
Linux image evidence; the new cold browser run uses the actual Node24 executable
on the host and makes no new Linux/container claim. Docker execution backend,
signing, release and deployment remain separate gates. Visual baselines were
not captured or approved. H02 extracts the native history service and qualifies
private supervised IPC before H03 adds authenticated hosted history/restore.
