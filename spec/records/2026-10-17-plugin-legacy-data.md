# Legacy plugin-data adoption

Owner: Notes API. Requirement: LN-PLUG-112. Native Terminal intake exposed that
static registration deleted `.lapis/terminal.json` before `loadData()` could
adopt it. The same generic defect affects every core compatibility data file.

Registration now leaves an unadopted file intact. Only an explicit canonical
removal event authorizes mirror deletion. Canonical updates still refresh the
mirror, with existing App-owned writer admission and recovery unchanged.

Initial test setup omitted matchMedia: 2 failures. After correcting the fixture,
`pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/plugin-legacy-data.test.ts`
produced 1 meaningful failure / 1 pass: registration lost data; explicit
removal already passed. The exact target passes after the fix; expanded ordinary/conditional fixtures
pass 4/4. A first overlapping broad run timed out 3 existing API cases (1,120
passed); the unchanged exact files then pass 14/14 serially. No timeout or
assertion was relaxed. Cancelled overlapping check/catalog prerequisites and a
hung global pnpm 12.6.0 launcher are not qualification. All final commands use
the repository's pinned pnpm 10.34.5 executable on PATH.

## Final source verification

| Command                                                    | Result                                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `TURBO_CONCURRENCY=1 pnpm test --task-args --maxWorkers=1` | 18 tasks pass; 1,716 unique package tests pass, one existing Deno unit skip; 1,842 executions include repeated 98/28-test build prerequisites. |
| `TURBO_CONCURRENCY=1 pnpm check`                           | 18 tasks pass, including strict package types/Svelte and source audits.                                                                        |
| `TURBO_CONCURRENCY=1 pnpm build`                           | 10 tasks pass through public package outputs and publishability checks.                                                                        |
| `TURBO_CONCURRENCY=1 pnpm test:storybook --force`          | 258 interaction/axe cases pass across four fresh shards: 92/71/40/55; zero cached tasks.                                                       |
| `pnpm spec:check`                                          | Specification/book/mapping checks, App ownership, metadata queries and 38 validator tests pass.                                                |

Initial specification mapping lacked the architecture confirmation; adding the
unchanged App-ownership contract confirmation resolves it. The browser AI
Catalog scenes print RangeError diagnostics while their assertions/axe pass;
this change makes no AI qualification claim. Visual baselines remain pending.

This is a generic API registration repair. Its public package will be refreshed
in the Tauri consumer; cold consumer results remain in Desktop's independent
E-TERMINAL-001 record. Existing web/server transport and host source are unchanged.
The new requirement's source gate is complete; no desktop milestone is claimed.

Versions: Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, Playwright 1.61.1, macOS ARM64.
Logs: `/tmp/lapis-m81-api-*`.

No Deno host source change, publication, signing or baseline update is included.
This repair does not complete the desktop Terminal gate by itself.
