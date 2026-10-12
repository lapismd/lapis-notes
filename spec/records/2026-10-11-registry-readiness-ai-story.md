# AI story readiness repair

The exact cold command
`pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/ai/shell/Shell.stories.ts -t 'Local Conversations'`
reproduced one failure: the History options button still inherited
`pointer-events: none` after the model menu closed. The visible conversation
state had rendered before overlay teardown restored pointer interaction.

The Notes acceptance story now waits for that actual computed readiness before
clicking, matching the verified Plugins counterpart. It retains the real click,
archive, restore, delete, and new-chat assertions. There is no forced click,
fixed sleep, production CSS override, or weakened assertion.

## Validation

- The exact target passes: one failure before, one pass afterward, eight
  unselected stories. Both runs use fresh Vitest/Storybook processes.
- The complete interaction/accessibility lane passes all 212 stories across
  four fresh shards: 62, 58, 40, and 52. The previous complete lane had 211
  passes and one failure. Fatal-runtime guards remain enabled.
- Root check and unit lanes each pass all 18 tasks; root build passes all ten
  tasks. These product lanes reuse valid Turbo results because product source
  and package configuration did not change in this repair.
- Specification check passes all five configured lanes plus App-ownership and
  metadata-query audits. The static Storybook build passes and renders all 36
  specification chapters.

Evidence is in ignored `.local/registry-readiness-ai-before.log`,
`registry-readiness-ai-after.log`, `registry-readiness-notes-storybook.log`,
`registry-readiness-notes-check.log`, `registry-readiness-notes-unit.log`,
`registry-readiness-notes-build.log`, `registry-readiness-notes-spec.log`, and
`registry-readiness-notes-storybook-build.log`.

## Separate release gates

This verifies only the Notes AI story repair. The existing uncommitted static
registry integration remains its parent and is not newly release-qualified.
The stale bundled-Bases browser target still times out and must install Bases
through the real registry before exercising LN-WEB-011.

Local desktop packaging succeeds using the user's approved Deno age override
and an ignored separate lockfile. Packaged acceptance remains failing: the
first attempt timed out before the instance endpoint; the retry creates that
endpoint but times out waiting for workspace readiness. A separate diagnostic
launch boots the renderer, so the next investigation is the packaged acceptance
path, not an assertion-timeout increase. No production package publication or
deployment occurred.
