# Web AI and Terminal retirement

M8.2 source qualification is complete; native desktop consumer acceptance is recorded separately in its owning repository.

The Notes API owns generic App-constructor restrictions used consistently by
registry compatibility, installation/update and external manifest loading. The
Web host selects `ai` and `terminal` as desktop-only even for older manifests.
Rejection happens before manifest indexing and evaluation. Installed records,
preferences, plugin data and unknown saved views remain; startup removes only
`web.agentRuntime.token` and `web.terminalHost.token`. The Web graph no longer
contains service clients/bridges, URL/token sections or service environment
prefixes. A development-only controller metadata fixture moves to `scripts/lib`
without changing default Fake catalog behavior. Frozen Deno desktop is unchanged.

## Regression and verification

- API `plugin-manager.test.ts -t "host restriction rejects"`: two meaningful
  failures (older manifests reach evaluation) to two passes. The initial test
  scaffold also found its diagnostic field was named `lastFailureMessage`.
- API manager/distribution affected lane: 87 passes. Discovery retains older
  entries but compatible filtering and installation apply desktop-only reasons.
- Web `desktop-plugin-policy.test.ts`: one meaningful startup failure and two
  passes to three passes. Its initial source-read fixture needed a filesystem
  path rather than the browser-transformed `import.meta.url`.
- New real PluginBrowser/signed-snapshot scenario: passes with a disabled
  installation button and desktop-only title. Initial attempts asserted visible
  text instead of the existing button title and read before catalog readiness.
- First full check: 17/18 tasks pass; Web reports one stale public App declaration
  for the new option. Fixed in API `context.svelte.d.ts`; a public pack-type
  contract now protects admission and omission from renderer-safe App properties.
- The E2E fixture follows the existing structural serialized-browser ports;
  importing the entire UI declaration graph instead exposed twelve dependency
  declaration diagnostics. No production type override or checker flag changed.
- Development fixture smoke: five passes. Specification/audits: six lanes and
  38 validator regressions pass after placing the story in the governed
  `Workspace/Plugins` family.

Full source check, unit, build, catalog and cold production Web lanes pass.
Visual capture/review remains pending under
`workspace/plugins/desktop-only-ai`; no baseline changed.

The initial complete unit run passed every package except one Web startup
source assertion for the explicitly retired agent Settings integration (37 Web
passes, one failure). The assertion now requires host restrictions and forbids
the old runtime refresh; its exact regression passes.

Docker was stopped with MemoryMiB=3072. Its explicitly approved temporary
8192 MiB limit is journaled in the desktop ignored M8.2 evidence directory;
Docker was restored to stopped with MemoryMiB=3072 after the server tests; the journal records restoration.

## Completed source lanes

- Final `TURBO_CONCURRENCY=1 pnpm check`: 18/18 tasks pass.
- Final `TURBO_CONCURRENCY=1 pnpm test --task-args --maxWorkers=1`: 1,702
  unique unit cases pass, one existing Deno integration skip. The 1,828
  executions include repeated 98/28-test build prerequisites.
- `TURBO_CONCURRENCY=1 pnpm build`: 10/10 tasks pass.
- Cold forced `pnpm test:storybook --force`: 259 interaction/axe cases pass
  across shards 92/66/46/55. Non-failing existing AI diagnostics remain distinct.
- The new story also passes after adopting the existing 700px isolated Docs
  framing. `pnpm build-storybook` passes and renders all 172 specification
  chapters. No visual baseline changed.
- Exact cold production browser: one pass using the root locked Playwright
  1.61.1 CLI. Existing package-local CLI shim incorrectly targets 1.62.1;
  the initial wrong-runner invocation ran no product tests. No dependency
  files or installed archives were changed to select the correct runner.
- `CI=1 pnpm exec playwright test -c packages/web/playwright.config.ts
packages/web/e2e/desktop-features.spec.ts` verifies no activation, unchanged
  installation bytes/choices/data/layout, absent connection sections, no
  retired sockets and removal of only dedicated tokens.

Fresh server-image acceptance passes its exact case and all 13 cold Web cases pass with the qualified public-archive cohort. Consumer archive refresh and native qualification are tracked in the desktop repository.

## Docs registration and server dependency cohort

The first static index exposed a duplicate-CSF title: the new separate file
claimed the existing `Workspace/Plugins` Docs route. An exact index assertion
failed once. The scenario now lives in a small support module exported by the
existing `Plugins.stories.ts` owner. All 32 Plugins/snapshot cases pass after the
move; a transient quoted-example syntax error was repaired before that pass.
The fresh static build and exact Docs-owner assertion pass; all 172 chapters
remain present.

The initial complete browser run passed 12 cases and failed server startup:
registry Design Core 0.4.0 lacks the already implemented `renderer.setCloseGuard`
contract required by the Notes migration candidate. The trace identifies that
exact missing method. No application fallback or dependency patch was added.

The ignored validation-only Dockerfile under `.local/m82` consumes the same
verified public Design Core archive as the native desktop cohort. Its source
receipt is `a65dcf6d5b40199aadbaa22f4934215202f07f55`, SHA-256
`0d31cc17e3be99bff4eea941de0ab828aabc5f94a12dddcf5a24ec6d3629a4fd`.
The archive bytes are checked before package-manager resolution; peers retain
normal semver ranges. Tracked manifests, lockfile routes and production Dockerfile
remain portable. The throwaway image install resolves the local public archive.

Registry-only image: `sha256:d7adbafe6db12b961d72757d712b1b306941ca16da2fa2ce053ef2f735ffa7ad`.
Qualified-cohort image build: `sha256:f49afdcc60d723a87118e074159a46ddd6297e8a6ef32dbb0a1660ee0be4c46e`.
Command: `docker build --progress=plain -f .local/m82/Dockerfile -t lapis-server:desktop-m82-local .`.
This is an explicit temporary validation prerequisite under the user's local
archive preference; registry publication remains at the later release gate.

## Final acceptance

- Exact qualified server acceptance: one pass, zero failures.
- Complete cold Web suite with `CI=1 LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-m82-local pnpm exec playwright test -c packages/web/playwright.config.ts`: 13 passes, zero failures.
- Rendered Plugins Docs retain the original owner, public Show Code and the isolated 700px iframe. All 32 affected Plugins/snapshot interactions and accessibility cases pass; the final static catalog contains all 172 chapters.
- Docker was stopped successfully and its latest settings were restored by changing only MemoryMiB from 8192 to 3072. The original stopped state and value are restored.
