# CV Plugin

`@lapis-notes/cv` owns CV YAML file views, structured editing through public
Design Core form primitives, and browser-generated preview. Vault files remain
the source of truth. Search indexing and Applications views stay outside this
slice.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CV-001 | The repo MAY ship `@lapis-notes/cv` at `packages/plugins/plugin-cv`. This slice covers CV file views only. Application views remain unspecified. Tasks MUST NOT ship in this plugin. |
| LN-CV-002 | The plugin MUST register through the existing API `Plugin` surface: `registerView`, `registerEditorView`, and `registerExtensions`. It MUST NOT introduce a parallel loader or settings framework. |
| LN-CV-003 | When enabled, the plugin MUST own view type `cv` with exclusive filename patterns `*.cv.yml` and `*.cv.yaml` and compound extensions `cv.yml` and `cv.yaml`. |
| LN-CV-004 | Generic `.yml` and `.yaml` files MUST remain outside the CV association. |
| LN-CV-005 | `CvView` MUST extend API `TextFileView` so vault read and write remain the source of truth. The plugin MUST NOT add a server backend or AI path. |
| LN-CV-006 | The view MUST parse open vault content through the canonical `parseCvYaml` normalization boundary before it populates the structured form or preview. |
| LN-CV-007 | Generated preview MUST use the browser WASM Typst path. HTML compiled preview MAY remain a fallback when the worker fails. Node Typst and CV Studio API routes MUST NOT be used. |
| LN-CV-008 | Structured CV editing MUST compose public `@lapismd/design-core/forms` primitives. The plugin MUST NOT import Design Core's story-local Complete CV Form module. |
| LN-CV-009 | The plugin MUST NOT write Search documents or import Search internals. Vault indexing of CV files remains a later Search-owned change. |
| LN-CV-010 | Hosts MUST register CV as an optional core plugin enabled by default and load it before metadata and layout restoration. |
| LN-CV-011 | `@lapis-notes/cv` MAY host a package Storybook on port 7020 for CV form, compiler, preview, and App-backed workspace stories. That host MUST use design-core styles and MUST NOT replace the repository catalog on 7010. |
| LN-CV-012 | The package Storybook MUST include one App-backed workspace story that registers File Explorer, Search, and optional CV, restores explorer, search, and a `*.cv.yml` leaf, and asserts those three view types. |
| LN-CV-013 | The CV workspace MUST fill the leaf view host. AppShell main inset, radius, shadow, and border MUST be zeroed through documented `--ui-shell-main-*` tokens so the view is white edge to edge. |
| LN-CV-014 | The preview toolbar MUST offer Typst SVG, Typst PNG, Typst source, Markdown, and HTML. Typst SVG and PNG MUST come from the browser WASM worker. HTML, Markdown, and Typst source MUST come from compile output. A selected Typst page mode MUST NOT silently swap to HTML while a render is in flight. |
| LN-CV-015 | Preview zoom MUST stay between 50% and 250% and MUST change the 820px document width rather than applying transform scale. The preview pane MUST keep its split size. Zoom above 100% MUST let the page stack scroll horizontally. |
| LN-CV-016 | The CV, Design, Locale, and Settings tab row MUST include previous, current, and next RenderCV theme controls. Those controls MUST write `design.theme`. The Design tab theme field MUST remain. |
| LN-CV-017 | The CV workspace MUST fill leftover height under the toolbar and form-area tabs. The leaf MUST NOT scroll as a whole. Form, YAML, and preview MUST each own an independent scrollport. |
| LN-CV-018 | The main toolbar MUST include a YAML switch that shows the YAML editor in the editor pane. Form and YAML MUST NOT appear as peer workspace tabs. Edit and Preview tabs MUST appear only when the form and preview columns stack into one row. |
| LN-CV-019 | On small viewports the main CV toolbar MUST scroll horizontally without visible scrollbars and MUST stay touch-pannable. |
| LN-CV-020 | Package Storybook on port 7020 MUST fail `pnpm --filter @lapis-notes/cv test:storybook` on axe violations. `.storybook/vitest.setup.ts` MUST register `@storybook/addon-a11y/preview`, and preview MUST set `parameters.a11y.test` to `error`. |
| LN-CV-021 | The toolbar title, YAML label, preview mode control, and form-area tabs MUST render at the design-core small text size of 0.875rem. |
| LN-CV-022 | Structured edits MUST preserve normalized evidence and every supported field outside the edited form fragment. Saving MUST NOT narrow the document to the visible form model. |
| LN-CV-023 | Invalid full-document YAML MUST remain editable in the shared YAML editor with an accessible parse error. Invalid drafts MUST NOT be written; a valid correction MUST restore the structured form and preview. |
| LN-CV-024 | Experience extra details MUST use only `text`, `comma_list`, or `semicolon_list`. The structured form MUST offer those values and MUST serialize the selected value unchanged. |
| LN-CV-025 | Structured and YAML edits MUST debounce vault writes for 1,200ms, serialize concurrent writes, and flush the latest value before file changes or view closure. A failed write MUST retain the dirty value and expose an accessible error. |
| LN-CV-026 | Typst SVG and PNG success stories MUST require real worker page output. Worker failure MUST be tested as the documented HTML fallback and MUST NOT satisfy a successful Typst story. |
| LN-CV-027 | Production CV styling MUST use public Design Core tokens and stable component selectors. Storybook host selectors and private CodeMirror classes MUST remain in catalog-owned styling or be omitted. |

### LN-CV-012 acceptance details

The App-backed plugin Storybook scenario verifies:

- The story MUST boot a real api `App` and `WorkspaceShell`, not a form-only harness.
- File Explorer and Search MUST come from their public packages as Storybook-only dependencies.
- The play MUST keep the CV leaf as view type `cv` and MUST NOT treat CV YAML as a Search document.

### LN-CV-013 acceptance details

The CV leaf fills the workspace view host:

- The shell MUST set `--ui-shell-main-block-inset`, `--ui-shell-main-radius`, `--ui-shell-main-shadow`, and `--ui-shell-main-border` to a flush stack.
- The main surface MUST NOT keep a visible card margin against the view host.
- Preview page chrome MUST NOT add a second padded, shadowed card around the rendered CV.

### LN-CV-014 acceptance details

The preview mode dropdown verifies:

- The menu MUST list Typst SVG, Typst PNG, Typst source, Markdown, and HTML.
- Typst SVG and PNG MUST render worker page images for the selected extension.
- HTML fallback MUST appear only after a worker failure, never while a Typst page render is in flight.

### LN-CV-015 acceptance details

Preview zoom verifies:

- Minus, percent reset, and plus MUST move zoom in 10% steps between 50% and 250%.
- At 90%, the preview document width MUST be 738px while the pane still fills the split.
- Ctrl or Cmd plus wheel on the preview scroller MUST change zoom.

### LN-CV-016 acceptance details

The form-area theme shortcut verifies:

- Previous, current, and next theme controls MUST sit on the CV, Design, Locale, and Settings row.
- Next or a menu choice MUST update `source.design.theme`.
- The Design tab CyclePicker theme field MUST remain available.

### LN-CV-017 acceptance details

Independent pane scrolling verifies:

- The shell MUST keep `overflow` hidden so the leaf does not scroll as a whole.
- The form and preview ScrollArea viewports MUST have bounded height inside the split.
- YAML MUST scroll inside the CodeMirror editor rather than growing the leaf.
- Sample CV and Plugin Shell plays MUST move the form or preview scroller and MUST keep `shell.scrollTop` at 0.

### LN-CV-018 acceptance details

Workspace chrome verifies:

- The YAML switch MUST sit in the main toolbar and MUST replace the structured form in the editor pane when on.
- Wide viewports MUST show the editor and preview columns side by side with no Edit or Preview tablist visible.
- Stacked viewports MUST show Edit and Preview tabs that switch the single visible column.

### LN-CV-019 acceptance details

Small-viewport toolbar scrolling verifies:

- The toolbar MUST keep a single row and MUST overflow on the inline axis.
- Scrollbars MUST be hidden while touch panning remains available.
- Toolbar controls MUST stay large enough to tap.

### LN-CV-020 acceptance details

Package Storybook accessibility verifies:

- `.storybook/vitest.setup.ts` MUST register `@storybook/addon-a11y/preview` before project preview annotations.
- Preview MUST set `parameters.a11y.test` to `error`.
- `pnpm --filter @lapis-notes/cv test:storybook` MUST fail when a 7020 story reports an axe violation.

### LN-CV-021 acceptance details

Toolbar and tab type verifies:

- The toolbar title, YAML label, and preview mode button MUST compute to 14px.
- Form-area tab triggers MUST compute to 14px.
- Those controls MUST use the resolved sans family, not the browser UI font.

## Ownership

Reusable Plugin and `TextFileView` contracts remain in `@lapis-notes/api`.
Public form orchestrators remain in `@lapismd/design-core/forms`. The CV
package owns filename association, YAML parse/normalize/compile, the `cv`
workspace view, and browser WASM preview assets. Search retains indexing
policy. Applications and tasks stay unspecified. The package Storybook may
boot File Explorer and Search beside CV to verify host enablement.
