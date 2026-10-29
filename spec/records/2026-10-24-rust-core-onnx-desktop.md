# Desktop native ONNX dependency qualification

Date: 2026-10-24. Qualified source Notes `6e56d581`; consumer Desktop
`a9ce8d9a`, owned evidence `spec/src/history/E-CORE-013.md`.

The native encoder source receipt remains
[real model inference](2026-10-24-rust-core-onnx.md). Desktop refreshes only
its private core dependency lock: **29** required package/version pairs are
added, with no existing versions removed or upgraded. The locked Darwin feature
tree retains dynamic ONNX **API 30**, with no runtime download feature. This is
dependency compatibility, not a selected semantic Search provider.

Exact consumer acceptance:

- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path
src-tauri/Cargo.toml --test core_file_service --locked` initially fails with
  **one lockfile diagnostic**, no runtime cases. After the targeted offline
  core lock refresh, **both cases pass**, zero failed/ignored. The existing
  compact-unwind linker warning remains non-fatal.
- Strict `cargo clippy` with that manifest, `--all-targets --locked --
-D warnings`, and the same environment passes normally and with `--features
e2e`. No application windows or user profiles are opened.
- `pnpm check:progress` rejects one unfinished evidence draft's unsupported
  result value. The finalized record preserves that attempt and passes with
  **50 tasks / 279 evidence records**, bookkeeping only.
- `pnpm spec:check` first rejects the expanded checkpoint at **32,836 bytes**;
  the first condensation remains nine bytes over the unchanged **32,768-byte**
  limit. Condensing that new summary leaves **32,756 bytes** and preserves
  every existing requirement. The exact rerun passes **all four lanes**.
- Final changed-document formatting, progress and specification validation
  pass: **321 chapters / 106 requirements**. The milestone ledger and generated
  `MIGRATION.md` both retain **2026-10-24 16:55:13 UTC** in that commit.

Consumer logs use `.local/core-onnx-*`; E-CORE-013 records exact attempts,
versions, commands, counts and scope. Source qualification remains separate:
**173 ordinary Rust cases**, one ignored real-model case executed separately
with actual CPU outputs, **1,489 API cases**, all source check/test/build/spec
lanes and ten task-routing/cache regressions pass at `6e56d581`.

AI `6548afe0`, Terminal `d7e0a7cd` and Redaction `3c3dc0d7` remain clean. JJ
Store `4d660d4c` retains unrelated changes; **529 paths** relative to its native
baseline `95d46e44` include no crates/Cargo/toolchain/desktop inputs. Preserve
them. Source provenance inventory is `.local/rust-onnx-jj-store-inputs.txt`.

No renderer, browser host, database adapter, installed app, runtime/model package
or native UI gate changes. The source's temporary native qualification library
is not a distribution solution. Provider/cache/status, vector publication and
retrieval, batch/rebuild controls, host adoption, unattended indexing and
R1.3/R3/R2/R4–R7 remain unfinished. This master-tracker follow-up refreshes its
UTC timestamp after the consumer commit as required by LN-GOV-051.

This documentation-only follow-up passes changed-file Prettier and full
`pnpm spec:check`: **nine lanes**, ownership/metadata audits and **38 regressions**.
Log `.local/rust-onnx-master-spec.log`. Final metadata validation retains **175
chapters / 1,511 requirements**. The already qualified product lanes are not
repeated for this status/evidence-only commit.
