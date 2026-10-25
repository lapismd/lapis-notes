# Public catalogue dispatch argument types

Baseline: Notes `00a8f5ef`; Desktop M16.3 is uncommitted and under qualification.
Its real consumer type check exposes a pre-existing public contract defect:
`RemoteAppDatabaseArgs<RemoteAppDatabaseMethod>` intersects incompatible method
argument tuples into `never`. A transport dispatching a runtime method therefore
cannot use the public parser without a consumer cast.

Make argument inference distributive over method names. Literal methods keep
their exact tuples, unknown methods remain invalid, and a runtime method union
retains a usable union of argument tuples. No JavaScript implementation, parser,
allowlist, DTO, database engine or authority changes. No consumer shim or package
patch is introduced.

## Qualification

Exact `pnpm --filter @lapis-notes/api check:pack-types` initially fails two
diagnostics in the new public packed fixture: assigning an allowed empty method
tuple and mapping validated union arguments. The rebuilt API now passes prepack,
publint and the same fixture, including negative required-argument and unknown-
method examples. Complete source qualification passes:

- `pnpm check`: twenty successful tasks, zero cached.
- `pnpm test`: 237 ordinary Rust cases and twenty successful package tasks
  (nine cached), including 1,532 API cases. Five opt-in real-asset cases remain
  ignored in this ordinary lane; previous real-model receipts keep their scope.
- `pnpm build`: eleven successful tasks (nine cached); the affected API and Web
  outputs were rebuilt.
- `pnpm spec:check`: all ten lanes and 49 specification regressions.

The first complete check/spec attempt correctly rejected a 401-line canonical
page. Concise wording restores the 400-line limit without removing requirements;
the final page has 399 physical lines. Final changed-document formatting and
progress generation are checked before commit.

Desktop's nine focused native cases and eight renderer cases pass independently;
its broad type/native/catalog/application acceptance and R1.3.8 completion remain
pending. HTTP and existing source/model receipts keep their separate scope.
Hosted Web, backup lifetime and R2–R7 remain open; M11 stays Deferred.

Logs use `.local/shared-database-dispatch-*`. This is a types-only source fix,
not a new feature or completed native consumer gate.
