# Lapis application core

Transport-independent native application services for Lapis Notes. The first
slice extracts the existing Desktop vault file engine; Tauri consumes this crate
directly. Hosted adapters and independent job ownership remain later gates in
the [migration plan](../../RUST_CORE_MIGRATION_PLAN.md).

`vault` owns checked relative-path IO, bounded reads, atomic and conditional
publication, exclusive create/rename/copy and native action targets. Hosts still
own root admission and mutation serialization. Native capability handles never
cross into renderer or HTTP values.

Run `pnpm test:rust-core`, `pnpm check:rust-core` and `pnpm build:rust-core` from
the Notes root. Each checkout owns `.local/rust-core-target`; the build wrapper
refuses a target override and requires 30 GiB free. No cleanup is automatic.

Application code has no Tauri, HTTP, renderer or browser dependency. Use the
public module directly; consumers must not copy this engine or re-export its
old Desktop paths.
