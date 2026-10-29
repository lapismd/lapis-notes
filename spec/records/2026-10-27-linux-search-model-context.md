# Explicit Linux CPU reference for native Search

Date: 2026-10-27. Source base `869f36bc9eef4d2a7a28bf0f7f146ef0b174f4d1`,
preserved as tree-identical duplicate `9c1ba39e`. This is test-reference
qualification, with no production encoder, provider or indexing-policy change.
The independent cache/admission repair and combined source/host gates belong to
the enclosing migration slice.

## Independent reference and retained contract

The retained API fixture remains byte-identical, SHA256
`fc735637f05dfd8aebce2ea75e1f5704f37248c4404ab40ef0117ded0dfcc133`.
Its original Darwin ARM64 CPU qualification and library hash remain in
[the encoder receipt](2026-10-24-rust-core-onnx.md).

The unchanged Node reference script was rerun against frozen Notes source
`bd7a55d21e349bc6ce5208bb6895d11193919746`. That source is production-equivalent
to the retained source cohort. The capture finished at
`2026-10-27T00:24:37.155Z`, receipt
`28cb3619-c820-4efa-a24e-7b16a6f13ef6`. The script SHA256 is
`0910f508227ad106596a2dacbbca2a3802d3ebd5f31f42e4f9731863a9360df2`;
its complete unchanged output SHA256 is
`4a5c17184d858df46f40ffdb34c78ebca1afd3dbb2327b599299efc38f13bbe6`.
Both are retained under
[the separate fixture directory](../../crates/lapis-app-core/tests/fixtures/search-model/README.md).
The `.txt` suffix preserves the captured bytes independently of formatting.

The new reference used Node **24.15.0**, Transformers **4.3.1**, ONNX Runtime
**1.30.0**, CPU on **Linux x64 / AMD Ryzen 7 7800X3D**. The exact runtime-library
SHA256 is `ffb75a925ba05e47b235bb66e3e3911714a80b328a9c9425539feb204aa32a23`.
The provenance file retains the frozen source, script/output/receipt hashes,
container image, worker resources, CPU, logical CPUs, available parallelism and
all five model asset sizes/hashes. Model identity remains
`Xenova/all-MiniLM-L6-v2`, revision
`751bff37182d3f1213fa05d7196b954e230abad9`, q8, mean pooling, 384 dimensions.

All six query texts and exact token IDs, attention masks and type IDs match the
retained fixture. All mixed-batch inputs/dimensions/tokens, chunk fingerprints,
raw input and token-hash expectations remain unchanged. The test helper compares
every non-vector field and verifies the original fixture hash before using the
separate Linux vectors. No Rust output generates expected data.

The independent Node/Linux run reproduces the native mismatch: query four's
maximum difference is `0.0036988351494073868`, query five's is
`0.004347372800111771`, and the padded/mixed maximum is
`0.015728341997601092`. Sixteen of twenty-two compared vectors exceed the old
`1e-5` tolerance. Query four dimension zero is `0.01851302571594715`, matching
the earlier native actual. This establishes a qualified-context difference on
this machine; it does not qualify other CPUs or platforms.

## Explicit selection and focused gate

The three real encoder/provider/semantic cases use an explicit
`LAPIS_TEST_ONNX_REFERENCE_CONTEXT`. The retained context is
`darwin-arm64-ort-1.30.0`; the new context is
`linux-x64-ort-1.30.0-amd-7800x3d`. Missing/unknown selection, a different OS,
architecture, Linux CPU model, runtime binary or model asset refuses before
inference. There is no platform fallback inside the tests. Canonical command
selection and broader source qualification are owned by the enclosing slice.

All existing `1e-5` vector and `0.0002` semantic-score tolerances remain exact.
Individual queries, the six-row padded batch, the nine-input mixed batch,
unnormalized output, cold reopen, detached publication and semantic rank/score
assertions remain intact. The original macOS fixture is never regenerated.

The bounded worker `f23c3e5f-690a-44a1-90a8-8cf4cbaaf6f2` freezes the original
tests at `644c870c8ed91148079c077553d93ec44bbdc0ba` and the reference candidate
at `64a81075436f5a8dd137859489999663c25edcfc`. It runs each target independently:

```sh
node scripts/rust-core.mjs test -p lapis-app-core --test embedding_model --locked -- --ignored
node scripts/rust-core.mjs test -p lapis-app-core --test database_search_provider_model --locked -- --ignored
node scripts/rust-core.mjs test -p lapis-app-core --test database_search_semantic_model --locked -- --ignored
```

The run finished at `2026-10-27T00:37:32.445Z`, exit zero, without OOM.
Each target's original failure was reproduced independently before the update:

| Real case                                                    | Before          | After           |
| ------------------------------------------------------------ | --------------- | --------------- |
| Encoder tokens, individual/batched/raw vectors and reopen    | 0 pass / 1 fail | 1 pass / 0 fail |
| Admitted provider publication, detach and cold configuration | 0 pass / 1 fail | 1 pass / 0 fail |
| Semantic ranks/scores, diagnostics, detach and cold reopen   | 0 pass / 1 fail | 1 pass / 0 fail |

All three actual-model cases execute with zero ignored. The original encoder
failure is exactly `0.0036988351494073868`; the provider reports query four,
dimension zero, actual `0.01851302571594715` versus old expected
`0.02047053351998329`; the semantic case retains its original score-tolerance
failure. The after cases change only reference selection.

The two explicit negative executions both refuse as expected: unknown context
reports `Unqualified model reference context`, and selecting the Darwin context
on Linux reports `unqualified model reference OS`. These are expected refusal
probes, separate from the three passing model cases. No assertion is loosened.

`node scripts/rust-core.mjs fmt --all -- --check` and strict Clippy for all
three model targets pass. The exact Clippy command is:

```sh
node scripts/rust-core.mjs clippy -p lapis-app-core --test embedding_model --test database_search_provider_model --test database_search_semantic_model --locked -- -D warnings
```

The local receipt directory is
`.local/validation/runs/lapis-r3-adapters-model-reference-f23c3e5f-690a-44a1-90a8-8cf4cbaaf6f2`.
The combined five-model gate, complete native tests/check/specification,
Desktop/hosted acceptance, publication and default cutover are not qualified by
this focused reference receipt.
