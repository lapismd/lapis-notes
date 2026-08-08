/**
 * Catalog of API-consumed `@lapis-notes/ui` verification stories.
 */

/** @typedef {{ id: string, title: string, spec: string, publicSurface: string, storyId: string, skipVisual?: boolean }} CatalogEntry */

/** @type {CatalogEntry[]} */
export const apiUiCatalog = [
  {
    id: "api-button",
    title: "Button",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/button",
    storyId: "api-button--button",
  },
  {
    id: "api-input",
    title: "Input",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/input",
    storyId: "api-input--input",
  },
  {
    id: "api-textarea",
    title: "Textarea",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/textarea",
    storyId: "api-textarea--textarea",
  },
  {
    id: "api-switch",
    title: "Switch",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/switch",
    storyId: "api-switch--switch",
  },
  {
    id: "api-slider",
    title: "Slider",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/slider",
    storyId: "api-slider--slider",
  },
  {
    id: "api-progress",
    title: "Progress",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/progress",
    storyId: "api-progress--progress",
  },
  {
    id: "api-select",
    title: "Select",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/select",
    storyId: "api-select--select",
  },
  {
    id: "api-search",
    title: "Search",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/search",
    storyId: "api-search--search",
  },
  {
    id: "api-tooltip",
    title: "Tooltip",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/tooltip",
    storyId: "api-tooltip--tooltip",
  },
  {
    id: "api-popover",
    title: "Popover",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/popover",
    storyId: "api-popover--popover",
  },
  {
    id: "api-command",
    title: "Command",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/command",
    storyId: "api-command--command",
  },
  {
    id: "api-dropdown-menu",
    title: "Dropdown Menu",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/dropdown-menu",
    storyId: "api-dropdown-menu--dropdown-menu",
  },
  {
    id: "api-context-menu",
    title: "Context Menu",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/context-menu",
    storyId: "api-context-menu--context-menu",
  },
  {
    id: "api-drawer",
    title: "Drawer",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/drawer",
    storyId: "api-drawer--drawer",
  },
  {
    id: "api-modal",
    title: "Modal",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/modal",
    storyId: "api-modal--modal",
  },
  {
    id: "api-confirm-dialog",
    title: "Confirm Dialog",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/confirm-dialog",
    storyId: "api-confirm-dialog--confirm-dialog",
  },
  {
    id: "api-date-setting",
    title: "Date Setting",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/forms",
    storyId: "api-date-setting--date-setting",
  },
  {
    id: "api-scroll-area",
    title: "Scroll Area",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/scroll-area",
    storyId: "api-scroll-area--scroll-area",
  },
  {
    id: "api-table",
    title: "Table",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/table",
    storyId: "api-table--table",
  },
  {
    id: "api-toggle-group",
    title: "Toggle Group",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapismd/design-core/shadcn/toggle-group",
    storyId: "api-toggle-group--toggle-group",
  },
  {
    id: "api-sidebar-custom",
    title: "Sidebar Custom",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/sidebar-custom",
    storyId: "api-sidebar-custom--sidebar-custom",
  },
  {
    id: "api-table-dnd",
    title: "Table DnD",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/table-dnd",
    storyId: "api-table-dnd--table-dnd",
  },
  {
    id: "api-helpers",
    title: "Helpers",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui",
    storyId: "api-helpers--helpers",
    skipVisual: true,
  },
];

/** @type {CatalogEntry[]} */
export const workspaceCatalog = [
  {
    id: "workspace-lapis-editor-demo-ready",
    title: "Lapis Editor Demo Ready",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/workspace + story-local core plugins",
    storyId: "workspace-lapis-editor-demo--ready",
  },
  {
    id: "workspace-lapis-editor-demo-same-file-split-sync",
    title: "Lapis Editor Demo Same File Split Sync",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/api source editors",
    storyId: "workspace-lapis-editor-demo--same-file-split-sync",
  },
  {
    id: "workspace-lapis-editor-demo-explorer-mutations",
    title: "Lapis Editor Demo Explorer Mutations",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapismd/design-core/workspace/explorer",
    storyId: "workspace-lapis-editor-demo--explorer-mutations",
  },
  {
    id: "workspace-lapis-editor-demo-editor-settings",
    title: "Lapis Editor Demo Editor Settings",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapismd/design-core/workspace/settings",
    storyId: "workspace-lapis-editor-demo--editor-settings",
  },
  {
    id: "workspace-lapis-editor-demo-loading-plugins",
    title: "Lapis Editor Demo Loading Plugins",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapismd/design-core/workspace/startup",
    storyId: "workspace-lapis-editor-demo--loading-plugins",
  },
  {
    id: "workspace-lapis-editor-demo-startup-failure",
    title: "Lapis Editor Demo Startup Failure",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapismd/design-core/workspace/startup",
    storyId: "workspace-lapis-editor-demo--startup-failure",
  },
  {
    id: "workspace-lapis-editor-demo-explorer-opening-vault",
    title: "Lapis Editor Demo Explorer Opening Vault",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapismd/design-core/workspace/explorer",
    storyId: "workspace-lapis-editor-demo--explorer-opening-vault",
  },
  {
    id: "workspace-shell-persisted-desktop",
    title: "Persisted Desktop",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--persisted-desktop",
  },
  {
    id: "workspace-shell-mobile",
    title: "Mobile",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--mobile",
  },
  {
    id: "workspace-shell-notification-center",
    title: "Notification Center",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--notification-center",
  },
  {
    id: "workspace-shell-about-lapis-notes",
    title: "About Lapis Notes",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--about-lapis-notes",
  },
  {
    id: "workspace-shell-stacked-tabs",
    title: "Stacked Tabs",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--stacked-tabs",
  },
  {
    id: "workspace-shell-bottom-panel-settings",
    title: "Bottom Panel Settings",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--bottom-panel-settings",
  },
];

export function catalogParameters(catalogId) {
  const entry = apiUiCatalog.find((item) => item.id === catalogId);
  if (!entry) {
    throw new Error(`Unknown catalog id: ${catalogId}`);
  }
  return {
    lapis: {
      catalogId: entry.id,
      spec: entry.spec,
      publicSurface: entry.publicSurface,
    },
  };
}

export function workspaceCatalogParameters(catalogId) {
  const entry = workspaceCatalog.find((item) => item.id === catalogId);
  if (!entry) {
    throw new Error(`Unknown workspace catalog id: ${catalogId}`);
  }
  return {
    lapis: {
      catalogId: entry.id,
      spec: entry.spec,
      publicSurface: entry.publicSurface,
    },
  };
}

export const visualPendingTags = ["visual-pending", "test"];
export const skipVisualTags = ["skip-visual", "test"];
