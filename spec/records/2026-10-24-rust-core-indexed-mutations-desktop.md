# Desktop compatibility for the native indexed-file facade

Date: 2026-10-24. Notes source `68f9c02e`; Desktop consumer/evidence commit
`39fba424`, E-CORE-012. The [source receipt](2026-10-24-rust-core-indexed-mutations.md)
qualifies the implementation separately; neither host selects this facade yet.

Desktop qualification passes:

- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked`:
  **two pass**, zero failed/ignored; the existing compact-unwind warning remains.
- Strict `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings`,
  using the same environment and repeated with `--features e2e`: **both pass**.
- `pnpm spec:check`: **four lanes** pass. Final `pnpm check:progress` qualifies
  **50 tasks / 278 evidence records** as bookkeeping. Final specification
  validation covers **six validators / 320 chapters / 106 requirements**.
- Changed Markdown formatting and the selected Darwin locked/offline Cargo tree
  pass. No new compilation or verification failure occurs in this consumer.

Logs are Desktop `.local/core-indexed-mutations-{service,clippy,clippy-e2e,spec}.log`,
`.local/core-indexed-mutations-{progress-final,validate-final,format-final-check,tree}.log`.
The task ledger UTC timestamp survives generation into `MIGRATION.md`.

The root history index had reached 400 lines. Core receipt links now have their
own navigation page; original evidence paths/content and all links remain intact.
No threshold, baseline, requirement or original completion gate is weakened.

Notes source qualification passes ten retained full-state scenarios, seven
native transaction/lifetime cases, two protocol cases, **169 full Rust cases**,
**1,489 API cases** and all root check/test/build/specification lanes. The native
inputs consumed above match committed source `68f9c02e`. No production renderer
or shared catalog helper changes; the earlier **261-case** cold catalog receipt
remains independent of this unused native facade addition.

Cargo lock/dependency selection, renderer archives and Desktop's existing
database adapter are unchanged. Six local roots remain: Desktop, Notes,
AI `6548afe0`, Terminal `d7e0a7cd`, JJ Store `4d660d4c` and Redaction `3c3dc0d7`.
AI/Terminal/Redaction are clean. All **519** changed JJ Store paths from native
baseline `95d46e44` through the inspected working copy exclude Rust/Cargo/desktop
inputs; unrelated work is preserved. Notes inventory is
`.local/rust-indexed-mutations-jj-store-inputs.txt`.

M16.2 retains its original E-CORE-003/004 file/admission Done gate. The old
**230-case** native receipt remains against Notes `fa9581f0`, and the **three-case**
cold WebView receipt against `67a57aa9`. This check launches no application and
qualifies no new WebView/OS, provider, hosted, Linux or distribution journey.

The **68-method** name audit narrows the remaining catalogue work to Search
provider/status, batch/rebuild and schema/revision alias review. Name presence
is not return-shape or mode conformance. Native semantic output, vector/hybrid
retrieval, both database adapters, R1.3 shell/backup lifetime, unattended R3
indexing and R2/R4–R7 remain incomplete.

This follow-up refreshes the master tracker after the consumer commit, including
its explicit UTC date/time. Changed Markdown formatting and Notes specification
validation qualify the record/tracker-only update; product suites are not
repeated for this documentation change.
