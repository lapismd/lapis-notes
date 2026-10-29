# Desktop compatibility for native Search storage and preparation

Date: 2026-10-24. Notes native source `113cb2ec`, including Search storage
`3aa8abaa`; Desktop consumer/evidence commit `c2aa31af`.
The [storage record](2026-10-24-rust-core-search-storage.md) and
[preparation record](2026-10-24-rust-core-search-preparation.md) retain source
qualification separately. Neither host has selected the new database facade.

Desktop E-CORE-010 records:

- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked`:
  **two pass**, zero failed/ignored.
- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings`,
  repeated with `--features e2e`: **both pass**.
- `pnpm progress:generate`, `pnpm check:progress`: **50 tasks / 276 evidence
  records** pass; generated root status remains unchanged. This is bookkeeping.
- `pnpm spec:check`: **four lanes** pass. Changed-document Prettier passes.

Logs are Desktop `.local/core-search-{service,clippy,clippy-e2e,spec}.log`,
`.local/core-search-progress-{generate,check}.log` and
`.local/core-search-format-check.log`. No new compilation or test failure
occurs; the existing compact-unwind linker warning remains.

An all-platform offline `cargo metadata` inspection requests uncached optional
`antithesis_sdk 0.2.9`. The actual selected Darwin `cargo tree --locked --offline
--target aarch64-apple-darwin` succeeds. This inspection failure is not a failed
native build. The selected graph has six local source roots: Desktop, Notes,
AI `6548afe0`, Terminal `d7e0a7cd`, JJ Store `4d660d4c` and Agent Redaction
`3c3dc0d7`. JJ Store has unrelated documentation work; consumed native inputs
are unchanged from `95d46e44`. Desktop's separate deferred Review planning
commit `6699a167` changes no native runtime input from `4b775fdb`. Preserve it.

Desktop's Turso/FTS dependency selection, Cargo lockfile, native adapters and
renderer archive cohort remain unchanged. The retained API Unicode source fix
is not installed into Desktop by this native compatibility check. E-CORE-008
retains the 230-case native qualification against Notes `fa9581f0`; E-CORE-005
retains the three cold WebView cases against `67a57aa9`. No application is
launched, installed or restarted.

M16.2 retains its original file/admission completion gate. This evidence does
not qualify database adapter adoption, Search retrieval/model output, R1.3
hosted shell/backup lifetime, unattended R3 indexing, UI/OS, providers, Linux or
distribution. Those gates remain open in the migration tracker.

The original agreed plan remains tracked at root
[`RUST_CORE_MIGRATION_PLAN.md`](../../RUST_CORE_MIGRATION_PLAN.md), linked from
`AGENTS.md`, `MIGRATION.md`, the canonical Rust architecture chapter and now the
README. The plan matches committed source `113cb2ec` byte for byte; no duplicate
plan is introduced. Current statuses remain in `MIGRATION.md` rather than being
copied into the plan.

Changed-document Prettier and `pnpm spec:validate` pass: **10 validators,
175 chapters and 1,505 requirements**. Product suites are not repeated for this
record/navigation-only change. Logs use `.local/rust-search-desktop-docs-*`.
