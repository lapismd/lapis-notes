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
    publicSurface: "@lapis-notes/ui/button",
    storyId: "api-button--button",
  },
  {
    id: "api-input",
    title: "Input",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/input",
    storyId: "api-input--input",
  },
  {
    id: "api-textarea",
    title: "Textarea",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/textarea",
    storyId: "api-textarea--textarea",
  },
  {
    id: "api-switch",
    title: "Switch",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/switch",
    storyId: "api-switch--switch",
  },
  {
    id: "api-slider",
    title: "Slider",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/slider",
    storyId: "api-slider--slider",
  },
  {
    id: "api-progress",
    title: "Progress",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/progress",
    storyId: "api-progress--progress",
  },
  {
    id: "api-select",
    title: "Select",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/select",
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
    publicSurface: "@lapis-notes/ui/tooltip",
    storyId: "api-tooltip--tooltip",
  },
  {
    id: "api-popover",
    title: "Popover",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/popover",
    storyId: "api-popover--popover",
  },
  {
    id: "api-command",
    title: "Command",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/command",
    storyId: "api-command--command",
  },
  {
    id: "api-dropdown-menu",
    title: "Dropdown Menu",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/dropdown-menu",
    storyId: "api-dropdown-menu--dropdown-menu",
  },
  {
    id: "api-context-menu",
    title: "Context Menu",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/context-menu",
    storyId: "api-context-menu--context-menu",
  },
  {
    id: "api-drawer",
    title: "Drawer",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/drawer",
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
    id: "api-date-time-picker-dialog",
    title: "Date Time Picker Dialog",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/date-time-picker-dialog",
    storyId: "api-date-time-picker-dialog--date-time-picker-dialog",
  },
  {
    id: "api-scroll-area",
    title: "Scroll Area",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/scroll-area",
    storyId: "api-scroll-area--scroll-area",
  },
  {
    id: "api-table",
    title: "Table",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/table",
    storyId: "api-table--table",
  },
  {
    id: "api-toggle-group",
    title: "Toggle Group",
    spec: "spec/src/storybook-catalog.md",
    publicSurface: "@lapis-notes/ui/toggle-group",
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

export const visualPendingTags = ["visual-pending", "test"];
export const skipVisualTags = ["skip-visual", "test"];
