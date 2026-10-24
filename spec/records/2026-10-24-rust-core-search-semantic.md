# Native semantic Search retrieval

R1.3/R3 source intake implements configured vector/hybrid/auto retrieval through
the existing admitted provider and database owner. No host selects the facade in
this slice. Model/cache installation, downloads/progress, complete facade
conformance, both host adapters and unattended indexing remain original gates.

The implementation retains native Turso FTS/float-vector candidate selection,
complete scoped evaluation before final limits, the existing dot-product scorer
for normalized vectors, threshold 0.2, three preferred chunks, locale ranks,
reciprocal-rank fusion K=60 and the complete result envelope. Scores are bounded
without retaining document bodies; only selected result bodies are loaded.
Query inference failure retains the existing lexical degradation without
substituting a model. Raw metadata cannot silently admit an unknown provider.

The unconfigured mode staging assertions now follow the retained Turso contract:
unstructured vector requests have no candidates; hybrid requests retain lexical
results; scoped/structured queries retain complete-table lexical evaluation
when no query vector is available. Invalid bounds and closed admission remain
fail-closed. Optional provider-kind diagnostics are added to the coordinated
private protocol and its generated schema/TypeScript bindings.

Before/after evidence:

- The committed semantic reference `4569fbac` passes all 32 Memory/Turso cases.
- The exact native intake prototype initially fails one case on its first vector
  query with Unsupported. After implementation it passes all 16 query envelopes
  and their path-only results after cold reopen. Command: `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path Cargo.toml -p lapis-app-core --test database_search_semantic --locked`. Logs `.local/search-semantic-native-{before,after-first}.log`.
- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path Cargo.toml -p lapis-app-core --test database_search_semantic_edges --test database_search_retrieval --locked`: eight cases pass, including the original full lexical/structured reference, 111 scoped candidates before limit one, ready/pending/dimension-mismatched vectors, three previews, unavailable-model degradation and closed admission. Log `.local/search-semantic-edges-first.log`.
- `pnpm protocol:generate` refreshes only the additive diagnostic field. Log `.local/search-semantic-protocol-generate.log`.
- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test:search:onnx`: all three real-model cases pass, zero failures/ignored. The existing tokenization/inference and detached publication cases remain; the new retrieval case checks six real queries, ranks/thresholds against retained model vectors, source/model diagnostics, cold reopen, detached waiter completion and close drain without a database write. Log `.local/search-semantic-model-first.log`.

The actual ONNX runtime is API 30 / 1.30.0, SHA-256
`685d2be5dba1309c89d3a5324b7fd06a5c42f1a61bfea32d14c4cc28d072121d`.
The five existing model assets retain revision
`751bff37182d3f1213fa05d7196b954e230abad9` of Xenova/all-MiniLM-L6-v2 and their
pinned byte counts/digests. The offline harness verifies them; no download,
provider fallback, baseline mutation or runtime installation is performed.

Desktop completes its native check and 230 service cases against the earlier
qualified cfb369f7 source before this source is changed. The full catalog and its
separate E-CORE-014 receipt remain pending; they do not qualify native semantic
adoption. Later source/consumer evidence must retain those separate revisions.

The first full source check stops on one boundary-audit finding: an inline Rust
parameter named `document` matches the browser-global source guard. Rename that
record parameter consistently; retain the unchanged guard and rerun its exact
command before resuming full validation. This is not a transport dependency.

Candidate loading also retains the original bounded-IN query shape: FTS/vector
paths are loaded in 256-path batches instead of scanning unrelated document
bodies. Complete scoped queries still evaluate their full scope before limits.
A 300-record case checks all selected paths/ranks across that batch boundary.
The earlier source-check pass is superseded by requalification of this final
loading shape; original result assertions and limits remain unchanged.

The intermediate root test run passes its Rust cases but stops at API packaging:
`publint` reports 57 generated export files absent from the packed artifact;
the files exist afterward. Unrelated API embed-registry/plugin edits also appear
in the shared checkout during that run. Preserve them and reproduce the narrow
packaging check before the final serial source qualification. No test failure
or packaging assertion is waived.

The exact `pnpm --filter @lapis-notes/api exec publint` rerun passes with zero
findings, without changing API implementation, manifests or packaging rules.
The final serial run rechecks the actual shared checkout; unrelated edits remain
excluded from this source slice commit. Log `.local/search-semantic-publint-exact.log`.

Final batched-shape qualification passes `pnpm check`, `pnpm test`, `pnpm build`
and `pnpm spec:check` in sequence. Counts: 20/20 check tasks (one cached), 20/20
test tasks (ten cached), 11/11 builds (nine cached), all nine specification lanes
and 38 specification regressions. Rust runs 192 ordinary cases with zero failed;
three asset-dependent cases are separately ignored in the ordinary run and all
three pass through the offline ONNX lane. The shared checkout API run passes
1,525 cases / 145 files, including one unrelated embed-registry case. Its
tracked API/spec edits remain outside this commit and are byte-identical from
the start of the final qualification. No packaging failure remains.

The final six-case exact command (16-query conformance plus five edge cases)
passes after candidate batching; all three real-model cases pass again afterward.
Logs: `.local/search-semantic-batched-{exact,check,test,build,spec-check}.log` and
`.local/search-semantic-model-batched.log`. Strict all-target Rust Clippy,
protocol drift/TypeScript and boundary audits pass in the root check.

The tracker marks semantic retrieval Source complete and preserves both host
adoption gates. No facade selection, asset installer, unattended indexer,
provider release, distribution/platform gate or remaining R1.3/R2–R7 gate is
completed by this source receipt. M11 stays Deferred.
