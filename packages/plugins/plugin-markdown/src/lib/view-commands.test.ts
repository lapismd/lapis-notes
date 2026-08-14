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
    expect(new Set(commandIds).size).toBe(commandIds.length);
    expect(
      MARKDOWN_PANEL_VIEW_COMMANDS.every(
        ({ command }) => command.id.length > 0 && command.name.length > 0,
      ),
    ).toBe(true);
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

  it("reveals existing panel leaves without creating another one", async () => {
    const first = {} as WorkspaceLeaf;
    const second = {} as WorkspaceLeaf;
    const revealLeaf = vi.fn();
    const getRightLeaf = vi.fn();
    const app = {
      workspace: {
        getLeavesOfType: vi.fn(() => [first, second]),
        getRightLeaf,
        revealLeaf,
      },
    } as unknown as App;

    await revealOrOpenMarkdownPanel(app, OutlineViewType);

    expect(revealLeaf).toHaveBeenNthCalledWith(1, first);
    expect(revealLeaf).toHaveBeenNthCalledWith(2, second);
    expect(getRightLeaf).not.toHaveBeenCalled();
  });

  it("creates the canonical panel in the right leaf when absent", async () => {
    const setViewState = vi.fn().mockResolvedValue(undefined);
    const leaf = { setViewState } as unknown as WorkspaceLeaf;
    const revealLeaf = vi.fn();
    const app = {
      workspace: {
        getLeavesOfType: vi.fn(() => []),
        getRightLeaf: vi.fn(() => leaf),
        revealLeaf,
      },
    } as unknown as App;

    await revealOrOpenMarkdownPanel(app, BacklinksViewType);

    expect(setViewState).toHaveBeenCalledWith({ type: BacklinksViewType });
    expect(revealLeaf).toHaveBeenCalledWith(leaf);
  });

  it("does nothing when the default right leaf is unavailable", async () => {
    const revealLeaf = vi.fn();
    const app = {
      workspace: {
        getLeavesOfType: vi.fn(() => []),
        getRightLeaf: vi.fn(() => null),
        revealLeaf,
      },
    } as unknown as App;

    await revealOrOpenMarkdownPanel(app, TagsViewType);

    expect(revealLeaf).not.toHaveBeenCalled();
  });
});
