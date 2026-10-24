# Desktop compatibility with the native model/cache source

Qualified source: Notes `a18c84bb`. Consumer: Desktop `df16e136`, with fresh
`E-CORE-015`. Source qualification and host adoption remain distinct.

The exact locked `core_file_service` target initially stops at one missing-lock
diagnostic and executes no runtime case. A targeted Cargo refresh also
re-resolves unrelated wide-range dependencies; reject that draft. The final
consumer lock retains every package/version and unrelated edge, adding only
`lapis-app-core -> reqwest 0.12.28` and
`reqwest 0.12.28 -> futures-channel`.

Against that final graph, both exact native service cases pass. Strict normal
and e2e all-target Clippy checks pass. All nineteen existing pnpm archive hashes
verify; no archives, installed payloads, manifests, npm lockfile or renderer
source change. Native model/cache factory selection remains unimplemented in
both hosts. The unchanged debug `__eh_frame` linker warning is also present in
the earlier native calls/ONNX/Search logs; no new native warning is introduced.

The consumer passes all four specification lanes, six metadata validators,
326 chapters / 106 requirements, final spec-first and changed-file formatting.
Progress validates 50 tasks and 284 evidence records. Navigation retains all
325 prior chapter paths in order and adds only the new record. Condensed
introductory prose keeps the original canonical byte limit; historical records
and visual baselines remain untouched.

Consumer logs: `.local/core-model-cache-service-final.log`,
`.local/core-model-cache-clippy-normal-final.log`,
`.local/core-model-cache-clippy-e2e-final.log` and
`.local/core-model-cache-spec-final.log`. Package/edge and archive inventories
are `.local/core-model-cache-final-lock-delta.json` and
`.local/core-model-cache-archives.json`.

Notes source retains 216 ordinary Rust cases, eleven focused cache cases,
four live-download and four offline actual-model targets with cold-process
inference, full source check/build and ten specification lanes / 49 regressions.
This master-tracker follow-up refreshes the UTC checkpoint after the consumer
commit. Run the tracker regressions, drift check, metadata and formatting;
already-qualified product suites are not repeated for this status-only change.
The consumer-qualification table also replaces its older "latest" receipt with
this exact source/consumer pair; retained historical sections stay explicit.

Next is R1.3 vault-lifetime database ownership and both high-level adapters,
then retained hosted-shell and detach/Quit backup acceptance. Neither app uses
the new database facade; hosted access remains Node. Unattended indexing and
R2–R7 remain open. Desktop M11 stays Deferred.
