# UI and Styling / Context

The existing user-approved Bits UI `2.19.5` Link Preview lifecycle patch is
retained for the direct runtime refresh, so canceled selection probes and listener
cleanup remain qualified. This reuses the approved correction without extending
its scope; the legacy `2.18.1` patch still covers remaining transitive users.

Notes pins its direct Bits UI runtime to published `2.19.5`, including the
upstream document text-selection listener teardown fix. Dependency-originated
Svelte diagnostics remain fatal, and retained diagnostics fail after story
teardown even when component cleanup catches the immediate exception.

UI and Workspace consumers require published Design Core `^0.6.0`, retaining bold Settings headings, selected-tab separator alignment, native window-controls allowances and mobile shell teardown alongside prepared browser CSS and bundled fonts. Presentation continues to use public Design Core tokens and components.

UI 0.1.1 carries the shared search-highlight tokens used by the static registry
plugin candidates. API consumers require that public version while continuing
to use the owning theme and component contracts.

UI development uses the qualified Svelte version from LN-PKG-149 so API and
workspace consumers share one Design Core type and renderer graph. This changes
compiler qualification without changing component paint or public styling tokens.

Design Core styling and components resolve through the repository's current
published semver range and committed lockfile, with source fixes remaining in
the owning package.

## Swap map (normative intent)

Shared shadcn families (button, input, dialog, select, tooltip, table, menus,
progress, slider, context-menu, drawer, …) MUST come from
`@lapismd/design-core/shadcn/*`. Lapis-custom compounds (`modal`,
`confirm-dialog`, `search`, `sidebar-custom`, `table-dnd`) stay in
`@lapis-notes/ui` and compose design-core primitives. Confirm-dialog MUST keep
Design Core `dialog` host identity so overlay and surface paint apply; its
colocated CSS MAY only add `--ui-confirm-dialog-*` sizing. Date/time settings
use `@lapismd/design-core/forms` (`DatePicker` / `TimePicker`).

The workspace shell uses native CSS scoped by `data-ui-component` and
`data-ui-part` attributes, with public `--ui-workspace-*` tokens supplied by
design-core. It does not add a Tailwind-based component styling surface.
