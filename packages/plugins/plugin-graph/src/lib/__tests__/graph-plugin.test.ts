import { afterEach, describe, expect, it, vi } from "vitest";
import { GraphPlugin } from "../graph-plugin";
import {
  DEFAULT_GRAPH_SETTINGS,
  DEFAULT_GRAPH_CENTER_FORCE,
  GRAPH_SETTINGS_VERSION,
  graphForceSliderToStrength,
  graphRepelForceMagnitude,
  loadPersistedGraphSettings,
  mergeGraphSettings,
  moveGraphGroup,
  patchGraphSettings,
  serializeGraphSettings,
} from "../graph-settings";

describe("graph settings persistence snapshots", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads stored graph settings with defaults merged in", () => {
    const settings = mergeGraphSettings({
      display: {
        ...DEFAULT_GRAPH_SETTINGS.display,
        nodeSize: 12,
      },
      localGraph: {
        ...DEFAULT_GRAPH_SETTINGS.localGraph,
        depth: 3,
      },
    });

    expect(settings.display.nodeSize).toBe(12);
    expect(settings.display.wheelZoomSensitivity).toBe(
      DEFAULT_GRAPH_SETTINGS.display.wheelZoomSensitivity,
    );
    expect(settings.localGraph.depth).toBe(3);
    expect(settings.forces.repelForce).toBe(
      DEFAULT_GRAPH_SETTINGS.forces.repelForce,
    );
  });

  it("maps Obsidian force controls to effective strengths", () => {
    expect(DEFAULT_GRAPH_CENTER_FORCE).toBeCloseTo(0.518713248970312, 12);
    expect(graphForceSliderToStrength(0.518713248970312)).toBeCloseTo(0.1, 12);
    expect(graphForceSliderToStrength(0.803507596067918)).toBeCloseTo(
      0.3985758025144454,
      12,
    );
    expect(graphForceSliderToStrength(1)).toBe(1);
    expect(graphRepelForceMagnitude(10)).toBe(1000);
    expect(graphRepelForceMagnitude(0)).toBe(1);
  });

  it("creates a full persisted snapshot after settings changes", () => {
    const nextSettings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: { showTags: true },
      display: { nodeSize: 11 },
    });

    expect(nextSettings).toEqual({
      ...DEFAULT_GRAPH_SETTINGS,
      filters: {
        ...DEFAULT_GRAPH_SETTINGS.filters,
        showTags: true,
      },
      display: {
        ...DEFAULT_GRAPH_SETTINGS.display,
        nodeSize: 11,
      },
    });
  });

  it("persists wheel zoom sensitivity changes in display settings", () => {
    const nextSettings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      display: { wheelZoomSensitivity: 0.7 },
    });

    expect(nextSettings.display.wheelZoomSensitivity).toBe(0.7);
    expect(nextSettings.display.nodeSize).toBe(
      DEFAULT_GRAPH_SETTINGS.display.nodeSize,
    );
  });

  it("reorders Groups without changing their persisted fields", () => {
    const groups = [
      { id: "a", query: "path:A", color: "#111111" },
      { id: "b", query: "path:B", color: "#222222" },
    ];

    expect(moveGraphGroup(groups, 1, -1)).toEqual([groups[1], groups[0]]);
    expect(moveGraphGroup(groups, 0, -1)).toEqual(groups);
  });

  it("migrates unversioned forces and simplifies Groups", () => {
    const loaded = loadPersistedGraphSettings({
      filters: { showTags: true },
      display: { nodeSize: 13, linkThickness: 0.4 },
      forces: {
        centerForce: 0.08,
        repelForce: 240,
        linkForce: 0.22,
        linkDistance: 96,
      },
      localGraph: { depth: 4 },
      groups: [
        {
          id: "code",
          name: "Code",
          query: "path:Code",
          color: "#112233",
          enabled: true,
        },
      ],
    });

    expect(loaded.migrated).toBe(true);
    expect(loaded.settings.forces).toEqual(DEFAULT_GRAPH_SETTINGS.forces);
    expect(loaded.settings.filters.showTags).toBe(true);
    expect(loaded.settings.display).toEqual(
      expect.objectContaining({ nodeSize: 13, linkThickness: 0.4 }),
    );
    expect(loaded.settings.localGraph.depth).toBe(4);
    expect(loaded.settings.groups).toEqual([
      { id: "code", query: "path:Code", color: "#112233" },
    ]);
  });

  it("migrates version-one Groups to ordered always-active rules", () => {
    const loaded = loadPersistedGraphSettings({
      settingsVersion: 1,
      groups: [
        {
          id: "disabled",
          name: "Disabled before migration",
          query: "tag:#topic/finance",
          color: "#112233",
          enabled: false,
        },
        {
          id: "active",
          name: "Active before migration",
          query: 'tag:"#project alpha"',
          color: "#445566",
          enabled: true,
        },
      ],
    });

    expect(loaded.migrated).toBe(true);
    expect(loaded.settings.groups).toEqual([
      {
        id: "disabled",
        query: "tag:#topic/finance",
        color: "#112233",
      },
      {
        id: "active",
        query: 'tag:"#project alpha"',
        color: "#445566",
      },
    ]);
  });

  it("reloads current versioned settings without migrating again", () => {
    const customized = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: { showAttachments: true },
      forces: { linkDistance: 320 },
    });
    const persisted = serializeGraphSettings(customized);
    const loaded = loadPersistedGraphSettings(persisted);

    expect(persisted.settingsVersion).toBe(GRAPH_SETTINGS_VERSION);
    expect(loaded.migrated).toBe(false);
    expect(loaded.settings).toEqual(customized);
  });

  it("persists the current version immediately after unversioned migration", async () => {
    vi.stubGlobal("createDiv", () => ({}));
    const plugin = new GraphPlugin({} as never);
    const loadData = vi.fn(async () => ({
      filters: { showTags: true },
      forces: { centerForce: 0.08, repelForce: 240 },
    }));
    const saveData = vi.fn(async () => undefined);
    (
      plugin as unknown as {
        loadData: typeof loadData;
        saveData: typeof saveData;
        initializeSettings(): Promise<void>;
      }
    ).loadData = loadData;
    (
      plugin as unknown as {
        saveData: typeof saveData;
      }
    ).saveData = saveData;

    await (
      plugin as unknown as {
        initializeSettings(): Promise<void>;
      }
    ).initializeSettings();

    expect(plugin.getSettings().filters.showTags).toBe(true);
    expect(plugin.getSettings().forces).toEqual(DEFAULT_GRAPH_SETTINGS.forces);
    expect(saveData).toHaveBeenCalledOnce();
    expect(saveData).toHaveBeenCalledWith(
      expect.objectContaining({
        settingsVersion: GRAPH_SETTINGS_VERSION,
        filters: expect.objectContaining({ showTags: true }),
        forces: DEFAULT_GRAPH_SETTINGS.forces,
      }),
    );
  });

  it("coalesces rapid plugin settings writes and flushes on unload", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("createDiv", () => ({}));
    const plugin = new GraphPlugin({} as never);
    const saveData = vi.fn(async () => undefined);
    (plugin as unknown as { saveData: typeof saveData }).saveData = saveData;

    await plugin.updateSettings(
      patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
        display: { nodeSize: 9 },
      }),
    );
    await plugin.updateSettings(
      patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
        display: { nodeSize: 10 },
      }),
    );
    expect(saveData).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(180);
    expect(saveData).toHaveBeenCalledTimes(1);
    expect(saveData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        settingsVersion: GRAPH_SETTINGS_VERSION,
        display: expect.objectContaining({ nodeSize: 10 }),
      }),
    );

    await plugin.updateSettings(
      patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
        display: { nodeSize: 11 },
      }),
    );
    await plugin.onunload();
    expect(saveData).toHaveBeenCalledTimes(2);
    expect(saveData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        settingsVersion: GRAPH_SETTINGS_VERSION,
        display: expect.objectContaining({ nodeSize: 11 }),
      }),
    );
  });
});
