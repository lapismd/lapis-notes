# Native semantic model inference intake

Date: 2026-10-24. Baseline Notes `982d3d81`. R1.3/R3 remains incomplete.

Qualify real ONNX CPU inference, exact tokenizer behavior, masked mean pooling
and vector normalization against the retained current model. Native runtime and
model locations are host inputs, never transport configuration. Provider/cache
control, vector/hybrid retrieval and both host adapters remain separate gates.

## Implementation and reference

`lapis-app-core::embedding::OnnxEncoder` loads the host-admitted runtime,
model and tokenizer without Tauri, HTTP, Node inference or unsafe application
code. The process-owned ONNX environment permits independent sessions and
survives their closure. A different runtime path is rejected explicitly.
Inputs are bounded; inference uses batches of eight and one intra-op thread.
Models load from bounded memory rather than an implicit external-tensor folder.
Errors omit native paths, and a missing encoder never selects token-hash.

Reference model `Xenova/all-MiniLM-L6-v2`, revision
`751bff37182d3f1213fa05d7196b954e230abad9`, uses CPU q8, mean pooling and
384 dimensions. The committed `search-semantic-model.json` fixture retains
six individual cases, a six-row chunk batch, a nine-input mixed batch crossing
the native batch limit, exact 512-token truncation and unnormalized output.
Token IDs, masks and type IDs compare exactly; vectors compare within **1e-5**.
Queries include accented/Greek/Chinese/emoji text, punctuation and long input.
The cat/kitten example must remain closer than the unrelated Rust example.
Masking, finite values, dimensions and float32 norm overflow also have unit cases.

The independent reference ran actual `@huggingface/transformers` **4.3.1**
with `onnxruntime-node` **1.30.0**, explicitly selecting **CPU**. An initial
call to the retained provider failed because its browser-default `wasm` device
is unsupported in Node; this does not qualify that default or change browser
provider behavior. A first CPU harness had one root dependency-resolution
failure. Resolving the existing API dependency from its package manifest fixes
the harness; all actual CPU vectors are retained, without a fake substitute.
Logs `.local/search-semantic-{reference,cpu-reference,cpu-reference-pass,cpu-reference-expanded}.log`.

The fixture pins five asset sizes and SHA256 digests, including the **22,972,370
byte** quantized ONNX model. No model binary or native library is committed.
The qualification library is the existing npm dependency's Darwin ARM64 ONNX
Runtime 1.30.0 binary, SHA256
`685d2be5dba1309c89d3a5324b7fd06a5c42f1a61bfea32d14c4cc28d072121d`.
`ort` **2.0.0-rc.15** compiles against **API 30** and loads dynamically; the
Rust build neither downloads nor statically links that runtime. Distribution,
installation admission, other models and other platforms remain unqualified.
Cargo adds 36 required package/version pairs and removes/upgrades none.

## Before and after

- Native baseline has **one unresolved-module diagnostic**, no runtime cases:
  `.local/rust-onnx-before.log`. The initial short-input real model target passes
  **one case**, `.local/rust-onnx-first.log` and
  `.local/rust-onnx-model-gate.log`.
- Expanded reference first fails **one case**: Rust's tokenizer reserves the
  final separator before truncation, whereas current Transformers.js truncates
  the postprocessed sequence. Native truncation now retains that exact sequence
  without changing any token/vector assertion. Log
  `.local/rust-onnx-model-expanded.log`.
- The corrected sequence exposes **one session-lifetime failure**: ONNX permits
  one environment per process. Share the installed environment, retain separate
  sessions and reject a different installation. Logs
  `.local/rust-onnx-model-corrected.log` and
  `.local/rust-onnx-model-lifecycle.log`. The latter passes **one real-model
  case**, zero failures/ignored, including reopen and runtime-identity rejection.
- The local task inventory initially fails **one case** on an existing direct
  host-test command. All four native/model public entries now use registered,
  uncached bounded Turbo tasks with raw runners. The exact inventory changes
  from **one failure to one pass**; all **ten** routing/cache regressions pass.
  Split the inventory into `local-test-routing.test.mjs` to retain source limits
  and its release-lane registration. Logs `.local/rust-onnx-routing-{before,after,full}.log`.
- First root check reports **two Clippy diagnostics** in model-test slice
  construction. Use borrowed slices; no allowlist or assertion changes.
  `.local/rust-onnx-root-check.log` retains that attempt.

## Reproducible qualification and limits

`CARGO_BUILD_JOBS=2 pnpm test:search:onnx --force` runs the real model gate
through an uncached root task. Default execution is offline. For a fresh cache,
`pnpm test:search:onnx --download` explicitly fetches only missing pinned assets,
verifies their digest and atomically publishes them into a checkout-owned cache.
Symlinked caches are rejected. `LAPIS_TEST_ONNX_RUNTIME` may select a trusted
qualification library; otherwise the script requires the existing 1.30.0 npm
library. Inference itself never invokes Node. Ordinary Rust tests intentionally
ignore the asset-dependent model test; its separately executed receipt is required.

Full source qualification runs the following lanes sequentially:

- `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm check` passes **20/20**
  package tasks, all executed, plus native boundaries, generated protocol,
  Rust formatting and strict workspace/all-target Clippy. Log
  `.local/rust-onnx-root-check-pass.log`.
- The same environment's `pnpm test` passes **173 Rust cases**, zero failed,
  with the one explicit model case ignored. The model receipt is separate.
  API passes **1,489 cases / 142 files**; **20/20** package tasks pass, nine
  reused. The existing opt-in Deno ACP case remains skipped. Log
  `.local/rust-onnx-root-test.log`.
- After its source-limit split, `node --test scripts/local-test-routing.test.mjs
scripts/storybook-turbo-cache.test.mjs` retains **ten passes**, zero failures.
  Log `.local/rust-onnx-routing-split.log`.
- `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm build` passes the native
  workspace and **11/11** package tasks, nine reused. Log
  `.local/rust-onnx-root-build.log`.
- The final exact `CARGO_BUILD_JOBS=2 pnpm test:search:onnx --force` passes
  **one real-model case**, zero failures/ignored, uncached. Log
  `.local/rust-onnx-model-final.log`.
- `pnpm spec:check` passes **nine lanes**, ownership/metadata audits and
  **38 regressions**. Final spec-first passes **13 protected files / five
  chapters**. Changed authored-file Prettier passes. Logs
  `.local/rust-onnx-{spec,spec-first-final,format-final}.log`.

No renderer production code, browser host, catalog
helper or Storybook setup changes. Prior catalog and native UI receipts retain
their original revisions and cannot qualify this unused encoder's host adoption.

This is the encoder component only. Lazy provider/configuration/cache/status,
identity invalidation, database vector publication, vector/hybrid retrieval,
batch/rebuild controls, both database adapters and unattended indexing remain
unfinished. R1.3/R3, R2 and R4–R7 remain open. UTC status is refreshed in the
enclosing commit, with consumer qualification recorded separately afterward.
