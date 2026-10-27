# R7 Desktop and standalone compatibility audit

Read-only audit captured at 2026-10-27T10:52:43 UTC. This supporting record
imports the supplied findings without claiming fresh acceptance. The adjacent
`2026-10-27-hosted-cutover-audit.json` preserves 20 source hashes, 42 changed
public/turn paths and exact opt-in/ignore locations. Default cutover remains R7.

## Qualified baseline and current-source difference

Desktop product build is `b6a7d859` on main adoption `40b50d3e`, with Core
`b2034168`, 31 public archives and 117 resolved import routes. E-CORE-045's
actual provider pair is qualified on that cohort. Source main is now Notes
`14172a21`; this is a distinct intake, not a byte-equal metadata adoption.

The b203-to-14172 diff changes API `native-turns`, adds participant types,
changes AppProfile NativeChat/conversation/session/observer, generated protocol
and schema, and Core turn creation, history, launch, worker, storage and queue
dispatch. Refresh native pin and source-qualified API/AppProfile public archives
together. Retain exact source revisions, archive checksums and installation-route
verification. A final E045 b203 pass cannot stand in for latest-cohort native
or public-consumer acceptance.

## Current selection boundaries

| Surface                 | Current selection                                                                 | R7 consequence                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Desktop AI              | `LAPIS_DESKTOP_AI_OWNER`, absent/`renderer` selects Renderer, `core` selects Core | Deliberate staged native selection remains distinct from the hosted default.                                 |
| Desktop metadata/Search | `LAPIS_DESKTOP_METADATA_OWNER`, Renderer by default                               | Core native database already serves the public high-level API; background ownership is a separate flag.      |
| Desktop editing         | `LAPIS_DESKTOP_EDITING_OWNER`, Renderer by default                                | Keep native intent and writer/preflight gates together.                                                      |
| Desktop Tasks           | `LAPIS_DESKTOP_TASKS_OWNER`, Renderer by default                                  | Core refuses startup unless metadata AND editing also select Core, in both Rust and renderer validation.     |
| Desktop History         | Existing native repository/backup/read adapters, sharing admitted Core clients    | No HTTP or Node companion is required. Retain scope, root and immutable operation fences.                    |
| Standalone local Web    | `__LAPIS_SERVER_MODE__ === false`                                                 | Retain WebVaultHost, OPFS, PWA, browser embeddings and owner takeover; no native service admission.          |
| Hosted Web              | Server mode plus explicit Rust build selector                                     | Rust backend enables native metadata/History/Tasks only through declared Vite flags in the current baseline. |

Current Web flags are `VITE_LAPIS_NATIVE_METADATA=1`,
`VITE_LAPIS_NATIVE_HISTORY=1` and `VITE_LAPIS_NATIVE_TASKS=1`. Native Tasks also
supplies editing intents. Native chat is supplied by the Rust hosted backend;
standalone browser deliberately retains AI/Terminal restrictions and preserves
legacy plugin data without connecting to obsolete services.

Do not let a hosted build-default edit turn every standalone build into a
server profile. Vite currently distinguishes standalone `dist`, Node-hosted
`dist-server`, and Rust-hosted `dist-rust-server`; server builds exclude PWA
registration. Preserve that ownership/delivery distinction when retiring Node.

A hosted default switch does not itself authorize silently enabling every
Desktop feature flag. Qualify the chosen Desktop cohort explicitly; leave
unimplemented participant editing/busy group queue/context/tool features in
R4 unless they are necessary to retain actual serving behavior.

## Node and companion audit

The actual ordinary ARM64 bundle audit passes: 330 JavaScript chunks, zero
automation markers and zero packaged `node`, `deno` or `wdio` runtime files.
Production Desktop imports do not refer to Node application server/client
modules or ai-host/controller runtime. The unused direct `@lapismd/ai-host`
manifest range is not evidence of a selected Node service.

External installed-agent setup/probes can use operator-provided Node/npm; the
cutover plan explicitly allows those prerequisites and Node/pnpm build tools.
Do not mistake those for a bundled application server or remove working CLI
providers merely to ban the word Node.

**The Rust `jj-store-jj/companion` Cargo feature is not the obsolete Node
application companion.** Its base feature adds `tokio/time` and enables the
local Git-backed collaboration metadata profile. Keep it and the native
repository/history capabilities; remove only the actual obsolete Node server
entrypoints/transports after native replacements pass.

## Remaining tests and exceptions

| Inventory                           | Classification                                                                                                         | Required action                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop Rust 2 ignores              | Process helpers explicitly invoked by interruption/restart parent cases                                                | Retain ignores and prove the parent cases; do not count as missing product tests.                                                        |
| Core Rust 2 ignores                 | Turn and Tasks crash-process helpers                                                                                   | Same distinction; ordinary parent qualification exercises them.                                                                          |
| Core Rust 5 ignores                 | Real ONNX/runtime/model cases across four test binaries                                                                | Run explicit owner `pnpm test:search:onnx` with qualified Linux assets/reference context for selected delivery; no fixture substitution. |
| Desktop 13 conditional opt-in sites | Installed client install, original provider matrix, retained local AI/compute features and newer Core provider targets | Require explicit config/feature flags; quiet default skip is intentional, not provider qualification.                                    |
| E-CORE-045 opt-out                  | Two cases intentionally skipped without `LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1`                                          | Final explicit provider run passed 2/2; keep no-window quiet default.                                                                    |
| Immutable Desktop E-AI-109 format   | Previously explicitly accepted, unchanged historical record                                                            | Record baseline, preserve bytes and require every other file/gate to pass.                                                               |

Original provider matrix defaults to Codex, Cursor and OpenCode and tests app
read/edit approval/cancel/cold recovery. Compute also needs an explicit GGUF.
Those broader M10 gates are distinct from R7 compatibility and E045's installed
Codex queue proof. Do not claim they passed on new Core/participant inputs unless
run with the selected source/public/provider cohort. Remaining source-package
exceptions belong in the separately owned R7 source exception inventory.

## Exact acceptance plan and commands

No commands below were run for this audit. Existing E045 receipts remain
separate executed evidence. Use a frozen source/public cohort and cold processes.

1. Rebuild/pack changed public API and AppProfile in their owner, with its exact,
   affected and required full gates. Refresh Desktop's ignored archive overlay,
   preserving portable tracked manifests/lockfile; verify all archive routes.
2. Run Desktop strict compatibility against the new native pins:
   `pnpm check:rust`, `pnpm check:rust:e2e`, `pnpm test:rust`.
3. Run the exact four quiet native admission/queue cases from a built e2e app:
   `node --test --test-concurrency=1 tests/desktop/ai-native-queue-admission.test.mjs tests/desktop/ai-native-queue-owner.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs`.
4. Run E045's two actual-provider targets against a private complete verified
   runtime config, preserving omitted model/effort and Unknown/no-replay:
   `LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<private-config> node --test --test-concurrency=1 tests/desktop/ai-native-queue-provider.test.mjs`.
5. `pnpm test:desktop:api` is the full hidden native service/owner/admission gate;
   `pnpm test:desktop:onnx` adds actual model acceptance. For user/window/OS
   behavior use `pnpm test:desktop:headed`. `pnpm test:desktop` stays quiet and
   cannot replace native product gates.
6. API/AppProfile changes affect multiple families: full relevant Desktop
   renderer/AI/catalog lanes and actual lifecycle/History/editor/Tasks/native
   journeys need coherent new-public-input qualification. Build both app
   configurations with complete resources and run `node scripts/check-bundle.mjs`
   on the ordinary bundle. Do not repeat broad lanes if an exact product/input
   equality proof makes a later metadata-only adoption truly identical.
7. Standalone acceptance starts with `pnpm --filter @lapis-notes/web test` and
   its exact config/policy units, then `pnpm test:web:e2e` on the proper built
   standalone/registry fixture. Exact browser files: `web-host.spec.ts`,
   `desktop-features.spec.ts`, `plugins-browser.spec.ts`; include OPFS cold
   reload and secondary-tab Turso/Search takeover. Preserve the full relevant
   package/browser lane for shared Vite, startup or App lifecycle changes.
8. Hosted Linux serving/static/auth/SSE/provider cases are Root's separate
   R7 gates. Mac bundle/ONNX evidence cannot qualify a Linux image or helper.

This supporting audit and its captured hashes are now retained in the main
Notes repository. R7.6 owns coherent host acceptance; this record changes no
product gate or runtime default.
