# Rust hosted cutover priority

User-directed priority revision, 2026-10-27. This narrows delivery order, not
completion claims. The original scope remains in [RUST_CORE_MIGRATION_PLAN.md](RUST_CORE_MIGRATION_PLAN.md) and
canonical [Rust services](spec/src/architecture/rust-application-services.md).

## Finish the current slice

The skill/participant union is qualified in main: 693 Rust tests, 2,469 package
cases and all 265 cold catalog cases pass. Exact tracker repair passes 13/0,
full tooling 80/0; frozen `f5f7344c` / `c27dee42` passes complete canonical,
120-row progress and formatting with zero tracked worker mutations.
[Integrated evidence](spec/records/2026-10-27-participant-skills-main-adoption.md).
Desktop queue adoption `40b50d3e` / E-CORE-044 is complete. Actual-provider queue
acceptance remains separately tracked with confirmed/unknown and no-replay gates.

## Cutover work, in order

| Work                               | Completion evidence                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit actual serving-profile gaps  | Compare retained Node and Rust entrypoints, routes, configuration, assets, authentication, file/database/History/Search/Tasks and AI behavior. Record each limitation and its owner.                                                              |
| Repair required test gaps upstream | Inventory exact ignored/skipped/failing gates and accepted baselines in selected source packages. Reproduce the narrow boundary, fix its owner and refresh consumers; do not remove assertions or treat a skip as acceptance.                     |
| Select Rust by default             | Development/start/build/packaging/container paths select the native server and existing Web UI, with explicit startup errors and portable configuration. Preserve managed vaults, persisted formats and safe agent defaults.                      |
| Retire Node and companion runtime  | Remove the application-server entrypoints, transitional transport, obsolete orchestration and runtime dependencies once native replacements pass. Node/pnpm build tools and explicit external-agent prerequisites remain allowed.                 |
| Qualify release inputs             | Full relevant hosted/desktop journeys, standalone local/offline browser, Linux binary/container delivery and cold restart/cancel/unknown cases pass on coherent source/public/native inputs.                                                      |
| Close the scoped cutover           | Refresh canonical verification, generated migration ledger and exact evidence. Distinguish completed runtime replacement from deferred native ownership/features; publication, signing, deployment and installed-app replacement remain separate. |

R7 can start before R5 and R6. It cannot conceal a serving regression or remove a
required capability merely to obtain a passing profile. If an unfinished R4
boundary is required for the serving profile or Node retirement, fix that boundary
as cutover work; otherwise keep it explicitly pending rather than expanding a
new feature lane before cutover.

## Concrete delivery gaps found so far

- Rust currently serves the typed API and admitted plugin assets. It still needs
  the built Web entrypoint/static assets and the existing health/readiness routes;
  hosted acceptance currently uses Node/Vite preview for renderer delivery.
- Native database observation still uses one-second polling. Add the planned
  authenticated stream delivery and reconnect/cursor/cold-close acceptance.
- Docker/Compose and server CI still select the Node application server. Build
  and qualify a Linux native/helper/runtime image, then change the default paths.
- Native metadata, History, Tasks and AI profile flags remain explicit staging
  choices. Select one deliberate cutover cohort and prove retained behavior
  before removing the old Node/companion/browser transport imports.
- Five ignored Rust cases require actual ONNX/runtime assets; qualify them for
  the selected Linux delivery. Two other ignores are intentionally invoked
  crash-process helpers and must remain distinct from deferred product tests.
- The progress regression is repaired: exact 13/0 and full tooling 80/0 pass
  for legitimate empty groups. Other accepted sibling-package findings are
  being inventoried by owner and command. Final canonical intake closure passes.

These are current audit findings, not completed implementation or permission to
remove a capability. Update this list with exact evidence as each gate closes.

## Deferred or still pending

| Area                            | Current disposition                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R5 memory jobs                  | Deferred after cutover: capture/recall coordination, claims, scheduled maintenance, forget/relocation and unattended/cold recovery. Native storage already exists; current behavior/data must be retained.       |
| R6 durable operations           | Deferred after cutover: service-owned imports/capture, Forge/transfer/Compute jobs, installation transactions and terminal lifetime/progress/cancel/recovery. Reuse existing engines later.                      |
| R4 participant completion       | Native/shared/hosted-fixture source is qualified. Tauri declared-profile integration, actual providers, profile editing and busy group queue remain; classify against serving needs.                             |
| R4 context/commands/handoff     | Projection/bootstrap/skills/bindings are source-qualified. Rich dispatch, command/handoff assembly and actual-host integration remain; classify against serving needs.                                           |
| R4 approvals/tools/Changes/undo | Still pending. Reuse existing native runtime/file/repository engines; no arbitrary JavaScript fallback. Work only on boundaries needed for the scoped cutover before returning to the remaining feature backlog. |
| Source test exceptions          | Enumerate by owner/command/current result. Existing accepted findings are not automatically repaired, waived anew or relabelled as passing. Immutable evidence stays immutable.                                  |
| Other agreed deferrals          | Deno frozen; signing/M11, publication, deployment, installed-app replacement and optional legacy History ownership remain separate.                                                                              |

## Authority and safety of retained behavior

One selected service owns each writer. Authentication, caller/vault admission,
stream bounds, editor intents, exact operation pins and uncertain-effect rules
remain canonical gates. Missing clients cannot execute callbacks. Starting or
restoring an application never prompts a provider or replays uncertain work.
The standalone local browser keeps its existing browser implementation.

Record source qualification, main adoption, actual native/provider behavior and
Linux/container delivery independently. Audit only repositories/input cohorts
used by cutover or implicated by an exact failed gate; preserve dirty siblings.
