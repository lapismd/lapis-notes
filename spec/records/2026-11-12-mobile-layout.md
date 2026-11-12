# Mobile layout source and web qualification

LN-WS-009, LN-WS-105 and LN-WS-106 are implemented in isolated workspace
`mobile-layout` (change `myloqqmp`, parent `1d9f1d18`). Source qualification
uses explicit prepared public package bytes; registry adoption and deployment
remain separate. The default Notes workspace retains concurrent editing work.

## Source ownership and behavior

Design Core owns nullable-root ResizeObserver lifecycle, responsive rendering,
transient mobile navigation, shared Select/PanelToggle controls, reachable compact
Settings dismissal, command-palette presentation and scroll chrome. Its owner
receipt is `design-core/spec/records/2026-11-12-mobile-layout.md`.

Notes removes Web and frozen Deno host desktop overrides. Deterministic catalog
examples retain explicit modes, while Responsive Mode follows its owning App's
settings and actual shell width. WorkspaceShell binds disposable legacy mode and
navigation commands, dispatches Search through `search:open-search`, and creates
notes through serialized tracked FileManager operations. Existing files and
foreign command registrations are preserved. No ambient App access was added
to runtime implementation.

## Dependency projection

Prepared Core version 0.12.1, owner change `qnmqnokq`, SHA-256:
`a38ac37ced590599e00ea3b626aefeaae3b9ca5f85332aa340470c6d49046a54`.
Notes API is 0.2.8 and Workspace is 0.3.5. An ignored pnpm hook selects that
checksummed archive and the existing verified plugin archives. Tracked registry
manifests and pnpm lockfile are unchanged. Core's minor release must precede
normal registry adoption of its new public mobile contract; update the consumer
range after that release rather than publishing this temporary projection.

## Focused before and after evidence

- Design Core's initial five responsive cases had 1 pass and 4 failures; the
  complete source regression now passes all 9 cases, including both comments.
- `pnpm --filter @lapis-notes/workspace exec vitest run
src/lib/mobile-workspace.test.ts`: 4 pass. The complete Workspace package has
  44 passing tests in 10 files and no Svelte or TypeScript diagnostics.
- `WORKSPACE_STORYBOOK_PORT=7110 pnpm exec playwright test -c
playwright.workspace.config.ts tests/workspace/mobile-layout.spec.ts
--retries=0`: 2 pass against a fresh Storybook process and refreshed Core
  archive. Settings persist to `.lapis/app.json`; Always/Never switch without
  reload; Auto follows resizing; actual new-note, Search and palette work.
- `pnpm exec vitest run --project storybook
stories/workspace/WorkspaceShell.stories.ts -t '^Mobile$'`: 1 pass. The
  initial test incorrectly expected new-note creation to always add a tab.
  Tab creation/close assertions now exercise the real overview New Tab action,
  while note creation additionally proves its file and active view.
- Built Web `e2e/mobile-layout.spec.ts`: 1 pass. It proves the setting is stored
  before reload, survives reload, switches Always/Never, follows Auto in both
  directions and exposes a usable close action at compact widths.

## Complete source and consumer lanes

Local portable lanes deliberately used Node 24 and the supported explicit
`LAPIS_NOTES_VALIDATION_RUNTIME=native` selection. This is host qualification,
not Docker CI parity or native macOS application acceptance.

- `pnpm check`: 16 Turbo tasks pass; includes App-ownership, metadata-query,
  no-Tailwind, parity, specification validation and package/type checks.
- `pnpm test`: 2,214 tests pass in 242 files across all nine packages.
- `pnpm build`: all 9 package builds pass, including production Web and public
  Workspace output/publint.
- `pnpm test:storybook`: 276 interaction/accessibility cases pass in four cold
  sequential shards (102 + 70 + 47 + 57). Existing CI quarantine is unchanged.
- Complete workspace browser lane, `--workers=1 --retries=0`: 12 pass.
- Complete production Web browser lane: 13 pass, including actual installed
  plugins, PWA reload, OPFS and secondary-tab takeover.
- `pnpm build-storybook`: passes; all 194 specification chapters are present.
- `pnpm spec:check`: all six configured lanes, spec-first, App-ownership,
  metadata-query and 67 specification regression tests pass.
- Spec Validator 0.2.0 doctor: 10 pass, one existing script-alias warning. QMD
  `pnpm spec:search 'LN-WS-105'` succeeds under the matching Node 24 ABI.

## Retained failed attempts and repairs

Initial local Docker admission requested 8 CPUs from a 5-CPU daemon. Its bounded
retry then failed during node-gyp header extraction with `fchown EPERM` in the
capability-restricted worker. These remain Docker failures; no protections were
weakened and no automatic runtime fallback was added.

A concurrent Playwright webServer startup invoked the normal Storybook prepare
script while an explicit server was starting, causing a forced reinstall.
Task-owned processes were stopped; the archive was reinstalled with the registry
lock preserved. Acceptance waited for explicit `storybook:installed` readiness.
Transient missing-import/type errors from that race are superseded by the full
passing source checks and fresh browser runs.

The first full workspace browser run passed 11/12. Popup failure injection
still replaced `vault.modify`, although current text persistence uses
`modifyIfUnchanged`. LN-WS-099 acceptance now injects the same failure at that
public conditional-write contract. Its exact test and the complete 12-test lane
pass while retaining the original draft, rejection and popup-lifetime assertions.
A raw adapter-write experiment also failed to intercept conditional writes and
was discarded. No persistence behavior or assertion was loosened.

Early spec-first attempts identified missing mapped host/package chapters; all
owning chapters and verification were updated. An automatically changed frozen
Deno lockfile was restored and is not part of this slice.

## Remaining adoption

No npm publication, push, production deployment, native application replacement
or visual baseline update occurred. New and changed stories remain
`visual-pending`; their declared independent baseline paths are retained.

Desktop's existing manifest/lockfile work overlaps dependency intake, and its
configured archive cohort contains Workspace 0.2.1 rather than the current
contract. Its acceptance attempt fails during import because that archive lacks
`bindFileConflictReviews`, before any responsive assertion runs. Desktop
integration remains pending a separately approved compatible dependency intake;
no desktop/native qualification is claimed here.
