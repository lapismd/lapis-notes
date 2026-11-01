# Dependency-update CI investigation

The initial open cohort was Mira PR #72 (`406243900ed937fd1ab4e01c9a29c7f76a9b3044`),
AI Host PR #73 (`a56a9e4d2fc8474bf84ba4795b5247156074f4ce`), and Visual Delta PR #74
(`c761ed8822a8e8e29d10c4fe6e2d452bc29cbe55`). Their aggregate failures did not all
identify the initiating failure because each failing job cancelled its own run.

## Original failures

- Mira run `41340392020`, attempt 2: Storybook discovered `tailwind-merge` late,
  reloaded Vite, and could not import `LapisEditorDemo.stories.ts`; 83 other
  interaction cases passed before the shard stopped.
- AI Host run `41340421592`: Cloudflare artifact acceptance timed out waiting
  30 seconds for the main frame to navigate after the final **Install Now**
  action in `scripts/smoke-cloudflare-web.mjs:198`. The self-cancellation step
  stopped the remaining jobs; the aggregate subsequently failed on cancellations.
- Visual Delta run `41340449128`: Storybook lost its browser connection while
  starting `History.stories.ts`, with `rpc is closed, cannot call createTesters`.
  This is a browser-runner failure, not evidence of an addon API incompatibility.

## Shared source repairs

Storybook already prebundled API's `tailwind-merge` 2.6.1 and the Design Core/Mira
3.7.0 instance. Source-aliased Notes UI resolves 3.6.0 in the frozen Mira candidate.
The missing UI-owned optimizer entry caused a new bare helper discovery during
browser execution. Both the normal Storybook configuration and Vitest consume
the corrected shared include list. No dependency source, shim, alias or baseline
was changed.

At the user's request, reusable CI no longer calls the run-cancellation API after
any required job fails. Active validation runs are also retained instead of
being cancelled by newer queued runs, and the unused Actions write permission is
removed. Jobs retain their actual results; the `always()` aggregate still rejects
failed, skipped and cancelled required jobs. The normal workflow checker rejects
reintroduced cancellation endpoints.

## Source validation on the frozen Mira candidate

- `pnpm install --frozen-lockfile`: passed with registry dependencies.
- `pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts`:
  19 failures with a late helper reload before the fix; 19 passes after a fresh
  config-triggered optimizer startup.
- `node --test --test-name-pattern='required CI jobs remain retryable|rejects workflow self-cancellation' scripts/check-release-workflow.spec.mjs`:
  2 failures before the workflow/policy change; 2 passes afterward.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native TURBO_CONCURRENCY=2 pnpm test:storybook`:
  275 interaction/accessibility passes across the complete four-shard lane.
- `LAPIS_NOTES_VALIDATION_RUNTIME=native TURBO_CONCURRENCY=2 pnpm check`:
  all 16 tasks passed, including specification, application ownership, metadata,
  package types and Svelte checks.
- Complete `pnpm test` with the above native/Turbo settings and CI's Node 24.15.0:
  2,080 tests passed across nine package suites; all 16 Turbo tasks passed.
- Full root `pnpm build` passed all 9 tasks; `pnpm release:check` also passed.
- `pnpm release:test` with CI's Node 24.15.0 and the same native/Turbo settings:
  101 release-tooling tests passed on this candidate's older baseline.
- `pnpm spec:check` passed its six validator lanes, mdBook, spec-first, ownership
  and metadata audits, and 67 specification regressions. Doctor passed; QMD
  semantic discovery worked. The installed spec-validator 0.2.0 was already the
  latest Deno-free release.
- A fresh `build:web`, Cloudflare artifact preparation and
  `web:cloudflare:acceptance` passed on the Mira candidate, including refusal,
  retry, unsaved edit persistence, offline reopening and service-worker update.

The first broad unit attempt used local Node 26 and exposed two unchanged legacy
Intl date fixtures with a narrow-space difference. Both exact fixtures passed
under CI's Node 24.15.0, followed by the complete passing unit lane. Fixture bytes
and assertions were preserved. Validation artifacts and local tool installations
remain outside tracked manifests and registry lockfiles.

Source correctness, final main integration, and each dependency PR's hosted CI
results remain separate receipts; successful local browser runs do not prove
that an intermittent connection failure can never recur.

## Exact AI Host candidate

A separate checkout of PR #73's exact head completed a frozen registry install,
`build:web`, `web:cloudflare:prepare`, and `web:cloudflare:acceptance` under CI's
Node 24.15.0. The full dirty-update/refusal/retry/offline scenario passed without
changing a persistence assertion, timeout or production PWA implementation. The
original timeout remains retained above; this successful fresh run does not
establish a permanent fix for an intermittent event timeout.
