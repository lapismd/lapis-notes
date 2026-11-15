# Native Sync App contract — 2026-11-15

This source slice adds the portable Notes API boundary required for native
Lapis Sync. It starts from Notes main `d1178edf` in the independent repository
`/tmp/lapis-sync-implementation.Vk9Fyp/lapis-notes`; the qualified Jujutsu
change ID is `lllstqmk`. It does not select a Desktop or Server consumer, run a
native Sync repository, publish a package, or activate Sync by default.

## Contract and ownership

- `App` and `VaultSession` accept one optional host-admitted `NativeSyncPort`.
  A session-owned port takes precedence over a direct App port.
- A plugin must select the exact `lapis-server` provider and receives a
  revocable lease. Snapshots, commands, replies and errors cross the API as
  cloned opaque values; Notes imports no Sync protocol or merge algorithm.
- Lease detach and App disposal synchronously fence new calls and
  observations, reject late results and drain work accepted before revocation.
- Working-vault apply holds `FileEditingSessionRegistry.guard(undefined)` for
  the complete native call, protecting and flushing active writers without
  adding a second renderer persistence path.
- Native absence, provider mismatch, observation failure, mutation failure and
  cleanup failure remain explicit. The API does not select another provider,
  disposable persistence or a renderer mutation fallback.

## Exact regression

The initial focused suite could not load `../native-sync`: **0 suites passed / 1
suite failed**, with no assertions executed. After implementation:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/native-sync-service.test.ts
```

passes **8/8** cases. They cover absent and session-preferred ports, exact
provider selection, cloned snapshot/command/reply forwarding, observation
errors, synchronous revocation, accepted-call drain, late-result rejection,
provider failure without fallback, whole-vault writer protection and App
teardown.

## Qualified source lanes

All portable lanes used the pinned Node 24.10.0 toolchain. Validation explicitly
used `LAPIS_NOTES_VALIDATION_RUNTIME=native`; this is not Docker qualification.

| Lane                                               | Result                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| API focused suite                                  | **8/8** passed                                                                       |
| API complete suite                                 | **181 files / 1,812 tests** passed                                                   |
| API Svelte and TypeScript checks                   | **0 errors / 0 warnings**                                                            |
| API build, publint and public declaration contract | passed                                                                               |
| `pnpm check`                                       | **16/16 tasks** passed                                                               |
| `pnpm test`                                        | **16/16 tasks / 2,160 tests** passed                                                 |
| `pnpm build`                                       | **9/9 tasks** passed, including the production Web build                             |
| `pnpm spec:check`                                  | **6/6 lanes** passed                                                                 |
| direct specification validation                    | **11 validators / 194 chapters / 1,594 requirements**, zero findings                 |
| spec-first                                         | **10 protected files / 8 canonical chapters** passed                                 |
| specification mirrors                              | **194/194** current                                                                  |
| `pnpm packages:check`                              | boundary/policy gates and **121 tests** passed                                       |
| `pnpm audit`                                       | completed with **56 existing advisories**: 2 critical, 9 high, 36 moderate and 9 low |

The dependency advisories are repository-wide and this slice changes no
dependency version or lockfile. They remain a separate dependency-maintenance
gate rather than being hidden by Sync changes.

## Unavailable boundary and remaining gates

The canonical Docker-backed `pnpm spec:first` and package `check` entry points
both stalled in `docker info` before assertions and were stopped with SIGINT.
The explicit documented native override qualified the portable source lanes
above. No Docker, Linux, Tauri, OS credential, HTTP Server, installed-app or
end-to-end two-device boundary is claimed here.

The public patch changeset records the API addition, but publication is not
authorized. Server-owned native core/protocol, Desktop and Server adapters,
plugin consumption, cold restart, offline convergence, real credential
custody, external server edits and full Sync qualification remain separate
implementation stages. No visual source changed; visual review remains a
separate pending product lane.
