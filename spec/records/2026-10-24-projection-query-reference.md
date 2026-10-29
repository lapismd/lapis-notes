# Projection query reference conformance for the Rust migration

Date: 2026-10-24. Source-owned prerequisite for the remaining R1.3/R3 native
projection catalogue. Existing projection AST/public method shapes are unchanged.

The new API-owned JSON fixture and independent Memory/Turso provider cases
reproduce existing differences before porting those queries into Rust. The first
exact run passes nine cases and fails three: null membership, literal dotted
fields and first-page cursor publication. Expanded ordering/cursor/selection
coverage passes 16 and fails 14 of 30 cases. The unchanged assertions now pass
all 30 cases after the source fixes.

Ten additional relationship cases first pass five and fail five. Memory returned
stale targets and bypassed target registration/private access; Turso limited
edges before target filtering and missed incoming path-only edges. The repaired
providers pass all 40 query and relationship cases without changing assertions.

Turso uses conservative SQL candidate constraints when SQL null/type comparison
cannot prove the shared evaluator's scalar comparison. Negating an inexact
candidate never discards potential matches. The complete evaluator applies
filtering, locale ordering, cursor continuation and final limit; a SQL-limited
prefix cannot hide matches or lose the next cursor. The existing low-level SQL
compiler retains its shape and SQL sorting/limit options, with corrected literal
field paths, empty Boolean identities and null membership.

Cursor continuation now uses the same explicit null placement and locale row-ID
ties as sorting. Selection copies only own properties through `Object.fromEntries`
so JSON field names cannot mutate the selected object's prototype. These are
retained query-contract repairs, not new product features or a schema migration.

Exact command: `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/projection-query-contract.test.ts`.

Logs: `.local/rust-projection-query-reference-{before,expanded-before,after}.log`.
Relationship logs: `.local/projection-related-reference-{before,after}.log`.

Source qualification:

- Exact query/relationship tests: **40 passed / zero failed**. The focused run
  including editor conflict/persistence cases passes **73** tests.
- `pnpm build`: **11/11 tasks**; `pnpm check` and `pnpm test`: **20/20 tasks**
  each, including **1,231 API tests**.
- `pnpm spec:check`: nine configured lanes, ownership/query audits and **38**
  specification regressions pass.
- `pnpm test:storybook`: **261 passed / zero failed**, across all four cold
  shards (93, 71, 42, 55). The discovered
  [Problems save defect](2026-10-24-problems-quick-fix-persistence.md) is repaired
  at its owning source boundary; no unhandled errors remain.

The earlier concurrent aggregates exposed one five-second timeout in retained
host `sync-vault.test.ts` and two in frozen desktop `sync-local-bridge.test.ts`.
Exact unchanged reruns passed; the final sequential aggregates also pass without
Deno source, assertion or timeout changes. Initial logs remain
`.local/projection-query-root-{check,test}.log`; final logs are
`.local/projection-reference-{build,check,test,storybook}-final.log` and
`.local/projection-query-spec-final.log`.

Native AST and relationship queries, task integration, consumer adoption and the
R1.3/R3 gates remain open. This source record does not widen native/provider or
platform qualification. Visual baselines are unchanged.
