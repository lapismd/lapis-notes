import { describe, expect, it } from "vitest";
import {
  clampGraphZoom,
  createGraphForceSimulation,
  graphEmphasisAlpha,
  graphFitScale,
  graphFitTransform,
  graphFocusTransform,
  graphLinkIntersectsViewport,
  graphNodeLabelAlpha,
  graphNodeIntersectsViewport,
  graphNodeScreenRadius,
  graphNodeWorldRadius,
  graphPhyllotaxisPosition,
  GRAPH_FOCUS_ZOOM,
  GRAPH_MAX_ZOOM,
  GRAPH_MIN_ZOOM,
  GRAPH_ZOOM_STEP,
  type GraphRenderLink,
  type GraphRenderNode,
} from "../graph-renderer";
import { DEFAULT_GRAPH_SETTINGS } from "../graph-settings";

describe("Graph renderer zoom bounds", () => {
  it("allows manual zoom-out below the legacy viewport floor", () => {
    expect(clampGraphZoom(0.2)).toBe(0.2);
    expect(clampGraphZoom(0.001)).toBe(GRAPH_MIN_ZOOM);
    expect(clampGraphZoom(10)).toBe(GRAPH_MAX_ZOOM);
    expect(GRAPH_MIN_ZOOM).toBe(1 / 128);
    expect(GRAPH_MAX_ZOOM).toBe(8);
    expect(GRAPH_ZOOM_STEP).toBe(1.5);
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

  it("grows node screen radius by square-root zoom while preserving link geometry", () => {
    expect(graphNodeScreenRadius(8, 1)).toBe(8);
    expect(graphNodeScreenRadius(8, 4)).toBe(16);
    expect(graphNodeWorldRadius(8, 4)).toBe(4);
    expect(graphNodeWorldRadius(8, 4) * 4).toBe(16);
  });

  it("fades unrelated graph geometry to the governed hover levels", () => {
    expect(graphEmphasisAlpha("node", false, 1)).toBe(0.12);
    expect(graphEmphasisAlpha("link", false, 1)).toBeCloseTo(0.05);
    expect(graphEmphasisAlpha("label", false, 1)).toBe(0);
    expect(graphEmphasisAlpha("node", true, 1)).toBe(1);
    expect(graphEmphasisAlpha("node", false, 0.5)).toBeCloseTo(0.56);
  });

  it("seeds deterministic phyllotaxis positions for large entrance layouts", () => {
    const first = Array.from({ length: 1_100 }, (_, index) =>
      graphPhyllotaxisPosition(index),
    );
    const second = Array.from({ length: 1_100 }, (_, index) =>
      graphPhyllotaxisPosition(index),
    );

    expect(first).toEqual(second);
    expect(new Set(first.map(({ x, y }) => `${x}:${y}`)).size).toBe(1_100);
    expect(Math.hypot(first[1_099]!.x, first[1_099]!.y)).toBeGreaterThan(
      Math.hypot(first[100]!.x, first[100]!.y),
    );
  });

  it("moves and settles the governed 1,100-node, 8,600-link fixture without moving its camera", () => {
    const nodes: GraphRenderNode[] = Array.from(
      { length: 1_100 },
      (_, index) => {
        const position = graphPhyllotaxisPosition(index);
        return {
          id: `note:${index}`,
          label: `Note ${index}`,
          path: `Notes/${index}.md`,
          type: "note",
          exists: true,
          refCount: 0,
          outgoingCount: 0,
          tags: [],
          groupIds: [],
          radius: 8,
          ...position,
        };
      },
    );
    const links: GraphRenderLink[] = Array.from(
      { length: 8_600 },
      (_, index) => ({
        id: `link:${index}`,
        source: `note:${index % nodes.length}`,
        target: `note:${(index * 31 + 7) % nodes.length}`,
        count: 1,
        directed: true,
      }),
    );
    const initial = nodes.map((node) => ({ x: node.x, y: node.y }));
    const camera = { x: 12, y: 24, k: 0.5 };
    const simulation = createGraphForceSimulation(
      nodes,
      links,
      DEFAULT_GRAPH_SETTINGS,
    ).alpha(1);

    simulation.tick(1);
    expect(
      nodes.some(
        (node, index) =>
          node.x !== initial[index]!.x || node.y !== initial[index]!.y,
      ),
    ).toBe(true);
    simulation.tick(180);

    expect(simulation.alpha()).toBeLessThan(0.001);
    expect(nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(
      true,
    );
    expect(camera).toEqual({ x: 12, y: 24, k: 0.5 });
  });

  it("culls off-screen nodes and links without changing their coordinates", () => {
    const transform = { x: 0, y: 0, k: 1 };
    expect(
      graphNodeIntersectsViewport({
        nodeX: 50,
        nodeY: 50,
        screenRadius: 8,
        transform,
        viewportWidth: 100,
        viewportHeight: 100,
      }),
    ).toBe(true);
    expect(
      graphNodeIntersectsViewport({
        nodeX: 500,
        nodeY: 500,
        screenRadius: 8,
        transform,
        viewportWidth: 100,
        viewportHeight: 100,
      }),
    ).toBe(false);
    expect(
      graphLinkIntersectsViewport({
        sourceX: -100,
        sourceY: 50,
        targetX: 200,
        targetY: 50,
        transform,
        viewportWidth: 100,
        viewportHeight: 100,
      }),
    ).toBe(true);
    expect(
      graphLinkIntersectsViewport({
        sourceX: 200,
        sourceY: 200,
        targetX: 300,
        targetY: 300,
        transform,
        viewportWidth: 100,
        viewportHeight: 100,
      }),
    ).toBe(false);
  });
});
