# Plugin file icons: implementation and qualification

Implementation: enclosing Jujutsu change `xsyyluml`, based on saved plan
`f6b99dce`. Design Core source is committed at `99fa0952`; Bases adoption,
candidate-audit tooling and the requested CSV Docs repair at `67c763aa`.
Desktop consumer commit `102c5c1e` retains `E-ICONS-001` in its isolated
file-icons workspace.
Default checkouts and unrelated concurrent changes are preserved.

## Public behavior

Editor-view and admitted manifest/catalog contributions accept optional
`fileIcon` metadata. Workspace selects it through the existing association,
priority and specificity rules without reading content, constructing a view or
activating a plugin. Missing, failed and unknown artwork retains the filename
icon. The existing two-argument extension helper remains compatible; the third
options argument supports independent icon contributions sharing one view type.

`App.icons` owns SVG and synchronous/asynchronous icon-pack resources.
`Plugin.registerIcon` returns an owned ID and `Plugin.registerIconPack` an owned
prefix, both disposed through plugin lifetime. Legacy custom SVG registrations,
qualified names, Lucide spellings, aliases and packs remain explicit fallback
inputs. Apps isolate owned resources; stale disposers and late asynchronous
results cannot replace current artwork. SVG validation rejects executable and
external content while retaining supported vector geometry and local definitions.

The API supplies Design Core's instance-scoped resolver directly to Explorer.
Artwork/metadata invalidation preserves row state and rename presentation.
Design Core owns actual SVG rendering, definition-ID isolation and decorative
accessibility. The API adds no consumer renderer or global App assignment.
Canonical requirements are LN-PLUG-122–124 and LN-EXP-014.

## Exact regressions and affected source

- Initial icon registry regressions: five failures before, five passes after.
- Initial routing regressions: three failures before, three passes after.
- Final edge regressions: two failures before, two passes after. Legacy bare
  `plugin-*` names and ordinary `plugin-*` packs remain supported outside the
  reserved qualified owner namespace. Synchronous loader throws are cached
  across different icon names until re-registration, like rejected promises.
- Final affected API target: all 190 cases in six files pass, including
  registration, ownership/disposal, overlay, extension, routing and legacy icon
  behavior. Strict API Svelte/type checks pass with zero errors/warnings.
- Explorer's first family attempt has six passes and one new custom-artwork
  failure. The exact new story subsequently passes cold. The final complete
  Explorer family passes all seven cases (`fa2ae451`), including custom SVG
  enable/disable/re-enable, file opening, rename and accessible row names.

Exact API commands use `pnpm --filter @lapis-notes/api exec vitest run` with
`src/lib/__tests__/{plugin,lapis-extension,editor-view-registry,icons,icon-registry,workspace}.test.ts`.
The two final edge cases are selected by
`-t 'legacy plugin-prefixed|caches synchronous pack failures'`. Browser targets
use `pnpm test:storybook -- stories/plugins/explorer/panels/Explorer.stories.ts`.

## Complete source gates

Final root commands and results:

| Command                                         | Result                                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm check`                                    | 20 tasks pass; strict types and App/style boundaries pass                                          |
| `pnpm test`                                     | 20 tasks pass; 2,362 package cases, including 1,671 API and 39 Explorer cases; 561 Rust cases pass |
| `pnpm build`                                    | All 11 tasks pass through public package and host exports                                          |
| `pnpm test:storybook`                           | All 262 interaction/accessibility cases pass across 59 families and four fresh shards              |
| `pnpm build-storybook`                          | Complete static catalog passes                                                                     |
| `pnpm spec:check`                               | Ten specification lanes, 78 governance and six Rust-boundary cases pass                            |
| `pnpm spec:first`                               | 31 protected files map to 16 owning chapters                                                       |
| `pnpm progress:generate`, `pnpm check:progress` | All 101 existing Rust task rows retain their statuses                                              |

Seven existing Rust opt-in asset/provider ignores and one existing frozen-Deno
platform skip retain their original gates. No native release, provider or OS
acceptance is inferred from those source tests. Source runtime defaults remain
unchanged. No visual comparison or baseline update is performed.

Final root run IDs are `45452675` (check), `222fda2f` (test), `6f793d90`
(build), `8d9fac7d` (complete catalog), `11b93236` (static catalog) and
`d1bffafc` (specification). Logs and exact source/archive manifests remain in
ignored `.local/file-icons-*.log` and `.local/validation/runs/` directories.

## Public package and actual host acceptance

The final public artifacts are built and packed at snapshot
`db95a879b866b7a033c7f908d76d0536a2b88ab1`; later edits are documentation and
evidence. The ignored `file-icons-final-public-archives` cohort pins:

- API: `cfff557ff2ccbb7e2751777f62ef467bd445eee7bb6180dd05525389b566b712`.
- Explorer: `47d10e8f1f8c88b24ecd07cc6a5ece123d35c274d8c64fe3004cf3980ab05da3`.
- UI: `53967f60dc94d37ff8f8a336c71715132cc347a3782eecb4d0e93da76089f59c`.
- Workspace: `a215920c24354bc0d33c1036fa6af63b9a56ad709e62b8bca01ca84c25cd308e`.
- Language Service: `ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65`.

Design Core's prepared archive is
`ad82a73a5323b70ac814a69f7db4ee10f032a1b1146eef11d38f341dad1543fb`.
Its source qualification records 922 units, 987 interaction/accessibility cases,
workspace/shell/AI/Shadcn browser lanes, strict types, static and package checks.
Bases npm archive is
`a7ab0601c7feacca7341eea612b417f481ff40c276e400a3307f7c603fc40930`.
Its owning record retains 164 units, 19 browser cases, 48 package tasks,
deterministic runtime reproduction and test-only signature verification.

Built standalone Web acceptance passes all 12 existing cases using explicit
`LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm test:web:e2e`. This includes real
registry installation, OPFS edit/reload and multi-tab database ownership.

A separate cold Web case installs the actual new test-signed Bases bundle from
a one-entry, publicly schema-validated local registry. It first observes the
filename fallback, then the actual registered SVG after verified installation,
opens the file in Bases and restores both the file view and artwork after
reload. The candidate uses its qualified runtime snapshot `ea51f96f` and signed
bundle SHA-256 `0f9271f4b39ef43c750b70aef0307b8f1b9839b31fed9916474ef175f18a5dcc`.
No production key or public registry is changed. Temporary signing secrets are
removed or confined to the short-lived test process.

Desktop uses the same final API/Explorer/Bases artifacts and passes the exact
artwork/opening case in four presentations, strict types, renderer/static build
and all 2,060 catalog cases. Its own E-ICONS-001 records the 28-archive cohort,
separate consumer revisions, attempts and unchanged native milestone gates.

## Failed attempts and repairs

- An early parallel API request was rejected by the active workspace lease
  before tests. Subsequent exact, full and consumer runs are serialized per
  workspace; independent Desktop shards use separate owned workspaces.
- Initial patched-Zod intake exposed Node server schema identity/deep type
  errors. API and server-node now depend on patched `^4.6.6` and use `zod/v3`,
  preserving existing schemas; the exact server dependency build passes seven
  tasks. No advisory ignore or compatibility type shim is added.
- Appending duplicate audit prose exceeded two canonical-page limits (405 and
  404 lines). Integrating the boundary notes into their owning prose restores
  both size gates without suppressing validation.
- Two cold catalog attempts fail importing the editor-demo family. A native
  diagnostic run discovers late `zod/v3` optimization and a browser reload,
  producing 18 failed cases. Adding that actual public entry to the shared
  optimizer makes the exact 18 cases pass and both full 262-case runs pass.
- The first specification close reports six missing mapped chapters. Owning
  App/database/demo/Markdown/view/Problems boundary notes are added; the map
  and ten specification lanes subsequently pass without changing the gate.
- The first Web attempt builds remotely and then starts a host preview without
  host `dist`, timing out before any test. Explicit native host build selection
  gives all 12 passes. The new installed-candidate probe initially reloads before
  layout persistence; waiting for the real saved layout gives the complete
  install/artwork/open/reload pass without changing application code.

## Accepted existing findings and remaining release gates

The supplementary macOS API run passes 1,667 cases and fails two frozen daily
reference cases due to ICU 78.3 space formatting. Both exact cases fail the same
way on the untouched pre-feature checkout. The user explicitly accepts these
as a separate existing issue on 2026-10-26; required Docker API tests all pass.

The user separately accepts the Plugins prerequisite advisories, unchanged CSV
metadata/style findings and two release-tooling findings recorded by source
commit `67c763aa`. Seven CSV documentation findings are fixed at the user's
request, with five cold cases and rendered public Docs verified. These findings
remain separate from icon qualification and do not authorize publication.

Release order remains Design Core, API, then Explorer and dependent plugins,
with consumer minimum ranges raised to the first containing releases. Normal
publishable dependency metadata remains unchanged except the patched Zod npm
ranges. The current migration uses explicit verified archives and defers release
approval, installed-app replacement and unrelated native/provider work.
