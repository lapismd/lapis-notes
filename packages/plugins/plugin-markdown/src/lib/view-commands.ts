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
    id: `open-${string}`;
    name: `Open ${string}`;
  };
  sidebar?: MarkdownPanelSidebarRegistration;
};

export const MARKDOWN_PANEL_VIEW_COMMANDS = [
  {
    viewType: AllPropertiesViewType,
    legacyViewTypes: [],
    command: {
      id: "open-all-properties",
      name: "Open All Properties",
    },
  },
  {
    viewType: OutlineViewType,
    legacyViewTypes: OutlineLegacyViewTypes,
    command: {
      id: "open-outline",
      name: "Open Outline",
    },
  },
  {
    viewType: FilePropertiesViewType,
    legacyViewTypes: FilePropertiesLegacyViewTypes,
    command: {
      id: "open-file-properties",
      name: "Open File Properties",
    },
  },
  {
    viewType: BacklinksViewType,
    legacyViewTypes: BacklinksLegacyViewTypes,
    command: {
      id: "open-backlinks",
      name: "Open Backlinks",
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
      id: "open-outgoing-links",
      name: "Open Outgoing Links",
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
      id: "open-tags",
      name: "Open Tags",
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
  const existing = app.workspace.getLeavesOfType(viewType)[0];
  const target = existing ?? app.workspace.ensureSideLeaf(viewType, "right");
  if (!existing) await target.setViewState({ type: viewType });
  app.workspace.activateLeaf(target, {
    focusRootHost: false,
    source: "api",
    operation: `open-${viewType}`,
  });
  await app.workspace.revealLeaf(target);
}
