# Shared conflict disk acceptance

Desktop adoption of Workspace 0.3.0 exposed four failing conflict scenarios:
explicit disk acceptance was missing from the shared screen. The Desktop-owned
duplicate presentation is being removed separately; its assertions are retained.

A new owning Storybook regression first failed once because the visible action
was absent. It now passes after restoring the captured `use-external` action,
including preserving deletion instead of writing an empty merged result. The
action remains disabled during busy, inhibited and unreadable states.

The initial test-registration attempt failed before collection (missing catalog
ID). The first post-fix cold attempt failed before collection after Vite
discovered the new Undo icon. Its public dependency is now eagerly inventoried,
and the next cold exact run passed. Neither diagnostics nor timing were weakened.

Workspace's 38 tests in eight files, strict type/Svelte checks (zero diagnostics),
build and publint pass. All three conflict stories pass in a fresh browser.
All six specification lanes pass, including 67 tooling cases. Hosted broad
source gates and Desktop packed-export acceptance remain pending. Visual review and package
publication remain separate; the source carries a Workspace patch changeset.
