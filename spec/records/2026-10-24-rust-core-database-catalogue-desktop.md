# Focused Desktop compatibility for database catalogue extensions

Date: 2026-10-24. Desktop source remains `f043d1b9` with a clean working copy.
Notes `27e1b01f` supplies saved state/change events; `f235d02f` adds file-history
storage. Both source revisions were committed and independently qualified
before Desktop compiled against them.

For each revision, `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test
--manifest-path src-tauri/Cargo.toml --test core_file_service --locked` passes
both focused native cases. Existing native admission, shared file behaviour,
unknown-session rejection and replaced-root protection remain intact. The
Desktop lockfile needs no changes. The previously recorded linker unwind-size
warning remains unchanged.

These methods are not consumed by Desktop's existing database adapter. The
additive DTOs do not alter its vault frames or renderer input. These focused
results prove compilation and the retained file-service boundary; they do not
qualify database adoption, native UI/OS acceptance, providers or distribution.
The previous complete 230-case/three-cold-case qualification remains scoped to
Notes `67a57aa9` in E-CORE-005, rather than being widened to these revisions.
