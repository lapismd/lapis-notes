# Native current-format database lifecycle

R1.3/R3 source slice; neither host selects this facade yet. The native owner
adds the retained `migrate()` operation and initializes the actual normalized
Turso v5 schema plus `schema_meta` and `app_meta` version markers. Open and
explicit migration share one implementation. Initialization is transactional,
idempotent and does not create a change revision or notification.

Accepted migration survives caller detach and close drains it through the
existing worker. Stored payloads, frozen `app_state` bytes and existing change
revisions remain intact. The earlier unversioned native schema is initialized
additively. Unsupported versioned formats fail without rewriting storage;
legacy database import/backfill is outside the agreed pre-release migration.
The retained TypeScript provider keeps its existing legacy migration behavior.

The 68-method inventory is still name-level only. Optional/default arguments,
undefined/null/void results, remaining query-enhancement shape and actual
transport/host adoption remain required before claiming complete conformance.

## Exact regression and failures

- `pnpm rust:core -- test -p lapis-app-core --test database_schema --locked`:
  baseline **one failure**, fresh native open returns no schema version instead
  of Turso version 5. Initial implementation rerun: **one pass**.
- Expanded test draft: **three compiler diagnostics**, because ChangeSet does
  not implement PartialEq. Assertions now compare the exact error after
  `unwrap_err()` without altering production DTOs or relaxing the checks.
- Expanded exact target: **six pass, zero failures**. It checks both version
  markers, repeated migration, zero revisions/events, admission after close,
  ordered work after a detached waiter, cold reopen, eight retained payload
  families from the actual serving schema, unversioned native initialization,
  full DDL rollback/released ownership, and three unsupported version markers.
- Name inventory: **68 native methods/known aliases, zero missing**. This does
  not establish signature, default or transport compatibility.
- `pnpm check`: **20/20** package tasks pass (cached), plus current native
  boundary/protocol checks and strict workspace/all-target Clippy. Metadata,
  specification, App ownership and styling/query audits pass.
- `pnpm test`: **198 ordinary Rust cases, zero failures**, with three
  asset-dependent cases explicitly ignored; all **20/20** package tasks pass
  from their existing unchanged cache entries.
- `pnpm test:search:onnx`: all **three actual-model cases pass**, including
  provider initialization, semantic retrieval/reopen and retained MiniLM output.
  Existing checked model/runtime assets are used; no new download.
- `pnpm build`: native workspace build and **11/11** package tasks pass
  (unchanged package tasks cached).
- `pnpm spec:check`: all **nine lanes** and **38 specification regressions**
  pass. This includes current protocol drift, native boundary checks and all
  175 specification mirrors. No product/Storybook source changes or baselines.
- Full facade signature/transport conformance and current Desktop dependency
  compatibility remain separate from these source gates.
- Changed-document Prettier checks pass; `pnpm spec:first` passes for **seven
  protected files / two canonical chapters**. Source is qualified independently
  of the separate Desktop compatibility check.

## Remaining original gates

The complete facade, model/cache installation, Tauri and authenticated HTTP
adapters, retained hosted shell and backup detach/Quit acceptance remain R1.3.
R3 unattended metadata/projection/Search/history ownership remains waiting.
Native service evidence does not qualify visible WebView/provider/platform
journeys. M11 distribution remains Deferred; R0–R7 remains active.
