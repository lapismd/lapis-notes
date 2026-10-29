# Opt-in native Tasks occurrence publication

Last updated: 2026-10-25 17:40:03 UTC.

Status: source complete. Both desktop and hosted plugin/processor selections
remain pending. This record does not qualify UI dependencies or installed apps.

## Scope and ownership

Notes starts at `16ab57a1` in the isolated `native-occurrences` workspace.
`set_task_occurrence_indexing(true)` explicitly starts or wakes the existing
vault-owned Markdown worker. Markdown-only selection stays unchanged. Disabling
fences new Tasks source admissions, retains already accepted publication drain
and leaves Markdown running. No second scheduler or renderer fallback is added.

Notes owns registration, source identity and atomic publication of the existing
public `tasks/occurrence` schema. The Tasks crate owns parsing. Private database
state reads make definition/source reconciliation idempotent, independently of
unchanged Markdown metadata. Missing sources rebuild cold; noncanonical/deleted
sources lose ready rows. Duplicate identities within one source and more than
64 rows publish stable source errors with no partial ready rows.

## Exact inputs

The Docker native snapshot pins unchanged source parsers:

- Tasks `569d7e30ed86bd4514365e50befb908b2a8400e2`.
- Plugins `6af2420ff720cf8ce04581306c9c7b8d12b126e4`.

The retained CRLF/astral fixture is copied without changing its source string
or expected records from the Tasks fixture inventory. Its numbers are compared
using the source reference's JavaScript numeric domain: JSON `2` and `2.0` are
equivalent; every key, array position, other value and UTF-16 range stays exact.

These native-only checks use the same explicitly declared Design Core/Agent UI
prerequisite archives as the earlier qualified native lane (Design Core archive
SHA `4db7d4f621d66f5d40110ddb87d423f34063a0731a811618aa6abdae7abe7658`, Agent UI
SHA `b6d8a4283d8007d83d7f786458a2712d2796df8e8031c1a48e9692ebe7135f3d`).
The isolated installation projection restores tracked manifests/lockfiles before
checks. This does not admit those UI archives as the refreshed product cohort.
The Cargo lock adds only the private Tasks package and core dependency edge;
all third-party package selections stay unchanged.

Compiler-cache prewarming copied from the stopped owned main
`c3d427cde32aea83-e2b643f83d95dec360dc` caches into private workspace
`407deacac2a3f69a` caches. The image, Rust 1.99.0 and x86_64 Linux target matched;
source volumes were read-only and all mounts were rechecked idle. Only Cargo
registry/git and Rust target artifacts were copied; no profiles, models or
runtime state. Cargo retains fingerprint invalidation. Ignored provenance lives
under `.local/validation/cache-prewarm/`. Cache reuse is not qualification.

## Before and after

The exact target is
`pnpm validation:rust -- test -p lapis-app-core --test service_task_occurrences --locked`.

| Boundary                          | Before                                                                                                                                                      | Repaired result / report suffix                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Source-base registry-only install | Existing app-profile manifest/lock mismatch; Rust did not run (`3e0c0f1b-aa78-4cc7-a020-a1d5e9406f6c`)                                                      | Explicit prerequisite projection enables native-only qualification                 |
| New selection API                 | Eight missing-method compiler diagnostics; zero cases (`3e03bde9-7f57-4ce5-84b1-ab793a755f83`)                                                              | All five exact cases pass                                                          |
| First implementation              | One missing optional parser argument; zero cases (`f2113ae3-7266-41e5-b85a-8c9c4130bb08`)                                                                   | Correct source parser call                                                         |
| Exact fixture comparison          | Four passes, one timeout (`5fbf4457-052b-4225-afc0-c15b85da613b`); narrowed assertion proves only `2.0` versus `2` (`2ba734d4-4bb8-40ff-830e-daa731d9934c`) | Reuse the retained reference numeric domain; all other exact comparisons preserved |
| Diagnostic launcher               | Cargo `--nocapture` lacked its separator; zero cases (`89f5306f-6f88-476c-91ed-4f9a3bc2efb3`)                                                               | Corrected launcher exposes the full stored-row difference                          |

The new workspace initially lacks host tool dependencies, so direct
`pnpm progress:generate` cannot import Prettier. Its generator is byte-identical
to the default workspace's; that exported generator is invoked with this
isolated root for local projection. Canonical progress/specification checks run
with installed dependencies inside Docker.

## Qualification

All commands use the bounded 4 CPU / 12 GiB remote Docker lane. Receipts live
under ignored `.local/validation/runs/lapis-notes-validation-<suffix>/` and retain
source, native inputs, image, tool and outcome identities.

| Command                       | Result                                                                                                                                                                                                                         | Report suffix                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Exact five-case native target | Five pass, zero fail: no-client startup/late opt-in, exact UTF-16 rows, edit/noncanonical/delete convergence, cold missing-source repair and unchanged revisions, duplicate/65-row source errors, Tasks-only disable/re-enable | `e3808c25-1117-45f3-9785-c81b38673e68` |
| `pnpm check:rust-core`        | Source/dependency boundaries, generated protocol equality, rustfmt and strict full-workspace/all-target Clippy pass                                                                                                            | `544abacb-0c58-4bfa-b948-3b3197d4883b` |
| `pnpm test:rust-core`         | All 344 Rust cases plus five boundary regressions pass; zero failures. Six retained ignores: five real-model gates and one crash helper                                                                                        | `d78f0cfd-b0d6-49b5-b427-50879b2707a0` |
| `pnpm build:rust-core`        | Locked complete native workspace build passes                                                                                                                                                                                  | `783af034-1f73-42dd-8c81-08a952361841` |
| `pnpm spec:check`             | Canonical validation, progress, native boundaries/protocol, spec-first, mdBook, App ownership, metadata-query audit and all 78 specification regressions pass                                                                  | `a20a59dc-0f7b-42d3-b855-3dd7afa32acf` |

Complete Rust source/protocol/HTTP tests include the existing ten Markdown
lifetime cases and retained database/projection behavior. No new model or native
OS acceptance is inferred from the retained ignored tests.

## Remaining gates

Both host/plugin selections remain waiting under `R3.2.1.3`. Full Tasks document
parsing, recurrence/materialization, Docs/custom processors, Search and History
scheduling remain separate R3 gates. Consumer adoption, refreshed UI dependencies,
actual-provider behavior, other operating systems and distribution are separate.

After recording source completion in the isolated ledger, the complete
`pnpm spec:check` gate passed again with all 78 specification regressions
(`15036fca-c301-49a6-a86d-b9921069a2df`). Final changed-document Prettier,
rustfmt and generated grouped/spec-linked progress checks pass. The default
workspace remains untouched; its master tracker will adopt this source receipt
separately from its pending UI cohort.
