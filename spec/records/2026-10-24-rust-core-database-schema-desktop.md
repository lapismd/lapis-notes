# Desktop compatibility with native schema lifecycle

Notes source `3d5a0fcb` independently qualifies the
[native schema lifecycle](2026-10-24-rust-core-database-schema.md). This receipt
checks that Desktop `074dee3a` still consumes that library. Desktop remains on
its previous database adapter; only the common file service is selected.

The five Notes public archives remain at the previously qualified `e6de56ef`;
the other fourteen cohort entries and tracked registry ranges are unchanged.
All nineteen archive SHA-256 values are rechecked. An initial ad hoc audit
incorrectly resolved the five relative tarball paths from the caller directory
and stopped with ENOENT; using the manifest directory resolves all paths and
the complete cohort passes. No archive or installation is modified.
This Rust dependency check neither refreshes those archives nor adopts native
AppDatabase, semantic queries, model installation or unattended indexers.

## Native checks

- `MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo test --manifest-path
src-tauri/Cargo.toml --locked --test core_file_service`: **two pass, zero
  failures** after a native rebuild. The existing compact-unwind linker warning
  repeats, as in the prior `8fd7b926` compatibility log; no assertion or compiler
  warning policy changed.
- `MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 cargo
clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D
warnings`: **pass, zero diagnostics**.
- The same strict command with `--features e2e`: **pass, zero diagnostics**.
  Incremental output is disabled for these checks to avoid recreating caches.
  Native logs are `.local/core-schema-compatibility-exact.log` and
  `.local/core-schema-compatibility-clippy-{normal,e2e}.log` in Desktop.
- The committed source's `pnpm spec:first --base '@--' --head '@-'` passes
  for **seven protected files / two canonical chapters**.

All native checks are quiet library/service qualification. They do not launch
a native review window or qualify visible WebView, OS, provider or distribution
gates. The earlier full Desktop catalog/native receipt remains independently
recorded under E-CORE-014.

## Build cache maintenance

The rebuild lowers free space below the 30 GiB guard. Under the user's standing
cache approval, only the inactive Desktop `target/debug/incremental` directory
is removed (1,792,713,043 bytes). Compiler inactivity and open files are checked;
an initial deletion attempt stops without deleting anything while Spotlight
briefly holds a cache object. A later empty open-file check permits removal,
restoring 31.81 GiB free. Binaries, application packages, profiles, vaults,
model/runtime assets and source trees are preserved.

## Remaining original gates

The source owns `migrate()` and all 68 method names/known aliases now exist.
Exact argument defaults, query-enhancement shape, missing/null/void transport
results, selected host adapters and R1.3 shell/backup lifetime remain incomplete.
R0–R7 stays active; M11 distribution stays Deferred.

This documentation-only receipt passes changed-document Prettier and
`pnpm spec:validate` (10 validators, 175 chapters, 1,511 requirements). Desktop
remains clean; only this receipt and the Notes master tracker change.
