# Catalog validation landing in the default workspace

The catalog-composition and Docker-first validation slice is integrated into
the default Notes workspace. The original qualified change is `upypvpzt`
(`4199356c` before the landing follow-up). Native conversation, navigation and indexing work was preserved, then committed
by its owning task as `7161a447` and ledger follow-up `8bcf0fd8` during this
landing. Their source qualification remains separate from this catalog change.

The pre-landing working-copy snapshot is retained at
`local/validation-landing-before-20261025`, commit `f0f4b971`.
Ignored `.local/validation/landing-20261025/before.json` records its file hashes.
The default workspace has no unresolved Jujutsu conflicts. The temporary
`catalog-validation` and `catalog-consumer-pack` workspaces remain pending the
user's cleanup confirmation; their evidence and archives are retained.

## Combined checkout validation

The original isolated qualification and counts remain in
[the original record](2026-10-25-catalog-validation.md). The landing additionally
passes story-composition validation for all 59 current families, the Docker
runner regressions, native-source boundaries, migration-progress validation,
and `pnpm spec:check`, including all 78 specification cases.

The first combined `pnpm test:storybook` run, retained as
`lapis-notes-validation-ac1d3b4f-5d28-4d5c-8990-69fbb236430d`, reports 254 passed
and seven failed cases. Six Search panel placements expect the newer source
accessible-name contract; `AI Chat / Search Tool Hits` expects the newer
Search-owned hit renderer. The exact cold target reproduces seven failures in
`lapis-notes-validation-c2b585f8-181f-4e90-8e3b-28e10c7ac3f5`:

```sh
pnpm test:storybook -- stories/plugins/search/panels/Search.stories.ts \
  stories/plugins/ai/AiChat.stories.ts \
  -t 'Middle Top Tabs|Stacked Tabs|Left Sidebar|Right Sidebar|Bottom Panel|Sidebar Group|Search Tool Hits'
```

The main workspace's local installation already consumes source-built AI and
Search archives. Declaring the same source prerequisites in the ignored Docker
configuration makes that exact cold target pass seven cases with zero failures
(19 unrelated cases are unselected), in
`lapis-notes-validation-9dea0fda-fd3e-4bf8-ad5f-9950ea865888`. No assertion or product implementation is
changed. The complete four-shard cold source-archive rerun passes all 261 cases
(93, 71, 42, 55) with zero functional or accessibility failures in
`lapis-notes-validation-6979045e-a21a-4a44-8a47-5987324a97a3`.
The exact source, prerequisite archive hashes and tool versions are retained in
its invocation report.

## Source archives and delivery boundaries

The ignored prerequisite inventory retains Design Core's committed-source
archive `67eb392b`, SHA-256
`4db7d4f621d66f5d40110ddb87d423f34063a0731a811618aa6abdae7abe7658`.
The staged App Profile also requires the separately built Agent UI archive,
SHA-256 `b6d8a4283d8007d83d7f786458a2712d2796df8e8031c1a48e9692ebe7135f3d`.
Its absence initially reproduces a registry 404. The worker installs declared
archives before validation, without first fetching that unpublished identity
from the registry. Tracked manifests and lockfiles remain portable.

Search and AI archives are collected from Plugins run
`lapis-plugins-validation-488dacf3-3c2f-479d-8f16-fc3920720353`, source
`5320b49517f80fc03d988a31b4f2b81d6454bba1`:

| Package               | Version | SHA-256                                                            |
| --------------------- | ------- | ------------------------------------------------------------------ |
| `@lapis-notes/search` | `0.1.3` | `39baabc1cbb2cf29738ed58571a8502901ce40f5dd0b4fb58725bf11488ba1db` |
| `@lapis-notes/ai`     | `0.1.5` | `04efc90fedf0669e703239410bc479b7e6fc0cb4e6b3e00a19b024f455a9d565` |

The all-plugin pack invocation remains blocked by a separate PDF WASM import;
that failure does not qualify PDF or any plugin release. The individual Search
and AI archives pass their containment checks and retain their checksums.
This is temporary source-integration evidence. Upstream publication and a fresh
registry-only consumer run remain release gates. No visual baseline changes,
publication or existing application-work commits are included.

## Final landing checks

The final combined `pnpm spec:check` passes in
`lapis-notes-validation-09b5a220-7d01-4435-88b8-0cf7155015d1`, including all
78 specification regressions. Final native specification validation and
formatting also pass after adding the evidence links.

The before/after SHA-256 comparison across all 2,661 existing tracked files
finds no unexpected changes. Only this landing's migration checkpoint, canonical
validation documentation and evidence links differ. The remaining native-source
pin stays uncommitted. No Jujutsu conflicts remain.
