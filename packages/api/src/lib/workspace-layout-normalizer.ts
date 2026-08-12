/**
 * Pure workspace layout normalizer.
 *
 * Repairs common corruption in workspace JSON before it is hydrated into the
 * live Svelte model:
 *
 * - Mismatched sizes arrays (length ≠ children count, non-finite values)
 * - Out-of-range or non-integer currentTab indices
 * - Empty floating / popout windows (dropped — popout windows cannot be restored
 *   across sessions)
 * - Stale hiddenLeafIds / collapsed / panelSizes entries in sidebar groups that
 *   refer to leaf ids no longer present in the group's children
 * - Unknown or malformed child node types (dropped gracefully)
 * - Missing required fields filled with safe defaults
 *
 * The function is pure (no side effects, no imports from the live model) and
 * always returns a structurally valid WorkspaceJson even when the input is
 * empty, partial, or fully corrupted.
 */

import { uniqueId } from "./utils";

// ---------------------------------------------------------------------------
// JSON shape types (mirror the private types in workspace.svelte.ts).
// Defined here so the normalizer is self-contained and testable in isolation.
// ---------------------------------------------------------------------------

type WorkspaceLeafJson = {
  id: string;
  type: "leaf";
  state: {
    type: string;
    state: Record<string, unknown>;
    icon: string;
    title: string;
  };
};

type WorkspaceSidebarGroupJson = {
  id: string;
  type: "sidebar-group";
  name: string;
  icon?: string;
  hiddenLeafIds?: string[];
  collapsed?: Record<string, boolean>;
  panelSizes?: Record<string, number>;
  children: WorkspaceLeafJson[];
};

type WorkspaceTabsChildJson = WorkspaceLeafJson | WorkspaceSidebarGroupJson;

type WorkspaceTabsJson = {
  id: string;
  type: "tabs";
  stacked: boolean;
  children: WorkspaceTabsChildJson[];
  currentTab: number;
};

type WorkspaceSplitJson = {
  id: string;
  type: "split";
  direction: "horizontal" | "vertical";
  sizes: number[];
  children: Array<WorkspaceSplitJson | WorkspaceTabsJson>;
};

type WorkspaceSidedockJson = WorkspaceSplitJson & { width: string };

type WorkspaceBottomPanelJson = WorkspaceTabsJson & { height: string };

type WorkspaceWindowJson = {
  id: string;
  type: "floating";
  mode?: "floating";
  displayState?: "collapsed" | "minimized";
  direction: "horizontal" | "vertical";
  sizes: number[];
  x: number;
  y: number;
  width: number;
  height: number;
  children: Array<WorkspaceSplitJson | WorkspaceTabsJson>;
};

/** Canonical workspace layout shape returned by the normalizer. */
export type WorkspaceJson = {
  main: WorkspaceSplitJson;
  left: WorkspaceSidedockJson;
  right: WorkspaceSidedockJson;
  bottom: WorkspaceBottomPanelJson;
  floating?: WorkspaceWindowJson[];
  active?: string;
};

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function ensureId(raw: unknown): string {
  return typeof raw === "string" && raw.length > 0 ? raw : uniqueId();
}

function ensureDirection(raw: unknown): "horizontal" | "vertical" {
  return raw === "horizontal" ? "horizontal" : "vertical";
}

/**
 * Returns a sizes array of exactly `count` positive finite numbers. Any missing
 * or invalid slot is filled with 50 (equal-weight default).
 */
function repairSizes(sizes: unknown, count: number): number[] {
  const arr = Array.isArray(sizes) ? sizes : [];
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = arr[i];
    result.push(typeof v === "number" && isFinite(v) && v > 0 ? v : 50);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Node normalizers
// ---------------------------------------------------------------------------

function normalizeLeaf(raw: unknown): WorkspaceLeafJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== "leaf") return null;
  const s =
    r.state && typeof r.state === "object"
      ? (r.state as Record<string, unknown>)
      : {};
  return {
    id: ensureId(r.id),
    type: "leaf",
    state: {
      type: typeof s.type === "string" ? s.type : "empty",
      state:
        s.state && typeof s.state === "object"
          ? (s.state as Record<string, unknown>)
          : {},
      icon: typeof s.icon === "string" ? s.icon : "",
      title: typeof s.title === "string" ? s.title : "",
    },
  };
}

function normalizeSidebarGroup(raw: unknown): WorkspaceSidebarGroupJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== "sidebar-group") return null;

  const children = (Array.isArray(r.children) ? r.children : [])
    .map(normalizeLeaf)
    .filter((c): c is WorkspaceLeafJson => c !== null);

  const childIds = new Set(children.map((c) => c.id));

  const hiddenLeafIds = Array.isArray(r.hiddenLeafIds)
    ? r.hiddenLeafIds.filter(
        (id): id is string => typeof id === "string" && childIds.has(id),
      )
    : undefined;

  const collapsed =
    r.collapsed && typeof r.collapsed === "object"
      ? Object.fromEntries(
          Object.entries(r.collapsed as Record<string, unknown>)
            .filter(([k]) => childIds.has(k))
            .map(([k, v]) => [k, Boolean(v)]),
        )
      : undefined;

  const panelSizes =
    r.panelSizes && typeof r.panelSizes === "object"
      ? Object.fromEntries(
          Object.entries(r.panelSizes as Record<string, unknown>)
            .filter(([k]) => childIds.has(k))
            .map(([k, v]) => [k, typeof v === "number" ? v : 50]),
        )
      : undefined;

  return {
    id: ensureId(r.id),
    type: "sidebar-group",
    name: typeof r.name === "string" ? r.name : "",
    ...(r.icon !== undefined
      ? { icon: typeof r.icon === "string" ? r.icon : "" }
      : {}),
    ...(hiddenLeafIds && hiddenLeafIds.length > 0 ? { hiddenLeafIds } : {}),
    ...(collapsed && Object.keys(collapsed).length > 0 ? { collapsed } : {}),
    ...(panelSizes && Object.keys(panelSizes).length > 0 ? { panelSizes } : {}),
    children,
  };
}

function normalizeTabsChild(raw: unknown): WorkspaceTabsChildJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type === "sidebar-group") return normalizeSidebarGroup(raw);
  return normalizeLeaf(raw);
}

function normalizeTabs(raw: unknown): WorkspaceTabsJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== "tabs") return null;

  const children = (Array.isArray(r.children) ? r.children : [])
    .map(normalizeTabsChild)
    .filter((c): c is WorkspaceTabsChildJson => c !== null);

  const rawIndex = r.currentTab;
  const currentTab =
    typeof rawIndex === "number" &&
    Number.isInteger(rawIndex) &&
    rawIndex >= 0 &&
    rawIndex < children.length
      ? rawIndex
      : 0;

  return {
    id: ensureId(r.id),
    type: "tabs",
    stacked: r.stacked === true,
    children,
    currentTab,
  };
}

function normalizeSplitChild(
  raw: unknown,
): WorkspaceSplitJson | WorkspaceTabsJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type === "split") return normalizeSplitInner(raw);
  if (r.type === "tabs") return normalizeTabs(raw);
  return null;
}

function normalizeSplitInner(raw: unknown): WorkspaceSplitJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== "split") return null;

  const direction = ensureDirection(r.direction);
  const children = (Array.isArray(r.children) ? r.children : [])
    .map(normalizeSplitChild)
    .filter((c): c is WorkspaceSplitJson | WorkspaceTabsJson => c !== null);

  if (children.length === 0) return null;

  return {
    id: ensureId(r.id),
    type: "split",
    direction,
    sizes: repairSizes(r.sizes, children.length),
    children,
  };
}

function normalizeRootSplit(raw: unknown): WorkspaceSplitJson {
  const result = normalizeSplitInner(raw);
  if (result) return result;
  // Fallback: a single empty-children tabs group. WorkspaceTabs.loadJson
  // creates an empty leaf automatically when children is empty.
  return {
    id: uniqueId(),
    type: "split",
    direction: "vertical",
    sizes: [100],
    children: [
      {
        id: uniqueId(),
        type: "tabs",
        stacked: false,
        children: [],
        currentTab: 0,
      },
    ],
  };
}

function normalizeSidedock(
  raw: unknown,
  defaultWidth: string,
): WorkspaceSidedockJson {
  const width =
    raw && typeof raw === "object" && typeof (raw as any).width === "string"
      ? (raw as any).width
      : defaultWidth;

  const result = normalizeSplitInner(raw) as WorkspaceSidedockJson | null;
  if (result) return { ...result, width };

  // Fallback: empty sidedock. WorkspaceSidedock.loadJson tolerates no children.
  return {
    id: uniqueId(),
    type: "split",
    direction: "vertical",
    sizes: [],
    children: [],
    width,
  };
}

function normalizeBottomPanel(raw: unknown): WorkspaceBottomPanelJson {
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tabs = normalizeTabs(raw) ?? {
    id:
      typeof input.id === "string" && input.id.length > 0
        ? input.id
        : "bottom-panel",
    type: "tabs" as const,
    stacked: false,
    children: [],
    currentTab: 0,
  };

  return {
    ...tabs,
    height:
      typeof input.height === "string" &&
      /^(?:\d+(?:\.\d+)?)(?:px|rem|em|%)?$/iu.test(input.height.trim())
        ? input.height
        : "0px",
  };
}

function normalizeFloatingWindow(raw: unknown): WorkspaceWindowJson | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.type !== "floating") return null;
  // Popout windows cannot be restored across sessions — drop them.
  if (r.mode === "popout") return null;

  const children = (Array.isArray(r.children) ? r.children : [])
    .map(normalizeSplitChild)
    .filter((c): c is WorkspaceSplitJson | WorkspaceTabsJson => c !== null);

  // Drop windows with no leaf content.
  if (!hasAnyLeaf(children)) return null;

  const toNum = (v: unknown, fallback: number): number =>
    typeof v === "number" && isFinite(v) ? v : fallback;

  const rawDisplayState = r.displayState;
  const displayState: WorkspaceWindowJson["displayState"] =
    rawDisplayState === "collapsed" || rawDisplayState === "minimized"
      ? rawDisplayState
      : undefined;

  return {
    id: ensureId(r.id),
    type: "floating",
    mode: "floating",
    ...(displayState !== undefined ? { displayState } : {}),
    direction: ensureDirection(r.direction),
    sizes: repairSizes(r.sizes, children.length),
    x: toNum(r.x, 100),
    y: toNum(r.y, 100),
    width: toNum(r.width, 800),
    height: toNum(r.height, 600),
    children,
  };
}

function hasAnyLeaf(
  nodes: Array<WorkspaceSplitJson | WorkspaceTabsJson>,
): boolean {
  for (const node of nodes) {
    if (node.type === "tabs") {
      if (node.children.length > 0) return true;
    } else {
      if (hasAnyLeaf(node.children)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Normalizes raw workspace layout JSON before it is loaded into the live
 * workspace model.
 *
 * Always returns a structurally valid {@link WorkspaceJson} even when the input
 * is `null`, empty, partial, or corrupted.
 */
export function normalizeWorkspaceJson(raw: unknown): WorkspaceJson {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const floating = Array.isArray(r.floating)
    ? r.floating
        .map(normalizeFloatingWindow)
        .filter((w): w is WorkspaceWindowJson => w !== null)
    : [];

  return {
    main: normalizeRootSplit(r.main),
    left: normalizeSidedock(r.left, "22rem"),
    right: normalizeSidedock(r.right, "0px"),
    bottom: normalizeBottomPanel(r.bottom),
    ...(floating.length > 0 ? { floating } : {}),
    ...(typeof r.active === "string" && r.active ? { active: r.active } : {}),
  };
}
