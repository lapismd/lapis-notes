# R1.3 retained native admission port

Notes source baseline: `b64952b4`; revision: enclosing change. Desktop baseline:
`ebcadc34`. This is the native capability port needed by its service adapter,
not completed Desktop/HTTP or backup lifetime qualification.

`Runtime::admit_root` consumes the host's already retained `VaultRoot` capability.
The ordinary trusted-path admission calls that same implementation after opening
its root. Both validate the physical directory and preserve duplicate-owner,
identity and shutdown fences. No path reopen or transport-visible capability is
introduced by the native port.

- Exact `pnpm rust:core -- test -p lapis-app-core --test native_admission --locked`:
  three missing-method compile errors before implementation; one test passes
  after implementation. It verifies shared ownership for retained capabilities
  and rejects a replaced path without writing to the replacement directory.
- `pnpm check:rust-core`, `pnpm test:rust-core`, `pnpm build:rust-core`: pass.
  All 29 Rust cases and five boundary regressions pass, with no ignored/failing
  cases. Schema/type drift and positive/negative fixtures, strict all-target
  Clippy and format checks pass.

The Desktop adapter's separate baseline target `core_file_service` reports two
missing crate/module imports before integration. That result and its eventual
native qualification belong to Desktop evidence; the source test does not
complete the consumer gate. No renderer or original host caller changes here.

`pnpm spec:check` also passes every lane, mdBook, protected mapping, App and
metadata-query audits, 175 mirrors and all 38 specification regressions.
Changed-file formatting passes. Consumer acceptance remains separately required.
