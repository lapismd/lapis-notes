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
import { adjustTransformForViewportResize } from "./graph-viewport-alignment";

interface RenderNode extends GraphNode, SimulationNodeDatum {
  radius: number;
}

interface RenderLink extends SimulationLinkDatum<RenderNode> {
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
  nodeNeutral: string;
  nodeStroke: string;
  nodeStrokeActive: string;
  nodeFocusRing: string;
  label: string;
  labelHover: string;
};

function simulationNodeId(value: string | number | RenderNode): string {
  return typeof value === "object" ? value.id : String(value);
}

interface GraphRendererCallbacks {
  onNodeClick: (node: GraphNode, event: MouseEvent) => void;
  onNodeContextMenu: (node: GraphNode, event: MouseEvent) => void;
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

export const GRAPH_MIN_ZOOM = 0.1;
export const GRAPH_MAX_ZOOM = 3.5;
export const GRAPH_MAX_FIT_ZOOM = 1.35;
export const GRAPH_FOCUS_ZOOM = 1.1;
const BASE_WHEEL_ZOOM_SENSITIVITY = 0.0008;
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
  private hoveredNodeId: string | null = null;
  private focusedNodeId: string | null = null;
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

  constructor(containerEl: HTMLElement, callbacks: GraphRendererCallbacks) {
    this.callbacks = callbacks;
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

    this.bindEvents();
    this.observeResize();
    this.resize();
  }

  setGraph(graph: GraphData, settings: GraphSettings): void {
    const shouldAutoFit = !this.hasSameTopology(graph);
    const continueInitialAutoFit = this.autoFitViewport;
    this.storePositions();
    this.graph = graph;
    this.settings = settings;
    this.emptyStateEl.style.display = graph.nodes.length ? "none" : "flex";

    const nextNodes = graph.nodes.map((node, index) => {
      const previous = this.positions.get(node.id);
      const angle = (index / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
      const distance = 140 + (index % 9) * 14;
      return {
        ...node,
        radius: nodeRadius(node, settings),
        x: previous?.x ?? Math.cos(angle) * distance,
        y: previous?.y ?? Math.sin(angle) * distance,
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
    this.autoFitViewport = shouldAutoFit || continueInitialAutoFit;
    if (shouldAutoFit) {
      this.hasFittedViewport = false;
      this.viewportAdjustedByUser = false;
      if (this.hasViewportSize()) {
        this.fitGraphToViewport();
        this.pendingFitViewport = false;
      } else {
        this.pendingFitViewport = true;
      }
    } else {
      this.pendingFitViewport = false;
    }
    this.restartSimulation();
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
    if (!nodeId) {
      this.pendingCenterNodeId = null;
      this.queueRender();
      return;
    }
    const node = this.nodes.find((entry) => entry.id === nodeId);
    if (!node) {
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
    this.zoomAtCenter(1.15);
  }

  zoomOut(): void {
    this.zoomAtCenter(1 / 1.15);
  }

  resetView(): void {
    this.focusedNodeId = null;
    this.autoCenterNodeId = null;
    this.autoCenterZoom = false;
    this.autoFitViewport = false;
    this.viewportAdjustedByUser = false;
    this.fitGraphToViewport();
    this.queueRender();
  }

  refreshViewport(): void {
    this.resize();
  }

  destroy(): void {
    this.storePositions();
    this.simulation.stop();
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
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
          BASE_WHEEL_ZOOM_SENSITIVITY *
          (this.settings?.display.wheelZoomSensitivity ?? 1);
        const zoomFactor = Math.exp(-wheelDelta * wheelZoomSensitivity);
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
        this.hoveredNodeId = hoveredNodeId;
        this.canvasEl.style.cursor = hovered ? "pointer" : "grab";
        this.queueRender();
      }
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
          this.zoomAtCenter(1.15);
          event.preventDefault();
          break;
        case "-":
          this.zoomAtCenter(1 / 1.15);
          event.preventDefault();
          break;
        case "Escape":
          this.hoveredNodeId = null;
          this.focusedNodeId = null;
          this.autoCenterNodeId = null;
          this.autoCenterZoom = false;
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

  private restartSimulation(): void {
    this.simulation.stop();
    if (!this.settings) {
      return;
    }
    this.simulation = forceSimulation(this.nodes)
      .force(
        "link",
        forceLink<RenderNode, RenderLink>(this.links)
          .id((node) => node.id)
          .distance(this.settings.forces.linkDistance)
          .strength(
            (link) =>
              this.settings!.forces.linkForce * Math.log1p(link.count + 1),
          ),
      )
      .force(
        "charge",
        forceManyBody<RenderNode>().strength(-this.settings.forces.repelForce),
      )
      .force(
        "center-x",
        forceX<RenderNode>(0).strength(this.settings.forces.centerForce),
      )
      .force(
        "center-y",
        forceY<RenderNode>(0).strength(this.settings.forces.centerForce),
      )
      .force(
        "collision",
        forceCollide<RenderNode>().radius((node) => node.radius + 6),
      )
      .alpha(1)
      .alphaDecay(0.04)
      .on("tick", () => {
        this.applyAutoCenter();
        this.queueRender();
      })
      .on("end", () => {
        this.applyFinalAlignment();
      });
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
    } else if (this.autoFitViewport) {
      this.fitGraphToViewport();
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
    } else if (this.autoFitViewport) {
      this.fitGraphToViewport();
    }

    this.autoCenterNodeId = null;
    this.autoCenterZoom = false;
    this.autoFitViewport = false;
    this.queueRender();
  }

  private queueRender(): void {
    if (this.animationFrame !== null) {
      return;
    }
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      this.render();
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
      this.drawLink(link, palette);
    }

    for (const node of this.nodes) {
      this.drawNode(node, palette);
    }

    this.context.restore();

    for (const node of this.nodes) {
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
    this.context.beginPath();
    this.context.moveTo(source.x, source.y);
    this.context.lineTo(target.x, target.y);
    this.context.strokeStyle = linkColor(active, palette);
    this.context.lineWidth = Math.max(
      0.75,
      (this.settings?.display.linkThickness ?? 1) * Math.log1p(link.count + 1),
    );
    this.context.stroke();

    if (!this.settings?.display.showArrows) {
      return;
    }
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const targetRadius = target.radius + 4;
    const arrowX = target.x - Math.cos(angle) * targetRadius;
    const arrowY = target.y - Math.sin(angle) * targetRadius;
    const arrowSize = 6;
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
    this.context.fillStyle = linkColor(active, palette);
    this.context.fill();
  }

  private drawNode(node: RenderNode, palette: GraphPalette): void {
    if (typeof node.x !== "number" || typeof node.y !== "number") {
      return;
    }
    const active = this.isNodeActive(node.id);
    this.context.beginPath();
    this.context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.context.fillStyle = nodeColor(node, palette);
    this.context.fill();
    this.context.lineWidth = active ? 2.4 : 1.2;
    this.context.strokeStyle = active
      ? palette.nodeStrokeActive
      : palette.nodeStroke;
    this.context.stroke();

    if (node.id === this.focusedNodeId) {
      const screenScale = Math.max(this.transform.k, GRAPH_MIN_ZOOM);
      this.context.beginPath();
      this.context.arc(
        node.x,
        node.y,
        node.radius + 3.5 / screenScale,
        0,
        Math.PI * 2,
      );
      this.context.lineWidth = 1.75 / screenScale;
      this.context.strokeStyle = palette.nodeFocusRing;
      this.context.stroke();
    }
  }

  private drawLabel(node: RenderNode, palette: GraphPalette): void {
    if (typeof node.x !== "number" || typeof node.y !== "number") {
      return;
    }
    const isHoveredLabel = node.id === this.hoveredNodeId;
    const alpha = graphNodeLabelAlpha({
      zoom: this.transform.k,
      textFadeThreshold: this.settings?.display.textFadeThreshold ?? 0.8,
      hovered: isHoveredLabel,
      context: this.isNodeActive(node.id),
    });
    if (alpha <= 0.05) {
      return;
    }
    const screenX = node.x * this.transform.k + this.transform.x;
    const screenY = node.y * this.transform.k + this.transform.y;
    const screenRadius = node.radius * this.transform.k;
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
    if (!this.hoveredNodeId && !this.focusedNodeId) {
      return true;
    }
    if (nodeId === this.hoveredNodeId || nodeId === this.focusedNodeId) {
      return true;
    }
    if (
      this.hoveredNodeId &&
      this.neighborMap.get(this.hoveredNodeId)?.has(nodeId)
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

  private isLinkActive(sourceId: string, targetId: string): boolean {
    if (!this.hoveredNodeId && !this.focusedNodeId) {
      return true;
    }
    const hoveredActive =
      this.hoveredNodeId !== null &&
      (sourceId === this.hoveredNodeId || targetId === this.hoveredNodeId);
    const focusedActive =
      this.focusedNodeId !== null &&
      (sourceId === this.focusedNodeId || targetId === this.focusedNodeId);
    return hoveredActive || focusedActive;
  }

  private hitTest(clientX: number, clientY: number): RenderNode | null {
    const point = this.screenToWorld(clientX, clientY);
    for (let index = this.nodes.length - 1; index >= 0; index -= 1) {
      const node = this.nodes[index];
      if (typeof node.x !== "number" || typeof node.y !== "number") {
        continue;
      }
      const distance = Math.hypot(point.x - node.x, point.y - node.y);
      if (distance <= node.radius + 6 / this.transform.k) {
        return node;
      }
    }
    return null;
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
