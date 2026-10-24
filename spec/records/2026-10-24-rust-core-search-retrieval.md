# Native lexical and structured Search intake

Date: 2026-10-24. Baseline Notes `6c314e7a`. R1.3/R3 source work; neither host
has selected this database facade. Native semantic inference remains separate.

The retained fixture stores complete result JSON, scores, snippets, chunk IDs,
diagnostics and ordered paths. Memory and Turso expectations are separate so
the reference preserves actual FTS candidate selection rather than pretending
table and FTS selection are identical. Source query grammar, scoped evaluation,
nested properties and JSON scalar conversions remain authoritative.

Native implementation groups parser/tokenizer, text/document evaluation,
properties, scopes, snippets and bounded result selection under Search.
It uses pinned `regress 0.12.0` with ECMAScript/UTF-16 matching and its unsafe-code
prohibition feature. This adds one lockfile package, reusing existing `memchr`;
no unrelated dependency version changes. Native FTS is created through the
existing pinned Turso engine. No embedded JavaScript runtime is introduced.

Document results retain at most the requested selected records, bounded to
32 MiB. Path-only selection retains paths/scores rather than selected bodies.
Complete table evaluation precedes ranking/limits. Query admission bounds text,
tokens, nesting, provider binds and result counts. Vector/hybrid and configured
automatic semantic search report explicit unsupported status pending the native
model intake; no token-hash or silent configured-provider replacement is used.

Before/after evidence so far:

- The first fixture-capture attempt fails once because Vitest's transformed
  `import.meta.url` is not a file URL. Use its package working-directory path;
  capture then passes. Logs `.local/rust-search-retrieval-fixture{,-pass}.log`.
  The one-time capture script is removed; only independent fixture assertions
  remain in the source tree.
- The initial source fixture passes **132 cases** over 66 queries: document
  JSON and path ordering through each retained provider. Log
  `.local/rust-search-retrieval-reference.log`.
- Native baseline reports **two missing-method diagnostics**, zero runtime
  cases. Log `.local/rust-search-retrieval-native-before.log`.
- First implementation compilation reports **five diagnostics** from two
  moved-module import paths and their inferred-type cascades, plus six unused
  import warnings. Correct the imports, retaining all assertions. Log
  `.local/rust-search-retrieval-native-first.log`.
- Native runtime then passes **one integration case**, consuming all **66
  complete Turso reference queries** and their path-only results. Log
  `.local/rust-search-retrieval-native-runtime.log`.
- Expanded edge checks reproduce **two retained snippet failures**: clipping
  bisects emoji at either boundary. Correct scalar-safe bounds in the owning
  API and native snippet implementations under LN-DB-060; preserve UTF-16 offsets
  and highlights. Both exact regressions and the earlier fixture pass **134
  cases**. Logs `.local/rust-search-snippet-{before,after}.log`.
- Expand the fixture with clipping and grammar cases. The final retained run
  passes **154 cases**: 76 queries per provider plus two direct Unicode cases.
  Log `.local/rust-search-retrieval-reference-final.log`.
- A subsequent native expansion has **one moved-range compilation diagnostic**
  in the task-scope matcher. Read its captured code unit without moving the
  range twice. Log `.local/rust-search-retrieval-native-final.log`.

An attempted native rerun stops at the unchanged 30 GiB free-space guard, before
compilation. Under standing cache approval, remove seven inactive old IDE
index/temp cache directories (3.70 GiB), preserving Local History, profiles,
plugins, applications and models. Then remove 47 inactive test executables
from the previous source cohort (1.92 GiB), whose Core/protocol inputs have
changed and will be rebuilt. Check open files and compiler inactivity; retain
the current retrieval executable. Ignored inventories are
`.local/inactive-search-retrieval-index-caches.json` and
`.local/obsolete-pre-retrieval-tests.json`. The latter leaves 31.22 GiB free.
No guard or test assertion is bypassed.

Host adapters, semantic output, native UI/OS, providers, Linux, publication and
distribution gates remain separate from this source intake.

Expanded local qualification:

- The expanded native target initially has **one runtime failure / two passes**
  at limited FTS ranking. Selecting the FTS score explicitly does not resolve
  it. Inspect the retained index DDL: it supplies field weights omitted by the
  first native index. Use those exact weights, retaining the full fixture and
  limit assertion. Logs `.local/rust-search-retrieval-native-{expanded,fts}.log`.
- The weighted exact rerun passes **four native cases**, including all **76
  full-result/path queries**, cold reopen of 111 eligible documents, bounded
  admission and explicit configured-semantic unavailability. Log
  `.local/rust-search-retrieval-native-weighted.log`.
- Both exact selected-buffer cases pass, including path-only selection whose
  document bodies exceed the complete-result byte bound. Log
  `.local/rust-search-retrieval-page.log`.
- All **three protocol Search cases** pass, including full fixture round-trips
  and rejection of SQL, native paths, unknown modes and invalid numeric options.
  Generated TypeScript/schema output is refreshed. Logs
  `.local/rust-search-retrieval-protocol-{generate,tests}.log`.
- Strict focused Clippy first reports **two** findings: a nested conditional
  and a large regex-containing AST variant. Collapse the conditional and box
  the literal; do not suppress either lint. The exact rerun passes. Logs
  `.local/rust-search-retrieval-clippy{,-pass}.log`.
- Eight directly affected API targets pass **273 cases**. A fresh headless
  Chromium Search catalog run passes **six** interaction/accessibility cases.
  Logs `.local/rust-search-retrieval-affected.log` and
  `.local/rust-search-retrieval-search-stories.log`.
- Initial `pnpm spec:first` passes **34 protected files / five chapters**. Log
  `.local/rust-search-retrieval-spec-first.log`.
- `pnpm check:rust-boundaries` initially reports **three** source-name findings:
  its DOM audit matches native `document.` variables. Rename those private
  bindings to `record`, preserving the public result field. The exact audit
  then passes; no verifier is changed. One multiline binding is missed, causing
  **one compilation diagnostic** in both source and Desktop Clippy. Repair it;
  strict source and Desktop normal Clippy then pass. Logs
  `.local/rust-search-retrieval-boundaries-final.log`,
  `.local/rust-search-retrieval-root-check{,-final}.log` and Desktop
  `.local/core-search-retrieval-clippy{,-final}.log`.
- Full `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=2 pnpm test` passes **160 Rust
  cases**, **1,479 API cases / 141 files** and **20/20 package tasks**, all
  executed. Log `.local/rust-search-retrieval-root-test.log`.
- Full root build passes **11/11 tasks**. After the private binding correction,
  root check passes **20/20 tasks**, protocol drift, boundaries and strict
  workspace Clippy. Logs `.local/rust-search-retrieval-root-build.log` and
  `.local/rust-search-retrieval-root-check-final.log`.

The first full specification run reaches mdBook but fails **one spec-first
mapping**: the newly requested AGENTS tracker rule also needs its canonical
governance chapter. Add LN-GOV-051 and its verification row without changing the
validator. The exact `pnpm spec:first` rerun passes **37 protected files / eight
chapters**. Logs `.local/rust-search-retrieval-spec-final.log` and
`.local/rust-search-retrieval-spec-first-final.log`.

Final qualification passes:

- The exact four-case native retrieval rerun passes after the private binding
  repair. The complete native suite passes **160 Rust cases**, zero failed or
  ignored, plus **five** architecture-audit cases. Native workspace build passes.
  Logs `.local/rust-search-retrieval-native-final-pass.log` and
  `.local/rust-search-retrieval-native-suite-final.log`.
- Cold `TURBO_CONCURRENCY=2 pnpm test:storybook` passes **261** headless Chromium
  interaction/accessibility cases across four fresh shards (93/71/42/55); all
  **five** Turbo tasks execute. Log `.local/rust-search-retrieval-catalog.log`.
- Final `pnpm spec:check` passes all **nine stages**, App-ownership and metadata
  audits and **38** specification regressions. Log
  `.local/rust-search-retrieval-spec-final-pass.log`.
- Changed authored TypeScript/JSON and Markdown formatting passes; generated
  protocol/schema drift remains checked by the source lanes. Logs
  `.local/rust-search-retrieval-format.log` and
  `.local/rust-search-retrieval-governance-format.log`.

The tracker records an explicit UTC date/time. LN-GOV-051 and AGENTS require a
refresh in every slice commit and after consumer qualification. This closes the
lexical/structured source slice only; R1.3/R3, semantic inference and both host
adoption gates remain incomplete.

The Desktop dependency lock needs only the new `regress` package/edge. Both
workspace and package-scoped offline Cargo updates propose 31 unrelated version
updates. Discard those untested changes, retain the generated new package block
and Core edge over the committed lock, and validate with the selected Darwin
`cargo tree --locked --offline`. No other package version changes. The actual
consumer checks remain separate from source qualification.
