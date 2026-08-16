# Explorer Plugin

`@lapis-notes/file-explorer` owns the reusable Explorer view and its canonical
command opener. Vault, file-manager, workspace navigation, and editor-demo
requirements remain defined at their owning API and host boundaries.

The package exports its production `ExplorerPanel` for Autodocs. Canonical
Storybook coverage remains registration-driven and demonstrates Explorer in
all six command-panel placements under `Plugins/Explorer/Panels/Explorer`.
