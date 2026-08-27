import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { GraphData, GraphNode, GraphSettings } from "./graph-types";
import {
  graphForceSliderToStrength,
  graphRepelForceMagnitude,
} from "./graph-settings";
import { adjustTransformForViewportResize } from "./graph-viewport-alignment";
import { GraphHoverIntent } from "./graph-hover-intent";

export interface GraphRenderNode extends GraphNode, SimulationNodeDatum {
  radius: number;
}

export interface GraphRenderLink extends SimulationLinkDatum<GraphRenderNode> {
  id: string;
  count: number;
  directed: boolean;
}

type GraphPalette = {
  link: string;
  linkActive: string;
  nodeNote: string;
  nodeAttachment: string;
  nodeTag: string;
  nodeUnresolved: string;
  nodeFocused: string;
  nodeNeutral: string;
  nodeStroke: string;
  nodeStrokeActive: string;
  nodeFocusRing: string;
  label: string;
  labelHover: string;
};

type RenderNode = GraphRenderNode;
type RenderLink = GraphRenderLink;

function simulationNodeId(value: string | number | RenderNode): string {
  return typeof value === "object" ? value.id : String(value);
}

interface GraphRendererCallbacks {
  onNodeClick: (node: GraphNode, event: MouseEvent) => void;
  onNodeContextMenu: (node: GraphNode, event: MouseEvent) => void;
  onLayoutComplete?: (summary: {
    animated: boolean;
    durationMs: number;
    nodeCount: number;
    linkCount: number;
  }) => void;
  onTimeLapseStateChange?: (state: {
    running: boolean;
    reason: "started" | "stopped" | "completed" | "graph-changed";
  }) => void;
  onNodePreviewChange?: (preview: GraphNodePreview | null) => void;
}

export interface GraphPreviewAnchor {
  getBoundingClientRect(): DOMRect;
}

export interface GraphNodePreview {
  node: GraphNode;
  anchor: GraphPreviewAnchor;
}

export type GraphViewportTransform = {
  x: number;
  y: number;
  k: number;
};

type Transform = GraphViewportTransform;

type StoredPosition = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function nodeRadius(node: GraphNode, settings: GraphSettings): number {
  return settings.display.nodeSize + Math.log2(node.refCount + 1) * 2.6;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const ENTRANCE_PREWARM_TICKS = 12;
const REDUCED_MOTION_SETTLE_TICKS = 240;
const EMPHASIS_FRAME_MS = 1000 / 60;
const EMPHASIS_DECAY_PER_FRAME = 0.9;
const EMPHASIS_EPSILON = 0.001;
export const GRAPH_D3_ALPHA_DECAY = 1 - Math.pow(0.001, 1 / 300);
export const GRAPH_D3_VELOCITY_DECAY = 0.4;

export function graphPhyllotaxisPosition(
  index: number,
  spacing = 18,
): { x: number; y: number } {
  const radius = spacing * Math.sqrt(Math.max(index, 0));
  const angle = index * GOLDEN_ANGLE;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export function graphNodeWorldRadius(baseRadius: number, zoom: number): number {
  return baseRadius / Math.sqrt(Math.max(zoom, GRAPH_MIN_ZOOM));
}

export function graphNodeScreenRadius(
  baseRadius: number,
  zoom: number,
): number {
  return baseRadius * Math.sqrt(Math.max(zoom, GRAPH_MIN_ZOOM));
}

export function graphNodeSupportsPreview(node: GraphNode): boolean {
  return Boolean(
    node.type === "note" &&
      node.exists &&
      node.path &&
      /\.(?:md|markdown)$/iu.test(node.path),
  );
}

export function graphNodePreviewRect(options: {
  node: GraphRenderNode;
  transform: GraphViewportTransform;
  canvasRect: Pick<DOMRect, "left" | "top">;
}): { x: number; y: number; width: number; height: number } {
  const { node, transform, canvasRect } = options;
  if (typeof node.x !== "number" || typeof node.y !== "number") {
    return { x: canvasRect.left, y: canvasRect.top, width: 0, height: 0 };
  }
  const radius = graphNodeScreenRadius(node.radius, transform.k);
  const centerX = canvasRect.left + node.x * transform.k + transform.x;
  const centerY = canvasRect.top + node.y * transform.k + transform.y;
  return {
    x: centerX - radius,
    y: centerY - radius,
    width: radius * 2,
    height: radius * 2,
  };
}

export function graphEmphasisAlpha(
  kind: "node" | "link" | "label",
  active: boolean,
  progress: number,
): number {
  if (active) return 1;
  const target = kind === "node" ? 0.12 : kind === "link" ? 0.05 : 0;
  return 1 - clamp(progress, 0, 1) * (1 - target);
}

export function advanceGraphEmphasis(
  previous: number,
  target: number,
  elapsedMs: number,
): number {
  const resolvedTarget = clamp(target, 0, 1);
  const resolvedPrevious = clamp(previous, 0, 1);
  if (Math.abs(resolvedTarget - resolvedPrevious) <= EMPHASIS_EPSILON) {
    return resolvedTarget;
  }
  const decay = Math.pow(
    EMPHASIS_DECAY_PER_FRAME,
    Math.max(0, elapsedMs) / EMPHASIS_FRAME_MS,
  );
  const next = resolvedPrevious * decay + resolvedTarget * (1 - decay);
  return Math.abs(resolvedTarget - next) <= EMPHASIS_EPSILON
    ? resolvedTarget
    : next;
}

export function graphLinkScreenWidth(value: number): number {
  return clamp(Number.isFinite(value) ? value : 1, 0.1, 5);
}

export function graphLinkUsesAccentPaint(
  hasEmphasis: boolean,
  incidentToSource: boolean,
): boolean {
  return hasEmphasis && incidentToSource;
}

export function createGraphLinkDegreeMap(
  nodes: GraphRenderNode[],
  links: GraphRenderLink[],
): ReadonlyMap<string, number> {
  const degrees = new Map(nodes.map((node) => [node.id, 0]));
  for (const link of links) {
    const sourceId = simulationNodeId(link.source);
    const targetId = simulationNodeId(link.target);
    degrees.set(sourceId, (degrees.get(sourceId) ?? 0) + 1);
    degrees.set(targetId, (degrees.get(targetId) ?? 0) + 1);
  }
  return degrees;
}

export function graphDegreeNormalizedLinkStrength(
  link: GraphRenderLink,
  degrees: ReadonlyMap<string, number>,
  sliderValue: number,
): number {
  const sourceDegree = Math.max(
    degrees.get(simulationNodeId(link.source)) ?? 0,
    1,
  );
  const targetDegree = Math.max(
    degrees.get(simulationNodeId(link.target)) ?? 0,
    1,
  );
  return (
    graphForceSliderToStrength(sliderValue) /
    Math.min(sourceDegree, targetDegree)
  );
}

export function createGraphForceSimulation(
  nodes: GraphRenderNode[],
  links: GraphRenderLink[],
  settings: GraphSettings,
) {
  const degrees = createGraphLinkDegreeMap(nodes, links);
  return forceSimulation(nodes)
    .force(
      "link",
      forceLink<GraphRenderNode, GraphRenderLink>(links)
        .id((node) => node.id)
        .distance(settings.forces.linkDistance)
        .strength((link) =>
          graphDegreeNormalizedLinkStrength(
            link,
            degrees,
            settings.forces.linkForce,
          ),
        ),
    )
    .force(
      "charge",
      forceManyBody<GraphRenderNode>()
        .strength(-graphRepelForceMagnitude(settings.forces.repelForce))
        .distanceMin(30),
    )
    .force(
      "center-x",
      forceX<GraphRenderNode>(0).strength(
        graphForceSliderToStrength(settings.forces.centerForce),
      ),
    )
    .force(
      "center-y",
      forceY<GraphRenderNode>(0).strength(
        graphForceSliderToStrength(settings.forces.centerForce),
      ),
    )
    .force(
      "collision",
      forceCollide<GraphRenderNode>().radius(60).strength(0.5),
    )
    .alphaDecay(GRAPH_D3_ALPHA_DECAY)
    .velocityDecay(GRAPH_D3_VELOCITY_DECAY)
    .stop();
}

function graphNodeChronology(node: GraphNode): number {
  if (typeof node.ctime === "number" && node.ctime > 0) return node.ctime;
  if (typeof node.mtime === "number" && node.mtime > 0) return node.mtime;
  return Number.POSITIVE_INFINITY;
}

export function createGraphTimeLapsePlan(graph: GraphData): string[] {
  const primary = graph.nodes
    .filter((node) => node.type === "note" || node.type === "attachment")
    .sort((left, right) => {
      const chronology = graphNodeChronology(left) - graphNodeChronology(right);
      return Number.isNaN(chronology) || chronology === 0
        ? left.id.localeCompare(right.id)
        : chronology;
    });
  const primaryRank = new Map(primary.map((node, index) => [node.id, index]));
  const auxiliaryRank = new Map<string, number>();
  for (const link of graph.links) {
    const sourceRank = primaryRank.get(link.source);
    const targetRank = primaryRank.get(link.target);
    if (sourceRank !== undefined && targetRank === undefined) {
      auxiliaryRank.set(
        link.target,
        Math.min(auxiliaryRank.get(link.target) ?? Infinity, sourceRank),
      );
    }
    if (targetRank !== undefined && sourceRank === undefined) {
      auxiliaryRank.set(
        link.source,
        Math.min(auxiliaryRank.get(link.source) ?? Infinity, targetRank),
      );
    }
  }

  const entries = [
    ...primary.map((node, index) => ({ id: node.id, rank: index, kind: 0 })),
    ...graph.nodes
      .filter((node) => !primaryRank.has(node.id))
      .map((node) => ({
        id: node.id,
        rank: auxiliaryRank.get(node.id) ?? Infinity,
        kind: 1,
      })),
  ];
  entries.sort(
    (left, right) =>
      left.rank - right.rank ||
      left.kind - right.kind ||
      left.id.localeCompare(right.id),
  );
  return entries.map((entry) => entry.id);
}

export function graphTimeLapseVisibleCount(
  elapsedMs: number,
  durationMs: number,
  total: number,
): number {
  if (total <= 0) return 0;
  if (durationMs <= 0) return total;
  return Math.min(
    total,
    Math.floor(clamp(elapsedMs / durationMs, 0, 1) * total),
  );
}

export function graphNodeIntersectsViewport(options: {
  nodeX: number;
  nodeY: number;
  screenRadius: number;
  transform: GraphViewportTransform;
  viewportWidth: number;
  viewportHeight: number;
  margin?: number;
}): boolean {
  const {
    nodeX,
    nodeY,
    screenRadius,
    transform,
    viewportWidth,
    viewportHeight,
    margin = 24,
  } = options;
  const x = nodeX * transform.k + transform.x;
  const y = nodeY * transform.k + transform.y;
  const radius = screenRadius + margin;
  return (
    x + radius >= 0 &&
    x - radius <= viewportWidth &&
    y + radius >= 0 &&
    y - radius <= viewportHeight
  );
}

export function graphLinkIntersectsViewport(options: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  transform: GraphViewportTransform;
  viewportWidth: number;
  viewportHeight: number;
  margin?: number;
}): boolean {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    transform,
    viewportWidth,
    viewportHeight,
    margin = 24,
  } = options;
  const x1 = sourceX * transform.k + transform.x;
  const y1 = sourceY * transform.k + transform.y;
  const x2 = targetX * transform.k + transform.x;
  const y2 = targetY * transform.k + transform.y;
  return !(
    Math.max(x1, x2) < -margin ||
    Math.min(x1, x2) > viewportWidth + margin ||
    Math.max(y1, y2) < -margin ||
    Math.min(y1, y2) > viewportHeight + margin
  );
}

function readStyleValue(
  styles: CSSStyleDeclaration,
  property: string,
  fallback: string,
): string {
  return styles.getPropertyValue(property).trim() || fallback;
}

function resolveGraphPalette(el: HTMLElement): GraphPalette {
  const styles = getComputedStyle(el);
  return {
    link: readStyleValue(
      styles,
      "--ui-graph-link",
      "rgba(100, 116, 139, 0.24)",
    ),
    linkActive: readStyleValue(
      styles,
      "--ui-graph-link-active",
      "rgba(15, 23, 42, 0.48)",
    ),
    nodeNote: readStyleValue(
      styles,
      "--ui-graph-node-note",
      "rgb(58, 127, 246)",
    ),
    nodeAttachment: readStyleValue(
      styles,
      "--ui-graph-node-attachment",
      "rgb(16, 185, 129)",
    ),
    nodeTag: readStyleValue(styles, "--ui-graph-node-tag", "rgb(245, 158, 11)"),
    nodeUnresolved: readStyleValue(
      styles,
      "--ui-graph-node-unresolved",
      "rgb(239, 68, 68)",
    ),
    nodeFocused: readStyleValue(
      styles,
      "--graph-node-focused",
      "rgb(58, 127, 246)",
    ),
    nodeNeutral: readStyleValue(
      styles,
      "--ui-graph-node-neutral",
      "rgb(148, 163, 184)",
    ),
    nodeStroke: readStyleValue(
      styles,
      "--ui-graph-node-stroke",
      "rgba(255, 255, 255, 0.85)",
    ),
    nodeStrokeActive: readStyleValue(
      styles,
      "--ui-graph-node-active-stroke",
      "rgba(15, 23, 42, 0.65)",
    ),
    nodeFocusRing: readStyleValue(
      styles,
      "--ui-graph-node-focus-ring",
      "rgba(15, 23, 42, 0.82)",
    ),
    label: readStyleValue(
      styles,
      "--ui-graph-node-label",
      "rgba(100, 116, 139, 0.92)",
    ),
    labelHover: readStyleValue(
      styles,
      "--ui-graph-node-label-hover",
      "rgb(15, 23, 42)",
    ),
  };
}

function nodeColor(node: GraphNode, palette: GraphPalette): string {
  if (node.primaryColor) {
    return node.primaryColor;
  }
  switch (node.type) {
    case "note":
      return palette.nodeNote;
    case "attachment":
      return palette.nodeAttachment;
    case "tag":
      return palette.nodeTag;
    case "unresolved":
      return palette.nodeUnresolved;
    default:
      return palette.nodeNeutral;
  }
}

function linkColor(active: boolean, palette: GraphPalette): string {
  return active ? palette.linkActive : palette.link;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const GRAPH_MIN_ZOOM = 1 / 128;
export const GRAPH_MAX_ZOOM = 8;
export const GRAPH_MAX_FIT_ZOOM = 1.35;
export const GRAPH_FOCUS_ZOOM = 1.1;
export const GRAPH_ZOOM_STEP = 1.5;
const WHEEL_ZOOM_DELTA_CAP = 240;

export function clampGraphZoom(value: number): number {
  return clamp(value, GRAPH_MIN_ZOOM, GRAPH_MAX_ZOOM);
}

export function graphFitScale(options: {
  viewportWidth: number;
  viewportHeight: number;
  contentWidth: number;
  contentHeight: number;
  padding: number;
}): number {
  const {
    viewportWidth,
    viewportHeight,
    contentWidth,
    contentHeight,
    padding,
  } = options;
  const fitScale = Math.min(
    (viewportWidth - padding * 2) / contentWidth,
    (viewportHeight - padding * 2) / contentHeight,
  );
  return clamp(fitScale, GRAPH_MIN_ZOOM, GRAPH_MAX_FIT_ZOOM);
}

export function graphFitTransform(options: {
  viewportWidth: number;
  viewportHeight: number;
  bounds: Bounds;
  padding: number;
}): GraphViewportTransform {
  const { viewportWidth, viewportHeight, bounds, padding } = options;
  const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = graphFitScale({
    viewportWidth,
    viewportHeight,
    contentWidth,
    contentHeight,
    padding,
  });
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    x: viewportWidth / 2 - centerX * scale,
    y: viewportHeight / 2 - centerY * scale,
    k: scale,
  };
}

export function graphFocusTransform(options: {
  viewportWidth: number;
  viewportHeight: number;
  nodeX: number;
  nodeY: number;
  currentScale: number;
}): GraphViewportTransform {
  const { viewportWidth, viewportHeight, nodeX, nodeY, currentScale } = options;
  const scale = clampGraphZoom(Math.max(currentScale, GRAPH_FOCUS_ZOOM));
  return {
    x: viewportWidth / 2 - nodeX * scale,
    y: viewportHeight / 2 - nodeY * scale,
    k: scale,
  };
}

export function graphNodeLabelAlpha(options: {
  zoom: number;
  textFadeThreshold: number;
  hovered: boolean;
  context: boolean;
}): number {
  if (options.hovered) {
    return 1;
  }
  const labelZoomThreshold = Math.max(1.05, options.textFadeThreshold + 0.35);
  const zoomProgress = clamp((options.zoom - labelZoomThreshold) / 0.55, 0, 1);
  return zoomProgress * (options.context ? 0.82 : 0.72);
}

export type GraphFocusOptions = {
  zoom?: boolean;
};

function normalizeWheelDelta(event: WheelEvent, pageHeight: number): number {
  const deltaModeScale =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? Math.max(pageHeight, 1)
        : 1;

  return clamp(
    event.deltaY * deltaModeScale,
    -WHEEL_ZOOM_DELTA_CAP,
    WHEEL_ZOOM_DELTA_CAP,
  );
}

export class GraphRenderer {
  private readonly wrapperEl: HTMLDivElement;
  private readonly canvasEl: HTMLCanvasElement;
  private readonly emptyStateEl: HTMLDivElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly callbacks: GraphRendererCallbacks;

  private simulation = forceSimulation<RenderNode>([]);
  private graph: GraphData = { nodes: [], links: [], centerNodeId: null };
  private settings: GraphSettings | null = null;
  private nodes: RenderNode[] = [];
  private links: RenderLink[] = [];
  private neighborMap: Map<string, Set<string>> = new Map();
  private positions: Map<string, StoredPosition> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private animationFrame: number | null = null;
  private timeLapseFrame: number | null = null;
  private timeLapseStartedAt = 0;
  private timeLapseDurationMs = 10_000;
  private timeLapseOrder: string[] = [];
  private visibleTimeLapseNodes: Set<string> | null = null;
  private hoveredNodeId: string | null = null;
  private emphasisNodeId: string | null = null;
  private focusedNodeId: string | null = null;
  private emphasisProgress = 0;
  private emphasisTarget = 0;
  private emphasisFrameAt = 0;
  private layoutStartedAt = 0;
  private readonly reducedMotion: boolean;
  private autoCenterNodeId: string | null = null;
  private autoCenterZoom = false;
  private autoFitViewport = false;
  private pendingCenterNodeId: string | null = null;
  private pendingFitViewport = false;
  private hasFittedViewport = false;
  private lastViewportWidth = 0;
  private lastViewportHeight = 0;
  private viewportAdjustedByUser = false;
  private pointerMode: "pan" | "drag" | null = null;
  private pointerId: number | null = null;
  private pointerDownNodeId: string | null = null;
  private pointerMoved = false;
  private dragNode: RenderNode | null = null;
  private pointerStart = { x: 0, y: 0 };
  private panStart: Transform = { x: 0, y: 0, k: 1 };
  private transform: Transform = { x: 0, y: 0, k: 1 };
  private readonly hoverIntent: GraphHoverIntent;
  private modifierDown = false;
  private previewNodeId: string | null = null;
  private previewSuppressedNodeId: string | null = null;
  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Meta" || event.key === "Control") {
      this.modifierDown = true;
      this.openPreviewForHoveredNode();
    }
  };
  private readonly handleDocumentKeyUp = (event: KeyboardEvent): void => {
    if (event.key === "Meta" || event.key === "Control") {
      this.modifierDown = event.metaKey || event.ctrlKey;
    }
  };

  constructor(containerEl: HTMLElement, callbacks: GraphRendererCallbacks) {
    this.callbacks = callbacks;
    this.reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.wrapperEl = document.createElement("div");
    this.wrapperEl.style.position = "relative";
    this.wrapperEl.style.flex = "1";
    this.wrapperEl.style.width = "100%";
    this.wrapperEl.style.height = "100%";
    this.wrapperEl.style.minHeight = "0";
    this.wrapperEl.style.border = "none";
    this.wrapperEl.style.borderRadius = "0";
    this.wrapperEl.style.overflow = "hidden";
    this.wrapperEl.style.background = "inherit";
    this.wrapperEl.style.outline = "none";
    this.wrapperEl.dataset.uiComponent = "graph-canvas";
    this.wrapperEl.dataset.uiPart = "renderer";
    this.wrapperEl.tabIndex = 0;

    this.canvasEl = document.createElement("canvas");
    this.canvasEl.style.width = "100%";
    this.canvasEl.style.height = "100%";
    this.canvasEl.style.display = "block";
    this.canvasEl.style.cursor = "grab";
    this.canvasEl.dataset.uiPart = "canvas";

    this.emptyStateEl = document.createElement("div");
    this.emptyStateEl.style.position = "absolute";
    this.emptyStateEl.style.inset = "0";
    this.emptyStateEl.style.display = "flex";
    this.emptyStateEl.style.alignItems = "center";
    this.emptyStateEl.style.justifyContent = "center";
    this.emptyStateEl.style.color = "var(--ui-graph-node-label, #64748b)";
    this.emptyStateEl.style.fontSize = "0.95rem";
    this.emptyStateEl.style.pointerEvents = "none";
    this.emptyStateEl.dataset.uiPart = "empty-state";
    this.emptyStateEl.textContent = "Graph has no visible nodes.";

    this.wrapperEl.append(this.canvasEl, this.emptyStateEl);
    containerEl.appendChild(this.wrapperEl);

    const context = this.canvasEl.getContext("2d");
    if (!context) {
      throw new Error("Failed to create graph canvas context");
    }
    this.context = context;

    this.hoverIntent = new GraphHoverIntent(
      () => ({
        activationDelayMs: this.settings?.display.hoverActivationDelayMs ?? 500,
        releaseDelayMs: this.settings?.display.hoverReleaseDelayMs ?? 350,
      }),
      (nodeId) => {
        this.emphasisNodeId = nodeId;
        this.updateEmphasisTarget();
        this.queueRender();
      },
    );

    this.bindEvents();
    this.wrapperEl.ownerDocument.addEventListener(
      "keydown",
      this.handleDocumentKeyDown,
    );
    this.wrapperEl.ownerDocument.addEventListener(
      "keyup",
      this.handleDocumentKeyUp,
    );
    this.observeResize();
    this.resize();
  }

  setGraph(graph: GraphData, settings: GraphSettings): void {
    this.stopTimeLapse("graph-changed");
    this.hoveredNodeId = null;
    this.hoverIntent.clear();
    this.closePreview();
    const sameTopology = this.hasSameTopology(graph);
    this.storePositions();
    this.graph = graph;
    this.settings = settings;
    this.emptyStateEl.style.display = graph.nodes.length ? "none" : "flex";

    const nextNodes = graph.nodes.map((node, index) => {
      const previous = this.positions.get(node.id);
      const seed = graphPhyllotaxisPosition(index);
      return {
        ...node,
        radius: nodeRadius(node, settings),
        x: previous?.x ?? seed.x,
        y: previous?.y ?? seed.y,
        vx: previous?.vx ?? 0,
        vy: previous?.vy ?? 0,
      } satisfies RenderNode;
    });
    const nodeMap = new Map(nextNodes.map((node) => [node.id, node]));
    const nextLinks: RenderLink[] = [];
    for (const link of graph.links) {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) {
        continue;
      }
      nextLinks.push({
        id: link.id,
        source,
        target,
        count: link.count,
        directed: link.directed,
      });
    }

    this.nodes = nextNodes;
    this.links = nextLinks;
    this.rebuildNeighborMap();
    this.autoFitViewport = false;
    if (!sameTopology) {
      this.hasFittedViewport = false;
      this.viewportAdjustedByUser = false;
    } else {
      this.pendingFitViewport = false;
    }
    this.restartSimulation(sameTopology);
    this.queueRender();
  }

  private hasSameTopology(graph: GraphData): boolean {
    if (
      this.graph.nodes.length !== graph.nodes.length ||
      this.graph.links.length !== graph.links.length
    ) {
      return false;
    }

    const previousNodeIds = new Set(this.graph.nodes.map((node) => node.id));
    for (const node of graph.nodes) {
      if (!previousNodeIds.has(node.id)) {
        return false;
      }
    }

    const previousLinkIds = new Set(this.graph.links.map((link) => link.id));
    for (const link of graph.links) {
      if (!previousLinkIds.has(link.id)) {
        return false;
      }
    }

    return true;
  }

  focusNode(nodeId: string | null, options: GraphFocusOptions = {}): void {
    this.focusedNodeId = nodeId;
    this.autoCenterNodeId = nodeId;
    this.autoCenterZoom = options.zoom === true;
    this.updateEmphasisTarget();
    if (!nodeId) {
      this.pendingCenterNodeId = null;
      this.queueRender();
      return;
    }
    const node = this.nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      this.focusedNodeId = null;
      this.autoCenterNodeId = null;
      this.autoCenterZoom = false;
      this.updateEmphasisTarget();
      this.queueRender();
      return;
    }
    this.viewportAdjustedByUser = false;
    if (!this.hasViewportSize()) {
      this.pendingCenterNodeId = nodeId;
      this.queueRender();
      return;
    }

    this.pendingFitViewport = false;
    this.applyFocusAlignment(node);
    this.pendingCenterNodeId = null;
    this.queueRender();
  }

  zoomIn(): void {
    this.zoomAtCenter(GRAPH_ZOOM_STEP);
  }

  zoomOut(): void {
    this.zoomAtCenter(1 / GRAPH_ZOOM_STEP);
  }

  resetView(): void {
    this.focusedNodeId = null;
    this.autoCenterNodeId = null;
    this.autoCenterZoom = false;
    this.autoFitViewport = false;
    this.viewportAdjustedByUser = false;
    this.updateEmphasisTarget();
    this.fitGraphToViewport();
    this.queueRender();
  }

  refreshViewport(): void {
    this.resize();
  }

  startTimeLapse(durationMs = 10_000): void {
    if (!this.nodes.length) return;
    this.hoveredNodeId = null;
    this.hoverIntent.clear();
    this.stopTimeLapse("stopped", false);
    this.timeLapseDurationMs = Math.max(1, durationMs);
    this.timeLapseOrder = createGraphTimeLapsePlan(this.graph);
    this.visibleTimeLapseNodes = new Set();
    this.timeLapseStartedAt = performance.now();
    this.callbacks.onTimeLapseStateChange?.({
      running: true,
      reason: "started",
    });
    this.scheduleTimeLapseFrame();
    this.queueRender();
  }

  stopTimeLapse(
    reason: "stopped" | "completed" | "graph-changed" = "stopped",
    notify = true,
  ): void {
    const wasRunning = this.visibleTimeLapseNodes !== null;
    if (this.timeLapseFrame !== null) {
      cancelAnimationFrame(this.timeLapseFrame);
      this.timeLapseFrame = null;
    }
    this.visibleTimeLapseNodes = null;
    this.timeLapseOrder = [];
    if (wasRunning) {
      this.queueRender();
      if (notify) {
        this.callbacks.onTimeLapseStateChange?.({ running: false, reason });
      }
    }
  }

  isTimeLapseRunning(): boolean {
    return this.visibleTimeLapseNodes !== null;
  }

  dismissPreview(): void {
    this.previewSuppressedNodeId = this.hoveredNodeId;
    this.closePreview();
  }

  destroy(): void {
    this.hoverIntent.destroy();
    this.closePreview();
    this.wrapperEl.ownerDocument.removeEventListener(
      "keydown",
      this.handleDocumentKeyDown,
    );
    this.wrapperEl.ownerDocument.removeEventListener(
      "keyup",
      this.handleDocumentKeyUp,
    );
    this.storePositions();
    this.simulation.stop();
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.timeLapseFrame !== null) {
      cancelAnimationFrame(this.timeLapseFrame);
      this.timeLapseFrame = null;
    }
    this.resizeObserver?.disconnect();
    this.wrapperEl.remove();
  }

  private observeResize(): void {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.wrapperEl);
  }

  private bindEvents(): void {
    this.wrapperEl.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const rect = this.canvasEl.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const worldX = (offsetX - this.transform.x) / this.transform.k;
        const worldY = (offsetY - this.transform.y) / this.transform.k;
        const wheelDelta = normalizeWheelDelta(
          event,
          this.wrapperEl.clientHeight,
        );
        const wheelZoomSensitivity =
          this.settings?.display.wheelZoomSensitivity ?? 1;
        const zoomFactor = Math.pow(
          GRAPH_ZOOM_STEP,
          (-wheelDelta / 120) * wheelZoomSensitivity,
        );
        const nextScale = this.transform.k * zoomFactor;
        this.transform.k = clampGraphZoom(nextScale);
        this.transform.x = offsetX - worldX * this.transform.k;
        this.transform.y = offsetY - worldY * this.transform.k;
        this.viewportAdjustedByUser = true;
        this.queueRender();
      },
      { passive: false },
    );

    this.wrapperEl.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }
      this.wrapperEl.focus();
      this.hoveredNodeId = null;
      this.hoverIntent.clear();
      this.closePreview();
      this.pointerId = event.pointerId;
      this.pointerStart = { x: event.clientX, y: event.clientY };
      this.panStart = { ...this.transform };
      this.pointerMoved = false;
      const node = this.hitTest(event.clientX, event.clientY);
      this.pointerDownNodeId = node?.id ?? null;
      if (node) {
        this.pointerMode = "drag";
        this.dragNode = node;
        node.fx = node.x ?? 0;
        node.fy = node.y ?? 0;
        this.simulation.alphaTarget(0.25).restart();
        this.canvasEl.style.cursor = "grabbing";
      } else {
        this.pointerMode = "pan";
        this.canvasEl.style.cursor = "grabbing";
      }
      this.wrapperEl.setPointerCapture(event.pointerId);
    });

    this.wrapperEl.addEventListener("pointermove", (event) => {
      if (this.pointerMode === "drag" && this.dragNode) {
        const point = this.screenToWorld(event.clientX, event.clientY);
        this.pointerMoved =
          this.pointerMoved ||
          this.pointerDistance(event.clientX, event.clientY) > 3;
        this.dragNode.fx = point.x;
        this.dragNode.fy = point.y;
        this.dragNode.x = point.x;
        this.dragNode.y = point.y;
        this.queueRender();
        return;
      }
      if (this.pointerMode === "pan") {
        this.pointerMoved =
          this.pointerMoved ||
          this.pointerDistance(event.clientX, event.clientY) > 3;
        this.transform.x =
          this.panStart.x + (event.clientX - this.pointerStart.x);
        this.transform.y =
          this.panStart.y + (event.clientY - this.pointerStart.y);
        this.viewportAdjustedByUser = true;
        this.queueRender();
        return;
      }

      const hovered = this.hitTest(event.clientX, event.clientY);
      const hoveredNodeId = hovered?.id ?? null;
      if (hoveredNodeId !== this.hoveredNodeId) {
        this.closePreview();
        this.previewSuppressedNodeId = null;
        this.hoveredNodeId = hoveredNodeId;
        this.hoverIntent.setPointerNode(hoveredNodeId);
        this.canvasEl.style.cursor = hovered ? "pointer" : "grab";
        this.queueRender();
      }
      this.modifierDown = event.metaKey || event.ctrlKey || this.modifierDown;
      if (hovered && this.modifierDown) this.openPreview(hovered);
    });

    this.wrapperEl.addEventListener("pointerleave", () => {
      if (this.pointerMode || this.hoveredNodeId === null) return;
      this.hoveredNodeId = null;
      this.hoverIntent.setPointerNode(null);
      this.closePreview();
      this.canvasEl.style.cursor = "grab";
      this.queueRender();
    });

    this.wrapperEl.addEventListener("pointerup", (event) => {
      if (this.pointerId !== event.pointerId) {
        return;
      }
      const node = this.hitTest(event.clientX, event.clientY);
      if (
        !this.pointerMoved &&
        this.pointerDownNodeId &&
        node?.id === this.pointerDownNodeId
      ) {
        this.callbacks.onNodeClick(node, event as MouseEvent);
      }
      this.endPointerInteraction(event.pointerId);
    });

    this.wrapperEl.addEventListener("pointercancel", (event) => {
      this.endPointerInteraction(event.pointerId);
    });

    this.wrapperEl.addEventListener("contextmenu", (event) => {
      const node = this.hitTest(event.clientX, event.clientY);
      if (!node) {
        return;
      }
      event.preventDefault();
      this.callbacks.onNodeContextMenu(node, event);
    });

    this.wrapperEl.addEventListener("keydown", (event) => {
      const panDistance = event.shiftKey ? 90 : 36;
      switch (event.key) {
        case "ArrowLeft":
          this.transform.x += panDistance;
          this.viewportAdjustedByUser = true;
          this.queueRender();
          event.preventDefault();
          break;
        case "ArrowRight":
          this.transform.x -= panDistance;
          this.viewportAdjustedByUser = true;
          this.queueRender();
          event.preventDefault();
          break;
        case "ArrowUp":
          this.transform.y += panDistance;
          this.viewportAdjustedByUser = true;
          this.queueRender();
          event.preventDefault();
          break;
        case "ArrowDown":
          this.transform.y -= panDistance;
          this.viewportAdjustedByUser = true;
          this.queueRender();
          event.preventDefault();
          break;
        case "+":
        case "=":
          this.zoomAtCenter(GRAPH_ZOOM_STEP);
          event.preventDefault();
          break;
        case "-":
          this.zoomAtCenter(1 / GRAPH_ZOOM_STEP);
          event.preventDefault();
          break;
        case "Escape":
          this.hoveredNodeId = null;
          this.hoverIntent.clear();
          this.previewSuppressedNodeId = this.previewNodeId;
          this.closePreview();
          this.focusedNodeId = null;
          this.autoCenterNodeId = null;
          this.autoCenterZoom = false;
          this.updateEmphasisTarget();
          this.queueRender();
          event.preventDefault();
          break;
      }
    });
  }

  private resize(): void {
    const rect = this.wrapperEl.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    this.canvasEl.width = Math.max(1, Math.floor(rect.width * ratio));
    this.canvasEl.height = Math.max(1, Math.floor(rect.height * ratio));
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.scale(ratio, ratio);

    const viewportWidth = this.wrapperEl.clientWidth;
    const viewportHeight = this.wrapperEl.clientHeight;
    const prevViewportWidth = this.lastViewportWidth;
    const prevViewportHeight = this.lastViewportHeight;

    if (this.hasViewportSize()) {
      if (this.pendingCenterNodeId) {
        const node = this.nodes.find(
          (entry) => entry.id === this.pendingCenterNodeId,
        );
        if (this.pendingFitViewport || !this.hasFittedViewport) {
          this.fitGraphToViewport();
          this.pendingFitViewport = false;
        }
        if (node) {
          this.applyFocusAlignment(node);
        }
        this.pendingCenterNodeId = null;
      } else if (this.pendingFitViewport) {
        this.fitGraphToViewport();
        this.pendingFitViewport = false;
      } else if (this.autoCenterNodeId) {
        const node = this.nodes.find(
          (entry) => entry.id === this.autoCenterNodeId,
        );
        if (node) {
          this.applyFocusAlignment(node);
        }
      } else if (this.autoFitViewport) {
        this.fitGraphToViewport();
      } else if (
        viewportWidth !== prevViewportWidth ||
        viewportHeight !== prevViewportHeight
      ) {
        if (prevViewportWidth > 0 && prevViewportHeight > 0) {
          this.applyResizeAlignment(
            prevViewportWidth,
            prevViewportHeight,
            viewportWidth,
            viewportHeight,
          );
        } else if (!this.viewportAdjustedByUser) {
          this.applyResizeAlignment(
            viewportWidth,
            viewportHeight,
            viewportWidth,
            viewportHeight,
          );
        }
      }
    }

    this.lastViewportWidth = viewportWidth;
    this.lastViewportHeight = viewportHeight;
    this.queueRender();
  }

  private hasViewportSize(): boolean {
    return this.wrapperEl.clientWidth > 0 && this.wrapperEl.clientHeight > 0;
  }

  private centerNodeInViewport(node: RenderNode): void {
    this.transform = {
      ...this.transform,
      x: this.wrapperEl.clientWidth / 2 - (node.x ?? 0) * this.transform.k,
      y: this.wrapperEl.clientHeight / 2 - (node.y ?? 0) * this.transform.k,
    };
  }

  private applyFocusAlignment(node: RenderNode): void {
    if (this.autoFitViewport || !this.hasFittedViewport) {
      this.fitGraphToViewport();
    }
    if (this.autoCenterZoom) {
      this.transform = graphFocusTransform({
        viewportWidth: this.wrapperEl.clientWidth,
        viewportHeight: this.wrapperEl.clientHeight,
        nodeX: node.x ?? 0,
        nodeY: node.y ?? 0,
        currentScale: this.transform.k,
      });
      return;
    }
    this.centerNodeInViewport(node);
  }

  private applyResizeAlignment(
    prevWidth: number,
    prevHeight: number,
    nextWidth: number,
    nextHeight: number,
  ): void {
    if (!this.viewportAdjustedByUser) {
      if (this.focusedNodeId) {
        const node = this.nodes.find(
          (entry) => entry.id === this.focusedNodeId,
        );
        if (node) {
          this.applyFocusAlignment(node);
          return;
        }
      }
      this.fitGraphToViewport();
      return;
    }

    this.transform = adjustTransformForViewportResize(
      this.transform,
      prevWidth,
      prevHeight,
      nextWidth,
      nextHeight,
    );
  }

  private storePositions(): void {
    for (const node of this.nodes) {
      if (typeof node.x !== "number" || typeof node.y !== "number") {
        continue;
      }
      this.positions.set(node.id, {
        x: node.x,
        y: node.y,
        vx: node.vx ?? 0,
        vy: node.vy ?? 0,
      });
    }
  }

  private fitGraphToViewport(): void {
    const bounds = this.getBounds();
    if (!bounds) {
      this.transform = {
        x: this.wrapperEl.clientWidth / 2,
        y: this.wrapperEl.clientHeight / 2,
        k: 1,
      };
      return;
    }

    const viewportWidth = Math.max(this.wrapperEl.clientWidth, 1);
    const viewportHeight = Math.max(this.wrapperEl.clientHeight, 1);
    const padding = 48;
    this.transform = graphFitTransform({
      viewportWidth,
      viewportHeight,
      bounds,
      padding,
    });
    this.hasFittedViewport = true;
  }

  private getBounds(): Bounds | null {
    let bounds: Bounds | null = null;
    for (const node of this.nodes) {
      if (typeof node.x !== "number" || typeof node.y !== "number") {
        continue;
      }
      const radius = node.radius + 12;
      if (!bounds) {
        bounds = {
          minX: node.x - radius,
          minY: node.y - radius,
          maxX: node.x + radius,
          maxY: node.y + radius,
        };
        continue;
      }
      bounds.minX = Math.min(bounds.minX, node.x - radius);
      bounds.minY = Math.min(bounds.minY, node.y - radius);
      bounds.maxX = Math.max(bounds.maxX, node.x + radius);
      bounds.maxY = Math.max(bounds.maxY, node.y + radius);
    }
    return bounds;
  }

  private rebuildNeighborMap(): void {
    this.neighborMap = new Map();
    for (const node of this.nodes) {
      this.neighborMap.set(node.id, new Set());
    }
    for (const link of this.links) {
      const sourceId = simulationNodeId(link.source);
      const targetId = simulationNodeId(link.target);
      this.neighborMap.get(sourceId)?.add(targetId);
      this.neighborMap.get(targetId)?.add(sourceId);
    }
  }

  private restartSimulation(sameTopology: boolean): void {
    this.simulation.stop();
    if (!this.settings) {
      return;
    }
    this.layoutStartedAt = performance.now();
    this.simulation = createGraphForceSimulation(
      this.nodes,
      this.links,
      this.settings,
    )
      .on("tick", () => {
        this.applyAutoCenter();
        this.queueRender();
      })
      .on("end", () => {
        this.applyFinalAlignment();
        this.callbacks.onLayoutComplete?.({
          animated: !this.reducedMotion,
          durationMs: Math.round(performance.now() - this.layoutStartedAt),
          nodeCount: this.nodes.length,
          linkCount: this.links.length,
        });
      });

    this.simulation.stop();
    if (this.reducedMotion) {
      this.simulation
        .alpha(sameTopology ? 0.18 : 1)
        .tick(sameTopology ? 80 : REDUCED_MOTION_SETTLE_TICKS);
      this.prepareInitialFit(sameTopology);
      this.applyFinalAlignment();
      this.callbacks.onLayoutComplete?.({
        animated: false,
        durationMs: Math.round(performance.now() - this.layoutStartedAt),
        nodeCount: this.nodes.length,
        linkCount: this.links.length,
      });
      return;
    }

    if (!sameTopology) {
      this.simulation.alpha(1).tick(ENTRANCE_PREWARM_TICKS);
    }
    this.prepareInitialFit(sameTopology);
    this.simulation.alpha(sameTopology ? 0.18 : 0.82).restart();
  }

  private prepareInitialFit(sameTopology: boolean): void {
    if (sameTopology) return;
    if (this.hasViewportSize()) {
      this.fitGraphToViewport();
      this.pendingFitViewport = false;
    } else {
      this.pendingFitViewport = true;
    }
  }

  private applyAutoCenter(): void {
    if (this.autoCenterNodeId) {
      const node = this.nodes.find(
        (entry) => entry.id === this.autoCenterNodeId,
      );
      if (node && typeof node.x === "number" && typeof node.y === "number") {
        this.transform = {
          ...this.transform,
          x: this.wrapperEl.clientWidth / 2 - node.x * this.transform.k,
          y: this.wrapperEl.clientHeight / 2 - node.y * this.transform.k,
        };
      }
    }
  }

  private applyFinalAlignment(): void {
    if (!this.hasViewportSize()) {
      return;
    }

    if (this.autoCenterNodeId) {
      const node = this.nodes.find(
        (entry) => entry.id === this.autoCenterNodeId,
      );
      if (node) {
        this.applyFocusAlignment(node);
      }
    }

    this.autoCenterNodeId = null;
    this.autoCenterZoom = false;
    this.autoFitViewport = false;
    this.queueRender();
  }

  private updateEmphasisTarget(): void {
    const nextTarget = this.emphasisNodeId || this.focusedNodeId ? 1 : 0;
    if (nextTarget === this.emphasisTarget) return;
    if (this.reducedMotion) {
      this.emphasisProgress = nextTarget;
      this.emphasisTarget = nextTarget;
      this.emphasisFrameAt = 0;
      return;
    }
    const now = performance.now();
    this.advanceEmphasis(now);
    this.emphasisTarget = nextTarget;
    this.emphasisFrameAt = now;
  }

  private advanceEmphasis(now: number): boolean {
    if (this.emphasisProgress === this.emphasisTarget) return false;
    const elapsed = Math.max(0, now - this.emphasisFrameAt);
    this.emphasisFrameAt = now;
    this.emphasisProgress = advanceGraphEmphasis(
      this.emphasisProgress,
      this.emphasisTarget,
      elapsed,
    );
    return this.emphasisProgress !== this.emphasisTarget;
  }

  private scheduleTimeLapseFrame(): void {
    if (this.timeLapseFrame !== null || !this.visibleTimeLapseNodes) return;
    this.timeLapseFrame = requestAnimationFrame((now) => {
      this.timeLapseFrame = null;
      const visible = this.visibleTimeLapseNodes;
      if (!visible) return;
      const elapsed = Math.max(0, now - this.timeLapseStartedAt);
      const targetCount = graphTimeLapseVisibleCount(
        elapsed,
        this.timeLapseDurationMs,
        this.timeLapseOrder.length,
      );
      let added = 0;
      while (visible.size < targetCount && added < 64) {
        const nodeId = this.timeLapseOrder[visible.size];
        if (!nodeId) break;
        visible.add(nodeId);
        added += 1;
      }
      if (added > 0) {
        this.simulation
          .alpha(Math.max(this.simulation.alpha(), 0.08))
          .restart();
        this.queueRender();
      }
      if (
        elapsed >= this.timeLapseDurationMs &&
        visible.size >= this.timeLapseOrder.length
      ) {
        this.stopTimeLapse("completed");
        return;
      }
      this.scheduleTimeLapseFrame();
    });
  }

  private isNodeVisibleInTimeLapse(nodeId: string): boolean {
    return this.visibleTimeLapseNodes?.has(nodeId) ?? true;
  }

  private queueRender(): void {
    if (this.animationFrame !== null) {
      return;
    }
    this.animationFrame = requestAnimationFrame((now) => {
      this.animationFrame = null;
      const continueEmphasis = this.advanceEmphasis(now);
      this.render();
      if (continueEmphasis) this.queueRender();
    });
  }

  private render(): void {
    const width = this.wrapperEl.clientWidth;
    const height = this.wrapperEl.clientHeight;
    const palette = resolveGraphPalette(this.wrapperEl);
    this.context.clearRect(0, 0, width, height);

    this.context.save();
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);

    for (const link of this.links) {
      const source = link.source as RenderNode;
      const target = link.target as RenderNode;
      if (
        !this.isNodeVisibleInTimeLapse(source.id) ||
        !this.isNodeVisibleInTimeLapse(target.id) ||
        typeof source.x !== "number" ||
        typeof source.y !== "number" ||
        typeof target.x !== "number" ||
        typeof target.y !== "number" ||
        !graphLinkIntersectsViewport({
          sourceX: source.x,
          sourceY: source.y,
          targetX: target.x,
          targetY: target.y,
          transform: this.transform,
          viewportWidth: width,
          viewportHeight: height,
        })
      ) {
        continue;
      }
      this.drawLink(link, palette);
    }

    for (const node of this.nodes) {
      if (
        !this.isNodeVisibleInTimeLapse(node.id) ||
        typeof node.x !== "number" ||
        typeof node.y !== "number" ||
        !graphNodeIntersectsViewport({
          nodeX: node.x,
          nodeY: node.y,
          screenRadius: graphNodeScreenRadius(node.radius, this.transform.k),
          transform: this.transform,
          viewportWidth: width,
          viewportHeight: height,
        })
      ) {
        continue;
      }
      this.drawNode(node, palette);
    }

    this.context.restore();

    for (const node of this.nodes) {
      if (!this.isNodeVisibleInTimeLapse(node.id)) continue;
      this.drawLabel(node, palette);
    }
  }

  private drawLink(link: RenderLink, palette: GraphPalette): void {
    const source = link.source as RenderNode;
    const target = link.target as RenderNode;
    if (
      typeof source.x !== "number" ||
      typeof source.y !== "number" ||
      typeof target.x !== "number" ||
      typeof target.y !== "number"
    ) {
      return;
    }
    const active = this.isLinkActive(source.id, target.id);
    const usesAccent = graphLinkUsesAccentPaint(
      this.hasEmphasisSource(),
      active,
    );
    this.context.save();
    this.context.globalAlpha = graphEmphasisAlpha(
      "link",
      active,
      this.emphasisProgress,
    );
    this.context.beginPath();
    this.context.moveTo(source.x, source.y);
    this.context.lineTo(target.x, target.y);
    this.context.strokeStyle = linkColor(usesAccent, palette);
    const screenScale = Math.max(this.transform.k, GRAPH_MIN_ZOOM);
    const screenLineWidth = graphLinkScreenWidth(
      this.settings?.display.linkThickness ?? 1,
    );
    this.context.lineWidth = screenLineWidth / screenScale;
    this.context.stroke();

    if (!this.settings?.display.showArrows) {
      this.context.restore();
      return;
    }
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const targetRadius =
      graphNodeWorldRadius(target.radius, this.transform.k) + 4 / screenScale;
    const arrowX = target.x - Math.cos(angle) * targetRadius;
    const arrowY = target.y - Math.sin(angle) * targetRadius;
    const arrowSize = 6 / screenScale;
    this.context.beginPath();
    this.context.moveTo(arrowX, arrowY);
    this.context.lineTo(
      arrowX - Math.cos(angle - Math.PI / 7) * arrowSize,
      arrowY - Math.sin(angle - Math.PI / 7) * arrowSize,
    );
    this.context.lineTo(
      arrowX - Math.cos(angle + Math.PI / 7) * arrowSize,
      arrowY - Math.sin(angle + Math.PI / 7) * arrowSize,
    );
    this.context.closePath();
    this.context.fillStyle = linkColor(usesAccent, palette);
    this.context.fill();
    this.context.restore();
  }

  private drawNode(node: RenderNode, palette: GraphPalette): void {
    if (typeof node.x !== "number" || typeof node.y !== "number") {
      return;
    }
    const active = this.isNodeActive(node.id);
    const isEmphasisSource =
      node.id === this.emphasisNodeId || node.id === this.focusedNodeId;
    const screenScale = Math.max(this.transform.k, GRAPH_MIN_ZOOM);
    const radius = graphNodeWorldRadius(node.radius, screenScale);
    this.context.save();
    this.context.globalAlpha = graphEmphasisAlpha(
      "node",
      active,
      this.emphasisProgress,
    );
    this.context.beginPath();
    this.context.arc(node.x, node.y, radius, 0, Math.PI * 2);
    this.context.fillStyle = isEmphasisSource
      ? palette.nodeFocused
      : nodeColor(node, palette);
    this.context.fill();
    if (isEmphasisSource) {
      this.context.lineWidth = 1.5 / screenScale;
      this.context.strokeStyle = palette.nodeStrokeActive;
      this.context.stroke();
    }

    if (node.id === this.focusedNodeId) {
      this.context.beginPath();
      this.context.arc(
        node.x,
        node.y,
        radius + 3.5 / screenScale,
        0,
        Math.PI * 2,
      );
      this.context.lineWidth = 1.75 / screenScale;
      this.context.strokeStyle = palette.nodeFocusRing;
      this.context.stroke();
    }
    this.context.restore();
  }

  private drawLabel(node: RenderNode, palette: GraphPalette): void {
    if (typeof node.x !== "number" || typeof node.y !== "number") {
      return;
    }
    const isHoveredLabel = node.id === this.hoveredNodeId;
    const active = this.isNodeActive(node.id);
    const alpha =
      graphNodeLabelAlpha({
        zoom: this.transform.k,
        textFadeThreshold: this.settings?.display.textFadeThreshold ?? 0.8,
        hovered: isHoveredLabel,
        context: active,
      }) * graphEmphasisAlpha("label", active, this.emphasisProgress);
    if (alpha <= 0.05) {
      return;
    }
    const screenX = node.x * this.transform.k + this.transform.x;
    const screenY = node.y * this.transform.k + this.transform.y;
    if (
      !graphNodeIntersectsViewport({
        nodeX: node.x,
        nodeY: node.y,
        screenRadius: graphNodeScreenRadius(node.radius, this.transform.k),
        transform: this.transform,
        viewportWidth: this.wrapperEl.clientWidth,
        viewportHeight: this.wrapperEl.clientHeight,
        margin: 80,
      })
    ) {
      return;
    }
    const screenRadius = graphNodeScreenRadius(node.radius, this.transform.k);
    this.context.save();
    this.context.globalAlpha = alpha;
    this.context.font = isHoveredLabel
      ? "600 11px system-ui"
      : "500 11px system-ui";
    this.context.fillStyle = isHoveredLabel
      ? palette.labelHover
      : palette.label;
    this.context.textAlign = "center";
    this.context.textBaseline = "top";
    this.context.fillText(node.label, screenX, screenY + screenRadius + 8);
    this.context.restore();
  }

  private isNodeActive(nodeId: string): boolean {
    if (!this.emphasisNodeId && !this.focusedNodeId) {
      return true;
    }
    if (nodeId === this.emphasisNodeId || nodeId === this.focusedNodeId) {
      return true;
    }
    if (
      this.emphasisNodeId &&
      this.neighborMap.get(this.emphasisNodeId)?.has(nodeId)
    ) {
      return true;
    }
    if (
      this.focusedNodeId &&
      this.neighborMap.get(this.focusedNodeId)?.has(nodeId)
    ) {
      return true;
    }
    return false;
  }

  private hasEmphasisSource(): boolean {
    return this.emphasisNodeId !== null || this.focusedNodeId !== null;
  }

  private isLinkActive(sourceId: string, targetId: string): boolean {
    if (!this.emphasisNodeId && !this.focusedNodeId) {
      return true;
    }
    const hoveredActive =
      this.emphasisNodeId !== null &&
      (sourceId === this.emphasisNodeId || targetId === this.emphasisNodeId);
    const focusedActive =
      this.focusedNodeId !== null &&
      (sourceId === this.focusedNodeId || targetId === this.focusedNodeId);
    return hoveredActive || focusedActive;
  }

  private hitTest(clientX: number, clientY: number): RenderNode | null {
    const point = this.screenToWorld(clientX, clientY);
    for (let index = this.nodes.length - 1; index >= 0; index -= 1) {
      const node = this.nodes[index];
      if (!this.isNodeVisibleInTimeLapse(node.id)) continue;
      if (typeof node.x !== "number" || typeof node.y !== "number") {
        continue;
      }
      const distance = Math.hypot(point.x - node.x, point.y - node.y);
      if (
        distance <=
        graphNodeWorldRadius(node.radius, this.transform.k) +
          6 / this.transform.k
      ) {
        return node;
      }
    }
    return null;
  }

  private openPreviewForHoveredNode(): void {
    const node = this.nodes.find((entry) => entry.id === this.hoveredNodeId);
    if (node) this.openPreview(node);
  }

  private openPreview(node: RenderNode): void {
    if (
      node.id === this.previewNodeId ||
      node.id === this.previewSuppressedNodeId ||
      !graphNodeSupportsPreview(node)
    ) {
      return;
    }
    this.previewNodeId = node.id;
    const anchor: GraphPreviewAnchor = {
      getBoundingClientRect: () => {
        const current = this.nodes.find((entry) => entry.id === node.id);
        const canvasRect = this.canvasEl.getBoundingClientRect();
        if (!current) return new DOMRect(canvasRect.left, canvasRect.top, 0, 0);
        const rect = graphNodePreviewRect({
          node: current,
          transform: this.transform,
          canvasRect,
        });
        return new DOMRect(rect.x, rect.y, rect.width, rect.height);
      },
    };
    this.callbacks.onNodePreviewChange?.({ node, anchor });
  }

  private closePreview(): void {
    if (this.previewNodeId === null) return;
    this.previewNodeId = null;
    this.callbacks.onNodePreviewChange?.(null);
  }

  private screenToWorld(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const rect = this.canvasEl.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    return {
      x: (offsetX - this.transform.x) / this.transform.k,
      y: (offsetY - this.transform.y) / this.transform.k,
    };
  }

  private pointerDistance(clientX: number, clientY: number): number {
    return Math.hypot(
      clientX - this.pointerStart.x,
      clientY - this.pointerStart.y,
    );
  }

  private endPointerInteraction(pointerId: number): void {
    if (this.pointerId !== pointerId) {
      return;
    }
    if (this.dragNode) {
      this.dragNode.fx = null;
      this.dragNode.fy = null;
      this.dragNode = null;
      this.simulation.alphaTarget(0);
    }
    this.autoCenterNodeId = null;
    this.autoFitViewport = false;
    this.wrapperEl.releasePointerCapture(pointerId);
    this.pointerMode = null;
    this.pointerId = null;
    this.pointerDownNodeId = null;
    this.canvasEl.style.cursor = this.hoveredNodeId ? "pointer" : "grab";
    this.storePositions();
  }

  private zoomAtCenter(factor: number): void {
    this.autoCenterNodeId = null;
    this.autoFitViewport = false;
    this.viewportAdjustedByUser = true;
    const centerX = this.wrapperEl.clientWidth / 2;
    const centerY = this.wrapperEl.clientHeight / 2;
    const worldX = (centerX - this.transform.x) / this.transform.k;
    const worldY = (centerY - this.transform.y) / this.transform.k;
    this.transform.k = clampGraphZoom(this.transform.k * factor);
    this.transform.x = centerX - worldX * this.transform.k;
    this.transform.y = centerY - worldY * this.transform.k;
    this.queueRender();
  }
}
