# Captured-state native editor recovery

Scope: LN-CORE-025 and R3.2.4.2. A lost renderer can leave either a dirty claim
or an active clean intent. Explicit recovery/discard must not clear a newer
claim from a stale Problems action. Existing Problems remains the presentation;
these native transitions introduce no file writer or replacement recovery UI.

The exact source boundary is
`pnpm rust:core -- test -p lapis-app-core --test editor_intent_recovery --locked`.
Five cases cover clean/dirty recovery, stale revisions/generations, live foreign
ownership and client retirement, terminal/lost acknowledgement, and replaced
physical roots. Before/after and wider qualification will be recorded before a
verified slice is committed. The foundation is an explicit source prerequisite;
actual host adoption and complete R3 remain open.

## Exact baseline

Frozen `4d8d8f6dcd0193bd698262a9e97fd86f1fc5d6fb`, receipt
`lapis-r3-adapters-recovery-before-117c3635-5367-4c7e-b0e2-4e323843992b`,
reports zero passing and five failing exact cases. The existing typed nested
command does not admit recover/discard; every case fails at that source protocol
boundary. The tests compile and the native fixture remains disposable. No
existing product or governance failure is waived.

The first implemented five cases pass on frozen `1fe1382a`, while two additional
legacy-route regressions fail: the old ID-only recover/discard methods still
accept managed intents and bypass captured-state decisions. Receipt
`lapis-r3-adapters-recovery-before-1ff81c52-f714-401e-b0b6-0ffa4a5e2a53`
retains the 5-pass/2-fail outcome. Managed intents now require the typed guarded
route; ordinary unmanaged editor claims keep their existing legacy behavior.
Foundation-stage tests move to the captured-state commands rather than weakening
their retained-client and late-acquire assertions. No committed evidence changes.

## Exact corrected source

Frozen `5db6a68fe3c9470e654949f21b008445e591751a`, receipt
`lapis-r3-adapters-recovery-exact-832b5351-324b-47f4-bb20-c3e87dc38299`,
passes all seven recovery cases, all ten existing intent cases and all 46 HTTP
file/lifetime cases. Both legacy bypass failures are repaired without changing
unmanaged-claim behavior. Source-owned Rustfmt and protocol/public-host-module
generation are restored before wider qualification. A new real HTTP acceptance
case additionally covers Origin/vault admission, stale decisions, guarded
ownership transfer and terminal inspection after an abandoned response body.

## Coherent current-parent qualification

The source now combines committed native editor foundation d89c0fbe and main
restore2cbe0b3f. Runtime source merges directly; Rust exporter family fields and
declarations are united, then all bindings are generated from that sole merged
Rust authority. The native boundary audit passes without any size-limit change.
A host-side audit probe lacked the isolated workspace's sibling source paths;
its Docker rerun restores the exact pinned native graph and passes.

Frozen b46f1b3353496d14ab7224b714f45d5b40d40bd0, receipt
`lapis-r3-adapters-recovery-exact-9b4d9a00-db9a-4b1b-a909-62e9e87a4aba`,
passes the new real HTTP recovery journey, existing native restore case,
seven recovery cases, ten original intent cases and all51 combined HTTP cases.
Source/public declarations and the complete merged application gates follow.
The full worker uses canonical4CPU/12GiB memory/2GiB shared memory; no assertion,
Svelte diagnostic policy or accessibility gate is weakened.

Problems presentation is a separate child: it must show both detached native
claims and App-local pending/failed admission or rearm, including when no native
claim was admitted. Captured local registration and native generation/revision
must guard actions. Existing Problems navigation/menus and explicit admission
retry remain the presentation; native metadata never promises retained draft
bytes. Lost acknowledgements reconcile by read-only status, not Task replay.

## Full source qualification

Frozen `ce1734247cf5ac9202dce84c07384026e29e11a6`, receipt
`lapis-r3-adapters-full-b98e94cc-bfd7-4b94-8492-ebdcd16a90e6`,
passes all 561 Rust cases with seven intentional asset/provider ignores,
2,349 package cases with one frozen Deno integration skip, 261 cold
catalog/axe cases and all 24 existing browser journeys. Root strict/check,
Clippy, protocol, all 11 builds, public API packed declaration examples, static
Storybook and the full canonical specification/78 governance cases pass.
The public API archive SHA-256 is
`a3de9f645b8658a60462399efcd8705873c32cc9dde4f337ccfb3834a2012f94`.

The final source retains that frozen runtime, test, script, configuration and
protocol tree. Reparenting onto main's tracker-only `70b03231` changes only
tracking/evidence, not qualified product bytes. The follow-up document gate
checks the regenerated grouped ledger and canonical mappings. No host selects
the new recovery actions until the separate Problems/adoption gate.
