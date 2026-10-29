# Lapis Notes catalog validation and Docker execution

Status: original qualification in the isolated `catalog-validation` Jujutsu workspace.
See [the later main-workspace landing](2026-10-25-catalog-main-landing.md) for the
combined checkout and its separate delivery gates.
Functional, interaction, accessibility, build and final same-change specification
checks pass, including all 78 specification regressions.
Ongoing application edits in the default workspace are excluded.

The repository owns its WorkspaceShell policy through the spec-validator plugin
and explicit inventory. Component examples do not claim full application parity.
The public-package boundaries and existing App ownership, Show Code, interaction
and accessibility gates remain in force.

Before implementation, the runner target was absent. Docker source/tool/browser
smoke and runner regressions are recorded under ignored `.local/validation/`.
The composition inventory initially reported 23 findings;
fixture controls, explicit loading presentation and the mixed Plugin Management
classification resolve them without replacing production components.

Qualified commands so far (Linux Docker on the remote `omarchy` daemon,
4 CPUs, 12 GiB RAM and 2 GiB shared memory):

| Command                                                                                                                                                            | Result                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `pnpm validation:check`                                                                                                                                            | 48 runner/native-source/composition cases pass                          |
| `node --test scripts/local-test-routing.test.mjs scripts/validation.test.mjs scripts/validation-native.test.mjs scripts/spec-validation/storybook-parity.test.mjs` | 49 cases pass                                                           |
| `pnpm test:storybook`                                                                                                                                              | 261 cases pass across all four cold shards: 93, 71, 42, 55              |
| `pnpm check`                                                                                                                                                       | Complete root check, Clippy and package lanes pass                      |
| `pnpm test`                                                                                                                                                        | 312 native cases and 2157 package cases pass; all 20 package tasks pass |
| `pnpm build`                                                                                                                                                       | Complete native and package builds pass                                 |
| `pnpm build-storybook`                                                                                                                                             | Static catalog and 178 specification chapters pass                      |
| `pnpm spec:check`                                                                                                                                                  | Canonical checks, ownership audits and all 78 regressions pass          |

The migration-progress routing regression initially failed once because it
inspected the old root script. It now verifies both Docker dispatch and the
mandatory native progress lane; the exact named regression passes.
The specification lane also caught a 402-line chapter; its existing release
qualification paragraph now contains the evidence within the 400-line budget.
The jj-store source repair is committed as
`4e74e423966180576da89229e02da49dcd014dfd`, with all 379 owning-crate tests,
Clippy and build passing. Notes pins that exact source; the original backup
binary improves from 5 passed / 1 failed to 6 passed / 0 failed.

Widening then exposes eleven native-turn failures. The complete affected target
is `pnpm validation:rust -- test --locked -p lapis-app-core --test native_turn
--test turn_journal --test vault_conformance --test vault_directory_sync
--no-fail-fast`: before 3 passed / 24 failed / 1 ignored; after 27 passed /
0 failed / 1 ignored. Existing file, journal, conversation and model-cache
barriers now share one private capability-relative readable-directory sync
helper. Physical-root checks, symlink refusal, writer/dirty-buffer ownership,
conditional publication, receipts and byte bounds remain unchanged. The new
mutation test covers create, conditional overwrite, append, copy, cross-directory
rename, file removal and both directory-removal modes.
Server startup then reproduces one library failure (3 passed / 1 failed):
private profile permission changes also used search-only handles. The same
capability-relative readable reopen now precedes `set_permissions(0700)` and the
host turn-directory barrier. The exact `pnpm validation:rust -- test --locked
-p lapis-server --lib` target passes 4/4. Metadata-only identity witnesses remain
unchanged. The complete server suite passes 64 cases with zero failures; the complete root test lane now passes 312 Rust cases and 2157 package cases across all 20 tasks. Six existing native asset/helper ignores and one existing Desktop skipped case retain their separate gates; a 90-case host suite repeats during its build and is not counted twice. The final root check passes all 20 tasks (including strict Clippy), and the root build passes all 11 package tasks plus the native build. No functional failures remain in this qualified graph.

Linux native cache qualification reproduced four failures under the exact
`validation:rust -- test --locked -p lapis-app-core --lib embedding::cache::`
command. Publication attempted to fsync a search-only directory capability.
The owner now reopens the same capability-relative directory for reading before
syncing; verification, physical-root checks and atomic publication are retained.

The full browser lane found one Graph hit-test failure. The exact cold rerun
reproduced it: without Storybook body classes, the real application was mounted
in a 116px-tall fixture. Panel fixtures now own their viewport height directly
and every placement asserts the browser viewport height, including Vitest.
The isolated Docs height remains 700px. No production Graph styling is changed.

Current Design Core source acceptance uses a clean consumer-validated archive
from committed source `67eb392b` (excluding its ongoing dependency-refresh
working copy), SHA-256 `4db7d4f621d66f5d40110ddb87d423f34063a0731a811618aa6abdae7abe7658`.
This temporary qualification graph is recorded separately from registry-only
installation; tracked manifests and locks do not reference the archive.

No PNG baselines changed. Stories retain visual-pending; real-provider,
platform-native application and registry-only delivery gates remain separate.
