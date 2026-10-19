# Specification Governance / Context

LN-GOV-044 covers dependency-image candidate generation and verified digest-pin
updates as distinct from strict image consumption. Their regressions run in the
normal release-test lane; the producer may refresh old metadata, while consumer
lockfile and digest checks remain fail-closed.

Normal specification and CI unit validation execute the Storybook runtime
classifier and owned-console regression tests. These tests reject formatted
Svelte diagnostics and prove that caught teardown errors remain fatal through
the registered after-story and final-cleanup checks (LN-CAT-111).

Notes owns its Deno CI runtime prerequisite: the shared `ci-setup` action installs
Deno `2.9.7` through the pinned setup action before toolchain verification and
frozen installation. Every validation, release and Pages job that uses this action
receives the same runtime. Missing or mismatched Deno fails before package tasks;
the shared Node/pnpm image does not promise a Deno runtime.

Spec-first mappings cover the API Markdown registries, the Markdown provider,
and every consumer-facing chapter affected by shared Plugin and App lifecycle
changes.

Specification changes precede or accompany protected implementation changes.
The gate is package-aware: updating an unrelated chapter does not satisfy a
protected package change.

The package-aware mapping includes reusable File Explorer production sources.
Explorer changes therefore require their package, architecture, and
editor-demo chapters rather than being hidden by Storybook's fixture exemption.

Release-helper changes remain mapped to both Packages and Specification
Governance so partial public-package candidates retain package semantics and
release-policy coverage in the same logical change. This includes preserving
the hidden candidate directory when workflow actions upload release evidence
and keeping ordinary push runs outside the explicit manual publication gate.
The same mapping covers CI images, dependency-context generation, signed Turbo
cache configuration, local container parity, and parallel workflow
orchestration so infrastructure changes remain traceable to architecture and
package policy.

The Storybook structure audit treats AI, Bases, and History as required
plugin Shell families and maps both Graph panel families through the shared
command catalog. Its persisted Workspace inventory check requires the ten
audited enabled plugin IDs, including Graph, History, and Word Count, in both
the shell demo and the PersistedDesktop and Mobile stories.

## Requirement structure

Requirements stay readable when their IDs match the boundaries used by
verification. Apply these rules when adding or restructuring a requirement:

- Keep one independently verifiable concern under each ID.
- Split clauses that can fail separately or need different evidence.
- Keep the original ID on the primary concern and allocate unused IDs to the
  extracted concerns.
- Preserve every normative keyword, constraint, and exception during a split.
- Use an ID-scoped acceptance-details list only when several details share one
  verification outcome.
- Keep each requirement statement and acceptance bullet within 80 prose words
  and four sentences.
- Add one verification row for every ID and update all references in the same
  change.

Write shared acceptance checks beneath the requirement heading using this shape:

```markdown
### Acceptance details

The focused scenario verifies:

- First acceptance detail
- Second acceptance detail
- Third acceptance detail
```

`pnpm spec:validate` loads `spec-validator.config.mjs` and reports each objective
failure with its validator code, governing Lapis requirement, source location,
and affected requirement ID.
Atomicity remains an author and reviewer decision; the validator does not infer
whether two concise clauses can fail independently.

The shared Panels contract demonstrates this structure: `LN-MD-018` owns the
panel frame, while `LN-MD-032` through `LN-MD-035` own layout, paint, placement,
and list integration.

## Specification discovery

The QMD index is a disposable discovery cache over every tracked Markdown file
under `spec/src`. It helps agents locate likely chapters, requirement IDs, and
verification evidence; returned source files remain authoritative.

- `pnpm spec:search "<query or LN-ID>"` refreshes and runs lexical search.
- `pnpm spec:search --semantic "<concept>"` also refreshes embeddings before
  vector search.
- `pnpm spec:index` explicitly prewarms the lexical index; add `--semantic` to
  precompute embeddings.

Normal specification checks do not build this local index. Use `rg` when QMD is
not installed or when an embedding model is unavailable.

## Change map

The table names the owning topic families. `spec-validator.config.mjs` maps protected paths to the defining topic pages in those families, excluding landing pages and explanatory context. Deno packaging and packaged smoke follow the same family map as renderer and native host sources.

| Protected area                                                                 | Required chapter                                                                                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/api` source or manifest                                              | `packages/` topic pages, `architecture/` topic pages                                                                                         |
| `packages/api/src/lib/file-tools`                                              | `packages/` topic pages, `architecture/` topic pages, `plugins/ai/`                                                                          |
| API plugin lifecycle and workspace managed-plugin bridge                       | `plugin-model/` topic pages, `packages/` topic pages, `architecture/` topic pages                                                            |
| `packages/ui` source or manifest                                               | `packages/` topic pages, `ui-and-styling/` topic pages                                                                                       |
| `packages/workspace` source or manifest                                        | `packages/` topic pages, `architecture/` topic pages, `workspace-shell/` topic pages                                                         |
| `packages/desktop-deno` package                                                | `desktop-deno-host/` topic pages, `packages/` topic pages, `architecture/` topic pages                                                       |
| `packages/deno-host-services`                                                  | `server-node-host/` topic pages, `desktop-deno-host/` topic pages, `packages/` topic pages, `architecture/` topic pages                      |
| `packages/server-deno`                                                         | `server-node-host/` topic pages, `packages/` topic pages, `architecture/` topic pages, `app-database/` topic pages                           |
| `packages/api/src/lib/storage` except `desktop-native.ts`                      | `app-database/` topic pages, `packages/` topic pages, `architecture/` topic pages                                                            |
| `packages/api/src/lib/storage/desktop-native.ts`                               | `desktop-deno-host/` topic pages, `packages/` topic pages, `architecture/` topic pages                                                       |
| `packages/ai-host` cutover remnants                                            | `plugins/ai/`, `packages/` topic pages, `architecture/` topic pages, `desktop-deno-host/` topic pages, `web-host/` topic pages               |
| Focused AI Storybook stories                                                   | `plugins/ai/`, `storybook-catalog/` topic pages                                                                                              |
| `packages/web`                                                                 | `server-node-host/` topic pages, `web-host/` topic pages, `packages/` topic pages, `architecture/` topic pages                               |
| Focused real-App Graph Storybook stories                                       | `graph-plugin.md`, `storybook-catalog/` topic pages                                                                                          |
| Native Markdown runtime source or language-service manifest                    | `desktop-deno-host/` topic pages, `packages/` topic pages, `workspace-shell/panels/problems.md`                                              |
| Extracted plugin npm ranges and local tarball acceptance                       | `packages/` topic pages, `plugin-model/` topic pages, `architecture/` topic pages, `desktop-deno-host/` topic pages, `web-host/` topic pages |
| Focused or real-App Bases Storybook stories                                    | `bases-plugin.md`, `storybook-catalog/` topic pages                                                                                          |
| Shared Markdown panel shell source                                             | `workspace-shell/panels.md`                                                                                                                  |
| Individual Markdown panel source                                               | Its owning `markdown-plugin/panels/<panel>.md` page                                                                                          |
| Reusable Problems UI, diagnostic adapters, lint hover, or diagnostic providers | `workspace-shell/panels/problems.md`                                                                                                         |
| Storybook infrastructure and catalog metadata                                  | `storybook-catalog/` topic pages                                                                                                             |
| Root architecture / workspace / turbo manifests                                | `architecture/` topic pages, `packages/` topic pages                                                                                         |
| Governance scripts, QMD config/ignore rules, `AGENTS.md`, `spec/book.toml`     | `spec-governance/` topic pages                                                                                                               |
| Local release-candidate installer and support module                           | `packages/` topic pages, `spec-governance/` topic pages                                                                                      |

## Agent workflow

Package-specific guidance may restate an interaction rule only when its
canonical requirement remains authoritative. CV domain and package-catalog
guidance now resolves to the sibling Roles repository's standalone specification;
this repository retains only host integration and consumer acceptance contracts.

1. Inspect VCS status
2. Read mapped chapter + requirement IDs
3. Update requirements and verification before or with implementation
4. Add evidence (unit / story) as appropriate
5. Run `pnpm spec:first` and package checks
6. Commit the verified slice. This is a standing request for every workspace
   package; do not wait for the user to ask.

`AGENTS.md` must stay aligned with architecture requirements (including
published LapisMD dependency ranges rather than external workspace membership,
package-export resolution, alias-only ui theme, and `pnpm check:no-tailwind`)
whenever onboarding guidance changes. Development
workflow guidance SHOULD match mira-mde: if the `jj` binary is available, use
the `jj-jujutsu` skill and Jujutsu for VCS inspection/diffs/commits instead of
Git, and commit verified work with a PR-quality message without waiting for a
later user request. Tooling guidance for
Storybook must note that `pnpm test:storybook` fails on axe violations
(`parameters.a11y.test: "error"`).

GitHub workflow maintenance keeps the configured Node runtime and action majors
on Node 24 so CI and release runs do not depend on GitHub's deprecated Node 20
action runtime.

Markdown authoring guidance must route editor composition through Mira's public
base-free authoring contract. Any optional authoring surface must keep schema,
Settings UI, runtime resolution, lifecycle cleanup, and focused demo evidence
aligned; Storybook-only feature flags must not substitute for application
configuration. Guidance must also keep document surfaces borderless, route
view-menu settings through API configuration, and require persisted-file
acceptance for toolbar-driven editor settings.

CV guidance must keep compilation and artifact selection in the CV package
while routing compiled Markdown presentation through Mira's public read-only
Preview and Source surfaces. It must prohibit package-local Markdown renderers
and editable generated artifacts, keep mode chrome outside the nested Mira
surface, and group mode and disclosure actions in the main toolbar immediately after YAML.

Problems guidance must keep live totals in Design Core's structured workspace
view badge, preserve the stored leaf title, and prohibit a duplicate count in
the panel toolbar. Acceptance must cover the idle badge paint and a real
diagnostic-count transition. Hover cards must open only from the underlined
range or gutter marker. Hover-card action lists must use unique keys when
titles repeat, and cached actions for a diagnostic must belong to that
diagnostic with at most one action per title.

- Desktop build output follows the same generated-artifact rule as Storybook and the specification book.

- `packages/desktop-deno/dist/` and `packages/desktop-deno/release/` stay ignored, while package source, acceptance tests, icons, and entitlements remain reviewable inputs.

- Ignored package-local desktop development symlinks for source imports are generated bootstrap state, not tracked source.

- The change map requires desktop implementation slices to update the desktop, package, and architecture chapters; language-runtime changes additionally update Problems.

- The local Storybook structure validator reads the shared command-panel registry and rejects duplicate or stale mappings, missing canonical stories, incorrect `Plugins/<Plugin>/Panels/<Panel>` titles, missing placements, and absent `visual-pending` status.

- Shell, external-plugin, and persisted-inventory checks extend the same validator as those catalog slices migrate.

- The persisted inventory check requires Workspace Shell stories to assert History and Word Count among the eight enabled bundled plugins.

- Markdown `dist` consumers and file-scoped metadata panels are not covered by package unit tests or source-aliased Storybook alone.

- Handoff must rebuild Markdown and prove the web host plus a workspace that keeps Outline, Backlinks, and Outgoing Links from writing on a no-op `active-leaf-change`.

Local plugin preparation excludes published Design Core, Mira-family, and Spec
Validator entries from tarball remapping and install fingerprints. Existing
plugin and unpublished Community/AI Controller acceptance remains separate
from these registry foundations.

Dedicated `dist-registry-acceptance` output is ignored alongside other generated
artifacts. It contains only nonproduction fixture trust and must not enter source
commits, npm candidates, or production host packaging.

LN-PKG-149 binds compiled Svelte archives to the exact renderer ABI supplied by
the host. Generated versioned entries and browser import maps share that module
graph without exposing original private host specifiers. API and host Svelte
peers retain the exact qualified compiler version; dependency drift fails the
host-catalogue build before archives can be installed.

CI image pin updates carry a generated snapshot of the verified build inputs in
all three mapped topic pages (LN-GOV-046); the governance snapshot is in
[Protected change mapping](protected-change-mapping.md#current-ci-dependency-image). The image updater validates chapter
availability and snapshot markers before writing; the automation stages those
chapters together with the image manifest. No spec-first exemption applies.

The generated Changesets release PR follows LN-GOV-047, matching Mira's release
policy. Specification validation and build still run, alongside the required
package, unit, browser, artifact, and aggregate lanes. Only the exact generated
branch receives the diff-gate exception; dependency-image automation and other
ordinary PRs retain their mapped chapter and release-intent requirements.

The release workflow audit enforces the Pages package build preflight and its
ordering before Storybook (LN-PKG-152). Regression coverage parses the real
workflow to check setup, package outputs, and Storybook startup order; missing
or misplaced preflights remain blocking release-policy failures.

Storybook Turbo acceptance covers artifact restoration, source and toolchain
invalidation, and repeated execution after failures (LN-PKG-153 through
LN-PKG-155). CI and Pages use the same signed organization cache configuration
and report result reuse separately from package build restoration. The full
interaction and accessibility lane still runs on a miss and remains required
by `validate`.

LN-PKG-156 acceptance resets an API catalogue to its tracked pre-build state
and removes `dist` before restoring the cache. The restored catalogue must
match the generated one without another Storybook execution; tracked generated
source churn from local verification remains outside the infrastructure PR.
