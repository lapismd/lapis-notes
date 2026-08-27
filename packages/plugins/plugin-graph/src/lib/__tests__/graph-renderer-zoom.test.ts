import { describe, expect, it } from "vitest";
import {
  advanceGraphEmphasis,
  clampGraphZoom,
  createGraphLinkDegreeMap,
  createGraphForceSimulation,
  graphEmphasisAlpha,
  graphDegreeNormalizedLinkStrength,
  graphFitScale,
  graphFitTransform,
  graphFocusTransform,
  graphLinkIntersectsViewport,
  graphLinkScreenWidth,
  graphLinkUsesAccentPaint,
  graphNodeLabelAlpha,
  graphNodeIntersectsViewport,
  graphNodePreviewRect,
  graphNodeScreenRadius,
  graphNodeSupportsPreview,
  graphNodeWorldRadius,
  graphPhyllotaxisPosition,
  GRAPH_FOCUS_ZOOM,
  GRAPH_D3_ALPHA_DECAY,
  GRAPH_D3_VELOCITY_DECAY,
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

  it("limits previews to existing Markdown notes and tracks the canvas anchor", () => {
    const note: GraphRenderNode = {
      id: "note:Notes/Welcome.md",
      label: "Welcome",
      path: "Notes/Welcome.md",
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
      radius: 8,
      x: 10,
      y: 20,
    };

    expect(graphNodeSupportsPreview(note)).toBe(true);
    expect(graphNodeSupportsPreview({ ...note, type: "attachment" })).toBe(
      false,
    );
    expect(graphNodeSupportsPreview({ ...note, exists: false })).toBe(false);
    expect(
      graphNodeSupportsPreview({ ...note, path: "Images/diagram.png" }),
    ).toBe(false);

    expect(
      graphNodePreviewRect({
        node: note,
        transform: { x: 5, y: 7, k: 4 },
        canvasRect: { left: 100, top: 200 },
      }),
    ).toMatchObject({ x: 129, y: 271, width: 32, height: 32 });
  });

  it("fades unrelated graph geometry to the governed hover levels", () => {
    expect(graphEmphasisAlpha("node", false, 1)).toBe(0.12);
    expect(graphEmphasisAlpha("link", false, 1)).toBeCloseTo(0.05);
    expect(graphEmphasisAlpha("label", false, 1)).toBe(0);
    expect(graphEmphasisAlpha("node", true, 1)).toBe(1);
    expect(graphEmphasisAlpha("node", false, 0.5)).toBeCloseTo(0.56);
  });

  it("uses elapsed-time-normalized Obsidian-style emphasis easing", () => {
    const at60Hz = advanceGraphEmphasis(0, 1, 1000 / 60);
    const at120Hz = advanceGraphEmphasis(
      advanceGraphEmphasis(0, 1, 1000 / 120),
      1,
      1000 / 120,
    );

    expect(at60Hz).toBeCloseTo(0.1, 6);
    expect(at120Hz).toBeCloseTo(at60Hz, 6);
    expect(advanceGraphEmphasis(0, 1, 0)).toBe(0);
    expect(advanceGraphEmphasis(0.9995, 1, 1000 / 60)).toBe(1);
  });

  it("uses direct screen-pixel link widths and accent paint only during emphasis", () => {
    expect(graphLinkScreenWidth(0.1)).toBe(0.1);
    expect(graphLinkScreenWidth(2.5)).toBe(2.5);
    expect(graphLinkScreenWidth(8)).toBe(5);
    expect(graphLinkUsesAccentPaint(false, true)).toBe(false);
    expect(graphLinkUsesAccentPaint(true, false)).toBe(false);
    expect(graphLinkUsesAccentPaint(true, true)).toBe(true);
  });

  it("normalizes link force by endpoint degree without count weighting", () => {
    const nodes: GraphRenderNode[] = ["a", "b", "c", "d"].map((id) => ({
      id,
      label: id,
      path: `${id}.md`,
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
      radius: 8,
    }));
    const links: GraphRenderLink[] = [
      { id: "ab", source: "a", target: "b", count: 1, directed: true },
      { id: "ac", source: "a", target: "c", count: 40, directed: true },
      { id: "bd", source: "b", target: "d", count: 1, directed: true },
    ];
    const degrees = createGraphLinkDegreeMap(nodes, links);

    expect(degrees).toEqual(
      new Map([
        ["a", 2],
        ["b", 2],
        ["c", 1],
        ["d", 1],
      ]),
    );
    expect(graphDegreeNormalizedLinkStrength(links[0]!, degrees, 1)).toBe(0.5);
    expect(graphDegreeNormalizedLinkStrength(links[1]!, degrees, 1)).toBe(1);
    const countChanged = { ...links[1]!, count: 4_000 };
    expect(graphDegreeNormalizedLinkStrength(countChanged, degrees, 1)).toBe(1);
  });

  it("uses the governed D3 charge, collision, and decay configuration", () => {
    const nodes: GraphRenderNode[] = ["a", "b"].map((id) => ({
      id,
      label: id,
      path: `${id}.md`,
      type: "note",
      exists: true,
      refCount: 0,
      outgoingCount: 0,
      tags: [],
      groupIds: [],
      radius: 8,
    }));
    const links: GraphRenderLink[] = [
      { id: "ab", source: "a", target: "b", count: 8, directed: true },
    ];
    const simulation = createGraphForceSimulation(
      nodes,
      links,
      DEFAULT_GRAPH_SETTINGS,
    );
    const charge = simulation.force("charge") as unknown as {
      distanceMin(): number;
    };
    const collision = simulation.force("collision") as unknown as {
      radius(): (node: GraphRenderNode) => number;
      strength(): number;
    };

    expect(charge.distanceMin()).toBe(30);
    expect(collision.radius()(nodes[0]!)).toBe(60);
    expect(collision.strength()).toBe(0.5);
    expect(simulation.alphaDecay()).toBeCloseTo(GRAPH_D3_ALPHA_DECAY, 12);
    expect(simulation.velocityDecay()).toBe(GRAPH_D3_VELOCITY_DECAY);
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
    simulation.tick(300);

    expect(simulation.alpha()).toBeLessThanOrEqual(0.00101);
    expect(
      nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)),
    ).toBe(true);
    expect(camera).toEqual({ x: 12, y: 24, k: 0.5 });
  }, 30_000);

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
