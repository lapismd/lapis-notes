# Sync-host startup and observed file events

The final M6 native profile passed 36 of 37 cases. Search immediate Close
intermittently failed while disposing SyncHostService, with its explicit
"file change could not be committed after concurrent updates" error. The setting
had reached disk; this was identity-readiness failure during host teardown.

The source regression holds the first identity transaction, modifies a real
MemoryVault note and verifies the observed event cannot overtake initialization.
It fails once before the fix and passes afterward. Await initial reconciliation
inside the existing event queue, preserving sequence checks and bounded retries
against genuinely independent writers. No consumer retry or timeout change.

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/sync-host-startup-ordering.test.ts
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/sync-host-startup-ordering.test.ts src/lib/__tests__/sync-host.test.ts src/lib/__tests__/sync-host-local-provider.test.ts src/lib/__tests__/sync-host-plugin-harness.test.ts src/lib/__tests__/sync-host-security-provider.test.ts src/lib/__tests__/sync-host-security-store.test.ts
pnpm --filter @lapis-notes/api check
pnpm --filter @lapis-notes/api build
pnpm spec:first
```

All 74 affected cases across six files pass; API strict check reports zero
Svelte errors/warnings, and public build, publint and packed type contracts pass.
Mapped spec-first and all six canonical lanes pass, including App/metadata audits
and 38 specification-tooling cases. Final consumer archive/native
verification follows before qualifying the native fix. Node 26.9.0,
pnpm 10.34.5, Vitest 4.1.11, macOS ARM64.

The source workspace isolates all migration changes from unrelated main work.
Do not push main or publish. Full source/Storybook/axe/web/consumer lanes remain
session-deferred until M7 implementation; preserve every M4–M7 original gate.
Deno host source stays frozen. No ordinary user profile was used.
