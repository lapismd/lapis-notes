# Focused Desktop compatibility for native indexed metadata

Date: 2026-10-24. Notes `b7b517c0` supplies native normalized metadata
publication and indexed reads. Desktop remains clean at `f043d1b9`.

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path
src-tauri/Cargo.toml --test core_file_service --locked` passes both native
cases, with zero failures or ignored cases. Log:
`.local/core-db-indexed-service.log` in Desktop. The known linker unwind-size
warning remains. The Desktop lockfile needs no changes.

This proves native compilation and retained shared-file admission, including
unknown sessions and replaced-root rejection. Desktop still uses its existing
database adapter. It does not qualify adoption of these new methods, native UI,
providers, Linux or distribution. The previous full 230-case/three-cold-case
qualification remains scoped to Notes `67a57aa9` in E-CORE-005.
