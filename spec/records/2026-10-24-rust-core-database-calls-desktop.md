# Desktop dependency compatibility with native database calls

Notes `77ae786b` qualifies the [native high-level call boundary](2026-10-24-rust-core-database-calls.md)
before host selection: all 68 methods / 85 retained calls, complete value/default
semantics and retained enhancement diagnostics. Its full source gates include
205 Rust cases, 1,532 API cases, three actual-model cases and all specification
lanes. This receipt checks the unchanged Desktop `074dee3a` against that core.

All 19 existing archive SHA-256 values verify, including the five Notes entries.
The public archive cohort is not rebuilt by this Rust-only intake.
Five Notes archives remain at `e6de56ef`; fourteen other entries and tracked
registry ranges remain unchanged. Neither application's database provider changes.
Only the shared file service is selected, and hosted access still uses Node.

## Native dependency checks

The exact target passes **two cases, zero failures** after a fresh rebuild.
Both strict normal and e2e all-target Clippy checks pass with zero diagnostics.
The existing compact-unwind linker warning repeats in the test rebuild without
an assertion failure or a new compiler diagnostic. Incremental output is disabled
and compiler jobs are bounded to two. Commands:

```sh
CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_file_service
CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings
CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked --features e2e -- -D warnings
```

The committed Notes slice passes `pnpm spec:first --base '@--' --head '@-'`:
25 protected files / three canonical chapters. The independent source receipt
retains its actual failures, fixes, preflight stops and cache maintenance.

## Original gates retained

This is native library compatibility, not native database adoption, actual IPC
call acceptance, visible WebView or provider/UI qualification. The previous
full Desktop catalog/native receipt stays at E-CORE-014. Native asset admission,
both host adapters, retained shell and backup lifetime remain R1.3; unattended
metadata/projection/Search/history work remains R3. M11 stays Deferred.

The Desktop checkout remains clean; no source, manifest, lockfile or archive is
modified. Logs live under Desktop `.local/core-calls-compatibility-exact.log`
and `.local/core-calls-compatibility-clippy-{normal,e2e}.log`. This Notes receipt
and timestamped master tracker are the only follow-up changes.

Changed-document formatting and `pnpm spec:validate` qualify this documentation
follow-up; product suites remain recorded with the separately committed source.
