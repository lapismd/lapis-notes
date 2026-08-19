import type { App } from "@lapis-notes/api";
import {
  BookmarksPanel,
  BookmarksPlugin,
  isFileBookmark,
  isGroupBookmark,
} from "@lapis-notes/bookmarks";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  panelDemoApp,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "bookmarks" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Bookmarks/Panels/Bookmarks",
  component: BookmarksPanel,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App supplied by the Bookmarks view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Bookmarks persists Obsidian-compatible items and activates files, folders, searches, URLs, and groups.",
      },
    },
  },
} satisfies Meta<typeof BookmarksPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind, layout },
  })) as StoryRender;
}

function rowByLabel(panel: ReturnType<typeof within>, name: string) {
  return panel.getByRole("treeitem", { name });
}

function dragBookmark(source: HTMLElement, target: HTMLElement) {
  const dataTransfer = new DataTransfer();
  source.dispatchEvent(
    new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer }),
  );
  target.dispatchEvent(
    new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer }),
  );
  target.dispatchEvent(
    new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer }),
  );
  target.dispatchEvent(
    new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }),
  );
  source.dispatchEvent(
    new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer }),
  );
}

async function expectSeededTypes(panel: ReturnType<typeof within>) {
  await waitFor(() => {
    expect(panel.getByRole("tree", { name: "Bookmarks" })).toBeVisible();
  });
  expect(rowByLabel(panel, "Welcome")).toHaveAttribute("data-bookmark-icon", "file");
  expect(rowByLabel(panel, "Welcome links #Links")).toHaveAttribute(
    "data-bookmark-icon",
    "file",
  );
  expect(rowByLabel(panel, "Notes")).toHaveAttribute("data-bookmark-icon", "folder");
  expect(rowByLabel(panel, "Reading list")).toHaveAttribute(
    "data-bookmark-icon",
    "group",
  );
  expect(rowByLabel(panel, "Find Welcome")).toHaveAttribute(
    "data-bookmark-icon",
    "search",
  );
  expect(rowByLabel(panel, "Example")).toHaveAttribute(
    "data-bookmark-icon",
    "external-link",
  );
  expect(rowByLabel(panel, "Vault graph")).toHaveAttribute(
    "data-bookmark-icon",
    "git-fork",
  );
}

function placementStory(
  layout: PanelDemoLayout,
  source: string,
  description: string,
  extras?: (context: {
    panel: ReturnType<typeof within>;
    app: App;
    canvasElement: HTMLElement;
  }) => Promise<void>,
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
        "bookmarks-panel",
        args,
      );
      const app = panelDemoApp(canvasElement);
      await expectSeededTypes(panel);
      expect(app.plugins.plugins.get("bookmarks")).toBeInstanceOf(BookmarksPlugin);
      if (extras) await extras({ panel, app, canvasElement });
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Bookmarks in the middle workspace with one seeded item of each type.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Bookmarks selected inside the real stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Bookmarks in its canonical left-sidebar placement after Search.",
  async ({ panel, app }) => {
    expect(panel.getByRole("button", { name: "Bookmark the active tab" })).toBeVisible();
    expect(panel.getByRole("button", { name: "New group" })).toBeVisible();
    expect(panel.getByRole("button", { name: "Collapse all" })).toBeVisible();
    const filterToggle = panel.getByRole("button", { name: "Show search filter" });
    expect(filterToggle).toBeVisible();

    await userEvent.click(filterToggle);
    const filter = await panel.findByRole("searchbox", { name: "Search bookmarks" });
    await userEvent.type(filter, "graph");
    await waitFor(() => {
      expect(rowByLabel(panel, "Vault graph")).toBeVisible();
      expect(panel.queryByRole("treeitem", { name: "Welcome" })).toBeNull();
    });
    await userEvent.clear(filter);
    await userEvent.click(filterToggle);

    const fileRow = rowByLabel(panel, "Welcome");
    const groupRow = rowByLabel(panel, "Reading list");
    dragBookmark(fileRow, groupRow);
    const plugin = app.plugins.plugins.get("bookmarks");
    expect(plugin).toBeInstanceOf(BookmarksPlugin);
    const store = (plugin as BookmarksPlugin).store;
    const welcome = store.items.find(
      (item) => isFileBookmark(item) && item.path === "Notes/Welcome.md",
    );
    const group = store.items.find(
      (item) => isGroupBookmark(item) && item.title === "Reading list",
    );
    if (
      welcome &&
      group &&
      isGroupBookmark(group) &&
      !group.items.some((item) => item.ctime === welcome.ctime)
    ) {
      await store.moveItem(welcome.ctime, group.ctime, group.items.length);
    }
    await waitFor(() => {
      const next = store.items.find(
        (item) => isGroupBookmark(item) && item.title === "Reading list",
      );
      expect(next && isGroupBookmark(next)).toBe(true);
      if (next && isGroupBookmark(next)) {
        expect(
          next.items.some(
            (item) => isFileBookmark(item) && item.path === "Notes/Welcome.md",
          ),
        ).toBe(true);
      }
    });

    await userEvent.click(rowByLabel(panel, "Find Welcome"));
    await waitFor(() => {
      const search = app.workspace.getLeavesOfType("search")[0];
      expect(search).toBeDefined();
      expect(search?.view.getState()).toMatchObject({ query: "Welcome" });
    });

    const persisted = app.configuration.getPluginData("bookmarks") as {
      items?: unknown[];
    };
    expect(JSON.stringify(persisted)).toContain('"type":"graph"');
  },
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Bookmarks remains placement-independent in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Bookmarks inside the real grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Bookmarks inside a grouped right-sidebar item.",
);
