# Problems total acceptance after the runtime guard repair

GitHub run `38322523627`, job `115054575421`, reports one failed story and
83 passes in the first Storybook shard. It reports no `derived_inert` or other
fatal Svelte diagnostics. The only failure is `Markdown Lint Loft Boarding`
looking for the fixed label `Problems, 17 problems`.

The story correctly verifies 17 Markdownlint diagnostics, but then incorrectly
uses that source-filtered count for the complete Problems badge and row list.
LN-WS-046 requires the live total across all diagnostic collections. Other
providers, including Harper, can contribute results as they become ready. The
CI DOM dump is truncated before the actual badge; it does not identify which
additional results were present in that run.

The unchanged isolated story passes locally (1/1), as does the unchanged exact
CI shard (84/84). A deterministic regression adds one information diagnostic
through a separately owned public collection. The old assertion then fails
with `expected 17 but got 18`; the revised assertion passes (1/1) in a fresh
browser process. The fix keeps the exact Markdownlint rule list and duplicate
identity assertions, checks the full snapshot against both the badge and rows,
rejects unexpected workspace-wide error diagnostics, and verifies collection
addition and disposal without modifying the document. Disposal is guaranteed
even if an assertion fails.

Focused commands:

```sh
pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Markdown Lint Loft Boarding'
pnpm exec vitest run --project storybook --shard=1/4
pnpm spec:check
```

The repaired exact CI shard passes 84/84 in a fresh browser process with zero
fatal diagnostics. Specification checks,
App-ownership and metadata-query audits, and all 27 Node specification
regressions pass. Final aggregate verification remains delegated to GitHub CI.
No production component, dependency, runtime guard, or visual baseline changes.
