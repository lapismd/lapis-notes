# Retain App Shell controls in public plugin Settings

Desktop M8.3's first full cold native run passed 104 cases and exposed two
failures before the final two HTTP cases could run. The F-Mode test failed to
find its control before any persistence action. Registering Workspace's public
plugin Settings replaced the default Core page with a page listing only Lapis
static entries, omitting App Shell entries. An exact cold native rerun confirmed
that failure. History's separate driver-element issue remains consumer-owned.

The Core page and its search entries now read the existing public managed-plugin
registry, using source-qualified identities to route toggles to their actual
owner. Lapis version, Options, restart and diagnostic details remain available.
No App Shell persistence writer, copied control or consumer replacement is added.

## Focused source evidence

`pnpm exec vitest run --project storybook stories/workspace/PluginManagement.stories.ts
-t 'Core Toggles Options Restart And Diagnostics'` changes from one missing
F-Mode switch failure to one pass. The real story enables/disables F-Mode,
asserts the App Shell owner state, and retains Source Editor options, restart,
diagnostics and disable assertions. Both logs are under
`/tmp/lapis-m83-core-settings-story-{before,after}.log`.

## Complete source lanes so far

- `pnpm check`: 18/18 tasks pass, zero errors or warnings.
- `TURBO_CONCURRENCY=1 pnpm test --task-args --maxWorkers=1`:
  1,710 unique passes (1,836 executions including 98/28 build prerequisites),
  one existing integration skip; all 32 Workspace and 1,134 API cases pass.
- `TURBO_CONCURRENCY=1 pnpm build`: 10/10 tasks pass.
- `pnpm spec:check`: complete configured lanes and 38 validator cases pass.
  Initial spec-first reported two missing mapped architecture/package chapters.
  A subsequent 404-line package page failed its unchanged 400-line cap; moved
  the guidance to the matching host/plugin-integration chapter.
- Initial formatter calls could not infer a Svelte parser, then could not find
  a root Svelte plugin. Used the existing desktop formatter's public Svelte
  plugin for this source file; no dependency or configuration changed.

- `pnpm test:storybook:run`: all 259 interaction/axe cases in cold shards
  93/71/40/55 pass.
- `pnpm build-storybook:run`: static catalog and all 172 specification chapters
  pass. `pnpm test:specification:static:run`: six navigation/accessibility cases
  pass, with two existing development-only skips.
- `CI=1 LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-m83-managed-local pnpm exec
playwright test -c packages/web/playwright.config.ts`: all 13 cold cases pass.
  Fresh image: `sha256:43e5f94094bf6abec7eb79aaf3858b68c424cbd6690623e0c0fb87fe00bda0f1`;
  build source snapshot: `24ba968f131301df41a7fdca868626a7f1c228eb`.
- Docker returned to its original stopped state and 3072 MiB. The desktop journal
  `.local/m83/docker-memory-managed.json` records restoration.

Source qualification passes. Native archive acceptance remains a distinct
consumer gate in Desktop M8.3. Deno source, publication and visual baselines
remain unchanged.
