/**
 * Catalog of API-consumed `@lapis-notes/ui` verification stories.
 */

export {
  pluginPanelCatalog,
  pluginPanelFamilies,
  pluginPanelPlacements,
} from "./plugin-panels.mjs";
import { pluginPanelCatalog } from "./plugin-panels.mjs";

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
    id: "plugins-ai-chat-send",
    title: "AI Chat: Send And Complete",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--send-and-complete",
  },
  {
    id: "plugins-ai-chat-validation",
    title: "AI Chat: Validation And Empty State",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--validation-and-empty-state",
  },
  {
    id: "plugins-ai-chat-permission-requested",
    title: "AI Chat: Permission Requested",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--permission-requested",
  },
  {
    id: "plugins-ai-chat-permission-accepted",
    title: "AI Chat: Permission Accepted",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--permission-accepted",
  },
  {
    id: "plugins-ai-chat-question-asked",
    title: "AI Chat: Question Asked",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--question-asked",
  },
  {
    id: "plugins-ai-chat-question-answered",
    title: "AI Chat: Question Answered",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--question-answered",
  },
  {
    id: "plugins-ai-chat-tool-running",
    title: "AI Chat: Tool Running",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--tool-running",
  },
  {
    id: "plugins-ai-chat-tool-success",
    title: "AI Chat: Successful Tool Call",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--successful-tool-call",
  },
  {
    id: "plugins-ai-chat-tool-failure",
    title: "AI Chat: Failed Tool Call",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--failed-tool-call",
  },
  {
    id: "plugins-ai-chat-mentions",
    title: "AI Chat: File Mentions",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--file-mentions",
  },
  {
    id: "plugins-ai-chat-trace",
    title: "AI Chat: Agent Trace",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--agent-trace",
  },
  {
    id: "plugins-ai-chat-failure",
    title: "AI Chat: Failed Message And Retry",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--failed-message-and-retry",
  },
  {
    id: "plugins-ai-chat-scroll",
    title: "AI Chat: Scroll Recovery",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--scroll-recovery",
  },
  {
    id: "plugins-ai-chat-memory-recall",
    title: "AI Chat: Automatic Memory Recall",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--automatic-memory-recall",
  },
  {
    id: "plugins-ai-chat-app-tool-read",
    title: "AI Chat: Application Tool Read",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--app-tool-read-transcript",
  },
  {
    id: "plugins-ai-chat-app-tool-patch-approval",
    title: "AI Chat: Application Tool Patch Approval",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--app-tool-patch-approval",
  },
  {
    id: "plugins-ai-chat-app-tool-session-grant",
    title: "AI Chat: Application Tool Session Grant",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--app-tool-session-grant",
  },
  {
    id: "plugins-ai-chat-app-tool-host-upgrade",
    title: "AI Chat: Application Tool Host Upgrade",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--app-tool-host-upgrade-required",
  },
  {
    id: "plugins-ai-chat-skills-and-slash",
    title: "AI Chat: Skills And Slash",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai",
    storyId: "plugins-ai-chat--skills-and-slash",
  },
  {
    id: "plugins-ai-chat-search-result",
    title: "AI Chat: Search Tool Hits",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/search",
    storyId: "plugins-ai-chat--search-tool-hits",
  },
  {
    id: "plugins-ai-shell-desktop",
    title: "AI Shell: Desktop",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-shell--desktop",
  },
  {
    id: "plugins-ai-shell-mobile",
    title: "AI Shell: Mobile",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-shell--mobile",
  },
  {
    id: "plugins-ai-shell-community-tools",
    title: "AI Shell: Community Tool Opt-In",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-shell--community-tool-opt-in",
  },
  {
    id: "plugins-ai-shell-follow-scope",
    title: "AI Shell: Follow Scope",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-shell--follow-scope",
    skipVisual: true,
  },
  {
    id: "plugins-ai-shell-jsonl-preview",
    title: "AI Shell: JSONL Preview",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-shell--jsonl-preview",
  },
  {
    id: "plugins-ai-live-host",
    title: "AI Live Host: Manual Attach",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-live-host--manual-attach",
    skipVisual: true,
  },
  {
    id: "plugins-ai-live-host-reload-resume",
    title: "AI Live Host: Reload Resume",
    spec: "spec/src/plugins/ai/index.md",
    publicSurface: "@lapis-notes/ai + @lapis-notes/workspace",
    storyId: "plugins-ai-live-host--reload-resume",
    skipVisual: true,
  },
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
  ...pluginPanelCatalog,
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
