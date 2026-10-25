# Backlog / Legacy plugin ports

## Audit scope

The 2026-10-25 source audit compared the 16 plugin packages, Notebook, and
workspace features in `legacy-lapis-notes` at revision `8ec68e18` with the
current Notes, Tauri Desktop, `lapis-plugins`, and standalone first-party
plugin repositories. It identified six legacy capabilities without a current
counterpart. Package existence, publication, installation, and full feature
parity are separate checks; this audit establishes source coverage only.

Legacy source references below are relative to the `legacy-lapis-notes`
repository root. Its canonical plugin descriptions live under
`spec/src/20-packages/plugins/<plugin>/index.md`.

## Selected recommendations

The recommended product sequence is **PDF → CSV/TSV → Canvas**. PDF restores
common attachment workflows with the smallest integration surface. CSV/TSV
adds practical structured-data editing alongside Bases. Canvas is the next
substantial feature, with portable JSON Canvas documents and connected notes.

Telemetry is an optional engineering workstream for diagnosing performance and
plugin problems, rather than the third product priority. Univer Docs & Sheets
and Notebook remain deferred until a specific document or executable-note
workflow justifies their integration and maintenance cost. Tasks follow-up is
a selective compatibility audit of the existing implementation.

## Candidates by increasing difficulty

Difficulty is relative to a production port with current public contracts,
package-owned regression coverage, and affected-host acceptance. It is an
estimate, not a delivery commitment. This ordering differs from product
priority because Telemetry primarily benefits development.

| Order | Capability                 | Difficulty       | Recommendation                                            | Main integration work                                                                                                                                                                                                                         |
| ----- | -------------------------- | ---------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | PDF viewer and note embeds | Small–medium     | Product priority 1; port first                            | Adapt settings and theme integration, vault resource URLs, lazy EmbedPDF assets, file-view and Markdown-embed lifecycles; qualify web and native viewing.                                                                                     |
| 2     | CSV/TSV editor             | Medium           | Product priority 2                                        | Retain parsing, serialization, grid models, rainbow source highlighting, and linting. Adapt table controls, styling, selection, row/column drag reorder, undo/redo, and guarded saves.                                                        |
| 3     | Telemetry diagnostics      | Medium–large     | Optional engineering workstream                           | Restore a real collector behind the retained API, then adapt trace tables, span waterfalls, measurements, settings, and persistence. The current API defaults to a no-op service, so the legacy UI alone is insufficient.                     |
| 4     | Canvas                     | Large            | Product priority 3                                        | Adapt Svelte Flow nodes and edges, grouping, selection, zoom, keyboard/pointer behavior, Markdown/file embeds, and editable note surfaces. Qualify serialized/debounced writes, close/reload, and read-only embeds.                           |
| 5     | Univer Docs & Sheets       | Large–very large | Defer until native document/sheet workflows are requested | Integrate the embedded Univer/React runtime, lazy assets and module interop, measured pane startup, focus/theme behavior, and snapshot persistence with visible save recovery. Resolve view-identity overlap with current Docs.               |
| 6     | Notebook                   | Very large       | Defer; specify and port in stages                         | Restore notebook parsing and reactive execution, worker transport, DuckDB/WASM, TypeScript services, rich outputs and inputs, cancellation, vault access, and generated-state persistence. This spans the plugin and six supporting packages. |

## Source and compatibility boundaries

| Candidate            | Legacy package and source                                     | Legacy identity and files                                                                                                                                     |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PDF                  | `@lapis-notes/pdf`; `packages/plugins/plugin-pdf`             | Runtime `lapis-pdf`; `.pdf` views and Markdown PDF embeds.                                                                                                    |
| CSV/TSV              | `@lapis-notes/csv`; `packages/plugins/plugin-csv`             | Runtime `csv`; `.csv` and `.tsv` table/source views.                                                                                                          |
| Telemetry            | `@lapis-notes/telemetry`; `packages/plugins/plugin-telemetry` | Runtime `lapis-telemetry`; diagnostics view `plugin:diagnostics`.                                                                                             |
| Canvas               | `@lapis-notes/canvas`; `packages/plugins/plugin-canvas`       | Runtime `lapis-canvas`; `.canvas` JSON Canvas documents and embeds.                                                                                           |
| Univer Docs & Sheets | `@lapis-notes/docs`; `packages/plugins/plugin-docs`           | Runtime `lapis-docs`; `.lapisdoc` and `.lapissheet` JSON snapshot wrappers.                                                                                   |
| Notebook             | `@lapis-notes/notebook`; `packages/notebook`                  | `.notebook.md` notes, plus `notebook-core`, `notebook-duckdb`, `notebook-duckdb-assets`, `notebook-input`, `notebook-stdlib`, and `notebook-worker` packages. |

### Current Docs is a different feature

The current `@lapis-notes/lapis-plugin-docs` uses runtime ID `docs` and
`*.doc.md` Markdown files for documents, cards, and review. It does not replace
legacy Univer documents or spreadsheets. Both implementations use a
`docs-document` view name, so coexistence and persisted layout identities need
an explicit design before a Univer port. A port also needs a distinct product
name so users can tell the two features apart.

Legacy Univer Docs did not provide Office exchange: `.docx`, `.xlsx`, and
`.pptx` import/export are outside this candidate's inherited scope. CSV/TSV
remains owned by its separate plugin.

### Tasks is an existing implementation with parity follow-up

The current `@lapis-notes/lapis-plugin-tasks` already provides a Markdown-backed
planner, indexing, and recurrence. The legacy `@lapis-notes/tasks` includes a
TaskNotes-oriented model, Fizzy workflows, and task-specific Bases integration.
The source audit does not establish full compatibility between them.

The follow-up is to inventory valuable legacy behavior, identify model and
storage differences, and choose individual additions to the current package.
It is not a second whole-plugin port. Conformance or compatibility claims need
their own fixtures and acceptance evidence.

### Features already represented

Markdown, Markdown Lint, Search, Bases, Graph, Slides, Spellcheck, and History
have current implementations or replacements. Slides already lives in
`lapis-plugins/packages/slides`; it is not an unported candidate even when it
is absent from a host's bundled profile.

F-Mode and Notifications are represented by the shared shell. File Explorer,
Word Count, source editing, and Tags are also represented. Existing coverage
does not imply every legacy interaction is identical or every package is
released and installed in the running application.

## Intake and acceptance follow-up

Package intake still follows
[Specification before new package intake](../packages/editor-apis.md#ln-pkg-004):
each selected candidate needs a defining contract and tracking in `MIGRATION.md`
before implementation. This backlog records the recommended sequence without
changing active package authorization or completion status.

- [ ] Specify PDF as the first product slice, including file views, note
      embeds, settings, resource ownership, disposal, and web/native acceptance.
- [ ] Specify CSV/TSV next, retaining model/parser regressions and adding
      current-UI keyboard, selection, drag, undo, and persistence coverage.
      The first Storybook table and note embed are specified in
      `lapis-plugins/spec/src/plugins/csv/index.md`. Keyboard, selection,
      drag, undo, lint, rainbow source, and persistence remain open.
- [ ] Specify Canvas after those slices, with editable-note integration and
      close/reload persistence as explicit boundaries.
- [ ] Decide whether performance investigations warrant Telemetry; select the
      collector and host ownership before porting its diagnostics UI.
- [ ] Revisit Univer only when `.lapisdoc` or `.lapissheet` usage warrants it;
      settle naming and view identities before implementation.
- [ ] Revisit Notebook as a staged runtime proposal with explicit execution,
      cancellation, persistence, and worker/host boundaries.
- [ ] Audit Tasks compatibility separately and select useful features for the
      existing owning package.

Each selected port starts with its owning package contract and regression
evidence. Reusable plugin behavior belongs in the owning plugin repository;
missing generic contracts belong upstream in API, Mira, or Design Core. Notes
and Desktop retain application policy, routing, persistence admission, and host
adapters. Consumer acceptance follows verified public builds or documented
local archives, with portable registry ranges retained. Publication remains a
separate gate. Visual review stays pending without baseline updates; functional,
keyboard, accessibility, lifecycle, and affected-consumer checks remain part of
port qualification.
