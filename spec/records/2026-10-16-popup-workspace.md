# Session popup workspace

Source support for Desktop M7.2 retains one App, controller and layout writer.
The normalizer preserves popouts only for live projection. Cold restoration
continues dropping session-only windows. Compatibility wrappers bind the
controller's existing handles without opening another host. Retained editors
change their CodeMirror document root when their DOM moves.

`WorkspaceShell` forwards the optional public popup host. The shared renderer
admits tab and window removal through the App's editing-session registry after
focused-control blur and layout persistence. Rejected saving keeps content
reachable. The generic Design Core surface owns native-control clearance,
context propagation, popup-local keys/overlays and live appearance mirroring.

Targeted before/after:

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'preserves live popup'`:
  one failure before; one pass after.
- The four-file workspace/normalizer/persistence/close-guard lane passes all
  155 cases. Two existing synchronous-close scenarios were updated to await
  admitted removal and assert both the pre-removal and final persisted layout.
- `WORKSPACE_STORYBOOK_PORT=7340 pnpm exec playwright test -c playwright.workspace.config.ts tests/workspace/popout-session.spec.ts --retries=0`:
  five passes on the cold installed Design Core archive. A real source note
  retains its editor, draft and undo/redo across transfer and return. The
  failed-save case rejects a real vault write and retains the unsaved draft.
  Multiple windows retain local palettes and live themes. Top and stacked
  headers clear an 80px native-control inset at widths 900, 420 and 720.
- Initial browser acceptance failed because the new fixture used an invalid
  sidedock method; the fixture now uses the existing public `collapse()`.
  Intermediate specification audit ran during dependency installation and
  encountered a disappearing package file; the final audit runs after install.

Full source qualification passes 1,416 unit cases across the API, workspace,
UI, Explorer, language service, host services, app profile, server and web
packages. The frozen Deno desktop is excluded. Public check/build passes all
18 tasks. Storybook interaction/accessibility passes 258 cases across 58 files
in four shards (92/71/40/55).

The actual popup menu exposed a portal ownership regression in Design Core;
its source fix is consumed through the final `m72-menu` archive. Five popup
browser cases and a live stylesheet update case pass on that archive. A new
focus-restoration assertion failed once before synchronizing API command-host
ownership after live projection, then passed with the complete popup lane.

Broader pointer qualification found stale Bases and link-preview story routes.
The Bases exact rerun passes. The Markdown drag case failed once by measuring
the editor while the story was switching modes; it now waits for complete play
and its exact persisted-order rerun passes. The Outgoing Links assertion counted
the note's authored map image as forbidden wrapper chrome; acceptance now checks
the outer wrapper separately and requires the nested image to remain visible.
An intermediate concurrent run produced blank startup frames and was stopped;
the catalog was stopped, its generated caches cleared and restarted cold for
serial qualification. No timeout or behavior assertion was relaxed.

Final `WORKSPACE_STORYBOOK_PORT=7340 pnpm exec playwright test -c
playwright.workspace.config.ts --workers=1 --retries=0` passes all 10 cases,
including real drag persistence, diagnostic handoff, both link previews and all
five popup cases. The plain Python static server could not load dynamic runtime
chunks; that stopped attempt is not claimed as acceptance.

The final refreshed-cohort `pnpm test:storybook --force` passes all 258 cases in
58 files (92/71/40/55). `pnpm build-storybook` builds and renders all 172 spec
chapters. `pnpm packages:check` passes public package policy, two boundary cases,
nine local-consumer cases and 101 release-tooling cases. Canonical specification,
App ownership and metadata-query audits pass. Desktop's full cold run passes
startup, 27 foundation cases and all 64 profile cases with these packages; its
resource harness startup receipt correction is recorded separately by Desktop.

Native Tauri admission remains M7.3. Deno desktop stays frozen. Tracked
manifests/locks retain registry ranges; development uses verified archives
without publication. No screenshot baseline is updated; visual review remains
pending.
