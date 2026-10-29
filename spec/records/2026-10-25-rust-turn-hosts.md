# Typed native turn commands — R2.2 in progress

Parent source: Notes `c15cccf8`; the existing worker is `1c793d8b`.
Lapis AI source remains unchanged at `6548afe0`. No plugin source or user
profile is modified. R2.2 remains Working; existing chat, Tauri selection and
actual-provider application acceptance are still required.

## Scope and first evidence

Extract portable turn DTOs into `lapis-app-protocol::turns`; Core retains
normalization, journal validation and native authority. Existing callers import
the owning protocol module directly. No old-location DTO exports are kept.
The exact two-case wire target first fails for the missing module, then passes
round-trip/default/discriminant, timestamp and strict authority-field checks.

The new authenticated HTTP command route shares existing client leases and
vault ownership. Operator-only configuration admits physical helper paths and
environment; the browser chooses opaque target IDs and portable turn settings.
Unselected services return Unsupported. One real native peer completes after
HTTP detach, publishes portable files and survives a fresh service owner without
prompt replay. Reconnect/deduplication, separate vaults, metadata-only lists,
unknown launch fields, invalid IDs, Origin and cancellation are covered.

The original unselected-service HTTP target fails once (404 instead of 501).
Initial host integration has two compile diagnostics for private helper/type
access; keeping physical storage construction inside the owning turn feature
clears them. All three HTTP cases pass (1.60s). Reusing the larger shared HTTP
fixture exposes two unused-code warnings; a feature-local fixture removes that
unnecessary shared dependency rather than suppressing diagnostics.

## Prepared native execution

Desktop's existing prepared profile can change with the active view. Accepted
work must retain its resolved launch independently. The exact current-thread
regression changes native configuration after acceptance but before yielding to
the worker. Before: one failure, Failed instead of Completed. Resolve and retain
the launch under live native admission before publishing acceptance; create the
worker/capture binding only after the durable claim. Prepared native authority
is never serialized into a browser response or private portable record.

An initial correction has two Rust visibility diagnostics on the crate-private
normalizer. The validator remains Core-owned and is reused by native admission.
The exact corrected case passes; complete qualification continues before committing.

This evidence uses an executable Control V3 protocol fixture, not a provider.
Fresh owner construction is not a cold application or browser acceptance gate.
No UI, model, release or distribution acceptance is claimed here.

## Focused checkpoint

The prepared-launch regression now passes (0.84s); all eleven native execution
and ten ordinary journal cases pass (1.77s each). The native installation case
passes physical helper, vault containment, managed-vault containment, symlink,
execute permission and duplicate-target checks. All three HTTP cases pass
again (1.67s) without the earlier fixture warnings.

The new Web-client target first fails both cases because the native turn method
is absent. Both pass after adding the admitted call, without retry or cancel on
client detach. Public API packaging, publint and built declaration contracts
pass for the generated DTOs and `NativeTurnService` port. The normal drift gate
now owns that generated entry; no source alias or consumer type shim is added.

An early spec-first run reports four missing owning chapter updates for package
exports, plugin service exposure and both hosted profiles. Record these scopes
in their existing chapters and rerun; no mapping or validator is weakened.
Full source and directly affected consumer qualification remain in progress.

## Binary entrypoint and affected clients

The first configured-binary case fails once because its isolated fixture omits
mandatory owner bootstrap. Supply a private password file and the configured
HTTPS public origin, preserving production authentication. The exact case then
passes (3.32s): the actual Rust binary loads operator agent settings, completes
a turn after client detach, shuts down, reopens and returns the same record
without another prompt. The full three-case process family also passes with its
original dirty-claim and stalled-reader assertions intact.

The complete Web unit family passes all 62 cases after the two exact new cases.
SDK prepack/publint and built declaration contracts pass. Strict checks expose
one large `TurnValue` enum variant; boxing the optional record preserves the
wire shape and clears the finding without a lint allowance. Final strict Core,
protocol drift and source-boundary checks pass (14.84s). Full source, catalog
and existing hosted/browser regression qualification follow before commit.

## Full-source validation checkpoint

The initial full source check passes all 20 tasks. The first full test run
passes all 311 ordinary Rust cases/doctests with zero failures and six
intentional ignores, then exposes one unchanged frozen-Deno binding-probe
timing failure under parallel Turbo execution (295 pass, one fail, one skip
in that package). Its exact unchanged target passes on rerun (one pass, two
filtered cases). No Deno implementation, timeout or assertion is changed.
The bounded full rerun uses `TURBO_CONCURRENCY=1`, `CARGO_INCREMENTAL=0`,
`CARGO_BUILD_JOBS=2` and `RUST_TEST_THREADS=2`; all 311 Rust cases pass again
and the package run was still in progress at that checkpoint. The final
qualification below completes those build/spec/catalog/browser commands.

Under standing cache approval, inactive older compiler variants are removed
only after identity/open-file checks. Notes cleanup removes 379 old files
(2,330,483,088 bytes); separate inactive Desktop cleanup removes 505 old
library/metadata variants (1,509,685,309 bytes), holding that target's Cargo
lock. Current binaries, bundles, profiles, vaults and model data are retained.
The active Notes target is never pruned while Cargo owns it.

## Final source qualification — R2.2.1

The bounded rerun passes all 20 package tasks (16 valid cached results). Fresh
affected families pass API 1,534, Workspace 32, frozen Deno 296 and Web 62
cases. Deno retains its existing one skipped case. All 311 Rust cases/doctests
pass again; the six intentional ignores remain five asset-dependent native
model cases and the separately invoked crash-process helper. There is no
remaining functional failure in the required source lanes.

The bounded source commands use `TURBO_CONCURRENCY=1`, `CARGO_INCREMENTAL=0`,
`CARGO_BUILD_JOBS=2` and `RUST_TEST_THREADS=2`. The catalog uses the same
one-task Turbo bound and cold headless Chromium processes. Browser fixtures
use isolated profiles and real temporary vaults, never user profiles.

| Command                                               | Final result                                                                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                          | All 20 tasks pass fresh; strict Rust, protocol drift and source/App-ownership checks pass.                                                      |
| `pnpm test`                                           | 311 Rust cases/doctests and all 20 package tasks pass; retained skips are named above.                                                          |
| `pnpm build`                                          | Rust workspace and all eleven package builds pass (nine valid cached package results).                                                          |
| `pnpm spec:check`                                     | All ten configured lanes, source ownership and specification-regression checks pass.                                                            |
| `pnpm test:storybook`                                 | All 261 cases in 59 story files pass over four cold shards; no interaction/accessibility failure (6m10.642s including fresh dependency builds). |
| `pnpm --filter @lapis-notes/web test:e2e:rust-server` | All seven retained Rust-hosted browser journeys pass (54.2s after renderer/native build).                                                       |
| `pnpm --filter @lapis-notes/web test:e2e`             | All twelve production PWA journeys pass (1.6m).                                                                                                 |

The prepared-launch case, wire, HTTP and SDK/client regressions retain their
before/after failures above. The earlier parallel frozen-Deno timing failure
passes its exact rerun and the complete bounded family without source changes.
Temporary cache cleanup is development maintenance, not product behavior.

R2.2.1 is Source complete in this commit. R2.2 remains Working: native creation
and sequential continuation are R2.2.2; Tauri selection and existing chat
adoption are R2.2.3. The current worker creates a fresh conversation per request.
No new Desktop source, native UI, actual provider, Linux/container, publication,
installed-app replacement or final hosted cutover is qualified by this record.
The existing HTTP shell still selects its retained feature profile; these
browser regressions do not claim chat adoption. R2.3 and R3–R7 remain open.
