# Focused Desktop compatibility for native projection reads

Date: 2026-10-24. Notes `c028f4f6` supplies single-row projection reads.
Desktop remains clean at `14a07f6b` with its existing database adapter.

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path
src-tauri/Cargo.toml --test core_file_service --locked` passes both focused
native cases: zero failures or ignored cases. Native compilation rebuilt
inactive caches removed under standing user approval; no windows were launched.
Log: Desktop `.local/core-db-projection-rows-service.log`.

No Desktop source or lockfile changes are needed. AI `6548afe0`, Terminal
`d7e0a7cd` and JJ Store `d6be1ae5` retain their committed native inputs.
The known linker unwind-size warning is unchanged.
JJ Store has unrelated catalog/visual edits; no native crate or Cargo input
is modified. Those edits were left untouched.

This result qualifies native compilation and retained shared-file admission.
It does not adopt the new database facade or widen E-CORE-005's complete
230-case/three-cold-case qualification for Notes `67a57aa9`. Native UI/OS,
providers, hosted shell, indexing, Linux and distribution remain separate gates.
