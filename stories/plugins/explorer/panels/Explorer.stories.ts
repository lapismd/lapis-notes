import { PluginFileIconsSource } from "./Explorer.example-sources";
import { Plugin, FileView, type TFile, type App } from "@lapis-notes/api";
import { ExplorerPanel } from "@lapis-notes/file-explorer";
import type { ExplorerController } from "@lapismd/design-core/workspace/explorer";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "explorer" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Explorer/Panels/Explorer",
  component: ExplorerPanel,
  args: { controller: undefined as unknown as ExplorerController },
  argTypes: {
    controller: {
      control: false,
      description:
        "Explorer controller supplied by the registered plugin view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Explorer is a placement-neutral vault tree rendered by the production plugin panel.",
      },
    },
  },
} satisfies Meta<typeof ExplorerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind, layout },
  })) as StoryRender;
}

function placementStory(
  layout: PanelDemoLayout,
  source: string,
  description: string,
  options: { proveShowHidden?: boolean } = {},
): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: placementParameters(kind, layout, source, description),
    render: renderPlacement(layout),
    play: async ({ args, canvasElement, parameters }) => {
      const panel = await expectPanelPlacement(
        canvasElement,
        kind,
        layout,
        "lapis-editor-explorer",
        args,
      );
      await expect(panel.getByText("Notes")).toBeVisible();
      await expect(panel.queryByText(".env")).toBeNull();
      await expect(panel.queryByText(".lapis")).toBeNull();
      await expect(
        panel.getByRole("button", { name: "Create File" }),
      ).toBeVisible();
      const showHidden = panel.getByRole("button", {
        name: "Show hidden files",
      });
      await expect(showHidden).toHaveAttribute("aria-pressed", "false");
      if (options.proveShowHidden) {
        await userEvent.click(showHidden);
        await expect(showHidden).toHaveAttribute("aria-pressed", "true");
        await expect(panel.getByText(".env")).toBeVisible();
        await expect(panel.getByText(".lapis")).toBeVisible();
        const persisted = JSON.parse(
          await panelDemoApp(canvasElement).vault.adapter.read(
            ".lapis/app.json",
          ),
        ) as Record<string, unknown>;
        expect(persisted["workspace.fileExplorer.showHiddenFiles"]).toBe(true);
      }
      const notes = panel.getByText("Notes");
      notes.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await expect(body.findByText("Copy Path")).resolves.toBeVisible();
      expect(body.queryByText("From system root")).toBeNull();
      expect(body.queryByText("As Lapis URL")).toBeNull();
      expect(body.queryByText("Open in default app")).toBeNull();
      expect(body.queryByText("Reveal in Finder")).toBeNull();
      expect(body.queryByText("Reveal in File Explorer")).toBeNull();
      expect(body.queryByText("Reveal in file manager")).toBeNull();
      await userEvent.keyboard("{Escape}");
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Explorer in the middle workspace with standard top-tab chrome.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Explorer selected in real stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Explorer in its canonical left-sidebar placement.",
  { proveShowHidden: true },
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Explorer moved to the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Explorer inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Explorer as a grouped right-sidebar item.",
);

class DiagramFileView extends FileView {
  getViewType() {
    return "example-diagram";
  }
  getDisplayText() {
    return this.file?.name ?? "Diagram";
  }
  async onLoadFile(file: TFile) {
    this.contentEl.textContent = file.name;
  }
}
class DiagramIconPlugin extends Plugin {
  constructor(app: App) {
    super(app, DiagramIconPlugin.manifest);
  }
  static manifest = {
    id: "example-file-icons",
    name: "Example file icons",
    version: "1.0.0",
    minAppVersion: "0.0.1",
    author: "Lapis",
    description: "File icon acceptance",
  };
  onload() {
    const fileIcon = this.registerIcon(
      "diagram",
      '<svg viewBox="0 0 24 24"><path d="M2 3h7v9H2z"/></svg>',
    );
    this.registerView("example-diagram", (leaf) => new DiagramFileView(leaf), {
      kind: "file",
    });
    this.registerEditorView({
      id: "example.diagram",
      viewType: "example-diagram",
      label: "Diagram",
      filenamePatterns: ["*.diagram"],
      priority: "default",
      fileIcon,
    });
  }
}

export const PluginFileIcons: Story = {
  name: "Plugin custom file icons",
  parameters: {
    ...placementParameters(
      kind,
      "middle-top-tabs",
      sources.MiddleTopTabs,
      "A real plugin registers custom SVG artwork, updates Explorer without activation from paint, and disposes it on disable.",
    ),
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        story:
          "Plugin-registered SVGs follow enable/disable, file activation and rename through the real App and Explorer.",
      },
      source: {
        code: PluginFileIconsSource,
        language: "tsx",
        type: "code",
      },
    },
  },
  render: renderPlacement("middle-top-tabs"),
  play: async ({ args, canvasElement }) => {
    await expectPanelPlacement(
      canvasElement,
      kind,
      "middle-top-tabs",
      "lapis-editor-explorer",
      args,
    );
    const app = panelDemoApp(canvasElement);
    const file = await app.vault.create("example.diagram", "{}");
    const row = () =>
      canvasElement.querySelector('[data-path="example.diagram"]')!;
    await waitFor(() =>
      expect(
        row()?.querySelector('[data-ui-component="file-type-icon"]'),
      ).not.toBeNull(),
    );
    app.plugins.registerCorePlugins([
      { plugin: DiagramIconPlugin, required: false, enabledByDefault: false },
    ]);
    await app.plugins.enablePlugin("example-file-icons");
    await waitFor(() =>
      expect(row()?.querySelector('path[d="M2 3h7v9H2z"]')).not.toBeNull(),
    );
    await expect(row()).toHaveAccessibleName("example.diagram");
    await userEvent.click(within(canvasElement).getByText("example.diagram"));
    await waitFor(() =>
      expect(app.workspace.getLeavesOfType("example-diagram")).toHaveLength(1),
    );
    await app.plugins.disablePlugin("example-file-icons");
    await waitFor(() =>
      expect(
        row()?.querySelector('[data-ui-component="file-type-icon"]'),
      ).not.toBeNull(),
    );
    await app.plugins.enablePlugin("example-file-icons");
    await waitFor(() =>
      expect(row()?.querySelector('path[d="M2 3h7v9H2z"]')).not.toBeNull(),
    );
    await app.fileManager.renameFile(file, "example.other");
    await waitFor(() =>
      expect(
        canvasElement.querySelector(
          '[data-path="example.other"] [data-ui-component="file-type-icon"]',
        ),
      ).not.toBeNull(),
    );
    await app.fileManager.renameFile(file, "example.diagram");
    await waitFor(() =>
      expect(row()?.querySelector('path[d="M2 3h7v9H2z"]')).not.toBeNull(),
    );
  },
};
