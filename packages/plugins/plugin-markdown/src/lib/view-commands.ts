import type { App } from "@lapis-notes/api";
import { AllPropertiesViewType } from "$lib/views/all-properties";
import {
  BacklinksLegacyViewTypes,
  BacklinksViewType,
} from "$lib/views/backlinks";
import {
  FilePropertiesLegacyViewTypes,
  FilePropertiesViewType,
} from "$lib/views/file-properties";
import {
  OutlineLegacyViewTypes,
  OutlineViewType,
} from "$lib/views/outline";
import {
  OutgoingLinksLegacyViewTypes,
  OutgoingLinksViewType,
} from "$lib/views/outgoing-links";
import { TagsLegacyViewTypes, TagsViewType } from "$lib/views/tags";

type MarkdownPanelSidebarRegistration = {
  side: "left" | "right";
  group?: string;
  groupTitle?: string;
  title?: string;
  icon?: string;
};

export type MarkdownPanelViewCommandRegistration = {
  viewType: string;
  legacyViewTypes: readonly string[];
  command: {
    id: string;
    name: string;
  };
  sidebar?: MarkdownPanelSidebarRegistration;
};

export const MARKDOWN_PANEL_VIEW_COMMANDS = [
  {
    viewType: AllPropertiesViewType,
    legacyViewTypes: [],
    command: {
      id: "show-all-properties",
      name: "Show all properties",
    },
  },
  {
    viewType: OutlineViewType,
    legacyViewTypes: OutlineLegacyViewTypes,
    command: {
      id: "show-outline",
      name: "Show outline",
    },
  },
  {
    viewType: FilePropertiesViewType,
    legacyViewTypes: FilePropertiesLegacyViewTypes,
    command: {
      id: "show-file-properties",
      name: "Show file properties",
    },
  },
  {
    viewType: BacklinksViewType,
    legacyViewTypes: BacklinksLegacyViewTypes,
    command: {
      id: "show-backlinks",
      name: "Show backlinks",
    },
    sidebar: {
      side: "right",
      group: "Links",
      groupTitle: "Links",
    },
  },
  {
    viewType: OutgoingLinksViewType,
    legacyViewTypes: OutgoingLinksLegacyViewTypes,
    command: {
      id: "show-outgoing-links",
      name: "Show outgoing links",
    },
    sidebar: {
      side: "right",
      group: "Links",
      groupTitle: "Links",
    },
  },
  {
    viewType: TagsViewType,
    legacyViewTypes: TagsLegacyViewTypes,
    command: {
      id: "show-tags",
      name: "Show tags",
    },
    sidebar: {
      side: "right",
      title: "Tags",
      icon: "tags",
    },
  },
] as const satisfies readonly MarkdownPanelViewCommandRegistration[];

export type MarkdownPanelViewType =
  (typeof MARKDOWN_PANEL_VIEW_COMMANDS)[number]["viewType"];

export async function revealOrOpenMarkdownPanel(
  app: App,
  viewType: MarkdownPanelViewType,
): Promise<void> {
  const leaves = app.workspace.getLeavesOfType(viewType);
  if (leaves.length > 0) {
    for (const leaf of leaves) {
      app.workspace.revealLeaf(leaf);
    }
    return;
  }

  const leaf = app.workspace.getRightLeaf(false);
  if (!leaf) return;

  await leaf.setViewState({ type: viewType });
  app.workspace.revealLeaf(leaf);
}
