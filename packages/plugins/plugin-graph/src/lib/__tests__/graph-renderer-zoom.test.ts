import { describe, expect, it } from "vitest";
import {
  clampGraphZoom,
  graphFitScale,
  graphFitTransform,
  graphFocusTransform,
  graphNodeLabelAlpha,
  GRAPH_FOCUS_ZOOM,
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

  it("maps the complete graph-bounds center to the viewport center", () => {
    const bounds = { minX: -800, minY: -200, maxX: 1200, maxY: 600 };
    const transform = graphFitTransform({
      viewportWidth: 900,
      viewportHeight: 500,
      bounds,
      padding: 48,
    });
    const worldCenterX = (bounds.minX + bounds.maxX) / 2;
    const worldCenterY = (bounds.minY + bounds.maxY) / 2;

    expect(worldCenterX * transform.k + transform.x).toBeCloseTo(450);
    expect(worldCenterY * transform.k + transform.y).toBeCloseTo(250);
  });

  it("zooms and centers an explicitly focused node without zooming out", () => {
    const focused = graphFocusTransform({
      viewportWidth: 900,
      viewportHeight: 500,
      nodeX: 180,
      nodeY: -90,
      currentScale: 0.2,
    });

    expect(focused.k).toBe(GRAPH_FOCUS_ZOOM);
    expect(180 * focused.k + focused.x).toBeCloseTo(450);
    expect(-90 * focused.k + focused.y).toBeCloseTo(250);

    expect(
      graphFocusTransform({
        viewportWidth: 900,
        viewportHeight: 500,
        nodeX: 0,
        nodeY: 0,
        currentScale: 2,
      }).k,
    ).toBe(2);
  });

  it("shows labels on hover or after zooming past the text threshold", () => {
    expect(
      graphNodeLabelAlpha({
        zoom: GRAPH_FOCUS_ZOOM,
        textFadeThreshold: 0.8,
        hovered: false,
        context: true,
      }),
    ).toBe(0);
    expect(
      graphNodeLabelAlpha({
        zoom: 0.2,
        textFadeThreshold: 0.8,
        hovered: true,
        context: false,
      }),
    ).toBe(1);
    expect(
      graphNodeLabelAlpha({
        zoom: 1.5,
        textFadeThreshold: 0.8,
        hovered: false,
        context: true,
      }),
    ).toBeGreaterThan(0);
  });
});
