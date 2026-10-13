# Plugin Model / Context — Part 2

Community (`@lapis-notes/community`) is parked for this release. The application
profile excludes its constructor, styles and dependency. The API-owned
registry schema and generic installed-plugin support remain available.

Static plugin distribution consumes the API-owned registry schema under LN-PKG-150. The API retains its transport-neutral Nostr adapter extension point; concrete Community relay bindings remain deferred outside the active application profile.

The Plugins workspace browser preserves Community registry markup, typography,
filter selection and chip styling, cards, media gallery/viewer, and detail
layout (LN-PLUG-099–101). Adaptations bind the API catalog, verified resources,
and host install/update actions; Community runtime, authentication, reviews,
and comments remain parked. Cards navigate to details, where install and update
controls match the reviewed Community presentation. The paused implementation resumes after the user's
Storybook review; visual baselines remain pending separate approval.

For LN-PLUG-098, openers MUST use the public workspace activation operation after
revealing the selected leaf so the renderer and persisted layout select the
Plugins tab. Acceptance MUST open it from a workspace without a Plugins leaf and
verify that repeated activation reuses that leaf and returns to the homepage.

The Plugins browser contributes Registry and Plugins navigation through the native
view breadcrumbs and Refresh through the native view action. Its body keeps the
curved AppShell frame, Community content layout, bold section headings and line
section tabs. The active section indicator covers the tab-list divider without
a gap below it. Success chips preserve normal-text contrast on the catalog
background. Graph review fixtures cover distinct banner, overview and gallery
images with preview, full, light and dark variants (LN-PLUG-101).

Ungrouped left/right sidebar details also show Registry-to-Plugins-to-plugin
breadcrumbs above the content. Visibility uses the shared sidebar's existing
`data-ui-part="sidebar-body"` and `data-content-kind="tab"` CSS hooks, without
runtime placement inspection. Grouped and main-area views retain native header
breadcrumbs. Plugins restores the originating page and scroll state; Registry
returns home (LN-PLUG-101).

Available updates are installed-plugin upgrades approved by the shared distribution
read model (`canUpdate`), excluding bundled plugins. The Updates landing section
and removable directory filter use the same set; recent release dates do not
imply an installed upgrade. Details show Update for an eligible plugin and refresh
the section and filtered results after successful installation (LN-PLUG-099,
LN-PLUG-100, LN-PLUG-102). Old layouts default to no Updates filter; restored
layouts retain a validated boolean filter (LN-PLUG-103).

- Landing category tiles and directory filters share purpose-specific icons and catalog counts.

- Landing lanes, categories, detail columns, and directory controls respond to the owning plugin pane width.

- In compact mode, the directory body navigation uses the public WorkspaceSidebarToggle used by Lapis sidebars to expose the registered left filter panel through AppShell's mobile controller.

- The compact directory header places a Registry-to-Plugins breadcrumb immediately after the shared toggle; Registry returns to the homepage.

- The filter overlay omits that toggle and uses the shell dismissal control.

- Closing restores focus to the collapsed toggle.

- The compact header retains one row, with toggle and breadcrumb on the left and view/sort controls on the right.

- Single-column results hide List/Cards; the breadcrumb truncates and sorting stays compact.

- Repeated breadcrumb navigation retains one live filter panel.

- Results appear immediately above search; Clear all is a small circular icon action with an accessible name and a Shadcn tooltip (LN-PLUG-099–101).

The registry snapshot review stories under LN-PLUG-099–101 MUST use unchanged
local release-preview metadata through the public HTTP distribution manager and
schema. Provenance records source commits and copied-file hashes. All catalog
details are verified before mounting; real media bytes pass the public image
verifier. Optional absent fields MUST remain absent, Community stays excluded,
and the stories MUST distinguish snapshot presentation from production or
installation acceptance. Human review and broader work remain pending.

Settings Browse, Updates, and registry search results use the same Plugins view opener. Navigation reuses its existing placement, selects the plugin, reveals and activates the leaf, then closes Settings. If navigation fails, Settings remains open with an App-owned error notice (LN-PLUG-056, LN-PLUG-060).
