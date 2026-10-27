# R7 hosted delivery audit

Status: source audit, not cutover or deployment acceptance. Inspected the Notes
02a0ae50 frozen integration and its retained serving baseline; qualified skills
and participant source remain independently owned and unchanged by this slice.
The user has deferred R5 memory jobs and R6 durable operations until after R7.
Existing capabilities and data must remain present; deferral is not completion.

## Delivery blockers

| Boundary                      | Current source evidence                                                                                                                                                                                                      | Minimum R7 work and acceptance                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real Rust static delivery     | `crates/lapis-server/src/http/mod.rs` has API/plugin routes, no application static/fallback route. `packages/web/vite.config.ts` and `e2e/rust-server-runtime.ts` still use Node/Vite preview for the built Rust browser UI. | Serve the existing renderer from Rust with correct MIME, caching, CSP/isolation, SPA fallback, authenticated resource separation and explicit stale-client behavior. Test the installed server without Vite/Node. Use existing system-info readiness where sufficient instead of inventing a health API.          |
| Push updates                  | Rust vault adapter advertises `nativeWatch:false`; Rust database provider polls change revision every1000ms and explicitly marks SSE as R7. Node backend uses ServerVaultEventStream.                                        | Implement scoped authenticated file/database/native-state observation, bounded reconnect/reset and lease retirement through existing native authority. Browser detach must not own jobs/writers; reconnect cannot replay effects.                                                                                 |
| Selected defaults             | `build:server`/`start:server` and server Docker/CI still select server-node. Rust is `server-rust`; metadata/history/tasks browser flags and server history environment selection are explicit opt-ins.                      | Select one coherent qualified Rust profile in development/build/start/container and actual serving tests; retain standalone local/offline browser behavior. Verify database, native indexing/history/tasks/editor-intent and AI capability selection together.                                                    |
| Runtime packaging             | Only `packages/server-node/Dockerfile` and compose are product delivery examples. Current Rust Cargo manifests consume six pinned sibling source repositories.                                                               | Build a reproducible Linux Rust binary/renderer/native-source closure. Package explicit helper/runtime/model inputs or fail clearly when an optional capability lacks them. No JavaScript application runtime in final image; Node/pnpm remain build tools and external agents may retain declared prerequisites. |
| Container operations          | Existing Node image covers nonroot, read-only application files, writable data volume, secrets, health and restart. Current Rust browser fixtures only prove an API binary behind Vite preview.                              | Adapt those operational constraints to the Rust image, test real login/chooser/file/database/history/AI paths, image restart with retained data and stop/drain/dirty-conflict behavior. Keep production Origin/CSRF/cookie and resource bounds.                                                                   |
| Node and companion retirement | Web main retains node-backend; it imports `@lapis-notes/server-node/browser`. Root scripts/lanes/CI target server-node; `packages/server-native` retains the old companion/protocol.                                         | Inventory remaining imports and consumers, retain portable browser code in its actual owner, remove Node application server and obsolete companion transport only after their selected replacements pass. Preserve behavioral fixtures rather than deleting failing acceptance.                                   |
| Operator bootstrap/config     | Rust supports single owner/multiple vaults and separate native control/auth database; README explicitly makes no Node owner/session import claim.                                                                            | Provide the intentional pre-release bootstrap/config path and retain existing vault/note/settings/history bytes. Document credentials/proxy/storage/agent configuration; do not imply existing sessions were migrated automatically.                                                                              |
| Capability parity             | Rust backend has qualified adapters for files/transfers/plugins/database/history/tasks/native AI; remaining R4 and deferred R5/R6 ownership differ from default selection.                                                   | Produce the explicit serving feature matrix. Fix only missing boundaries needed to preserve the supported serving profile or remove Node runtime dependency; keep later ownership work visibly deferred. Do not silently hide functionality to make cutover pass.                                                 |

## Existing tests and repair classification

Notes' seven ordinary Rust ignores are not seven defects:

- Five actual ONNX/model-asset tests live in `database_search_provider_model`,
  `database_search_semantic_model`, `embedding_cache_model` (two), and
  `embedding_model`; `pnpm test:search:onnx` owns explicit asset qualification.
- `turn_journal` and Tasks lifecycle `process_tests` each retain an isolated
  crash-process helper that is invoked deliberately by another test. Keep their
  standalone ignores; running them blindly is not additional acceptance.
- The hosted ONNX browser journey is explicitly enabled with
  `LAPIS_TEST_HOSTED_ONNX=1` on the qualified Linux worker. Transfer its exact
  runtime/model/tokenizer identities into the selected delivery image and prove
  detach plus cold offline vectors/ranks there.
- Provider-screen, queue Stop and offline-recovery Resume targets are explicit
  operator-owned opt-ins. Normal disabled runs must not launch providers. Their
  installed-provider receipts stay separate from deterministic ACP fixtures.
- Current `.github/workflows/lapis-ci.yml` server acceptance builds Node24 and
  invokes the Node browser scenario. R7 needs the real deployed Rust image lane,
  plus retained standalone local browser and Desktop consumer regression.

Inventory accepted baseline findings only in the actual source/public/native
input cohort chosen for cutover. Reproduce exact current failures at their owner
before classifying a repair; never relabel immutable evidence or blanket-waive a
new result. Root owns the canonical cutover plan and generated master statuses.

## Smallest delivery order

1. Save the serving capability/test-gap matrix and exact selected input cohort.
2. Implement Rust static serving plus the required observation boundary, keeping
   actual browser reproduction narrow before widening.
3. Package and test one real Linux Rust serving image; reuse its exact inputs in
   container/browser/actual-asset acceptance.
4. Switch default commands/profile and remove Node/companion imports and runtime
   packaging only when the replacement paths pass.
5. Run full relevant hosted/Desktop/local-browser lanes, cold/unknown/provider
   cases and release-input audits. Then close scoped R7 while leaving R5/R6 and
   remaining R4 work explicitly pending or deferred.

Publication, deployment, signing and installed-app replacement remain separate.
