# Desktop and Deno retirement agent handover

Snapshot: 2026-11-19 after Desktop preservation and at the active Notes frozen-host removal. Coordination owner: `lapismd/lapis-notes`.

This is the takeover entry point. The [canonical plan](legacy-runtime-retirement.md) owns scope and ordering; the [progress ledger](legacy-runtime-retirement-progress.md) preserves dated attempts and evidence. The live GitHub tracker is [lapis-notes issue #177](https://github.com/lapismd/lapis-notes/issues/177).

## Scope that must not drift

- Remove only deprecated Desktop code and unnecessary Deno runtime/tooling.
- Preserve every core API service/function and future-facing capability,
  including Language Service, Sync and `packages/deno-host-services/**`.
- Keep E-RETIRE-007 parked. Lack of a current caller is not removal authority.
- Exclude `nostr-agent-controller`, `community-local` and `nostr-auth`.
- Preserve standalone `ai-controller`, AI Host execution/MCP/file-tools,
  portable Redaction, Tauri/native AI, history, artifacts and user data.
- Do not move terminal code. Desktop Rust packages stay in `lapis-terminal`;
  Server's private Rust service, Cargo manifests/lock and pin stay in
  `terminal-host`.
- Use isolated JJ workspaces, one reviewable removal per change and owner checks.
  Keep source, consumer, native, publication, deployment and installed-product
  gates separate.

## Completed foundations

- Shared `@lapis-notes/ai` source, package, catalogs, Notes probes and fixture
  inputs are removed; registry HTTP 410, provenance rejection and all eleven npm
  deprecations are live without unpublishing artifacts or deleting user data.
- Notes API 0.6.9, UI 0.2.5 and App Profile 0.2.6 are published and adopted.
- AI Host [#6](https://github.com/lapismd/ai-host/pull/6) removed only the orphan
  private Deno fixture. Merge `dcc42f3791282d4dd9138347614c2b93e09af245`;
  exact-main run
  [44434123912](https://github.com/lapismd/ai-host/actions/runs/44434123912)
  passed.
- Desktop preservation [#58](https://github.com/lapismd/lapis-desktop/pull/58)
  sealed E-RETIRE-015. Reviewed head
  `dedc658288435b4d60e3ebbfbf1a4d430354f1ad`; merge/current main
  `769cc6135af1305cf92ef20e2a41b7eeb2870f7f`; exact-head CI
  [44482302141](https://github.com/lapismd/lapis-desktop/actions/runs/44482302141),
  exact-main CI
  [44488080528](https://github.com/lapismd/lapis-desktop/actions/runs/44488080528)
  and exact-main Pages
  [44488080625](https://github.com/lapismd/lapis-desktop/actions/runs/44488080625)
  passed.
- The user accepted two unchanged, out-of-scope native failures as non-blocking:
  the transcript backup status never reaches `Vault history: Saved locally`,
  and a raw development-WebView diagnostic exits `SIGABRT`.

## Active slice: remove the frozen Notes Deno desktop

Workspace:
`/Users/stevejuma/code/lapismd/lapis-notes-retirement-frozen-desktop`

Base: Notes main `aca52edd7497e6ba7bd39c91507b9e8f87f5170f`.
JJ change: `rtkxrrpp`.

The source candidate removes exactly 176 tracked files under
`packages/desktop-deno/**`, `scripts/desktop-release.mjs` and its test. It
removes root manifest, lockfile, Deno import-map, workspace, cache and release
edges while retaining the fail-closed retirement checker.

The canonical candidate removes the eight current Deno-host chapters,
`LN-DENO-001` through `LN-DENO-094`, their verification page and generated
Storybook mirrors. It archives the retirement boundary at
`spec/archive/2026-11-19-frozen-deno-desktop-host-retirement.md` and rewrites
retained generic contracts without deleting API/core services.

Completed local qualification:

- Before deletion: `node --test scripts/desktop-release-workflow.test.mjs`
  passed 3/4; the sole expected failure named the package and two release
  scripts.
- After deletion: the same regression passes 4/4.
- Release-version regression passes 25/25; combined focused Node run passes
  29/29.
- Frozen installation reports the regenerated pnpm lock current and leaves its
  exact SHA-256 unchanged.
- Package/release validation passes package boundaries 4/4, local plugin
  consumer 9/9, release tests 219/219 and both release checkers.
- Specification validation passes all seven lanes: 11 validators, 187 chapters,
  1,470 requirements, 68/68 validator tests, mdBook, app ownership, metadata
  queries and embedded exact-base spec-first.
- The final current-contract audit finds no supported contract that requires the
  deleted host or a Notes-owned terminal host. Remaining Deno references are
  compatibility identities, retained host-service/server/Sync kernels,
  anti-resurrection/history, or negative terminal-host guards.
- Retained Deno host-service type checking passes for all nine production
  entries; the regenerated `deno.lock` contains no retired AI/MCP/terminal
  graph.

Earlier exact-product qualification also passes Web tests/build, root check,
root test and root build as recorded in the progress ledger. No executable
source changed during the final authority scrub.

Remote gates still required:

- [ ] Commit unsigned, push as an isolated bookmark, open/qualify/land the PR.
- [ ] Verify fresh exact-main CI and update issue #177 with exact receipts.

## Remaining order after Notes lands

1. Retire the already-absent shared-AI current specification authority as a
   spec-only Notes slice. Archive its 11 current chapters, 177 verification
   rows and generated mirrors; retain API file-tools, Tauri AI and history.
2. Update the standalone Terminal plugin's unavailable guidance so it no longer
   directs users to start `lapis-terminal-host`.
3. Convert `terminal-host` in place to Rust-only. Preserve `Cargo.toml`,
   `Cargo.lock`, `crates/lapis-terminal-service/**`, Server's exact pin,
   history and artifacts. Remove only Deno/npm/CLI/WebSocket/download/release
   surfaces; add Rust-only CI and a retired-Deno source audit.
4. Treat npm deprecation of `@lapismd/terminal-host@0.1.0` as a separate
   explicit metadata gate. Never unpublish its tarball.
5. Re-scan all in-scope repositories, classify executable references versus
   history/negative guards/preserved adapters, close current specs and update
   issue #177.

Website production deployment remains an independent unchecked decision; the
approved preview did not authorize production.

## Handover discipline

Read each repository's tracked `AGENTS.md`, inspect `jj --no-pager st`, fetch
current remote state and search the owning specification before editing. Work
one removal at a time. Do not infer completion from a prepared workspace,
focused replay, merged source PR, published package or hosted preview. Update
issue #177 and this snapshot after every landed slice.
