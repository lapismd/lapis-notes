import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
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
import {
  TagsLegacyViewTypes,
  TagsViewType,
} from "$lib/views/tags";
import {
  MARKDOWN_PANEL_VIEW_COMMANDS,
  revealOrOpenMarkdownPanel,
} from "$lib/view-commands";

describe("Markdown panel view commands", () => {
  it("associates every canonical panel view with one unique command", () => {
    expect(
      MARKDOWN_PANEL_VIEW_COMMANDS.map(({ viewType }) => viewType),
    ).toEqual([
      AllPropertiesViewType,
      OutlineViewType,
      FilePropertiesViewType,
      BacklinksViewType,
      OutgoingLinksViewType,
      TagsViewType,
    ]);

    const commandIds = MARKDOWN_PANEL_VIEW_COMMANDS.map(
      ({ command }) => command.id,
    );
    expect(commandIds).toEqual([
      "open-all-properties",
      "open-outline",
      "open-file-properties",
      "open-backlinks",
      "open-outgoing-links",
      "open-tags",
    ]);
    expect(
      MARKDOWN_PANEL_VIEW_COMMANDS.map(({ command }) => command.name),
    ).toEqual([
      "Open All Properties",
      "Open Outline",
      "Open File Properties",
      "Open Backlinks",
      "Open Outgoing Links",
      "Open Tags",
    ]);
  });

  it("keeps compatibility aliases on their canonical command registrations", () => {
    const aliases = Object.fromEntries(
      MARKDOWN_PANEL_VIEW_COMMANDS.map(({ viewType, legacyViewTypes }) => [
        viewType,
        legacyViewTypes,
      ]),
    );

    expect(aliases).toEqual({
      [AllPropertiesViewType]: [],
      [OutlineViewType]: OutlineLegacyViewTypes,
      [FilePropertiesViewType]: FilePropertiesLegacyViewTypes,
      [BacklinksViewType]: BacklinksLegacyViewTypes,
      [OutgoingLinksViewType]: OutgoingLinksLegacyViewTypes,
      [TagsViewType]: TagsLegacyViewTypes,
    });
  });

  it("activates and reveals an existing panel leaf without creating another one", async () => {
    const first = {} as WorkspaceLeaf;
    const revealLeaf = vi.fn();
    const ensureSideLeaf = vi.fn();
    const activateLeaf = vi.fn();
    const app = {
      workspace: {
        getLeavesOfType: vi.fn(() => [first]),
        ensureSideLeaf,
        activateLeaf,
        revealLeaf,
      },
    } as unknown as App;

    await revealOrOpenMarkdownPanel(app, OutlineViewType);

    expect(ensureSideLeaf).not.toHaveBeenCalled();
    expect(activateLeaf).toHaveBeenCalledWith(first, {
      focusRootHost: false,
      source: "api",
      operation: `open-${OutlineViewType}`,
    });
    expect(revealLeaf).toHaveBeenCalledWith(first);
  });

  it("creates, activates, and reveals the canonical panel when absent", async () => {
    const setViewState = vi.fn().mockResolvedValue(undefined);
    const leaf = { setViewState } as unknown as WorkspaceLeaf;
    const revealLeaf = vi.fn();
    const activateLeaf = vi.fn();
    const ensureSideLeaf = vi.fn(() => leaf);
    const app = {
      workspace: {
        getLeavesOfType: vi.fn(() => []),
        ensureSideLeaf,
        activateLeaf,
        revealLeaf,
      },
    } as unknown as App;

    await revealOrOpenMarkdownPanel(app, BacklinksViewType);

    expect(setViewState).toHaveBeenCalledWith({ type: BacklinksViewType });
    expect(ensureSideLeaf).toHaveBeenCalledWith(BacklinksViewType, "right");
    expect(activateLeaf).toHaveBeenCalledWith(leaf, {
      focusRootHost: false,
      source: "api",
      operation: `open-${BacklinksViewType}`,
    });
    expect(revealLeaf).toHaveBeenCalledWith(leaf);
  });
});
