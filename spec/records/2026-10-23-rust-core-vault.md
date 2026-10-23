# R1.1 shared native vault engine

Date: 2026-10-23. Source revision: enclosing Jujutsu change. Desktop source
baseline: `40a5d97c`. The consumer remains the default Desktop workspace.

## Implementation

Moved seven existing vault modules into Notes-owned `lapis-app-core`: checked
file access, conditional comparison, exclusive creates/mutations, atomic staging,
writes and native action targets. Desktop imports the public native types
directly and deletes its former engine modules. Profiles, OS actions, resources,
admission and the original IO gate remain Desktop-owned.

The native witness, checked-directory and metadata ports replace crate-private
field access. They are Rust capabilities, not new remote authority. The core
forbids unsafe code and has no Tauri/HTTP/browser dependency. Boundary checks
inspect actual Cargo dependency identities, source routing and size limits;
both normal check and canonical spec lanes execute the audit.

Normal root check/test/build include the new native lanes. The pinned Rust
workspace keeps its checkout-owned `.local/rust-core-target`, excludes the
transitional companion's independent workspace, and retains the 30 GiB guard.

## Before/after evidence

- Existing Desktop exact target: `cargo test --manifest-path src-tauri/Cargo.toml
--locked --test vault_conditional --test vault_access --test vault_creates
--test vault_interruptions --test vault_mutations --test vault_watch
--test watch_registry --test vault_identity --test vault_resources
--test vault_admission --test plugin_assets`: 52 pass, one subprocess helper
  ignored before extraction. The same command passes 52/0/1 after extraction.
- New source target: `cargo test -p lapis-app-core --locked --test
vault_conformance`: one unresolved-module compiler failure before extraction;
  five real-file cases pass after. These cover Unicode conditional writes,
  external/stale bytes, failed staging cleanup, exclusive publication, path/link
  containment and retained physical-root identity.
- First Desktop intake attempt: two test targets still imported the old module;
  corrected those imports and reran the exact 11-suite target successfully.
- First full Desktop compile: one remaining nested import in `terminal_policy`;
  corrected it and reran that exact target before the full native suite.
- `pnpm test:rust-core`: five source cases and the then-current three boundary
  regressions pass. The fourth alias/target dependency-identity regression was
  added afterwards and all four pass via `node --test
scripts/check-rust-boundaries.test.mjs`.
- `pnpm check:rust-core`: actual boundaries, Rust format and strict all-target
  Clippy pass. `pnpm build:rust-core`: pass.

- First source `pnpm spec:check`: native boundary audit and all four regressions,
  validation, docs, existing spec lanes and mdBook passed. Spec-first reported
  one missing Packages chapter for root script wiring. Added the explicit native
  package/build contract and reran the same command; no mapping was weakened.

## Final qualification

- Desktop `cargo test --manifest-path src-tauri/Cargo.toml --locked`: 228 pass,
  zero fail, two existing ignored helpers across the complete native suite.
  The repaired exact `terminal_policy` target also passes both cases.
- Normal and `--features e2e` `cargo clippy --manifest-path
src-tauri/Cargo.toml --all-targets --locked -- -D warnings`: both pass.
- Normal and e2e `cargo build --manifest-path src-tauri/Cargo.toml --locked`:
  both pass. Both retain the same linker unwind-size warning seen in baseline;
  no source warning was suppressed.
- Notes `pnpm spec:check`: pass, including four native boundary regressions,
  175 docs mirrors, 38 existing specification regressions, App ownership and
  metadata-query audit. Missing mapped Packages chapters: one to zero.
- Desktop source/App ownership audits and `pnpm check:progress`: pass
  (44 tasks, 266 evidence records). Desktop `pnpm spec:check`: all four lanes
  pass after keeping context references within existing document limits.
- Changed-file Prettier and both owning Cargo format checks pass. Full historical
  formatter evidence is unchanged; no immutable record was edited.

This source-private native extraction runs its owning Rust check/test/build and
all Desktop native consumers/configurations. TypeScript product code and public
screens are unchanged; their broad product/Storybook suites are outside this
slice. Existing M15.1 UI/native acceptance gaps remain in E-SHARED-007.

R1.1/M16.1 is qualified. R1.2/R1.3/R2 are not delivered by this extraction.

## Scope and retained gaps

This is R1.1/M16.1 only. It does not implement or qualify hosted use, service job
lifetime, cross-client writer coordination, a protocol or a real provider turn.
Those remain R1.2/R1.3/R2. Existing public screens, M15.1 pending qualification,
provider/model and distribution gaps remain explicit. No UI changes or visual
baseline updates were made.

The user approved removal of only the inactive Desktop incremental compiler
cache (about 1.4 GiB) after native baseline qualification. No compiler was active;
only that exact directory was removed. Binaries, profiles and vaults were retained.
