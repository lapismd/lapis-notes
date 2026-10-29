# Shared database observation for Tauri intake

Baseline: Notes `d1a6ddec`; Desktop remains `df16e136`. This is the existing
R1.3.8 source boundary, not completed Tauri or retained-Web adoption.

The admitted client now exposes the database's bounded committed-change receiver.
It validates native selection and the physical vault, opens lazily, and releases
its temporary opening lease before returning. Receivers retain neither admission
senders nor work leases. Detached clients and stalled receivers cannot delay
accepted writes, checkpoint, lock release or Quit. Overflow reports explicit lag;
the transport must publish a complete refresh before resuming incremental changes.

Rust also generates six database call/change DTOs into the API's public
`app-database` entry. The existing protocol drift gate checks this output;
packed declaration acceptance checks exact method-catalogue/change compatibility
and distinct undefined/null tags. Desktop consumes built public exports, not
private sibling sources or hand-maintained protocol copies.

## Regression and qualification

- Exact `pnpm rust:core -- test --locked -p lapis-app-core --test
service_database_changes` initially fails compilation with six missing-method
  diagnostics. The initial test also names a nonexistent status field; correcting
  it does not change production. The first runtime run finds an incorrect test
  assumption that metadata keys are file paths; retained metadata changes have
  no file paths. The corrected assertion preserves that contract.
- Exact `pnpm --filter @lapis-notes/api check:pack-types` initially fails with
  six missing exports and two catalogue/change type mismatches. Rebuilt API
  declarations now pass, including publint.
- All three focused subscription cases pass, with zero failures. Full `pnpm
check` passes all twenty JavaScript package tasks plus strict native/protocol
  checks. `pnpm test` passes 237 ordinary Rust cases, 1,532 API cases and all
  twenty package tasks. Five asset-dependent cases remain explicitly ignored in
  the ordinary Rust lane; their prior real-model receipts remain separate.
- `pnpm build` passes the production Rust build and all eleven JavaScript package
  builds. API prepack also passes publint and packed contract compilation.
  No UI presentation or embedding implementation changed, so this source slice
  does not substitute a fresh catalog/native/model gate.
- The initial `pnpm spec:check` passes its earlier lanes but fails spec-first
  because the new public API export also requires a mapped package chapter.
  Update the owning vault/storage package chapter; the exact spec-first rerun
  passes six protected files and three chapters. The full rerun passes all ten
  lanes, ownership/metadata audits and all 49 specification regressions.

No Desktop database adapter is selected by this change. HTTP qualification stays
at its existing receipt. Retained Web, backup lifetime, unattended indexing and
R2–R7 remain open; M11 stays Deferred. No UI, live-provider, Linux, release or
distribution acceptance is claimed.

Logs: `.local/tauri-database-{source-before,source-before-corrected,source-after,
types-before,api-build}.log` retain the initial diagnostics and first runtime
attempt. Final source commands use the same prefix.

Final source logs are `.local/tauri-database-final-{check,tests,build}.log`,
`.local/tauri-database-source-final.log`, `.local/tauri-database-types-final.log`
and `.local/tauri-database-final-spec-after.log`. All have zero final failures.
