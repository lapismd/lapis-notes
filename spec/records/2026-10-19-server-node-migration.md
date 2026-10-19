# Server rename and Node migration

Approved implementation plan, 2026-10-19. Living status is maintained in
[MIGRATION.md](../../MIGRATION.md#node-server-migration-2026-10-19).

## Goal

Rename `packages/server-deno` to `packages/server-node`, with private package
identity `@lapis-notes/server-node`, in this repository. Run on Node 24 LTS.
The server must build, test and deploy without an installed Deno executable.
Keep TypeScript, pnpm, tRPC, Turso, the authentication model, all 68 remote
AppDatabase methods and the existing browser application.

The frozen Deno desktop and unrelated sync tooling remain separate consumers.
No Rust service, repository extraction, public deployment or publication is
part of this migration. Existing server data remains readable without schema
conversion; `.lapis` remains the application state convention.

## Package boundaries

- Rename the server package, imports, scripts, Docker references and canonical
  specification mappings together.
- Extract the portable paths, database worker protocol, worker runtime, native
  database factory and language-service adapter to private
  `@lapis-notes/host-services`. It has Node-compatible build, check and test
  commands and one implementation of each helper.
- Retain the old Deno host-service subpaths as compatibility re-exports. Keep
  frozen desktop application code unchanged and preserve its import resolution.
- Add `node-server` to the shared runtime type and use it in the server browser
  host, database provider and document marker. Retain deprecated `deno-server`
  compatibility in the public API.

## Runtime

- Use `@hono/node-server` solely as a Fetch-to-Node adapter around the existing
  handler and tRPC Fetch adapter; do not add Hono application routing.
- Replace Deno file operations with `node:fs/promises` and preserve the existing
  public errors, containment, serialized mutations, atomic replacement, strong
  ETags, resources, plugin assets, ranges and bounded ZIP transfers.
- Replace Deno environment and signals with Node process APIs. Use
  `node:worker_threads` for database dispatch, preserving request ordering,
  messages, change notifications and rejection of pending failed requests.
- Emit ESM main and worker bundles with esbuild. Keep native dependencies
  external so native Turso binaries load through their supported npm package.
- Preserve streaming backpressure, cancellation, proxy trust and ordered
  shutdown. Retain HTTP routes, tRPC procedures, protocol major, public errors,
  environment names, port defaults, cookies, vault IDs and database schemas.
- Keep the current native database and Markdown language implementations.

## Deployment

Use Node 24 build/runtime images, a non-root runtime user, read-only application
files, explicit writable data storage and mounted bootstrap secrets. Retain
application authorization, path containment and outbound plugin-source
restrictions; document the replacement for Deno's runtime permission flags.
Remove server-only Deno config, types, launch commands and CI dependencies.
Historical records and compatibility documentation may still mention Deno.

## Ordered slices

| Slice | Deliverable                                                                                  | Completion gate                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| N0    | Save this full plan and the migration ledger; identify baseline and mapped requirements.     | Documentation checks pass and implementation remains Planned.                                                    |
| N1    | Extract portable host services and retain compatibility subpaths.                            | Contracts pass, the new package builds without Deno and retained imports resolve.                                |
| N2    | Rename and port server, worker, file/process bindings, browser imports and runtime identity. | Node smoke proves bootstrap, login, vault/files/database/events and clean shutdown.                              |
| N3    | Node Docker/Compose/CI/development commands, browser parity and dependency cleanup.          | A fresh container passes hosted browser acceptance, retains data across restart and contains no Deno executable. |

Update canonical requirements and verification mappings before or with protected
implementation changes. Preserve requirement IDs, enforce the spec-validator
gates and commit each verified slice separately with Jujutsu. Record status,
commit, exact commands, failure counts and remaining gaps. Status progression:
Planned, In progress, Implemented, Verified. Complete the migration only after
N3's acceptance gates pass.

## Verification

Record the original server unit and hosted-browser results before editing.
Start each repair at its exact failing boundary, then widen by impact.

- Bootstrap idempotency, sessions, logout, expiry, CSRF and all membership roles.
- File/binary round trips, ranges, traversal and symlink rejection, atomic writes
  and ETag conflicts. `process()` invokes its callback once and never retries it.
- Native Turso, all database methods, worker errors, pending-request rejection,
  shutdown and database closure.
- Event ordering, replay, stale-cursor resync, reconnect and revoked sessions.
- Static assets, Markdown diagnostics, plugin assets/downloads, bounded ZIP
  import/export and cleanup of rejected or cancelled operations.
- Actual browser create/open/edit/save/reopen flows, peer updates and retained
  storage across server restart, using the ordinary workspace components.
- Built-output startup/shutdown in a fresh Node container with Deno absent.

After focused checks pass, run the required repository check, test, build,
specification and affected interaction/accessibility lanes. Record pre-existing
failures independently; never weaken assertions or refresh visual baselines to
make the migration pass. Server acceptance is headless and does not raise
desktop application windows.

## Evidence

No product acceptance was claimed when the plan was authored. Per-slice
commands, counts, limitations and commits are appended here during execution.

### N0 — Plan and baseline

- Isolated Jujutsu workspace: `server-node` (`../lapis-notes-server-node`).
- `pnpm install --frozen-lockfile --ignore-pnpmfile --ignore-scripts`: passed.
- Prettier checks on this record and `MIGRATION.md`, plus `pnpm spec:validate`:
  passed; 172 chapters, 1,439 requirements.
- Initial tests could not load unbuilt public exports: server 8 failed suites;
  portable helpers 1 failed suite, 6 passed tests. Building existing public
  package outputs resolved those startup failures without product changes.
- `pnpm exec turbo run build --filter=@lapis-notes/api... --filter=@lapis-notes/language-service...`:
  5 successful package builds.
- `pnpm --filter @lapis-notes/server-deno test`: 8 files / 28 tests passed.
- `pnpm --filter @lapis-notes/deno-host-services exec vitest run src/paths.test.ts src/app-database-worker-runtime.test.ts src/language-service.test.ts`:
  3 files / 9 tests passed.
- `deno run --no-check --no-prompt --sloppy-imports --unstable-no-legacy-abort --allow-read --allow-write --allow-net --allow-env --allow-ffi --config packages/server-deno/deno.json packages/server-deno/src/server.smoke.ts`:
  original native server smoke passed.
- Development runtime: Node 26.9.0. Deployment target: Node 24 LTS. Docker
  currently has approximately 3 GiB RAM.
- Canonical mappings: LN-ARCH-096, LN-SRV-001–019, shared AppDatabase and Web
  host requirements. Product status is unchanged by this planning slice.

### N1 — Portable services

- Extracted the five portable modules to the private host-services package.
  Existing Deno source subpaths forward the canonical implementation, preserving
  frozen desktop imports. Built Node ESM and declarations use public dependencies.
- Portable build/check and 9 tests pass. The retained Deno package passes its
  Deno check and 90 tests, including exact compatibility-export identity.
- Plain Node imports of built portable services round-trip metadata through
  native Turso. The original Deno server smoke and 28 server tests still pass.
- `pnpm spec:check`: all six lanes and 38 validator tests pass.
- `pnpm check`: 20 successful tasks. `pnpm build`: 11 successful tasks.
- `pnpm test`: 20 successful tasks after a serial rerun. A first attempt
  overlapped a separate build that was replacing API output; five unresolved
  bundle imports and one workspace suite load failure were eliminated by
  finishing builds before the exact aggregate rerun.
- During extraction, the initial NodeNext declaration build reported 11 import
  errors; Bundler resolution plus bundled ESM fixed the actual package boundary.
  A new compatibility test initially compared built/source identities (1 failure);
  it now verifies that both retained subpaths and canonical source share the
  same implementation. No assertions were removed.
- The lockfile retains unrelated existing resolutions; a frozen install passes.
