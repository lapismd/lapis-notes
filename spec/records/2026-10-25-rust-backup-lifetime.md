# Shared native backup lifetime

Baseline: Notes `1bf61394`. This is the existing R1.3.10 gate from the shared
Rust plan, not a new backup engine or expansion of restore/sync functionality.
Native engine source is jj-store `7192ff39fb096d74f78ad9d7db503a33b9462fa8`;
its crate sources have no uncommitted changes. The source uses public `jj-vault`
capture, schedule, storage and recovery plus
the existing native backup path classifier. Desktop intake remains separate.

## Exact source acceptance

`CARGO_BUILD_JOBS=2 pnpm rust:core -- test -p lapis-app-core --test service_backup`
initially fails with nine missing API errors; no test case can run before the
shared backup owner exists. After implementation, a visibility error and one
unused import are repaired. The same four real-engine cases then pass in 2.73
seconds: native capture without clients/observers, final saved bytes on Quit,
failed final capture with original-owner repair/retry, and concurrent clients
sharing closure. Retained checkpoint bytes are restored through the native
engine after closure, not inferred from a status label.

Six integration cases now pass, including external-storage admission and cached-directory replacement. The
cancellation/drain case lives in a private test module and holds the real
initializer gate on a blocking test thread. It proves a cancelled waiter leaves
accepted initialization owned and that close stays blocked until it completes.
The earlier native-session contention fixture is replaced because a busy
repository lease fails immediately and cannot deterministically hold startup.
No production instrumentation or relaxed assertion is introduced. Full source,
strict and browser qualification remains required before commit.

The additional cached-storage regression
`pnpm rust:core -- test --workspace --test service_backup cached_backup_admission_rejects_a_replaced_history_directory --locked`
moves one failure to one pass. Cached attachment and every native capture now
revalidate the retained physical history directory before accessing a binding.
The test repairs the disposable directory before teardown and verifies that no
history is created in its replacement.

The first broad run passes strict all-target Clippy and all 244 ordinary Rust
cases. After the storage guard, final `pnpm check`, `pnpm test`, `pnpm build`
and `pnpm spec:check` pass: 245 fresh ordinary Rust cases, 20 package test tasks,
20 checking tasks, 11 package build tasks, the native workspace build, ten
specification lanes and 49 validator regressions. Valid cached JavaScript package
tasks are retained; their source is unchanged. Protocol generation, Rust
formatting and strict all-target Clippy pass through the normal check lane.

The final cold `pnpm --filter @lapis-notes/web test:e2e:rust-server` passes one
real login/open/edit/save/reload journey (8.6 seconds). It rebuilds the renderer
and Rust binary and uses the selected hosted backup profile. Test-owned Vite
serves the built assets; Rust owns application services. Production static
hosting remains R7. The existing Node journey receipt is `1bf61394`; Node source
is unchanged. Product catalog interactions are unchanged by this Rust slice;
generated Specification metadata is covered by its owning document checks.

## Hosted acceptance

The new exact HTTP case is
`CARGO_BUILD_JOBS=2 pnpm rust:core -- test -p lapis-server --test http_files backup::hosted_profile_keeps_native_backup_after_detach_and_drains_final_saved_bytes`.
It uses the real authenticated HTTP listener and immutable native history reads
to check initial reconciliation, capture after detach and final persisted bytes.
Before wiring profile-backed HTTP attachments, this exact case fails once
because no retained history exists. It now passes once (2.41 seconds), using the
same assertions. The application profile creates private `vault-history` storage
and reconciles on its authenticated attachment path. The cold hosted workflow also passes. Tauri ownership adoption and remaining
application parity retain their original gates.

## Governance and build attempts

- Adding the canonical backup lifetime chapter initially reports two missing
  Specification mirror/order findings. `pnpm spec:mirrors` creates the existing
  metadata-only mirror and ordered navigation. Specification validation then
  passes ten validators, 176 chapters and 1,511 requirements.
- The generated catalog metadata also requires its existing documentation
  chapter in spec-first; that truthful mapping accompanies the change. One
  final formatting warning in the generated preview order is corrected;
  Prettier, mirror synchronization and the spec-first gate then pass.
- The first native dependency build is retained in `.local/rust-backup-before.log`.
  Portable private sibling Cargo dependencies use existing source engines.
- Under standing cache approval, 67 inactive prior Notes Core/Server test
  executables (about 4.1 GiB) are removed. Compiler inactivity, unopened files
  and unchanged size/inode/mtime are checked before deletion. App binaries,
  libraries, vaults and profiles remain. The inventory is
  `.local/rust-backup-obsolete-tests.json`.
- A later build falls below the 30 GiB preflight. Under the same standing
  approval, 1,114 older library/metadata caches (about 3.37 GiB) are removed from
  the Notes and Desktop build directories. Source/features/profile groups retain
  their newest variants; libraries with an incomplete newer build keep their
  existing full archive. Compiler inactivity, open files and unchanged metadata
  are rechecked. All app binaries remain. The inventory is
  `.local/rust-backup-obsolete-libraries.json`.

The shared source and hosted native lifetime are qualified. R1.3.10 remains
Working because Tauri ownership adoption is outstanding. Native UI/provider
gates, R1.3.11 and R2–R7 remain open;
M11 stays Deferred. No `lapis-ai` source or frozen Deno implementation changes.
