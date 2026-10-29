# Native Markdown parser and cache intake

R3.2.1.2.12.1 adopts qualified owning Plugins source `797c14ef` in Notes. The
source parser's 55 complete outcomes repair all 17 retained YAML differences;
its source/native/package/catalog qualification remains separate from this
consumer intake. Notes does not copy the parser or alter npm package inputs.
LN-CORE-007/008 retain source bytes/hash semantics and disposable-cache repair.

## Exact consumer boundary

`cold_parser_identity_upgrade_reparses_unchanged_native_metadata` in
`crates/lapis-app-core/tests/service_markdown_parser_upgrade.rs` seeds a prior
native parser identity/metadata while preserving the saved file's exact hash,
stat and normalized properties/links. A cold service must replace that metadata
with the selected version-2 parser, without rewriting the note.

The first immutable before run `b84376e0-af50-4f09-b20d-fc19eafb174a`,
source `31f3ff7e`, has zero passes/one failure: the selected source still
publishes `markdown-native-v1`, not `markdown-native-v2`. The final regression
also separates an ordinary note whose normalized properties stay unchanged
from a literal-NEL YAML note. This ensures the identity fence is tested
independently of a changed derived property, while also proving the actual
Unicode parser fix reaches the consumer. Its strengthened baseline rerun also fails zero passes/one failure at source
`44119ace`, run `57d1705a-782e-4c98-88ca-1a6256827a65`, retaining
`markdown-native-v1`. No assertion was weakened.

The exact command is
`pnpm rust:core -- test -p lapis-app-core --test service_markdown_parser_upgrade --locked cold_parser_identity_upgrade_reparses_unchanged_native_metadata -- --exact --nocapture`
inside the checksummed source/archive Docker snapshot.

## Scope

Update only the native Plugins source pin and its necessary locked dependency
graph. Reuse existing parser-version comparison and Search source signatures;
no new scheduler, wire API, host selection or source-file migration is needed.
All 29 product/input paths from the preceding Docs/History intake remain
qualified at `5ee783f1` before this new source-pin change. Both complete host
selection gates remain separate.

## Locked source preparation

The bounded offline lock preparation succeeds in run
`377ee6cf-0d9a-43ef-9033-a7553bbf7dca`, source `0e4d6f3d`. The source change
replaces only the Plugins crate's serde_yaml edge with existing locked Saphyr
and ryu-js dependencies. Cargo also proposed an unrelated compatible
`gix-imara-diff` hashbrown edge change; retain its already-qualified package block.
The exact locked native test must accept this reviewed graph before wider gates.
No npm manifest/lock, algorithm implementation or public wire API changed.

## Exact consumer repair

The reviewed locked graph and exact cold regression pass one case/zero failures
at source `42341804`, immutable run `a8adfc54-f646-45c0-a8fe-f878fdb80f2d`.
The new parser identity replaces stale ordinary metadata even when normalized
properties are unchanged; the separate literal-NEL YAML note preserves its
actual Unicode value. File bytes, UTF-8 source hash, mtime and size stay exact.

This is a private native-source consumer change. Its complete impact is the
Rust metadata/Tasks/Docs/Search actors, database/host facades and retained API
reference envelopes. Widen to all native cases, native build/strict checks, both
API reference families and complete specification gates. Npm product source,
package inputs, UI and Storybook configuration are unchanged, so unrelated UI
build/catalog lanes are not repeated. The owning parser's full source/package
and cold catalog qualification remains in its separate source record.

## Complete consumer qualification

Immutable run `f12a71f1-456f-44c3-a028-168bf63679d2`, source
`9d7aff5973788b7f3e89ccc2acc83b233949be20`, passes every command:

- All 36 affected native indexing cases and all 392 Rust workspace cases,
  with zero failures and six existing ignored environment cases.
- Complete locked native workspace build, boundary/protocol/fmt checks and
  strict all-target Clippy through `pnpm check:rust-core`.
- All 54 cases in `native-indexing-reference.test.ts` and
  `native-search-manager-reference.test.ts`.
- Complete `pnpm spec:check`, including all ten specification lanes and
  78 governance regressions, plus App-ownership and metadata-query audits.

Final evidence/status prose is checked separately after the tested snapshot;
all Rust, source-pin and locked-input bytes must match it before commit.
R3 remains Working. Both host selections, remaining processors/Search parity,
application acceptance, publication and delivery retain their separate gates.
