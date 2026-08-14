# Roles Plugin

`@lapis-notes/roles` owns vault-native role workflows and the retained CV YAML
file views. Role documents and CV files remain the source of truth; aggregate
views are projections. The package composes public Design Core and Mira
surfaces without adding a server, database, AI, or task subsystem.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-CV-001 | The repo MAY ship `@lapis-notes/roles` at `packages/plugins/plugin-roles`. It MUST retain CV file views while Tasks and AI remain outside the package. |
| LN-CV-002 | The plugin MUST register through the existing API `Plugin` surface: `registerView`, `registerEditorView`, and `registerExtensions`. It MUST NOT introduce a parallel loader or settings framework. |
| LN-CV-003 | When enabled, the plugin MUST own view type `cv` with exclusive filename patterns `*.cv.yml` and `*.cv.yaml` and compound extensions `cv.yml` and `cv.yaml`. |
| LN-CV-004 | Generic `.yml` and `.yaml` files MUST remain outside the CV association. |
| LN-CV-005 | `CvView` MUST extend API `TextFileView` so vault read and write remain the source of truth. The plugin MUST NOT add a server backend or AI path. |
| LN-CV-006 | The view MUST parse open vault content through the canonical `parseCvYaml` normalization boundary before it populates the structured form or preview. |
| LN-CV-007 | Generated preview MUST use the browser WASM Typst path. HTML compiled preview MAY remain a fallback when the worker fails. Node Typst and CV Studio API routes MUST NOT be used. |
| LN-CV-008 | Structured CV editing MUST compose public `@lapismd/design-core/forms` primitives. The plugin MUST NOT import Design Core's story-local Complete CV Form module. |
| LN-CV-009 | The plugin MUST NOT write Search documents or import Search internals. Vault indexing of CV files remains a later Search-owned change. |
| LN-CV-010 | Hosts MUST register Roles as an optional core plugin enabled by default and load it before metadata and layout restoration. |
| LN-CV-011 | `@lapis-notes/roles` MAY host a package Storybook on port 7020 for Roles, CV, and App-backed workspace stories. That host MUST use design-core styles and MUST NOT replace the repository catalog on 7010. |
| LN-CV-012 | The package Storybook MUST include one App-backed workspace story that registers File Explorer, Search, and optional Roles, restores explorer, search, and a `*.cv.yml` leaf, and asserts those three view types. |
| LN-CV-013 | The CV workspace MUST fill the leaf view host. AppShell main inset, radius, shadow, and border MUST be zeroed through documented `--ui-shell-main-*` tokens so the view is white edge to edge. |
| LN-CV-014 | The preview toolbar MUST offer Typst SVG, Typst PNG, Typst source, Markdown, and HTML. Typst SVG and PNG MUST come from the browser WASM worker. HTML, Markdown, and Typst source MUST come from compile output. A selected Typst page mode MUST NOT silently swap to HTML while a render is in flight. |
| LN-CV-015 | Preview zoom MUST stay between 25% and 250%. Typst pages, HTML, Markdown Preview and Source, and Typst source MUST share the same pane-relative width scale. Width MUST remain continuous across 100%, preserve the viewport anchor, and leave the pane split unchanged. |
| LN-CV-016 | The CV form area MUST show previous, current, and next RenderCV theme controls. Design, Locale, and Settings MUST hide that shortcut. Those controls MUST write `design.theme`, while the Design tab theme field remains available. |
| LN-CV-017 | The CV workspace MUST fill leftover height under the toolbar and form-area tabs. The leaf MUST NOT scroll as a whole. Form, YAML, and preview MUST each own an independent scrollport. |
| LN-CV-018 | The main toolbar MUST include a YAML switch that shows the YAML editor in the editor pane. Form and YAML MUST NOT appear as peer workspace tabs. Edit and Preview tabs MUST appear only when the form and preview columns stack into one row. |
| LN-CV-019 | On small viewports the main CV toolbar MUST scroll horizontally without visible scrollbars and MUST stay touch-pannable. |
| LN-CV-020 | Package Storybook on port 7020 MUST fail `pnpm --filter @lapis-notes/roles test:storybook` on axe violations. `.storybook/vitest.setup.ts` MUST register `@storybook/addon-a11y/preview`, and preview MUST set `parameters.a11y.test` to `error`. |
| LN-CV-021 | The toolbar title, YAML label, preview mode control, and form-area tabs MUST render at the design-core small text size of 0.875rem. |
| LN-CV-022 | Structured edits MUST preserve normalized evidence and every supported field outside the edited form fragment. Saving MUST NOT narrow the document to the visible form model. |
| LN-CV-023 | Invalid full-document YAML MUST remain editable in the shared YAML editor with an accessible parse error. Invalid drafts MUST NOT be written; a valid correction MUST restore the structured form and preview. |
| LN-CV-024 | Experience extra details MUST use only `text`, `comma_list`, or `semicolon_list`. The structured form MUST offer those values and MUST serialize the selected value unchanged. |
| LN-CV-025 | Structured and YAML edits MUST debounce vault writes for 1,200ms, serialize concurrent writes, and flush the latest value before file changes or view closure. A failed write MUST retain the dirty value and expose an accessible error. |
| LN-CV-026 | Typst SVG and PNG success stories MUST require real worker page output. Worker failure MUST be tested as the documented HTML fallback and MUST NOT satisfy a successful Typst story. |
| LN-CV-027 | Production CV styling MUST use public Design Core tokens and stable component selectors. Storybook host selectors and private CodeMirror classes MUST remain in catalog-owned styling or be omitted. |
| LN-CV-028 | The Markdown artifact MUST render compiled Markdown through Mira's public preview surface with the Lapis theme. It MUST NOT use a plain text or package-local Markdown renderer. |
| LN-CV-029 | The Markdown artifact MUST default to Preview and offer one focus-safe book-or-pencil action that switches between Preview and read-only Source without changing the compiled value. Both surfaces MUST fill their zoomed document width and remain free of outer inset, nested toolbar, border, radius, or shadow chrome in either mode. |
| LN-CV-030 | PDF export MUST offer Download to device and Save to vault. Both actions MUST use the current browser-worker PDF bytes. Vault export MUST save beside the source CV under the generated artifact filename and replace that file on later exports. Failures MUST remain visible and accessible. |
| LN-CV-031 | The form-area header MUST use Design Core Scroll Area for horizontal overflow. Its tab list and contextual actions MUST share one scroll track so constrained workspace panes keep every control reachable without making the leaf scroll. |
| LN-CV-032 | The main toolbar MUST place the book-or-pencil action and form expand-or-collapse action immediately after the YAML switch. The book-or-pencil action appears when Markdown is selected. Both actions MUST use the outlined icon-button treatment of PDF export. On the CV tab, collapse MUST hide visible section bodies while retaining hidden-header wrappers and the section headers needed to expand them. |
| LN-ROLE-001 | The plugin MUST register aggregate view type `roles`, file view type `role`, and command `roles:open`. The `role` view MUST exclusively match files whose exact basename is `role.md` ahead of generic Markdown. |
| LN-ROLE-002 | A role document MUST use YAML frontmatter for structured data and the Markdown body for its role description. New documents MUST set `schemaVersion: 1`, timestamps, ordering, and empty collections. |
| LN-ROLE-003 | Valid roles MUST have a unique `id`, non-empty `company` and `title`, and one supported status. Invalid or duplicate documents MUST remain source-editable and MUST be excluded from projections with an accessible diagnostic. |
| LN-ROLE-004 | Structured mutations MUST preserve unknown frontmatter fields semantically and leave the Markdown body unchanged. Writes MUST serialize per path and re-read the current document before patching. |
| LN-ROLE-005 | A plugin-owned manager MUST scan exact `role.md` files and react to vault create, modify, delete, and rename events. It MUST expose immutable valid-role snapshots plus document diagnostics. |
| LN-ROLE-006 | New roles MUST use `Roles/<unique-slug>/role.md`. Slug collisions MUST receive deterministic numeric suffixes without replacing an existing document. |
| LN-ROLE-007 | Applications MUST project the statuses `saved`, `applied`, `screening`, `interview`, `offer`, and `rejected` through the legacy CV Applications ticket-board component structure and native CSS. Status, ordering, filters, selection, collapse, resize, drag/drop, and card movement MUST retain the legacy pointer and keyboard behavior after adapting persistence to the vault manager. |
| LN-ROLE-008 | Role details MUST retain the legacy CV Applications detail-sheet, hero, lower-tab, Role, Comments, and Stages component structure and native CSS. They MUST edit structured fields, description, prep stages, comments, reactions, and linked CV paths through the role document. Public Design Core controls MAY replace equivalent leaf controls, and Mira MUST own Markdown source and preview, without changing the surrounding legacy geometry. |
| LN-ROLE-009 | The package MUST NOT depend on or import Tasks, task-derived actions, AI, Carta, CV Studio packages, application servers, or application databases. Ported Applications presentation MUST remove those branches while retaining the source component and styling contract. Unknown task metadata MAY survive semantic round trips but MUST remain unowned. |
| LN-ROLE-010 | Activity MUST derive chronological events from role timestamps and mutations, group them by local day, and render explicit gaps between non-adjacent dates. |
| LN-ROLE-011 | Actions MUST project `overdue`, `today`, `upcoming`, `waiting`, and `done` from follow-up, waiting, and recently-contacted role state. Done contact activity MUST use a seven-day window. |
| LN-ROLE-012 | Action controls MUST support snooze, reschedule, waiting, contact completion, and application status transitions by patching the owning role document. They MUST NOT create or mutate tasks. |
| LN-ROLE-013 | `cvFile` and `tailoredCvFile` MUST store vault-relative CV paths. Tailoring MUST create `Roles/<id>/<id>.cv.yml`, open an existing target without overwriting it, and use the retained `cv` view. |
| LN-ROLE-014 | The package MUST publicly export `RolesPlugin`, aggregate and detail workspaces, the three projection components, role parsing helpers, and role snapshot/action types. Existing public CV workspace and compiler APIs MUST remain available from the renamed package. |
| LN-ROLE-015 | Role presentation state MUST persist through plugin data rather than `role.md`. Search indexing MUST remain Search-owned and consume ordinary vault Markdown without Roles writing Search internals. |
| LN-ROLE-016 | Desktop and web hosts MUST register optional Roles before metadata and layout restoration. They MUST restore persisted `role`, `roles`, and retained `cv` leaves without forcing Roles into a default layout. |
| LN-ROLE-017 | Package Storybook MUST cover Role File, Applications, Activity, Actions, retained CV, and one real App-backed Roles shell. The shell story MUST open a persisted `role.md` from File Explorer while that file already has a workspace tab, assert that the existing role leaf and rendered tab are selected and the role surface is visible, then restore the CV leaf and finish with Search collapsed. New or changed visual stories MUST remain `visual-pending`. |
| LN-ROLE-018 | Root Storybook MUST include `Workspace/Plugins/Roles` acceptance for exact `role.md` association, aggregate opening, persisted mutation, and linked CV navigation. Only newly added Roles stories MAY receive new baselines in this slice. |
| LN-ROLE-019 | The plugin-owned Applications, Activity, Actions, and role-detail page content MUST have pixel parity with the corresponding `/Users/stevejuma/code/cv` component family at the governed 1280 by 900 light-theme reference viewport. The port MUST preserve the legacy DOM grouping, class semantics, typography, spacing, borders, colors, column geometry, ticket/action cards, activity gaps, `detail-perma` hero, and lower panels. Lapis retains ownership of the surrounding workspace shell and theme activation. |

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

- Minus, percent reset, and plus MUST move zoom in 15% steps between 25% and 250%.
- Every artifact mode MUST expose the same document width at the same zoom.
- At 85%, 100%, and 115%, the document MUST use 85%, 100%, and 115% of the available preview width.
- Ctrl or Cmd plus wheel on the preview scroller MUST change zoom.
- Button and wheel changes MUST preserve the visible document anchor while the pane still fills its split.

### LN-CV-016 acceptance details

The form-area theme shortcut verifies:

- Previous, current, and next theme controls MUST appear only while CV is the active form area.
- Next or a menu choice MUST update `source.design.theme`.
- Design, Locale, and Settings MUST omit the shortcut, while the Design tab CyclePicker theme field remains available.

### LN-CV-031 acceptance details

Constrained form-area navigation verifies:

- One horizontal Design Core Scroll Area MUST contain the tab list and active contextual actions.
- The CV theme shortcut MUST remain within that shared scroll track when applicable.
- Resizing the owning workspace pane MUST make overflow controls reachable without scrolling the workspace leaf.

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
- `pnpm --filter @lapis-notes/roles test:storybook` MUST fail when a 7020 story reports an axe violation.

### LN-CV-021 acceptance details

Toolbar and tab type verifies:

- The toolbar title, YAML label, and preview mode button MUST compute to 14px.
- Form-area tab triggers MUST compute to 14px.
- Those controls MUST use the resolved sans family, not the browser UI font.

### LN-CV-030 acceptance details

PDF export verifies:

- The export menu MUST expose Download PDF and Save PDF to vault when the host supplies vault persistence.
- Download PDF MUST create a browser download using the current PDF artifact and generated filename.
- Save PDF to vault MUST create or replace the generated file beside the open CV and report its path.

## Ownership

Reusable Plugin and `TextFileView` contracts remain in `@lapis-notes/api`.
Public form orchestrators remain in `@lapismd/design-core/forms`. Roles owns
role paths, vault persistence, application projections, filename associations,
CV parse/normalize/compile, the ported legacy Applications presentation, and
the `role`, `roles`, and `cv` views. Mira owns Markdown rendering and CodeMirror
source presentation. Search retains indexing policy. Tasks and AI remain
outside the package. Package Storybook may boot File Explorer and Search beside
Roles to verify host enablement.
