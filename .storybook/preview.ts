import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { createControllerConnectionBridge } from "../scripts/lib/controller-connection-bridge";
import { syncCatalogStoryLayout } from "@lapismd/design-core/storybook/catalog-layout";
import { SpecificationDocsContainer } from "./specification-docs";
// Brand + shadcn paint: design-core. ui/theme.css is Obsidian alias-only.
// Host Tailwind (vite plugin) is for story/demo layout — not component paint.
import "@lapismd/design-core/storybook.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/bases/styles.css";
import "@lapis-notes/ai/styles.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";

// Live ACP is opt-in. Prefer `pnpm ai:smoke:storybook`, or attach a manually
// started host through `.env.storybook.local`. Storybook never starts the host.
// Register through the desktop-bridge global so preview does not import the
// API barrel (that hung the iframe on every story).
const controllerUrl = import.meta.env.LAPIS_AGENT_RUNTIME_URL;
const controllerToken = import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN;
const native = globalThis as { __LAPIS_NATIVE_DESKTOP__?: unknown };
if (!native.__LAPIS_NATIVE_DESKTOP__ && controllerUrl && controllerToken) {
  native.__LAPIS_NATIVE_DESKTOP__ = createControllerConnectionBridge({
    url: controllerUrl,
    token: controllerToken,
  });
}

const preview: Preview = {
  tags: ["autodocs", "test"],
  globalTypes: {
    theme: {
      description: "Brand theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "lapis", title: "Obsidian" },
          { value: "default", title: "Default" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i } },
    docs: {
      container: SpecificationDocsContainer,
      toc: {
        headingSelector: "h2, h3:not([id*='acceptance-details'])",
        title: "On this page",
      },
    },
    options: {
      storySort: {
        order: [
          "Specification",
          [
            "Introduction",
            "Architecture",
            [
              "Dependency boundaries",
              "Workspace integration",
              "Host boundaries",
              "Rust application services",
              "Rust hosted runtime delivery",
              "Rust managed vaults",
              "Durable native turn admission",
              "Native conversation queues",
              "Native logical participants",
              "Native indexing lifetime",
              "Native daily Task lifecycle",
              "Admitted native Tasks port",
              "Native History indexing lifetime",
              "Admitted native History reader",
              "Remaining native History parity",
              "Backup service lifetime",
              "Editor integration",
              "Native editor intents",
              "Build and validation",
              "Application ownership",
              "Plugin integration",
              "Context — Part 1",
              "Context — Part 2",
              "Context — Part 3",
            ],
            "Packages",
            [
              "App and services",
              "Host and plugin integration",
              "Editor APIs",
              "Releases and exports",
              "Native service exports",
              "Vault and storage",
              "Workspace APIs",
              "Configuration and lifecycle",
              "Context — Part 1",
              "Context — Part 2",
              "Context — Part 3",
            ],
            "Plugin Model",
            [
              "Lifecycle and views",
              "Distribution and registry — Part 1",
              "Distribution and registry — Part 2",
              "Editor contributions",
              "Application services",
              "App ownership",
              "Context — Part 1",
              "Context — Part 2",
            ],
            "App Database",
            [
              "Sessions and ownership",
              "Metadata and indexing",
              "Persistence and recovery",
              "Database integration",
              "Context",
            ],
            "Desktop Host",
            [
              "Window and shell",
              "Native vault and storage — Part 1",
              "Native vault and storage — Part 2",
              "Startup and lifecycle",
              "Host integration",
              "Packaging and acceptance",
              "Context",
            ],
            "Web Host",
            [
              "Application presentation",
              "Startup and plugins",
              "Browser storage and sync",
              "Browser integration",
              "Context",
            ],
            "Node Server Host",
            ["Integration contracts", "Context"],
            "Workspace Shell",
            [
              "Layout and persistence",
              "View lifecycle",
              "Plugin management",
              "Catalog acceptance",
              "Chrome and navigation",
              "Context",
              "Panels",
              [
                "Integration contracts",
                "Context",
                "Problems",
                [
                  "Integration contracts",
                  "Search result provider boundaries",
                  "Context",
                ],
              ],
            ],
            "Lapis Editor Demo",
            [
              "Editor scenarios — Part 1",
              "Editor scenarios — Part 2",
              "Context",
            ],
            "Plugins",
            [
              "Explorer",
              "Bookmarks",
              "Markdown",
              [
                "Files and persistence",
                "Editor and authoring",
                "Panels and navigation",
                "Integration contracts",
                "Context",
                "Panels",
                [
                  "Files and persistence",
                  "Editor and authoring",
                  "Panels and navigation",
                  "Context",
                  "All Properties",
                  "File Properties",
                  "Outline",
                  "Backlinks",
                  "Outgoing Links",
                  "Tags",
                  "Link Previews",
                ],
              ],
              "Markdown Lint",
              "Spell Check",
              "Search",
              ["Search queries and results", "Context"],
              "Graph",
              ["Graph behavior", "Context"],
              "History",
              ["History and comparison", "Context"],
              "Word Count",
              ["Integration contracts", "Context"],
              "Bases",
              ["Bases queries and views", "Context"],
              "AI",
              [
                "Providers and execution",
                "User decisions",
                "Tools and extensions — Part 1",
                "Tools and extensions — Part 2",
                "Conversation storage — Part 1",
                "Conversation storage — Part 2",
                "Conversation presentation",
                "Session lifecycle",
                "Application integration",
                "Context",
              ],
            ],
            "UI and Styling",
            ["Retained UI contracts", "Context"],
            "Storybook Catalog",
            [
              "Documentation and navigation",
              "Build and process",
              "Catalog policy",
              "Interaction and accessibility",
              "Plugin scenarios",
              "App-owned fixtures",
              "Visual policy",
              "Context",
            ],
            "Specification Governance",
            [
              "Verification and documents",
              "Requirement authoring",
              "Protected change mapping",
              "Validation and CI",
              "Repository policy",
              "Discovery",
              "Context",
            ],
            "Backlog",
            ["Legacy plugin ports"],
            "Verification",
            [
              "AI — Part 1",
              "AI — Part 2",
              "ARCH — Part 1",
              "ARCH — Part 2",
              "BASE",
              "BM",
              "CAT — Part 1",
              "CAT — Part 2",
              "CV",
              "DB",
              "DENO",
              "ED",
              "EXP",
              "GOV",
              "GRAPH",
              "HIST",
              "MD",
              "MDL",
              "PKG — Part 1",
              "PKG — Part 2",
              "PLUG — Part 1",
              "PLUG — Part 2",
              "ROLE",
              "SPL",
              "SRCH",
              "SRV",
              "CORE",
              "UI",
              "WC",
              "WEB",
              "WS",
            ],
          ],
          "Plugins",
          [
            "Explorer",
            ["Panels", ["Explorer", "*"]],
            "Bookmarks",
            ["Panels", ["Bookmarks", "*"]],
            "Search",
            ["Panels", ["Search", "*"]],
            "Graph",
            ["Panels", ["Graph", "Local Graph", "*"]],
            "History",
            ["Panels", ["History", "*"], "Compare", "*"],
            "Markdown",
            ["Panels", ["*"], "*"],
            "Markdown Lint",
            "Bases",
            ["Views", "Workflows", "Embeds", "Shell", ["Lifecycle", "*"], "*"],
            "AI",
            [
              "Panels",
              ["Chat", "History", "*"],
              "Chat",
              "Live Host",
              "Shell",
              "*",
            ],
            "*",
          ],
          "Workspace",
          "API",
          "*",
        ],
      },
    },
    // Fail Vitest / Testing Module runs on axe violations (panel alone is not enough).
    a11y: {
      test: "error",
      context: {
        exclude: [".cm-gutters"],
      },
    },
    backgrounds: {
      disable: true,
    },
    // Brand theme is owned by data-ui-theme; keep Lapis CSS for kept compounds.
    themes: {
      disable: true,
    },
  },
  initialGlobals: {
    colorMode: "light",
    theme: "lapis",
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        lapis: "lapis",
        default: "default",
      },
      defaultTheme: "lapis",
      attributeName: "data-ui-theme",
    }),
    (story, context) => {
      if (typeof document !== "undefined") {
        syncCatalogStoryLayout(document, context);
        document.documentElement.classList.toggle(
          "dark",
          context.globals.colorMode === "dark",
        );
      }
      return story();
    },
  ],
};

export default preview;
