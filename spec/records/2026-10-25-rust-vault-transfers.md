# Rust hosted vault transfers — R1.3.9.2

Status: Complete. Parent Notes revision `14b16c2d`; working change `uzxrzszw`.
This record covers LN-CORE-004/007 and the retained transfer portion of R1.3.9.
R6 durable operation recovery and R7 final hosted delivery remain separate.

## Before state

- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm rust:core -- test -p lapis-server
--test managed_vaults
transfer_import_publishes_complete_native_content_and_retains_it_after_restart
--locked`: one failure; import returns 405 instead of 201.
- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm rust:core -- test
-p lapis-app-core --test archives --locked`: one compiler diagnostic;
  `lapis_app_core::archive` is absent, so four conformance cases cannot run.

## Implementation

The shared native archive engine accepts an empty provisional root, validates
paths, types, entry/byte limits and collisions before extraction, streams payloads
with CRC checking and preserves Unicode/binary/`.lapis` bytes. Ordinary file
writes retain their independent 64 MiB limit. Export traverses regular content
without the ordinary directory-list cap and creates an immutable private ZIP.

HTTP upload stages at most 512 MiB in an anonymous file. Only completed uploads
enter accepted management work. Known extraction failures remove the newly
created unpublished content; uncertain catalogue publication preserves bytes.
Accepted imports and export snapshot creation outlive response cancellation and
drain before shutdown. Export releases native work before response streaming.

The generated host capability enables existing browser folder/ZIP import and
Export ZIP controls. Cookie downloads may omit the protocol header only on the
exact readonly export route. Supplied stale versions, foreign origins and upload
CSRF violations remain rejected. No Node fallback or replacement UI is added.

## Qualification checkpoint

- Original HTTP import/cold-reopen regression: one pass after its initial 405.
- Nine Core archive cases pass, including the separate bulk file limit and a
  completed snapshot remaining readable after the vault closes.
- Expanded archive run first exposed an authored fixture failure: the CRC test
  searched compressed output for plaintext. Explicit stored compression repairs
  the fixture; the corrupt payload is now rejected.
- A stale-lock attempt stopped after the server test dependency was added; the
  closure was refreshed without unrelated upgrades. The initial HTTP compile
  exposed Axum's disabled query extractor; enabling its query feature fixes it.
- Native managed-vault family: twelve pass. Its first widened run had eleven
  passes and one changed error code for replaced storage. Preserve the existing
  storage-error mapping; the exact regression and complete family now pass.
- Focused Web adapter: three pass. All Web checks and 53 unit cases pass.
- The cold transfer journey first timed out reading a successful import's unread
  response body. A focused `bodyUsed` assertion reproduces it (one failure).
  Consuming the acknowledgement fixes that exact test and the cold transfer
  journey (6.5s). All three fresh Rust UI journeys pass (18.3s), including real
  server restart and exported binary/Unicode/state-byte checks. The final cold
  three-journey rerun against the final native binary passes in 18.9s.
- All ten specification lanes and validator regressions pass.
- Desktop locked `core_file_service`: both original cases pass (1m49s rebuild).
  The linker retains its compact-unwind size warning; no product failure occurs.
  Only ZIP/typed-path dependency entries were added to the existing Desktop lock.
  This is library compatibility, not a committed Desktop adoption/bundle claim.
- Final collision preflight uses ordered explicit paths instead of allocating
  every implicit parent. Focused and broad native reruns against that final
  source passed all 273 ordinary native cases (five existing model cases ignored).
  Doctest failed because cache cleanup removed a library referenced by the still
  running Cargo invocation. The final complete rerun restores all three crates' doctest gates.
- The first full native run exposed an intermittent pooled BrokenPipe after an
  oversized database JSON request. Five exact reruns passed, but a strengthened
  connection-retirement assertion deterministically fails: 413 omits Close.
  The HTTP error boundary now retires oversized JSON connections; exact case and all 31 HTTP cases pass.
- All 261 catalog functional/accessibility cases pass (93/71/42/55 shards).
  Final Web checks and all 53 unit cases pass.
- Build disk guard cleanup used standing approval: 2,633 inactive standalone
  AI/JJ `.rlib`/`.rmeta` caches (3.82 GiB), then 541 older Desktop library caches
  (1.74 GiB). Inactivity/open-file and unchanged-metadata checks passed. All
  executables, bundles, profiles, vaults and model data were retained. A further
  574 older Core library caches (2.04 GiB) were removed, causing the doctest
  dependency error above. No further cleanup may touch a target while any Cargo
  invocation still owns it, including its test/doctest phase.

## Final qualified commands and scope

| Command / target                                                                                                                   | Result                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test`                                                                                 | 273 ordinary Rust cases pass; five existing real-model cases ignored. All three crates' doctest lanes and all 20 package test/build tasks pass. |
| `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check`                                                                                | Boundaries, generated protocol drift, Rust format, strict all-target Clippy, ownership audits and all 20 package check/build tasks pass.        |
| `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm build`                                                                                | Native workspace build and all eleven package builds pass.                                                                                      |
| `pnpm spec:check`                                                                                                                  | All ten specification lanes and 49 validator regressions pass.                                                                                  |
| `pnpm test:storybook`                                                                                                              | All 261 functional/accessibility cases pass.                                                                                                    |
| Web `build:rust-server`, then pinned Playwright CLI with `playwright.rust-server.config.ts`                                        | Final cold built-renderer/real-Rust suite: all three journeys pass, 18.9s.                                                                      |
| Desktop `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_file_service` | Final two cases pass after a 2m32s rebuild. Source/library compatibility only; no packaged UI claim.                                            |

The Desktop snapshot is uncommitted change `tnnyuvsvlsuk` / `332094f0860f`.
Its lock SHA-256 is
`e49869f8d8c068996d5b4c4323df74c76806ab3772f7a95fd937f97a61d3a575`.
Its pre-existing database/backup consumer commit gate remains open; this receipt
does not waive that gate. The final cache cleanup removed only 65 older native
integration-test executables (4.34 GiB), preserving the newest per test. It ran
after every Cargo/compiler invocation ended and repeated open-file/metadata
checks. All later Cargo, doctest and build commands pass without further cleanup.

## Milestone review

R1.3.9.2 is Complete in the commit containing this receipt. The existing hosted
controls are qualified through Rust; no replacement screen or Node fallback is
introduced. R1.3.9.3 installed delivery and R1.3.11 both-shell acceptance remain
waiting. R2–R7 and Deferred work retain their saved scope.
