import type {
  GraphGroupRule,
  GraphSettings,
  GraphSettingsPatch,
} from "./graph-types";

export const DEFAULT_GRAPH_GROUPS: GraphGroupRule[] = [];
export const GRAPH_SETTINGS_VERSION = 2;

const GRAPH_FORCE_CURVE_BASE = 0.01;

export function graphForceSliderToStrength(value: number): number {
  const slider = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 1);
  return (
    (Math.pow(GRAPH_FORCE_CURVE_BASE, 1 - slider) - GRAPH_FORCE_CURVE_BASE) /
    (1 - GRAPH_FORCE_CURVE_BASE)
  );
}

export function graphStrengthToForceSlider(value: number): number {
  const strength = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 1);
  const curved =
    strength * (1 - GRAPH_FORCE_CURVE_BASE) + GRAPH_FORCE_CURVE_BASE;
  return 1 - Math.log(curved) / Math.log(GRAPH_FORCE_CURVE_BASE);
}

export function graphRepelForceMagnitude(value: number): number {
  const slider = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 20);
  return Math.max(slider ** 3, 1);
}

export const DEFAULT_GRAPH_CENTER_FORCE = graphStrengthToForceSlider(0.1);

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
    hoverActivationDelayMs: 500,
    hoverReleaseDelayMs: 350,
  },
  forces: {
    centerForce: DEFAULT_GRAPH_CENTER_FORCE,
    repelForce: 10,
    linkForce: 1,
    linkDistance: 250,
  },
  localGraph: {
    depth: 1,
  },
  groups: DEFAULT_GRAPH_GROUPS,
};

export type PersistedGraphSettings = GraphSettings & {
  settingsVersion: number;
};

export type LoadedGraphSettings = {
  settings: GraphSettings;
  migrated: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadPersistedGraphSettings(
  stored: unknown,
): LoadedGraphSettings {
  if (!isRecord(stored)) {
    return {
      settings: mergeGraphSettings(null),
      migrated: false,
    };
  }

  const settings = mergeGraphSettings(stored as Partial<GraphSettings>);
  if (stored.settingsVersion === undefined) {
    settings.forces = { ...DEFAULT_GRAPH_SETTINGS.forces };
    return { settings, migrated: true };
  }
  return {
    settings,
    migrated: stored.settingsVersion === 1,
  };
}

export function serializeGraphSettings(
  settings: GraphSettings,
): PersistedGraphSettings {
  return {
    settingsVersion: GRAPH_SETTINGS_VERSION,
    ...mergeGraphSettings(settings),
  };
}

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
    groups:
      stored?.groups?.flatMap((group, index) => {
        if (!isRecord(group)) return [];
        const id = typeof group.id === "string" ? group.id : `group-${index}`;
        const query = typeof group.query === "string" ? group.query : "";
        const color = typeof group.color === "string" ? group.color : "#3b82f6";
        return [{ id, query, color }];
      }) ?? [],
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
  if (
    index < 0 ||
    index >= groups.length ||
    target < 0 ||
    target >= groups.length
  ) {
    return groups.map((group) => ({ ...group }));
  }
  const next = groups.map((group) => ({ ...group }));
  const [group] = next.splice(index, 1);
  if (group) next.splice(target, 0, group);
  return next;
}
