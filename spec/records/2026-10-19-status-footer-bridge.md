# Status footer bridge

LN-WS-054 now preserves left/center/right placement through API registration,
manifest validation and the API-owned controller. LN-WS-075 no-op layout-write
semantics remain unchanged; mounts, menus, conditions and owner teardown retain
existing ownership. Design Core owns geometry/overflow/Settings/notifications.

- Regression before: centre contribution missing, one exact workspace test fails.
- Three focused API files: 143 tests pass; manifest index now has six tests,
  including invalid-placement rejection.
- API check: zero Svelte errors/warnings, TypeScript passes.
- Public package build/publint passes. New packed-contract assertion reproduced
  one stale declaration error; regenerated status-bar declaration through
  svelte-package and public centre assignment passes.
- Initial full API run: 1161 pass, one build-helper timeout under memory load.
  Exact rerun and bounded full rerun pass: all 1162 API tests.
- Initial spec check caught missing mapped architectural/package/plugin chapters;
  those chapters now describe the footer boundary explicitly.

Temporary validation uses Design Core's built public 0.5.1 footer archive via the
existing ignored pnpm hook. Tracked dependency files retain portable ranges.
No package publication or baseline changes. Final wider results and consumer
handoff will be appended; enclosing Jujutsu change owns this record.

## Wider qualification

- `TURBO_CONCURRENCY=1 pnpm check`: 18 package tasks pass, including source
  App ownership and portable peer/build checks.
- `TURBO_CONCURRENCY=1 node scripts/run-turbo.mjs test --task-args --maxWorkers=2`:
  18 tasks pass; package tests total 1738 passing cases and one existing skip.
  Earlier malformed forwarding was rejected by Turbo without running tests;
  a duplicate prerequisite build was cancelled, then this serial lane completed.
- `TURBO_CONCURRENCY=1 pnpm build`: ten package tasks pass, including Deno desktop
  and Web bundles through the new public Design Core package. Existing PWA,
  chunk-size and source-comment advisories remain.
- Initial Storybook shard: 92 pass, one stale structural-marker assertion fails.
  Design Core now composes PanelToggle through its standard Button host; the
  unchanged public `data-ui-part` and `data-workspace-sidebar-toggle` markers
  replace the obsolete root component marker. Exact Responsive Directory then
  passes, retaining real filter open/close, state and focus assertions. This was
  the first of four shards, not the complete catalog.

## Browser regression qualification

- Whole catalog after the structural-marker fix: 253 pass / eight fail across
  261 cases. One stale Notification Center assertion expected progress on the
  bell; seven AI stories expected tool labels without their target/context.
- Exact Notification Center passes after asserting centre activity, the
  permanent right bell, shared panel opening/closing, activity removal on
  completion and retained history through the bell.
- All seven exact AI stories pass after matching the anchored tool name while
  allowing its context suffix. Expanded details, output and tool counts remain
  asserted. No product behavior or tool identity is weakened.
- `vitest.config.ts` now configures serialization on the browser pool itself;
  the outer setting alone did not bound browser-file concurrency. LN-CAT-070
  keeps the same four sequential shards and 120-second ceiling.
- `pnpm test:storybook`: all four shards pass, 59 files / 261 cases (93, 71,
  42 and 55). All five Turbo tasks succeed; the browser lane runs fresh.
  `/tmp/footer-notes-stories-final.log`.
- The first final spec run correctly required the
  mapped AI chapter for the story-only adaptation; that unchanged-contract
  confirmation is included with the story evidence.
- `pnpm spec:check`: all six configured lanes pass, followed by App ownership,
  metadata-query ownership and 38 specification regression tests. The configured
  view-command and catalog-structure lanes pass three and 21 tests respectively.
  `/tmp/footer-notes-spec-final2.log`.

LN-AI-027 now records the verified retained plugin's ordinary composer spacing;
the shell owns footer reservation. The source plugin's footer-spacing and
package-verification records retain its 376 tests, six placement stories and
reproducible payload evidence. No plugin presentation is copied into Notes.

No runtime/API defect was hidden by a consumer style or alias. The public centre
contract, existing no-op layout writes, mounts and teardown retain their source
checks. Final consumer receipts follow the enclosing source commit.

## Static artifact and restart recovery

`pnpm build-storybook` completed successfully before the machine restart.
The retained Turbo task log records the completed Vite build and the index
check confirming all 172 specification chapters; its successful cache receipt
is `32eafc965da57a5f`. The new index check passes again after restart. Copies of
both the completed catalog and static-build logs live under ignored
`.local/verification/footer/`, so they survive temporary-directory cleanup.
Existing large-chunk advisories remain; no baseline mutation or publication.
All source, package, host, catalog and static gates for this API slice pass.
The final checksummed consumer handoff follows the source commit.
