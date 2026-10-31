# Inline editor spacing qualification

LN-PKG-024 now keeps full-document trailing space off nested `mod-inline`
source editors. The Notebook reproduction measured 450px of inherited bottom
padding. API-owned `Inline Source Editor Spacing` reproduces that boundary in
the real Markdown shell and preserves the outer document's trailing space.

- Exact command: explicit native diagnosis via
  `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Inline Source Editor Spacing'`.
  Before: 1 failure (450px versus 0). After: 1 pass, 0 failures.
- LN-ARCH-146 routing regression: JavaScript root aggregates incorrectly chose
  the retired root Rust workspace and failed before executing because
  `Cargo.lock` is absent. The new regression failed once before the UI-image
  routing repair; all 30 runner/cache/image cases pass afterward. Explicit
  native lanes keep the full image.
- Docker `pnpm check:all` passes quality, all 2,048 package unit cases and the
  complete build, including the web consumer.
- Cold Docker `pnpm test:storybook` passes 269 interaction/accessibility stories
  across four sequential shards (99 + 67 + 46 + 57).
- `pnpm build-storybook` passes and renders all 194 specification chapters.
- Initial `pnpm spec:check` failed once for a missing mapped catalog chapter.
  After updating the owning app-fixture chapter, the exact command passes.

Logs: `/tmp/notes-notebook-inline-full-check-after.log`,
`/tmp/notes-notebook-inline-full-stories.log`,
`/tmp/notes-notebook-inline-static.log`,
`/tmp/notes-notebook-inline-spec-final.log`.

Built API archive for isolated Notebook acceptance:
`.release/validation-packages/lapis-notes-api-0.2.0.tgz`, SHA256
`0a10c0df0482eaf238b3c1a9691deef073e0ad51f282ad51922df3f5c1726f6c`.
Tracked manifests and lockfiles retain registry ranges. No publication, push,
visual-baseline update or native-host delivery is claimed.
