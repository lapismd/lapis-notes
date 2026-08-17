# Specification Governance

Specification changes precede or accompany protected implementation changes.
The gate is package-aware: updating an unrelated chapter does not satisfy a
protected package change.

The package-aware mapping includes reusable File Explorer production sources.
Explorer changes therefore require their package, architecture, and
editor-demo chapters rather than being hidden by Storybook's fixture exemption.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-GOV-001 | `spec/src` Markdown MUST be canonical, indexed once by `SUMMARY.md`, and buildable by mdBook.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| LN-GOV-002 | Requirement IDs MUST be unique and each ID MUST appear in the verification matrix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-GOV-003 | Protected implementation and configuration changes MUST update every mapped canonical chapter in the same logical change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| LN-GOV-004 | The local gate MUST inspect the current VCS change (`jj` preferred, else git); CI MAY compare base and head revisions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-GOV-005 | Tests, generated output, and ordinary story files MUST NOT satisfy or spuriously trigger the specification-first gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-GOV-006 | Governance tooling MUST fail closed when it cannot determine a trustworthy change set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-GOV-007 | Generated mdBook output under `spec/book/` MUST remain untracked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-GOV-008 | `AGENTS.md` MUST route reusable panel work to `workspace-shell/panels.md`, specialist behavior to its owning Markdown panel page, and identify the shared panel helpers and All Properties stories as the implementation reference.                                                                                                                                                                                                                                                                                                                                                      |
| LN-GOV-009 | `AGENTS.md` MUST direct full-shell `Workspace/Shell`, `Workspace/Lapis Editor Demo`, and movable-panel Autodocs to the shared isolated 700px Docs height, require scoped removal of Storybook shell padding, and distinguish that documented viewport from the unconstrained full-screen story canvas. As a repository-wide story rule, it MUST require multi-scenario families with authored MDX to supply non-empty canonical story-description metadata, identify every scenario, and bind Storybook's Description block immediately before its Canvas rather than duplicating prose. |
| LN-GOV-010 | Each requirement ID MUST describe one independently verifiable concern. Clauses that can fail independently, need different evidence, or evolve separately MUST use separate IDs.                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-GOV-011 | One concern MAY retain several acceptance details under one ID. If it has three or more unordered details, the specification MUST use an introduced, ID-scoped bullet list instead of a dense sentence; bullets MUST NOT combine independently verifiable concerns.                                                                                                                                                                                                                                                                                                                      |
| LN-GOV-012 | A requirement split MUST preserve the original contract's scope, constraints, exceptions, and normative meaning. The original ID MUST remain with its primary concern; new concerns MUST use unused IDs, and the same change MUST update verification rows, cross-references, progress records, and agent guidance.                                                                                                                                                                                                                                                                      |
| LN-GOV-013 | Repository-owned `spec-validator.config.mjs` MUST map Lapis IDs, paths, document dialects, and spec-first policy onto reusable validators supplied by `@lapismd/spec-validator`; Lapis-specific validation MAY remain a configured local plugin or check lane.                                                                                                                                                                                                                                                                                                                           |
| LN-GOV-014 | Every validation finding MUST include a stable error code, governing requirement ID, path, line, optional subject ID, and actionable message. Findings MUST be sorted deterministically.                                                                                                                                                                                                                                                                                                                                                                                                 |
| LN-GOV-015 | A requirement-table statement and each ID-scoped acceptance bullet MUST contain no more than 80 prose words and four sentences after Markdown syntax is removed.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-GOV-016 | An ID-scoped acceptance section MUST use a `### <ID> acceptance details` heading in the defining chapter, appear once, introduce an unordered list, and contain at least three bullets.                                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-GOV-017 | Specification validation MUST check canonical files, mdBook configuration, chapter indexing, local links, requirement structure, defined references, verification traceability, allowed statuses, evidence, and untracked generated output.                                                                                                                                                                                                                                                                                                                                              |
| LN-GOV-018 | Specification validation MUST exit `1` for findings and `2` for internal, parser, or version-control failures. A successful run MUST report validator, chapter, and requirement counts.                                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-GOV-019 | `spec:check` MUST run configured validation before mdBook and spec-first checks. Root `check` MUST validate the specification before package checks, while reusable validator regression tests MUST remain owned by `@lapismd/spec-validator` rather than copied into Lapis.                                                                                                                                                                                                                                                                                                             |
| LN-GOV-020 | The tracked QMD configuration MUST index `spec/src/**/*.md` as the `lapis-spec` collection and MUST keep its generated database state untracked.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-GOV-021 | Specification searches MUST refresh the local collection before querying. Semantic search MUST update embeddings before vector retrieval, while normal checks and CI MUST NOT refresh or require the discovery index.                                                                                                                                                                                                                                                                                                                                                                    |
| LN-GOV-022 | Agent guidance MUST prefer the repository wrapper for requirement discovery, require returned canonical sources to be read, and retain `rg` as the fallback when QMD or semantic models are unavailable.                                                                                                                                                                                                                                                                                                                                                                                 |
| LN-GOV-023 | Specification validation MUST inspect repository and authorized package-local Autodocs stories that use demo, harness, or fixture render boundaries. They MUST resolve explicit `docs.source` code, language, and type fields without exposing story-only names or `args` as consumer usage.                                                                                                                                                                                                                                                                                             |
| LN-GOV-024 | Agent guidance MUST require Markdown feature-presentation changes to preserve canonical child descriptors, flat configuration keys, and real-app persistence acceptance. It MUST direct agents to design-core's Boolean toggle-table contract instead of a stored object-grid collection.                                                                                                                                                                                                                                                                                                |
| LN-GOV-025 | Agent guidance MUST route reusable diagnostic and Problems-view work to the Workspace Shell Problems specification. It MUST preserve Design Core ownership of panel presentation, require stable hover handoff and styled inline-problem acceptance, and make Lapis adapters and providers read that contract before package-specific chapters.                                                                                                                                                                                                                                          |
| LN-GOV-026 | The spec-first map MUST route API storage to App Database and web changes to Web Host, Packages, and Architecture. Lapis Roles consumer stories MUST route to Roles Host Integration and Storybook Catalog.                                                                                                                                                                                                                                                                                                                                                                              |
| LN-GOV-027 | Roles package implementation and plugin-only Storybook changes MUST be governed by the sibling repository's standalone specification rather than Lapis source paths.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-GOV-028 | Agent guidance MUST keep CV Markdown mode and form disclosure actions grouped in the main toolbar immediately after YAML with the shared outlined icon treatment. Form-area scrolling guidance MUST remain limited to tabs and contextual form actions.                                                                                                                                                                                                                                                                                                                                  |
| LN-GOV-029 | Agent guidance MUST require canonical movable-panel registrations to declare their opening commands together, while file-backed editor views use editor associations and compatibility aliases reuse canonical commands.                                                                                                                                                                                                                                                                                                                                                                 |
| LN-GOV-030 | The spec-first map MUST route API plugin lifecycle sources to Plugin Model, Packages, and Architecture. It MUST route the external Roles repository through its standalone specification after cutover.                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-GOV-031 | The spec-first map MUST route Bases package sources to Bases Plugin, Packages, and Architecture. Focused and real-App Bases stories MUST route to Bases Plugin and Storybook Catalog instead of receiving the ordinary story exemption.                                                                                                                                                                                                                                                                                                                                                  |
| LN-GOV-032 | The spec-first map MUST route AI package sources to AI Plugin, Packages, and Architecture. Focused AI stories MUST route to AI Plugin and Storybook Catalog instead of receiving the ordinary story exemption.                                                                                                                                                                                                                                                                                                                                                                           |
| LN-GOV-033 | The spec-first map MUST route `packages/api/src/lib/storage/desktop-native.ts` to Desktop Host and Packages. It MUST NOT treat that file as an App Database change.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| LN-GOV-034 | `AGENTS.md` MUST require explicit `link:` dependencies or `link:`-valued root overrides for colocated LapisMD siblings, prohibit external workspace membership and vendoring, preserve portable publishable manifests, and require built-export providers to be rebuilt before consumer validation.                                                                                                                                                                                                                                                                                      |
| LN-GOV-035 | The spec-first map MUST route `packages/ai-host` to AI Plugin, Packages, Architecture, Desktop Host, and Web Host.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-GOV-036 | `AGENTS.md` MUST require first-party App access through explicit injection, workspace ownership, or Svelte context. It MUST limit `globalThis.app` to the compatibility bridge and dedicated fallback acceptance, require the ownership audit in root check and spec-check, and require separately versioned first-party plugins to enforce the same boundary.                                                                                                                                                                                                                           |
| LN-GOV-037 | The repository MUST run a local view-command audit that parses first-party TypeScript and Svelte scripts, rejects unclassified view registrations, maps its diagnostics to the Plugin Model access and opener requirements, and routes first-party plugin and Explorer source changes to that chapter.                                                                                                                                                                                                                                                                                   |
| LN-GOV-038 | The repository MUST run a local Storybook structure audit that maps command views to canonical panel stories and rejects stale mappings, missing placements, non-fullscreen panel geometry, legacy plugin paths, external Roles/CV catalog coupling, incomplete or scrolling shells, incomplete persisted Workspace plugin inventory, incomplete AI state coverage, and a non-first Specification menu.                                                                                                                                                                         |
| LN-GOV-039 | Supporting implementation records MUST live under `spec/records/`, and completed one-time plans MUST live under `spec/archive/`. Neither location is normative or indexed by `SUMMARY.md` or the QMD collection. Living intake MUST remain in root `MIGRATION.md`.                                                                                                                                                                                                                                                                                            |

The Storybook structure audit treats AI, Bases, and History as required
plugin Shell families. Its persisted Workspace inventory check requires the
seven enabled plugin IDs, including History, in both the shell demo and the
PersistedDesktop and Mobile stories.

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

Write shared acceptance checks below the requirement table using this shape:

```markdown
### LN-EXAMPLE-001 acceptance details

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

- `pnpm spec:search -- "<query or LN-ID>"` refreshes and runs lexical search.
- `pnpm spec:search -- --semantic "<concept>"` also refreshes embeddings before
  vector search.
- `pnpm spec:index` explicitly prewarms the lexical index; add `--semantic` to
  precompute embeddings.

Normal specification checks do not build this local index. Use `rg` when QMD is
not installed or when an embedding model is unavailable.

## Change map

| Protected area                                                             | Required chapter                                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `packages/api` source or manifest                                          | `packages.md`, `architecture.md`                                                         |
| API plugin lifecycle and workspace managed-plugin bridge                   | `plugin-model.md`, `packages.md`, `architecture.md`                                      |
| `packages/ui` source or manifest                                           | `packages.md`, `ui-and-styling.md`                                                       |
| `packages/workspace` source or manifest                                    | `packages.md`, `architecture.md`, `workspace-shell.md`                                   |
| `packages/desktop-electron` package                                        | `desktop-host.md`, `packages.md`, `architecture.md`                                      |
| `packages/api/src/lib/storage` except `desktop-native.ts`                  | `app-database.md`, `packages.md`, `architecture.md`                                      |
| `packages/api/src/lib/storage/desktop-native.ts`                           | `desktop-host.md`, `packages.md`, `architecture.md`                                      |
| `packages/plugins/plugin-ai` source or manifest                            | `ai-plugin.md`, `packages.md`, `architecture.md`                                         |
| `packages/ai-host` source or manifest                                      | `ai-plugin.md`, `packages.md`, `architecture.md`, `desktop-host.md`, `web-host.md`       |
| Focused AI Storybook stories                                               | `ai-plugin.md`, `storybook-catalog.md`                                                   |
| `packages/web`                                                             | `web-host.md`, `packages.md`, `architecture.md`                                          |
| `packages/plugins/plugin-search` package                                   | `search-plugin.md`, `packages.md`, `architecture.md`                                     |
| `packages/plugins/plugin-history` package                                  | `history-plugin.md`, `packages.md`, `architecture.md`                                    |
| Native Markdown runtime source or language-service manifest                | `desktop-host.md`, `packages.md`, `workspace-shell/panels/problems.md`                   |
| `packages/plugins/plugin-markdown` source, manifest, or `PARITY.md`        | `markdown-plugin.md`, `markdown-plugin/panels/index.md`, `packages.md`, `editor-demo.md` |
| `packages/plugins/plugin-bases` source or manifest                         | `bases-plugin.md`, `packages.md`, `architecture.md`                                      |
| Focused or real-App Bases Storybook stories                                | `bases-plugin.md`, `storybook-catalog.md`                                                |
| Shared Markdown panel shell source                                         | `workspace-shell/panels.md`                                                              |
| Individual Markdown panel source                                           | Its owning `markdown-plugin/panels/<panel>.md` page                                      |
| Reusable Problems UI, diagnostic adapters, or diagnostic providers         | `workspace-shell/panels/problems.md`                                                     |
| Storybook infrastructure and catalog metadata                              | `storybook-catalog.md`                                                                   |
| Root architecture / workspace / turbo manifests                            | `architecture.md`, `packages.md`                                                         |
| Governance scripts, QMD config/ignore rules, `AGENTS.md`, `spec/book.toml` | `spec-governance.md`                                                                     |

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
6. Commit the verified slice

`AGENTS.md` must stay aligned with architecture requirements (including
colocated siblings as explicit `link:` dependencies or `link:`-valued root
overrides rather than workspace members, package-export resolution, alias-only ui theme, and
`pnpm check:no-tailwind`)
whenever onboarding guidance changes. Development
workflow guidance SHOULD match mira-mde: if the `jj` binary is available, use
the `jj-jujutsu` skill and Jujutsu for VCS inspection/diffs/commits instead of
Git, and commit verified work with a PR-quality message. Tooling guidance for
Storybook must note that `pnpm test:storybook` fails on axe violations
(`parameters.a11y.test: "error"`).

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
diagnostic-count transition. Hover-card action lists must use unique keys when
titles repeat, and cached actions for a diagnostic must belong to that
diagnostic with at most one action per title.

Desktop build output follows the same generated-artifact rule as Storybook and
the specification book. `packages/desktop-electron/dist-electron/` and
`packages/desktop-electron/release/` stay ignored, while package source,
acceptance tests, icons, and entitlements remain reviewable inputs. The change
map requires desktop implementation slices to update the desktop, package, and
architecture chapters; language-runtime changes additionally update Problems.
The local Storybook structure validator reads the shared command-panel registry
and rejects duplicate or stale mappings, missing canonical stories, incorrect
`Plugins/<Plugin>/Panels/<Panel>` titles, missing placements, and absent
`visual-pending` status. Shell, external-plugin, and persisted-inventory checks
extend the same validator as those catalog slices migrate. The persisted
inventory check requires Workspace Shell stories to assert History among the
seven enabled bundled plugins.
