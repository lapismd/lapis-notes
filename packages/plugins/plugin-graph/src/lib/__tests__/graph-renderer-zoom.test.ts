import { describe, expect, it } from "vitest";
import {
  clampGraphZoom,
  graphFitScale,
  GRAPH_MAX_ZOOM,
  GRAPH_MIN_ZOOM,
} from "../graph-renderer";

describe("Graph renderer zoom bounds", () => {
  it("allows manual zoom-out below the legacy viewport floor", () => {
    expect(clampGraphZoom(0.2)).toBe(0.2);
    expect(clampGraphZoom(0.01)).toBe(GRAPH_MIN_ZOOM);
    expect(clampGraphZoom(10)).toBe(GRAPH_MAX_ZOOM);
  });

  it("fits large settled graph bounds below the previous 0.45 floor", () => {
    const scale = graphFitScale({
      viewportWidth: 800,
      viewportHeight: 600,
      contentWidth: 4_000,
      contentHeight: 3_000,
      padding: 48,
    });

    expect(scale).toBeCloseTo(0.168);
    expect(scale).toBeLessThan(0.35);
    expect(scale).toBeGreaterThanOrEqual(GRAPH_MIN_ZOOM);
  });
});
