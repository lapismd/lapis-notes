# Focused Desktop compatibility for native projection storage

Date: 2026-10-24. Notes `65a6c0e0` supplies the five native projection write
methods and typed ordered-map DTOs. Desktop `14a07f6b` records E-CORE-006.

The initial locked consumer command stops before running cases because the
new dependency edges are absent. Offline resolution and the final minimal lock
add only `indexmap` to the protocol, schema and type-generator dependencies.
All package versions and unrelated dependency choices remain unchanged.

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path
src-tauri/Cargo.toml --test core_file_service --locked` passes both focused
native cases, with zero failures or ignored cases. Desktop log:
`.local/core-db-projections-service-final.log`. Four Desktop specification lanes,
progress generation/checking and changed-document formatting pass.

AI `6548afe0` and Terminal `d7e0a7cd` remain clean. JJ Store `d6be1ae5`
has only catalog/docs/config differences from `47a73e13`, with unchanged native
crates/Cargo inputs. The known linker unwind-size warning remains.

This proves compilation and retained shared-file admission, not adoption of
the new database facade. The existing Desktop database adapter remains in use.
E-CORE-005's full 230-case/three-cold-case qualification stays scoped to Notes
`67a57aa9`. Hosted shell, indexing, native UI/OS, provider, Linux and
distribution gates are not widened.
