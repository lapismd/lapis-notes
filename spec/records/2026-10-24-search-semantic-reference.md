# Semantic Search retrieval reference

R1.3/R3 requires the existing semantic Search contract before either host adopts
the native AppDatabase facade. This source slice records 16 queries over eight
documents through both existing Memory and native Turso providers. It changes no
production implementation and does not complete Rust retrieval or host intake.

The fixture preserves vector/hybrid/auto/lexical scores, reciprocal-rank fusion
with K=60, lexical and vector ranks/contributions, candidate counts, provider and
model diagnostics, source/path filters, case/structured queries, snippets,
preferred chunk IDs, zero limits and locale tie ordering. Both document envelopes
and path-only results are asserted. Only the already-qualified document storage
body is projected to its path in this retrieval-specific reference, avoiding
clock-dependent embedding publication timestamps; the other result fields are
compared in full. Existing storage/preparation fixtures retain body conformance.

The token-hash provider is explicitly selected for deterministic ranking. This
never substitutes for configured ONNX inference, which retains its separate real
model qualification and assets. The retained dot-product chunk scorer assumes
normalized provider output; this reference does not change that algorithm.

Commands and initial results:

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/search-semantic-contract.test.ts`: 32/32 pass; document and path results agree.
- `CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path Cargo.toml -p lapis-app-core --test database_search_semantic --locked`: the next native intake prototype fails one case with the existing Unsupported error on its first vector query. The unimplemented intake prototype is retained in ignored `.local/database_search_semantic.rs`; this reference-only commit does not introduce a failing product test or claim that feature is implemented.
- The ignored fixture generator initially fails module resolution outside the API package. Resolve its installed provider dependency through that package's manifest; generation then succeeds without a committed alias or dependency change.

The next implementation must pass these envelopes, qualify actual admitted
ONNX retrieval and preserve bounded selection and owner lifetime. Ordinary-host
model installation, complete facade/host adoption and unattended scheduling
remain separate original-plan gates.

The first full `pnpm spec:check` reaches a single spec-first mapping failure:
the new API-owned JSON fixture also requires its package contract. Update
`spec/src/packages/vault-and-storage.md` alongside the shared Rust owner, then rerun the
exact gate. No mapping, checker or acceptance assertion is relaxed.

Final source qualification passes sequential root `pnpm check`, `pnpm test` and
`pnpm build`: 20/20 check tasks, 20/20 test tasks (nine cached), and 11/11 build
tasks (nine cached). The API runs 1,524 cases / 144 files; native suites run 185
ordinary cases, zero failures, with the same two existing asset-dependent cases
separately ignored. These do not include the pending native semantic prototype.

The exact repaired `pnpm spec:first` passes two protected files / three owning
chapters. Final `pnpm spec:check` passes all nine lanes, ownership/metadata audits
and all 38 specification regressions with zero failures. The first spec-first
mapping finding changes from one to zero. Node 26.9.0, pnpm 10.34.5 and Rust
1.99.0 are retained. No product, protocol, dependency or visual baseline changes.

MIGRATION records this verified reference and the still-Working native semantic
intake with a fresh UTC date/time. Rust production sources remain byte-identical
to the qualified cfb369f7 core while Desktop native requalification compiles; its
separate provider/catalog receipt remains an uncommitted draft.
