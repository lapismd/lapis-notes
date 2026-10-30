# Bases Plugin / Context

The package consumes the published Design Core semver contract. Runtime and
tests MUST NOT depend on a sibling-repository path or a workspace `link:`
override; local source overrides remain an optional development concern.
Real-App Bases plays wait for explicit workspace and embed readiness under the
same bounded startup window used by the rest of the full catalog acceptance.

## Public surface

`BasesViewSurface` is the focused rendering boundary. Consumers provide an
`App` and normalized document; file-view persistence, Markdown processors, and
managed-plugin lifecycle remain `BasesPlugin` responsibilities. Built-in view
registrations combine with App registrations unless an explicit mapping
overrides a matching type.
Focused view stories boot the optional bundled plugin against the canonical
Projects seed before mounting this public surface.

The port keeps query and TanStack-to-Svelte adapters private. Package evidence
retains the legacy 14-file / 142-test baseline and adds regressions for explicit
App flow, ordered and flushed writes, URL revocation, invalid read-only YAML,
and the published entrypoint without expanding the public surface.
Deno desktop, web, and the real-App catalog import the plugin and stylesheet from
the package, register it as optional bundled and default-enabled, and load it
before metadata and persisted layout restoration.

## Presentation and workflow components

The table surface owns measured virtual rows, sortable and draggable columns,
wrapped multivalue editing, inline metadata editing, and summaries. Cards own
cover resolution and URL cleanup.
Card queries project the configured image property even when that property is
not displayed in the card field order.
List owns collapsible groups. Map and unknown surfaces are explicit bounded
fallbacks. Header and settings compounds own query controls, schema visibility,
formulas, summaries, limits, view management, new-file, and CSV workflows.
The Bases stylesheet keeps legacy density local to these surfaces; current
Design Core remains the authority for theme colors and typography. Source mode
uses a Bases-owned YAML editor registration rather than treating `yaml` as a
file view or relying on an unregistered extension alias.
The Bases leaf declares `ViewAccess.file`: `.bases` and `.base` associations
remain its explicit file-backed opening path rather than a palette panel.

## Intentional parity gaps

This intake preserves the legacy package rather than expanding it. A real map
provider, complete Obsidian value wrappers and method-style formula semantics,
`this` binding, richer file/link behavior, deeper grouped summaries, removal of
the compatibility/runtime duplication, and behavioral parity beyond exported
name comparison remain future work tracked in the owning canonical backlog topic.
The current query source lowers safe candidates into AppDatabase filters and
reads unbounded candidate sets in stable path pages. A fully lowered view limit
uses one bounded sorted page; final PEaQL evaluation remains authoritative.
