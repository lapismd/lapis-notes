# Native Search provider and database publication

Date: 2026-10-24. Baseline Notes `5ca5191a`. R1.3/R3 remains active.

Connect the qualified real encoder to native Search configuration, lazy model
sessions, observable runtime status and accepted database publication. Native
model/cache admission stays separate from portable client configuration.
Configuration invalidation and file publication retain the database actor and
committed Search journal. Asset installation/download, vector/hybrid retrieval,
batch/rebuild and host adoption remain explicit remaining gates.

## Implementation and exact qualification

`NativeEmbeddingHost` registers native library/model/tokenizer cache files using
Rust values only. Portable configuration retains the existing provider labels,
model identity, dimensions and options. Browser device hints do not select a
native execution provider; this intake uses the qualified CPU engine. Protocol
JSON/schema/TypeScript exclude native paths and library/command authority.

One database actor persists configuration, rewrites stale embedding JSON/vector
columns and journals a single Search change before selecting the new runtime.
Invalidation reads bounded pages, including an empty first key. Failed commit
retains both records and the previous selection. Repeated identical configuration
does not advance the revision; cold open restores configuration without loading
the model.

Accepted raw Search upserts own normalization, a blocking inference worker and
publication independently of the reply receiver. Missing assets, dimension
mismatch, invalid output or worker failure produce visible error metadata and
runtime state, without another encoder. The explicit token-hash provider remains
available only when selected by its own configuration. Inference does not invoke
Node. Runtime status is a watch observation, independent of the actor's work queue.

The existing `test:search:onnx` gate validates the same pinned assets and now
executes both the direct encoder case and a real provider/database case. Ordinary
root Rust tests ignore those two asset-dependent cases; their actual execution
remains a separate receipt. No model, library or new Cargo dependency is added.
Native asset installation/download is still required before ordinary host intake;
this component does not claim it is implemented.

Before/after attempts:

- The first exact `database_search_provider` build has **11 missing-module/method
  diagnostics**, no runtime cases. Log `.local/rust-search-provider-before.log`.
- The first implementation has **two iterator type diagnostics**. Consume the
  array of optional references directly; no assertion or lint is suppressed.
  Logs `.local/rust-search-provider-first.log` and
  `.local/rust-search-provider-initial-pass.log`. The latter passes the first
  **two** lifecycle cases.
- Initial retained provider conformance has **two failures**: the new fixture
  omitted token-hash's existing default model version `0`, and Turso actually
  preserves ready vectors from the old model after configuration. Confirm the
  source default and keep an exact version assertion. Reuse a private API
  pending-record helper in Memory and Turso; Turso commits configuration and
  invalidation together and selects the runtime before committed callbacks.
  Failed configuration retains the previous runtime. Log
  `.local/rust-search-provider-reference-before.log`.
- The first reference rerun has **one transform diagnostic**, no runtime cases:
  a new callback argument shadows the existing commit promise. Rename that
  argument. Exact rerun passes **both cases**; adding rollback coverage and the
  affected API targets passes **28 cases / four files**. Logs
  `.local/rust-search-provider-reference-{after,pass}.log` and
  `.local/rust-search-provider-api-focused.log`.
- Initial spec-first has **one missing package-chapter diagnostic**. Update
  the API/storage ownership chapter alongside its existing DB and Core maps.
  It then passes **25 protected files / four chapters**. Logs
  `.local/rust-search-provider-spec-first{,-pass}.log`.

Final focused native qualification passes **six cases**: lazy/idempotent/cold
configuration; explicit unavailable state; 103-row multi-page invalidation and
transaction rollback; admission validation; all six retained Unicode token-hash
vectors/fingerprints; rejection of a 65-by-65,536 vector matrix before allocation.
The explicit hash reference is captured from the existing public provider, and
kept separately from actual ONNX reference vectors in the shared numeric fixture.
Logs `.local/rust-search-provider-{six,tokenhash-capture}.log`.

`pnpm test:search:onnx --force` passes **two real-model cases**, zero failures or
ignored. The new database case checks all six actual query vectors/fingerprints,
accepted publication after detaching, live status during inference, dimension
error without a substitute vector, reconfiguration and lazy cold reopen. Log
`.local/rust-search-provider-real-model.log`. Native library/model provenance
retains [the qualified encoder receipt](2026-10-24-rust-core-onnx.md).

Rust JSON and generated TypeScript negative contracts reject client model files,
library paths, unsupported kinds/pooling and malformed dimensions. Protocol
generation and the expanded client type fixture pass. Logs
`.local/rust-search-provider-protocol{,-final,-negative}.log`.

Full `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm check` passes **20/20** package
tasks, all executed, native boundaries, protocol drift, formatting, strict
all-target Rust Clippy and source audits. Log
`.local/rust-search-provider-root-check.log`. Completed tests/build, Web,
cold catalog and final specification evidence follow below.

## Complete source and serving-baseline qualification

- Sequential root `pnpm test` with the same bounded environment passes **180
  ordinary Rust cases**, zero failed and the **two explicit model cases ignored**.
  API passes **1,492 cases / 143 files**; **20/20** package tasks pass, nine
  reused. The existing opt-in Deno ACP integration remains skipped. Log
  `.local/rust-search-provider-root-test.log`.
- Root `pnpm build` passes the native workspace and **11/11** package tasks,
  nine reused. The final exact `pnpm test:search:onnx --force` passes **both
  actual-model cases**, zero failed/ignored. Logs
  `.local/rust-search-provider-root-build.log` and
  `.local/rust-search-provider-real-final.log`.
- Full `pnpm spec:check` passes **nine lanes**, ownership/metadata audits and
  **38 regressions**. Adding Web runner changes initially reveals **two
  missing mapped-chapter diagnostics**; update their Server and Plugin owners.
  The CLI checkpoint passes **28 protected files / seven chapters**. Logs
  `.local/rust-search-provider-{spec-final,spec-first-expanded,spec-first-cli}.log`.

Web and hosted acceptance expose a stale generated CLI shim, not a product
failure: tests import pinned Playwright **1.61.1**, but the shim invokes **1.62.1**.
The initial Web command has **six collection diagnostics**, no runtime cases.
Normal offline frozen installation refuses the ignored development hook's
checksum mismatch. Preserve that hook and the registry lockfile. Invoke the
declared `@playwright/test` SDK CLI directly in the existing Web/hosted scripts;
no dependency file, package implementation, assertion or baseline is patched.
Logs `.local/rust-search-provider-{web,install}.log`.

The exact canonical `TURBO_CONCURRENCY=2 pnpm test:web:e2e --force` rerun passes
**12/12 cases**, uncached. The hosted journey first fails its **Node 24 assertion**
under the machine's Node 26 default. Keep that assertion and rerun with installed
Node **24.10.0** prefixed only for the test command; the complete hosted
editing/sharing/restart journey passes **one case**, uncached. Web check and the
root test-routing inventory also pass. Logs
`.local/rust-search-provider-{web-pinned,hosted,hosted-node24,web-check,cli-routing}.log`.
This is local hosted acceptance, not Linux/container or Rust-host adoption.

A fresh checkout-owned Storybook process runs under supervisor **17602**, port
**7010**, after package output refresh. The first catalog invocation adds
`--force` to a live-cache-disabled run; Turbo rejects those mutually exclusive
flags before any case runs. Use the canonical `pnpm test:storybook` command:
the live configuration already disables both cache reads and writes. All **261
cases / 59 files** pass across four sequential shards (**93/71/42/55**), with
accessibility failures enabled and zero cached tasks. Logs
`.local/rust-search-provider-{storybook-final-cold,catalog,catalog-live}.log`.
No visual baseline is generated or updated.

This closes source provider control and database-publication qualification.
Native model installation/download and ordinary runtime admission, semantic
retrieval, batch/rebuild, complete transport shapes, Desktop archive/native
intake, both host adapters and unattended indexing remain unfinished. The master
tracker's per-commit UTC stamp and source/consumer distinctions are retained.
R1.3/R3, R2 and R4–R7 are not completed by this component.

Final changed-file formatting and metadata validation pass **175 chapters /
1,511 requirements**. After the Web verification row joins the slice, final
spec-first passes **28 protected files / eight chapters**. Logs
`.local/rust-search-provider-{format-final-check,validate-final,first-final}.log`.
