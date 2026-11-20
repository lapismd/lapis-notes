# Responsive plugin startup progress

LN-PLUG-138–140 are owned by `@lapis-notes/api`. Server and standalone Web consume
the shared App Profile workspace session; Desktop's Notes startup supplies the
same `PluginLoadOptions.onProgress` callback. All three already project plugin
names into Design Core's existing startup status.

The loader previously reported only runtime enablement. Installed-plugin
discovery and indexed-extension enablement were silent. Even reported names
could remain unpainted through a chain of resolved promises before synchronous
plugin work began. Callback-order tests did not exercise that rendering boundary.

The source now reports discovery folders before reading them, reports selected
indexed extensions, and lets visible documents render a frame before continuing.
A timer resumes non-visible documents and bounds a suspended frame wait. Calls
without a progress observer do not wait for a frame. Existing activation report
fields and host callbacks remain compatible; discovery adds an optional phase.
Positions and totals describe the current batch. Plugin admission and live
indexed-extension traversal remain owned by the existing loader.

## Regression evidence

The original command passed one callback-order test before strengthening:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/plugin-manager.test.ts \
  -t 'reports enable progress for each activated core plugin'
```

The exact expanded boundary failed all three cases before the source repair
and passed all three afterward:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/plugin-manager.test.ts \
  -t 'reports (enable progress|discovery progress|progress for configured indexed)'
```

The cases prove that queued host work runs before each core plugin's `onload`,
that discovery reports arrive before reading installed plugins, and that enabled
indexed extensions report without activating default-disabled extensions.
The separate suspended-animation-frame case passes and proves startup completes
when a visible page stops delivering frames. Its initial harness attempt failed
because the test document has no `visibilityState` getter; an explicit visible
test document repaired that harness without changing product behavior.
The complete plugin-manager family passes all 89 cases.

`Workspace/Notes Session/Plugin Startup Progress` samples the production startup
status on animation frames and records that sample synchronously in each probe
plugin's `onload`. Both names must have reached the rendered status before their
plugin starts. The story also retains the existing complete-session readiness
and document assertions. It passes in a fresh Docker browser process, including
accessibility checks.

## Broader qualification

All Docker commands deliberately use `LAPIS_NOTES_VALIDATION_ARCHIVES=` to test
the committed registry dependency graph. The initial configured local archive
cohort failed installation while applying the existing Bits UI patch; no product
tests ran in that attempt. Initial concurrent check/spec attempts also conflicted
with the repository validation lease; subsequent Docker lanes ran serially.

The initial full registry run passed 2,211 Vitest cases, including 1,842 API
cases, plus the Web icon-generation Node case. Root `pnpm check`, `pnpm build`
and `pnpm spec:check` passed. The latest
published Deno-free spec-validator is 0.2.1 and was already selected. Doctor
passes repository wiring but reports the local QMD native-module/Node ABI
mismatch; specification search printed its permitted fallback. Direct canonical
validation and the spec-first mapping pass. The first spec-first attempt lacked
mapped Architecture, Packages and Workspace chapters; those owning chapters are
now updated. The checkout lacks a Svelte Prettier parser, so that initial
formatter attempt failed; the fixture follows existing formatting and TypeScript
and Markdown formatting are checked separately.

The native local catalog's existing `Ready` story failed on missing note-body
text with both the unchanged and repaired loader. The same source fixture passes
the clean Docker focused story; the local package overlay is separate evidence
and does not qualify the product. No existing readiness assertion was loosened.

Final candidate results, all with zero functional or accessibility failures:

| Command after the registry environment override | Result                                                                                 | Retained run suffix                    |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| `pnpm test:storybook`                           | 241 passes across four cold shards: 96, 51, 41, 53                                     | `bc8323fd-795e-4eac-b658-7f56aa68e586` |
| `pnpm check`                                    | 16 successful tasks; type, Svelte, ownership and specification checks pass             | `362840db-b15b-42df-a8da-d466164e2bf7` |
| `pnpm test`                                     | 2,212 Vitest cases plus one Web icon-generation Node case pass; API has 1,843 cases    | `cb162b71-817c-4e9f-a1ea-c4b45bf555e1` |
| `pnpm build`                                    | Full package and production Web build pass                                             | `9c1e361a-0a57-4986-bedc-3856f06bee9c` |
| `pnpm validation:consumer-pack`                 | Six public archives pass identity, checksum and portable dependency-range verification | `b7622672-16b2-415d-8123-39450c3b9453` |
| `pnpm spec:check`                               | Canonical, book, ownership and specification-regression lanes pass                     | `ec7b0c6e-81ec-4a1b-b05a-2e20c5309c54` |

Receipts live under the ignored `.local/validation/runs/lapis-notes-validation-`
directory prefix followed by the suffix above. The existing two
`LinkPreviewAcceptance` cases remain excluded by the unchanged approved
quarantine; excluded cases are not counted as passes.

Static Storybook build and index checks also passed in run
`dbd14dc1-ec26-4125-ac19-38373e1f5544`, before the final live-traversal guard.
Catalog and fixture bytes stayed identical; the final full browser and production
build runs qualify the final API code. No existing assertions were weakened.

The final cold browser producer `9a7913973d3acd5a1b952fa64f3af3939f5b0aa4`
and archive producer `142eefc7e28853b06817bd80631b1ca301932697` contain the
same final API implementation, regression tests and session fixtures.
The final API source SHA-256 is
`5d3c58297c2be576d8d6752a003d7927f3ae56d5cf5c608a0b9fcaf87c092386`.
The unpublished API qualification archive retains version 0.6.10 and SHA-256
`3fd919d4038c101ec3beae2973ef5de142eb74c8487e2545fda122f58e188ea2`;
its built JS and declaration expose the discovery phase and rendering yield.
This does not claim that registry API 0.6.10 contains the fix.

After finalizing verification and backlog metadata, the native docs-only
`pnpm spec:check` closure passed, including all 68 governance regressions;
`pnpm spec:first` passed for two protected files and seven mapped chapters.
These metadata checks do not replace the Docker functional qualification.

## Delivery boundary

This is source qualification with an API patch Changeset. Source began at
`15e4251f`; unrelated local work remains in its original Jujutsu change and is
restored uncommitted after recording this verified slice. No
Server or Desktop source, live process, installed application, user vault,
registry publication, release workflow or production deployment is changed.
Separate Server/Desktop/Web consumer adoption and native acceptance remain
required before claiming that an installed host contains this fix.

The changed catalog remains `visual-pending`. Visual comparison was not run;
no visual baselines were created or updated.
