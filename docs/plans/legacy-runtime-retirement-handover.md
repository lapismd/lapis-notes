# Desktop and Deno retirement agent handover

Snapshot: 2026-11-19 after the frozen Notes host landed and at the active
shared-AI specification-authority removal. Coordination owner:
`lapismd/lapis-notes`.

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
- Frozen Notes host [#180](https://github.com/lapismd/lapis-notes/pull/180)
  removed the obsolete Deno desktop package and current host authority.
  Reviewed head `4f3323387402506c9c68cd7399530e0b450af6d3`; merge/current main
  `d2d0c9a4d2036f78094b52b681751d776e7e8d1c`. Fresh-main Release
  [44507599858](https://github.com/lapismd/lapis-notes/actions/runs/44507599858),
  PWA [44507598842](https://github.com/lapismd/lapis-notes/actions/runs/44507598842),
  dependency-image
  [44507598888](https://github.com/lapismd/lapis-notes/actions/runs/44507598888)
  and Storybook Pages
  [44507598925](https://github.com/lapismd/lapis-notes/actions/runs/44507598925)
  all passed. The PWA and Storybook deployments completed.

## Active slice: retire shared-AI current authority

Workspace:
`/Users/stevejuma/code/lapismd/lapis-notes-retirement-shared-ai-spec`

Base: exact Notes main `d2d0c9a4d2036f78094b52b681751d776e7e8d1c`.
JJ change: `nlxuqmxn`.

The candidate removes the 11 obsolete `spec/src/plugins/ai/**` chapters,
`LN-AI-*` current authority, the two AI verification pages and their generated
Storybook mirrors. It also removes requirements that existed only for the
retired shared plugin and narrows mixed requirements to their surviving
contracts.

Preserved authority includes App-owned memory and transcript contracts, API
file tools, skill/slash/tool/result-view registries, Native Chat, Tauri/native
AI, the registry provenance guard, saved settings/conversations/memory/data and
third-party fixtures whose plugin ID happens to be `ai`. Classification remains
provenance-based and never plugin-ID-only.

Completed local qualification:

- The Storybook spec-index regression passes 5/5.
- `pnpm check:retired-ai-tooling` passes.
- Direct validator output reports 11 validators, 174 chapters, 1,279
  requirements and zero findings.
- Specification validation passes all seven aggregate lanes. The final run is
  `.local/validation/runs/lapis-notes-validation-31668340-968f-4476-b53b-6d21bbb9be7e`.
- The 68 validator tests pass; mdBook, specification-document checks and
  exact-base spec-first all pass. The spec-first run maps three protected files
  to 56 canonical chapters.
- Static Storybook builds successfully and renders all 174 current
  specification chapters. Final run:
  `.local/validation/runs/lapis-notes-validation-9d5dea78-974f-4ece-bfde-65aa98a2954a`.
- The complete changed-path audit finds no `packages/**` product change. Every
  retained App/database/file-tool/native-AI/provenance requirement checked by
  the retirement boundary remains current.
- Host QMD has a Node ABI mismatch and correctly degrades to the documented
  `rg` fallback; do not claim semantic retrieval passed.

Remote gates still required:

- [ ] Commit unsigned, push an isolated bookmark, open/qualify/land the PR.
- [ ] Verify fresh exact-main workflows and update issue #177 with exact
      local, hosted and merge receipts.

## Remaining order after shared-AI authority lands

1. Update the standalone Terminal plugin's unavailable guidance so it no longer
   directs users to start `lapis-terminal-host`.
2. Convert `terminal-host` in place to Rust-only. Preserve `Cargo.toml`,
   `Cargo.lock`, `crates/lapis-terminal-service/**`, Server's exact pin,
   history and artifacts. Remove only Deno/npm/CLI/WebSocket/download/release
   surfaces; add Rust-only CI and a retired-Deno source audit.
   Do not relocate or rewrite the Rust service, and do not change Server's pin.
3. Treat npm deprecation of `@lapismd/terminal-host@0.1.0` as a separate
   explicit metadata gate. Never unpublish its tarball.
4. Re-scan all in-scope repositories, classify executable references versus
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
