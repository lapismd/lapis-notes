# Private hosted history companion (H02)

Implements LN-SRV-021–023. Node retains HTTP authentication, membership and vault
policy. The private Rust executable consumes JJ Store's committed neutral
history service at `f58b9363`, with no Tauri runtime. Original-source identity
witnesses adapt Desktop `8990cb57`; managed-root and IPC policy belong to Notes.

## Delivered boundary

- One supervised child and parent connection over a mode-0600 Unix socket in a
  mode-0700 temporary directory. No TCP endpoint or ambient agent launch.
- Versioned bounded outer frames carry the existing bounded inner frames as
  exact strings. JavaScript never parses/re-encodes their full-width integers.
  Pending work is bounded; malformed responses, exit and deadlines poison the
  connection without automatic replay or silent restart.
- Trusted binding resolves opaque vault UUIDs beneath configured managed
  storage. Source witnesses, canonical containment, repository identity and
  generation fence retained handles. Original and backup sources have distinct
  cache identities. Read frames cannot supply filesystem or caller authority.
- Revoke removes grants and drains their native scope. Shutdown confirms the
  native drain and zero exit separately from forced or uncertain completion.
  Parent disconnect drains preparation and removes the socket.
- The companion reuses heads/open/status/read/blame/close through
  `jj-history-service`; reading never initializes a missing repository.
- Rust code is grouped under `history` and `ipc`; Node transport lives under
  `src/native`. A checkout-owned native target pins Rust 1.99. The command guard
  requires 30 GiB free and never cleans or shares build caches implicitly.

## Verification

macOS ARM64, Rust 1.99.0, JJ 0.45.1, Node 24.15.0 and pnpm 10.34.5.

| Command / boundary                                                   | Result                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vitest run src/native/companion.test.ts` from server-node           | 4/4 pass; initial new-boundary run failed because the supervisor module was absent                                                                                                                           |
| `pnpm --filter @lapis-notes/server-node check`                       | 50/50 pass; TypeScript has no errors                                                                                                                                                                         |
| `pnpm test:server:native` on Node24                                  | 5 real Rust IPC tests plus actual Node-to-Rust smoke pass                                                                                                                                                    |
| Real native fixtures                                                 | Two vaults, exact pins after source advancement, scoped handles, generations, revocation, physical replacement, missing-source preservation, unknown/versioned frames, oversized input and parent disconnect |
| Native smoke                                                         | Two actual JJ vaults, denied other-session reads, explicit revocation and acknowledged graceful process exit                                                                                                 |
| `pnpm server:native -- clippy --all-targets --locked -- -D warnings` | Pass                                                                                                                                                                                                         |
| `pnpm check`                                                         | 20/20 tasks pass                                                                                                                                                                                             |
| `pnpm test`                                                          | 20/20 tasks pass                                                                                                                                                                                             |
| `pnpm build`                                                         | 11/11 tasks pass                                                                                                                                                                                             |
| `pnpm spec:check`                                                    | Six lanes, ownership/query audits and all 38 specification regressions pass                                                                                                                                  |

Fresh registry installation used the committed lockfile and `--ignore-pnpmfile`.
Temporary dependency links used during the earliest supervisor check were
removed before the independent full workspace qualification.

Initial Rust compilation exposed four adapter typing errors; corrected the
owned `Arc<History>` boundary and kept native errors serialize-only. Four fixture
startup failures retained the private/canonical-root policy; fixtures were fixed
to meet it. Strict Clippy found one complex grant-map type, now named. The first
Clippy command also exposed delimiter handling in the new launcher, now fixed.

An overlapping build/test attempt observed incomplete generated API declarations;
the serialized full build rerun passes. An initial specification attempt ran
against a stale Jujutsu workspace. Its preserved source snapshot was recovered
before qualification. Spec-first then required explicit unchanged AppDatabase,
package and mapping confirmations; the final check passes without exclusions.

## Remaining and milestone review

H02 establishes the private service boundary. H03 still owns authenticated HTTP
routing, shared browser History UI, automatic checkpoints/backup, coordinated
restore and cold two-browser acceptance. H04 onward remains pending; no AI
executor, conversation engine, memory, imports, Forge or Compute integration is
enabled here. Linux packaging and real-provider acceptance remain separate.

Desktop consumes the same service through its retained Tauri adapter; its
lockfile/native qualification is committed as `f8f3446e`, recorded independently
in E-REPO-056. Existing
desktop product milestones and visual/provider gates are unchanged. No user
profile, installed app, signing, package publication or deployment was changed.
