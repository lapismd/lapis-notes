# R1.2 vault and service ownership

Date: 2026-10-23. Notes source revision: enclosing Jujutsu change, based on
`0e95da98`. Desktop remains on qualified intake `6700f104`; its adapters do not
consume these new services until R1.3.

## Delivered boundary

`lapis-app-core::services::Runtime` admits one owner per opaque vault ID and
physical directory. Clients attach with fresh identities and a service
generation. Work leases survive client removal. Explicit close fences admission,
requests cancellation and waits for accepted leases to finish persistence. Quit
preflights every dirty editor before retiring any vault. An unresolved claim
leaves the original service live.

Conditional text writes share the owner's mutex, content hashes, exclusive create
and the extracted byte-conditional engine. Stale or external bytes are preserved.
Client saves cannot bypass another client's dirty claim; native work cannot
bypass any claim, including hard-link aliases. Detached claims remain discoverable
and explicitly recoverable/discardable. Saved acknowledgements cannot clear a
newer editor revision. A lease ending does not imply a durable job succeeded.

The private protocol crate owns version-three commands, replies, portable errors
and editor claims. Invalid protocol/request/vault/generation input rejects before
IO. Strict Serde parsing rejects unknown fields, including empty variants. Rust
exports JSON schema and TypeScript; normal native and canonical spec checks
verify drift and compile typed client fixtures. No HTTP/Tauri adapter, durable
ACP journal or automatic prompt recovery is claimed by this slice.

## Before and after

- Initial `cargo test -p lapis-app-core --test service_lifetime --locked`: three
  unresolved service imports before implementation; no tests ran. Initial eight
  lifecycle cases then passed.
- Reconnect expansion, `pnpm rust:core -- test -p lapis-app-core --test
service_lifetime --locked`: three missing `editor_claims` compile errors.
  After claim discovery/writer guards and the intentional dependency lock update,
  the exact target passes all ten tests. A `--locked` attempt correctly refused
  that feature/dependency lock update; regenerated offline before locked checks.
- `node --test scripts/check-rust-boundaries.test.mjs`: four pass/one fail before
  extending the audit to protocol and aliased dependency identities; five pass
  afterwards. Protocol cannot depend on the core or a transport.
- `pnpm rust:core -- test --workspace --offline`: 23 pass/one fail. The strict
  wire fixture exposed Serde accepting an extra field on an internally tagged
  unit variant. Empty struct variants preserve the wire shape and enforce field
  rejection. Exact `pnpm rust:core -- test -p lapis-app-protocol --test wire
--locked`: four pass/zero fail after the fix.
- ts-rs initially warned about `deny_unknown_fields`. Disabled its optional
  Serde inference and supplied explicit matching TypeScript tags/case rules;
  strict Serde enforcement remains. Discriminant fixtures and generated client
  compilation pass without warning suppression.
- Deliberately changed the generated TypeScript protocol major to 99;
  `node scripts/rust-protocol.mjs --check` rejected the stale artifact. Restored
  the original bytes in `finally`; the normal drift gate then passes.

## Qualification

- `pnpm test:rust-core`: 24 Rust cases pass (ten lifecycle, five service protocol,
  five original file conformance and four wire/schema cases); five Node audit
  regressions pass. No ignored or failing cases.
- `pnpm check:rust-core`: dependency/source/size audit, schema/type drift, positive
  and negative TypeScript fixtures, Rust formatting and strict all-target Clippy
  pass.
- `pnpm build:rust-core`: both crates and exporter build successfully.

The first `pnpm spec:check` passed validation, all configured lanes and mdBook,
but reported one missing mapped Governance chapter for the new configured
protocol lane. Added its explicit mapping explanation without weakening the gate.

The same `pnpm spec:check` then passes every lane, mdBook, protected-change
mapping, App ownership, metadata-query auditing and all 38 specification
regressions. Changed-file Prettier and 175 specification mirrors pass.

This is a private native-service addition with no renderer or existing host
caller changes. The owning native lanes qualify it; product UI/Storybook,
provider, hosted and Linux acceptance remain their later gates. The standalone
browser, frozen Deno, preserved hosted experiment and stored user data are
unchanged. R1.2 is qualified; R1.3–R7 remain required for the overall migration.
