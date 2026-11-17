/** Catalog of API-consumed `@lapis-notes/ui` verification stories. */

export {
  pluginPanelCatalog,
  pluginPanelFamilies,
  pluginPanelPlacements,
} from "./plugin-panels.mjs";
import { pluginPanelCatalog } from "./plugin-panels.mjs";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   spec: string;
 *   publicSurface: string;
 *   storyId: string;
 *   skipVisual?: boolean;
 * }} CatalogEntry
 */

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
const basesViewsCatalog = [
  ["table", "Table"],
  ["editable-cells", "Editable Cells"],
  ["cards", "Cards"],
  ["grouped-list", "Grouped List"],
  ["map", "Map Unavailable"],
  ["unknown", "Unknown View"],
].map(([scenario, title]) => ({
  id: `plugins-bases-views-${scenario}`,
  title: `Bases Views: ${title}`,
  spec: "spec/src/plugins/bases/index.md",
  publicSurface: "@lapis-notes/bases",
  storyId: `plugins-bases-views--${
    scenario === "grouped-list"
      ? "grouped-list"
      : scenario === "map"
        ? "map-unavailable"
        : scenario === "unknown"
          ? "unknown-view"
          : scenario
  }`,
}));

/** @type {CatalogEntry[]} */
const basesWorkflowsCatalog = [
  ["query-controls", "Query Controls"],
  ["schema-settings", "Schema and View Settings"],
  ["editable-cells", "Editable Cells"],
].map(([scenario, title]) => ({
  id: `plugins-bases-workflows-${scenario}`,
  title: `Bases Workflows: ${title}`,
  spec: "spec/src/plugins/bases/index.md",
  publicSurface: "@lapis-notes/bases",
  storyId: `plugins-bases-workflows--${scenario}`,
}));

/** @type {CatalogEntry[]} */
export const workspaceCatalog = [
  ...basesViewsCatalog,
  ...basesWorkflowsCatalog,
  {
    id: "plugins-bases-shell-desktop",
    title: "Bases Shell: Desktop",
    spec: "spec/src/plugins/bases/index.md",
    publicSurface:
      "@lapis-notes/bases + @lapis-notes/file-explorer + @lapis-notes/search + @lapis-notes/workspace",
    storyId: "plugins-bases-shell--desktop",
  },
  {
    id: "plugins-bases-shell-mobile",
    title: "Bases Shell: Mobile",
    spec: "spec/src/plugins/bases/index.md",
    publicSurface:
      "@lapis-notes/bases + @lapis-notes/file-explorer + @lapis-notes/search + @lapis-notes/workspace",
    storyId: "plugins-bases-shell--mobile",
  },
  {
    id: "plugins-bases-shell-file-view",
    title: "Bases Shell: File View",
    spec: "spec/src/plugins/bases/index.md",
    publicSurface: "@lapis-notes/bases + @lapis-notes/workspace",
    storyId: "plugins-bases-shell-lifecycle--file-view",
  },
  {
    id: "plugins-bases-embeds-markdown",
    title: "Bases Markdown Embeds",
    spec: "spec/src/plugins/bases/index.md",
    publicSurface: "@lapis-notes/bases + @lapis-notes/api",
    storyId: "plugins-bases-embeds--markdown",
  },
  {
    id: "plugins-history-shell-desktop",
    title: "History Shell: Desktop",
    spec: "spec/src/plugins/history/index.md",
    publicSurface:
      "@lapis-notes/history + @lapis-notes/file-explorer + @lapis-notes/search + @lapis-notes/workspace",
    storyId: "plugins-history-shell--desktop",
  },
  {
    id: "plugins-history-shell-mobile",
    title: "History Shell: Mobile",
    spec: "spec/src/plugins/history/index.md",
    publicSurface:
      "@lapis-notes/history + @lapis-notes/file-explorer + @lapis-notes/search + @lapis-notes/workspace",
    storyId: "plugins-history-shell--mobile",
  },
  {
    id: "plugin-history-compare-current",
    title: "History Compare: Current",
    spec: "spec/src/plugins/history/index.md",
    publicSurface: "@lapis-notes/history",
    storyId: "plugins-history-compare--compare-current",
  },
  {
    id: "plugin-history-compare-previous",
    title: "History Compare: Previous",
    spec: "spec/src/plugins/history/index.md",
    publicSurface: "@lapis-notes/history",
    storyId: "plugins-history-compare--compare-previous",
  },
  {
    id: "plugin-history-compare-selected",
    title: "History Compare: Selected",
    spec: "spec/src/plugins/history/index.md",
    publicSurface: "@lapis-notes/history",
    storyId: "plugins-history-compare--compare-selected",
  },
  {
    id: "plugin-history-compare-restore",
    title: "History Compare: Restore",
    spec: "spec/src/plugins/history/index.md",
    publicSurface: "@lapis-notes/history",
    storyId: "plugins-history-compare--restore-revision",
  },
  {
    id: "plugins-bases-shell-disable-restore",
    title: "Bases Shell: Disable and Restore",
    spec: "spec/src/plugins/bases/index.md",
    publicSurface: "@lapis-notes/bases + @lapis-notes/workspace",
    storyId: "plugins-bases-shell-lifecycle--disable-and-restore",
  },
  {
    id: "workspace-lapis-editor-demo-ready",
    title: "Lapis Editor Demo Ready",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/workspace + story-local core plugins",
    storyId: "workspace-lapis-editor-demo--ready",
  },
  {
    id: "workspace-lapis-editor-demo-sync-editor-persistence",
    title: "Lapis Editor Demo Sync Editor Persistence",
    spec: "spec/src/architecture/editor-integration.md",
    publicSurface: "@lapis-notes/api + @lapis-notes/workspace",
    storyId: "workspace-lapis-editor-demo--sync-editor-persistence",
  },
  {
    id: "workspace-lapis-editor-demo-sync-independent-writer-admission",
    title: "Lapis Editor Demo Sync Independent Writer Admission",
    spec: "spec/src/architecture/editor-integration.md",
    publicSurface: "@lapis-notes/api + @lapis-notes/workspace",
    storyId: "workspace-lapis-editor-demo--sync-independent-writer-admission",
  },
  {
    id: "workspace-lapis-editor-demo-sync-protected-editor",
    title: "Lapis Editor Demo Sync Protected Editor",
    spec: "spec/src/architecture/editor-integration.md",
    publicSurface: "@lapis-notes/api + @lapis-notes/workspace",
    storyId: "workspace-lapis-editor-demo--sync-protected-editor",
  },
  {
    id: "workspace-lapis-editor-demo-sync-document-loading-and-rename",
    title: "Lapis Editor Demo Sync Document Loading And Rename",
    spec: "spec/src/architecture/editor-integration.md",
    publicSurface: "@lapis-notes/api + @lapis-notes/workspace",
    storyId: "workspace-lapis-editor-demo--sync-document-loading-and-rename",
  },
  {
    id: "workspace-lapis-editor-demo-inline-source-editor-spacing",
    title: "Lapis Editor Demo Inline Source Editor Spacing",
    spec: "spec/src/packages/editor-apis.md",
    publicSurface: "@lapis-notes/api/editor/core",
    storyId: "workspace-lapis-editor-demo--inline-source-editor-spacing",
  },
  {
    id: "workspace-lapis-editor-demo-yaml-source",
    title: "Lapis Editor Demo YAML Source",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/source-editor",
    storyId: "workspace-lapis-editor-demo--yaml-source",
  },
  {
    id: "workspace-lapis-editor-demo-markdown-problems",
    title: "Lapis Editor Demo Markdown Problems",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/markdown-lint + workspace Problems",
    storyId: "workspace-lapis-editor-demo--markdown-problems",
  },
  {
    id: "workspace-lapis-editor-demo-markdown-spellcheck",
    title: "Lapis Editor Demo Markdown Spell Check",
    spec: "spec/src/plugins/spellcheck/index.md",
    publicSurface: "@lapis-notes/spellcheck + workspace Problems",
    storyId: "workspace-lapis-editor-demo--markdown-spellcheck",
  },
  {
    id: "workspace-lapis-editor-demo-markdown-lint-loft-boarding",
    title: "Lapis Editor Demo Markdown Lint Loft Boarding",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/markdown-lint + workspace Problems",
    storyId: "workspace-lapis-editor-demo--markdown-lint-loft-boarding",
  },
  {
    id: "workspace-lapis-editor-demo-same-file-split-sync",
    title: "Lapis Editor Demo Same File Split Sync",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/api source editors",
    storyId: "workspace-lapis-editor-demo--same-file-split-sync",
  },
  {
    id: "workspace-lapis-editor-demo-markdown-frontmatter",
    title: "Lapis Editor Demo Markdown Frontmatter",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/markdown + @lapismd/mira",
    storyId: "workspace-lapis-editor-demo--markdown-frontmatter",
  },
  {
    id: "workspace-lapis-editor-demo-markdown-authoring",
    title: "Lapis Editor Demo Markdown Authoring",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/markdown + @lapismd/mira",
    storyId: "workspace-lapis-editor-demo--markdown-authoring",
  },
  {
    id: "workspace-lapis-editor-demo-markdown-reading-outline",
    title: "Lapis Editor Demo Markdown Reading Outline",
    spec: "spec/src/editor-demo.md",
    publicSurface: "@lapis-notes/markdown + @lapismd/mira",
    storyId: "workspace-lapis-editor-demo--markdown-reading-outline",
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
    id: "workspace-shell-responsive-mode",
    title: "Responsive Mode",
    spec: "spec/src/workspace-shell.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-shell--responsive-mode",
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
  {
    id: "workspace-editing-recovery-detached",
    title: "Editing Recovery: Detached Claim",
    spec: "spec/src/architecture/native-editor-intents.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-editing-recovery--detached-claim",
  },
  {
    id: "workspace-editing-recovery-admission",
    title: "Editing Recovery: Admission Failure",
    spec: "spec/src/architecture/native-editor-intents.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-editing-recovery--admission-failure",
  },
  {
    id: "workspace-editing-recovery-handoff",
    title: "Editing Recovery: Handoff Failure",
    spec: "spec/src/architecture/native-editor-intents.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-editing-recovery--handoff-failure",
  },
  {
    id: "workspace-file-conflicts-edit-and-save",
    title: "File Conflicts: Edit And Save",
    spec: "spec/src/workspace-shell/panels/problems/core-contract.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-file-conflicts--edit-and-save",
  },
  {
    id: "workspace-file-conflicts-close-and-reopen",
    title: "File Conflicts: Close And Reopen",
    spec: "spec/src/workspace-shell/panels/problems/core-contract.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-file-conflicts--close-and-reopen",
  },
  {
    id: "workspace-file-conflicts-accept-disk-deletion",
    title: "File Conflicts: Accept Disk Deletion",
    spec: "spec/src/workspace-shell/panels/problems/core-contract.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-file-conflicts--accept-disk-deletion",
  },
  ...pluginPanelCatalog,
  {
    id: "workspace-plugins-app-link-release-selection",
    title: "Plugins App Link Release Selection",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--app-link-release-selection",
  },
  {
    id: "workspace-plugins-app-link-unavailable-version",
    title: "Plugins App Link Unavailable Version",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--app-link-unavailable-version",
  },
  {
    id: "workspace-plugins-detail-images-loading",
    title: "Plugin Detail Images Loading",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--detail-images-loading",
  },
  {
    id: "workspace-plugins-detail-images-unavailable",
    title: "Plugin Detail Images Unavailable",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--detail-images-unavailable",
  },
  {
    id: "workspace-plugin-management-updates-details",
    title: "Settings Updates to Plugins Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugin-management--updates-open-plugins-details",
  },
  {
    id: "workspace-plugin-management-moved-details",
    title: "Settings Browse Reuses Moved Plugins View",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugin-management--browse-reuses-moved-plugins-view",
  },
  {
    id: "workspace-plugins-snapshot-landing",
    title: "Plugins Snapshot Landing",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--landing",
  },
  {
    id: "workspace-plugins-snapshot-directory",
    title: "Plugins Snapshot Directory",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--directory",
  },
  {
    id: "workspace-plugins-snapshot-graph-details",
    title: "Plugins Snapshot Graph Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--graph-details",
  },
  {
    id: "workspace-plugins-snapshot-ai-details",
    title: "Plugins Snapshot AI Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--ai-details",
  },
  {
    id: "workspace-plugins-snapshot-loading-landing",
    title: "Plugins Snapshot Loading Landing",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--loading-landing",
  },
  {
    id: "workspace-plugins-snapshot-loading-directory",
    title: "Plugins Snapshot Loading Directory",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--loading-directory",
  },
  {
    id: "workspace-plugins-snapshot-loading-plugin",
    title: "Plugins Snapshot Loading Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins-registry-snapshot--loading-details",
  },
  {
    id: "workspace-plugins-responsive-landing",
    title: "Plugins Responsive Landing",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--responsive-landing",
  },
  {
    id: "workspace-plugins-responsive-directory",
    title: "Plugins Responsive Directory",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--responsive-directory",
  },
  {
    id: "workspace-plugins-responsive-details",
    title: "Plugins Responsive Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--responsive-details",
  },
  {
    id: "workspace-plugins-updates-landing",
    title: "Plugins Updates Landing",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--updates-landing",
  },
  {
    id: "workspace-plugins-installed-landing-management",
    title: "Plugins Installed Landing Management",
    spec: "spec/src/plugin-model/distribution-and-registry-01.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--installed-landing-management",
  },
  {
    id: "workspace-plugins-bulk-install-selection",
    title: "Plugins Bulk Install Selection",
    spec: "spec/src/plugin-model/distribution-and-registry-01.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--bulk-install-selection",
  },
  {
    id: "workspace-plugins-updates-directory",
    title: "Plugins Updates Directory",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--updates-directory",
  },
  {
    id: "workspace-plugins-installed-directory-management",
    title: "Plugins Installed Directory Management",
    spec: "spec/src/plugin-model/distribution-and-registry-01.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--installed-directory-management",
  },
  {
    id: "workspace-plugins-update-details",
    title: "Plugins Update Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--update-details",
  },
  {
    id: "workspace-plugins-directory",
    title: "Plugins Directory",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--directory",
  },
  {
    id: "workspace-plugins-graph-details",
    title: "Plugins Graph Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--graph-details",
  },
  {
    id: "workspace-plugins-plugin-details",
    title: "Plugins Plugin Details",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--plugin-details",
  },
  {
    id: "workspace-plugins-plugin-changelog",
    title: "Plugins Plugin Changelog",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--plugin-changelog",
  },
  {
    id: "workspace-plugins-media-viewer",
    title: "Plugins Media Viewer",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--media-viewer",
  },
  {
    id: "workspace-plugins-middle-top-tabs",
    title: "Plugins Middle (Top Tabs)",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--middle-top-tabs",
  },
  {
    id: "workspace-plugins-stacked-tabs",
    title: "Plugins Stacked Tabs",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--stacked-tabs",
  },
  {
    id: "workspace-plugins-left-sidebar",
    title: "Plugins Left Sidebar",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--left-sidebar",
  },
  {
    id: "workspace-plugins-right-sidebar",
    title: "Plugins Right Sidebar",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--right-sidebar",
  },
  {
    id: "workspace-plugins-bottom-panel",
    title: "Plugins Bottom Panel",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--bottom-panel",
  },
  {
    id: "workspace-plugins-sidebar-as-a-group",
    title: "Plugins Sidebar As a Group",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--sidebar-as-a-group",
  },
  {
    id: "workspace-plugins-category-details-and-install",
    title: "Plugins Category Details and Install",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--category-details-and-install",
  },
  {
    id: "workspace-plugins-ribbon-opens-plugins",
    title: "Plugins Ribbon Opens Plugins",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--ribbon-opens-plugins",
  },
  {
    id: "workspace-plugins-update-plugin",
    title: "Plugins Update Plugin",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--update-plugin",
  },
  {
    id: "workspace-plugins-install-failure",
    title: "Plugins Install Failure",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--install-failure",
  },
  {
    id: "workspace-plugins-catalog-unavailable",
    title: "Plugins Catalog Unavailable",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--catalog-unavailable",
  },
  {
    id: "workspace-plugins-empty-registry",
    title: "Plugins Empty Registry",
    spec: "spec/src/plugin-model.md",
    publicSurface: "@lapis-notes/workspace",
    storyId: "workspace-plugins--empty-registry",
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
