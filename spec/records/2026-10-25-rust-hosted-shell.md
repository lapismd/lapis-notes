# Retained hosted shell over Rust

Baseline: Notes `b55d3492`. Desktop M16.3 uses that committed source while its
native/catalog qualification runs independently. This R1.3.9 work connects the
existing hosted login, vault chooser and Notes workspace to versioned Rust
HTTP; no replacement screen, embedded JavaScript server, implicit Node fallback
or authoritative client background scheduler is introduced.

## Current qualification

The exact API runtime regression is
`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/server-vault-session.test.ts`.
Before implementation, two new `rust-server` cases fail and four retained
Node/Deno cases pass. After implementation all six pass. Rust-hosted sessions
require the owning injected provider, use direct admission and close that view
on session teardown. Six private HTTP-client cases pass for cookie/CSRF/protocol,
request identity, native errors, lost responses without replay and disposal.

## Initial retained-screen journey

`pnpm --filter @lapis-notes/web test:e2e:rust-server` now passes one cold journey
through the built production screen and actual Rust service. Login, selecting a
configured vault, opening/editing a real Markdown file, checking persisted bytes,
and browser reload/reopen all pass (7.3 seconds after build). The owned preview
serves built assets; Rust owns authentication, admitted files and the database.
Full Rust static delivery remains R7, not a claim from this preview fixture.

Failed attempts remain explicit:

- Web check initially finds four adapter/bootstrap typing errors; corrections
  retain exact public types and separate typed component mounting. A fixture
  environment annotation clears one later test-harness typing diagnostic.
- The first browser attempt correctly rejects insecure cookies at a numeric
  loopback origin. Use the existing allowed `http://localhost` test origin;
  authentication policy is unchanged.
- The next attempt finds a directory-creation contract mismatch. The exact
  `src/hosted/rust/vault-adapter.test.ts` moves two failures to two passes:
  existing directories are idempotent, while existing files/uncertain writes
  remain failures. Keep the prepared session's existing startup/recovery view
  visible instead of hiding it until readiness.
- The first spec-first pass reports four missing mapped chapters; the owning
  contracts now accompany these changes. The new generated output directory is
  ignored/untracked, with files retained on disk. Final validation must exclude
  those build artifacts rather than count them as source.

## Broad qualification

The complete `pnpm check` passes all 20 tasks. `pnpm test:storybook` passes
261 cases in four cold browser shards (93, 71, 42 and 55). The repaired
`pnpm spec:check` passes all ten configured lanes plus 49 validator regressions.
The first spec-first attempt also required the existing governance chapter to
record the generated Rust-hosted output exclusion; the checker is unchanged.

The initial full unit run has one timeout in the unchanged
`@lapis-notes/deno-host-services` test `keeps completed receipts outside the
bounded active journal`. The exact rerun passes one case (41 deselected) in
1.51 seconds, without a test or timeout change. The full rerun with competing
browser suites stopped passes all 20 tasks, including 237 Rust cases and 1,534
API cases. Complete `pnpm build` passes all 11 package tasks and the native
workspace build. The complete Web unit suite passes all 50 cases.

The retained Node baseline passes the complete existing host browser scenario:
`PATH="/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH" pnpm test:server:e2e:host`
builds the Node 24 server and production renderer, then passes editing, sharing
events and a real service restart (one browser case, 18.7 seconds). The backend
abstraction retains existing Node management/transfer/plugin adapters.

The final cold `pnpm --filter @lapis-notes/web test:e2e:rust-server` passes
against freshly built production assets and the actual Rust binary (one case,
7.4 seconds). It includes the final direct-role and normalized byte-path guards.
Both fixture services exit under their owned teardown; no review server is left
running. All changed supported source/document formats pass Prettier, including
Svelte through the existing local formatter plugin.

Existing browser/offline behavior and the Node serving baseline retain separate
gates. R1.3.9 retains full hosted intake/parity work. Backup lifetime, AI,
unattended indexing, native jobs and final cutover remain in their existing
slices. M11 stays Deferred.

The initial Rust profile uses operator-configured vaults. Existing management,
transfer and installation controls report their unavailable capabilities rather
than call Node. Full hosted parity remains open. Revision polling is view-only
observation during this stage; native services retain work/writer ownership,
and the final typed SSE transport remains R7.
