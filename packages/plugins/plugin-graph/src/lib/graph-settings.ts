import type {
  GraphGroupRule,
  GraphSettings,
  GraphSettingsPatch,
} from "./graph-types";

export const DEFAULT_GRAPH_GROUPS: GraphGroupRule[] = [];

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  filters: {
    searchQuery: "",
    showTags: false,
    showAttachments: false,
    existingFilesOnly: true,
    showOrphans: true,
  },
  display: {
    showArrows: false,
    textFadeThreshold: 0.8,
    nodeSize: 8,
    linkThickness: 1,
    wheelZoomSensitivity: 1,
  },
  forces: {
    centerForce: 0.08,
    repelForce: 240,
    linkForce: 0.22,
    linkDistance: 96,
  },
  localGraph: {
    depth: 1,
  },
  groups: DEFAULT_GRAPH_GROUPS,
};

export function mergeGraphSettings(
  stored: Partial<GraphSettings> | null | undefined,
): GraphSettings {
  return {
    filters: {
      ...DEFAULT_GRAPH_SETTINGS.filters,
      ...stored?.filters,
    },
    display: {
      ...DEFAULT_GRAPH_SETTINGS.display,
      ...stored?.display,
    },
    forces: {
      ...DEFAULT_GRAPH_SETTINGS.forces,
      ...stored?.forces,
    },
    localGraph: {
      ...DEFAULT_GRAPH_SETTINGS.localGraph,
      ...stored?.localGraph,
    },
    groups: stored?.groups?.map((group) => ({ ...group })) ?? [],
  };
}

export function patchGraphSettings(
  current: GraphSettings,
  patch: GraphSettingsPatch,
): GraphSettings {
  return mergeGraphSettings({
    ...current,
    ...patch,
    filters: { ...current.filters, ...patch.filters },
    display: { ...current.display, ...patch.display },
    forces: { ...current.forces, ...patch.forces },
    localGraph: { ...current.localGraph, ...patch.localGraph },
    groups: patch.groups ?? current.groups,
  });
}

export function moveGraphGroup(
  groups: GraphGroupRule[],
  index: number,
  delta: number,
): GraphGroupRule[] {
  const target = index + delta;
  if (index < 0 || index >= groups.length || target < 0 || target >= groups.length) {
    return groups.map((group) => ({ ...group }));
  }
  const next = groups.map((group) => ({ ...group }));
  const [group] = next.splice(index, 1);
  if (group) next.splice(target, 0, group);
  return next;
}
