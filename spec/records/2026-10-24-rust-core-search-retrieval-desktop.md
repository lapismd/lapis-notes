# Desktop compatibility for native Search retrieval

Date: 2026-10-24. Notes source `77398e4e`; Desktop consumer/evidence commit
`790e0b23`, E-CORE-011. The [source intake](2026-10-24-rust-core-search-retrieval.md)
records complete source qualification separately. Neither host has selected the
new database facade.

Desktop qualification:

- Exact `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked`:
  **two pass**, zero failed/ignored, after the final source correction.
- Strict `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings`,
  with the same environment and repeated with `--features e2e`: **both pass**.
- The timestamp regression improves from **one failure to one pass**; all
  **78 governance cases** pass. UTC date/time is taken from the canonical task
  ledger, survives `progress:generate`, and participates in stale-summary checks.
  Date-only input is rejected.
- `pnpm progress:generate` and `pnpm check:progress` pass **50 tasks / 277
  evidence records**, as bookkeeping. `pnpm spec:check` passes all **four lanes**.
  Final `pnpm spec:validate` passes **six validators / 318 chapters / 106
  requirements**. Changed-document/script/test formatting passes.

Logs are Desktop `.local/core-search-retrieval-{service-final,clippy-final,clippy-e2e,spec-final}.log`,
`.local/core-search-retrieval-{progress-commit,validate-commit,format-commit-check}.log`
and `.local/migration-timestamp-{before,after,governance}.log`.

Before/after history remains in E-CORE-011. One missed private binding causes a
compilation diagnostic and is repaired in Notes. The Desktop introduction then
exceeds the unchanged byte limit by 23 bytes. An initial prose replacement is a
no-op after formatting, so both validation attempts report that same finding;
the actual bounded introduction correction passes. No assertion or verifier is
weakened. The existing compact-unwind linker warning remains non-fatal.

The Cargo lock adds only pinned `regress 0.12.0` and its Core dependency edge.
Offline update attempts propose 31 unrelated upgrades; those are discarded.
The selected Darwin locked/offline dependency tree validates the retained graph.
Six local roots remain: Desktop, Notes, AI `6548afe0`, Terminal `d7e0a7cd`,
JJ Store `4d660d4c` and Agent Redaction `3c3dc0d7`. AI/Terminal/Redaction are clean.
All 497 changed JJ Store paths from `95d46e44` through its inspected working
copy omit Rust, Cargo and desktop inputs; unrelated UI/catalog/docs work is
preserved. The native inputs tested above match committed Notes `77398e4e`.

The production database transport and renderer archive cohort are unchanged.
The retained API snippet fix is not installed into Desktop by this dependency
check. E-CORE-008's **230 native cases** remain qualified against Notes
`fa9581f0`; E-CORE-005's **three cold WebView cases** remain against `67a57aa9`.
No application window, provider journey, visual baseline or installed app is
changed or claimed by this receipt.

M16.2 retains its original file/admission Done gate. Database adapter adoption,
native semantic Search, unattended R3 indexing, R1.3 hosted shell/backup lifetime,
R2/R4–R7, providers, Linux and distribution remain incomplete.

Both tracked agent guides now require a migration-ledger refresh with every
slice commit, including explicit UTC date/time. Notes LN-GOV-051 owns the master
tracker rule; the Desktop generator preserves its task-ledger timestamp rather
than substituting wall-clock time during validation. This follow-up refreshes
the master tracker after the consumer commit and retains the original plan.

Changed Markdown formatting and Notes `pnpm spec:validate` qualify this
record/tracker-only follow-up. Product checks remain the committed source and
consumer evidence above; no product suite is repeated for this document change.
