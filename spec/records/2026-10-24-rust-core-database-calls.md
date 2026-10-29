# Native high-level AppDatabase call boundary

R1.3/R3 source slice, qualified before either host selects the new facade.
The existing 68-method catalogue is wrapped
without exposing SQL, database paths or a second engine. Tagged values retain
JavaScript undefined separately from explicit JSON null in arguments/results.
Existing typed native operations remain the accepted-work owner.

## Exact regression

`pnpm rust:core -- test -p lapis-app-core --test database_calls --locked`:
baseline stops with **one compiler diagnostic** because the high-level native
`Database::call` boundary is absent. The missing/null/deletion regression then
passes. Final qualification covers all 68 methods with 85 transported calls,
rejected transactions, explicit undefined defaults and semantic-query signals.

The native call catalogue and query-enhancement source gates are complete.
Asset installation, both host adapters and original shell/backup/unattended
indexing gates remain active.
No host is selected by this source work; M11 remains Deferred.

## Conformance findings and reference preparation

- First full native comparison: **four pass / one failure**. `transactMeta`
  returned a boolean instead of the retained `{ applied }` object. The call
  adapter now preserves that result shape; all 72 initial calls then pass.
- Adding query-enhancement requests exposes **one failing native case**, rejecting
  the omitted request shape. Typed requests and retained skip diagnostics now
  pass all 83 calls, including all six runtime targets, disabled flags, absent
  diagnostics, strong/weak signals and complete counts before a limit of one.
- Turso reference capture has two draft failures: an invalid Search fixture
  omitted required tag arrays, then Vitest's transformed non-file import URL
  cannot name the capture file. Valid records and the API-owned capture path
  correct both; the retained target passes without capture enabled. No provider
  rule or assertion is relaxed.
- Only random file/revision identifiers in history publication are normalized;
  both providers assert nonempty IDs and matching file identity before doing so.
  JSON numeric comparison retains JavaScript Number semantics. All other fields
  and result tags are compared.

## Expanded exact qualification

- The final retained target passes **39 cases / two files**: the 85-call
  reference, an explicit unregistered-Tasks default contract, 32 original
  semantic cases and five enhancement cases through the actual Turso provider.
- Exact native `database_calls` and `database_search_semantic` targets pass
  **eight cases**. They cover all 85 reference calls, optional undefined slots,
  failed transactions, full semantic signals before limits, allowlist drift,
  invalid/oversized input, detached acceptance and cold reopen.
- One expanded default test initially fails because its empty fixture queries
  Tasks before registration. The retained provider is verified to reject that
  same query. Both retain the error without writes; native tests also register
  the projection and prove omitted/undefined query defaults agree. No fallback
  or empty-result substitution is introduced.
- A native rerun stops before test execution at the 30 GiB preflight. A fresh
  filesystem observation then reports 30.913 GiB free; the same target reruns
  and passes. No cache is removed for that transient preflight stop.
- Generated schema/TypeScript includes the call catalogue, explicit value tags,
  four-argument schema bound and retained query-enhancement types. The canonical
  test always checks expected values; its development-only capture bypass is
  removed after the retained provider creates the reference.

Full source qualification completes below.

## Source qualification

- `pnpm check`: all **20 package tasks pass freshly**, plus strict native
  workspace/all-target Clippy, protocol drift/types, boundaries, App ownership
  and metadata/style audits. Turbo emits its existing no-output notices for
  unchanged app-profile/deno-host-services build tasks.
- Initial `pnpm spec:first` reports one missing package-chapter mapping. The
  mapped vault/storage chapter now records the reference and remains within
  400 physical lines; the gate passes for **25 protected files / three chapters**.
- `pnpm test`: **205 ordinary Rust cases, zero failures**, with three
  asset-dependent cases ignored and separately qualified below. All **20/20**
  package tasks pass freshly, including **1,532 API cases / 146 files**.
- `pnpm build`: native workspace build plus **11/11** package tasks pass;
  two tasks execute freshly and nine reuse unchanged successful outputs.
- `pnpm test:search:onnx`: **all three actual-model cases pass**, with the
  retained pinned runtime and all five model/tokenizer assets checked offline.
- `pnpm spec:check`: all **nine lanes / 38 regressions** pass; protocol drift,
  native boundaries and all 175 specification mirrors are current.
- The first model-lane attempt stops at the 30 GiB guard without running tests.
  Under standing cache approval, 158 older `.rlib`/`.rmeta` caches are removed
  from the inactive Notes target (570,280,731 bytes). Matching package-source
  paths, features, profiles, targets, compiler/flags and configuration fingerprints
  retain newer replacements;
  compiler/open-file checks and file identity revalidation precede deletion.
  No executable, runtime/model asset, profile or vault is removed. Space returns
  to 32.377 GiB and the same uncached model lane then passes. Inventory and
  removal receipts are `.local/database-calls-{obsolete,removed}-libraries.json`.
- No selected host, visible WebView/provider or end-to-end application gate is
  claimed. Current Desktop compatibility remains the next separate receipt.

Exact commands:

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-facade-contract.test.ts src/lib/__tests__/search-semantic-contract.test.ts
CARGO_BUILD_JOBS=2 pnpm rust:core -- test -p lapis-app-core --test database_calls --test database_search_semantic --locked
```

Changed-document/fixture formatting and final specification metadata validation
pass (10 validators, 175 chapters, 1,511 requirements). No assertions, wait budgets,
visual baselines or existing source rules are weakened.
