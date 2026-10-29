# Shared desktop recovery presentation

Targeted migration qualification for LN-PKG-175. Full repository, Storybook and
consumer lanes remain deferred until M7 implementation is complete, as requested
for this delivery session. This does not complete M4's aggregate gate.

Workspace exposes `DesktopRecoveryBanner`, extracting the frozen Deno host's
existing Safe Mode content and actions into the shared presentation owner.
Host callbacks own restrictions, rebuilds and restart. Public Design Core Button
controls and native CSS remain the presentation boundary; the banner sits below
the top tab strips. The frozen Deno host remains unchanged.

## Focused evidence

- `pnpm --filter @lapis-notes/workspace exec vitest run
src/lib/desktop/desktop-recovery.test.ts`: one before failure, missing public
  banner export.
- `pnpm --filter @lapis-notes/workspace exec vitest run
src/lib/desktop/desktop-recovery.test.ts src/lib/desktop-presentation.test.ts`:
  six cases pass across two files, including retained actions, callbacks,
  descriptions, drag exclusion and existing chooser presentation.
- The first after attempt used a nonexistent Design Core `/button` subpath: two
  suite startup failures and one check diagnostic. The source import now uses
  the existing public `/shadcn/button` boundary. No alias or dependency shim was
  added. The exact package command above then passes.
- `pnpm exec vitest run --project storybook
stories/workspace/DesktopRecoveryBanner.stories.ts`: one initial accessibility
  failure, `aria-allowed-role`, for the frozen markup's `aside role=status`.
  Correcting the shared status container to a `div` preserves its live semantics
  and fixes the issue. The exact fresh command passes one interaction/axe case.
  No rule, assertion or threshold was changed.
- `pnpm --filter @lapis-notes/workspace check`: zero Svelte/type errors or
  warnings after the public import correction; native-CSS audit passes.
- `pnpm --filter @lapis-notes/workspace build`: normal svelte-package and
  publint pass, including after the semantic correction.
- `pnpm check:app-ownership`: passes.
- `pnpm spec:first`: four protected paths, five mapped canonical chapters pass.
- `pnpm spec:validate`: ten validators, 172 chapters and 1,458 requirements pass.

The first source-formatting attempts lacked a configured Svelte parser and then
could not resolve the optional formatter plugin. Formatting succeeds using the
existing Desktop `prettier-plugin-svelte` installation passed explicitly on the
command line; no tracked tooling or dependency files change.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. The story remains
`visual-pending`; no screenshot comparison or baseline capture/update is claimed.
Its future independent baseline path is documented in the story description.

## Consumer and deferred lanes

Tauri targeted startup recovery qualification is recorded separately in Desktop
E-RECOVERY-001, including the source snapshot and verified archive checksum.
Two exact cold native recovery cases and eight related startup/lifecycle cases
now pass, including unchanged configuration/layout bytes and session restrictions
across guarded reload. The embedded driver returns a fresh element ID on every
lookup, so tests observe actual DOM replacement instead. No assertion, deadline
or product behavior changed to accommodate that fixture race. Diagnostic
clipboard qualification joins M7. Source presentation evidence remains separate
from these real WebView results.

Run the session-deferred Notes full check/test/build, full affected
Storybook/accessibility and web-host lanes, and Desktop aggregate cold/native
qualification after M7 implementation. Deno is frozen and has no new packaged
qualification requirement. Publication and signing remain deferred.
