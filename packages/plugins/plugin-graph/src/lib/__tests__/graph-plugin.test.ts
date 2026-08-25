import { describe, expect, it } from "vitest";
import {
  DEFAULT_GRAPH_SETTINGS,
  mergeGraphSettings,
  patchGraphSettings,
} from "../graph-settings";

describe("graph settings persistence snapshots", () => {
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
});
