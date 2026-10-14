import type { PluginCatalogEntry } from "@lapis-notes/api";

export type PluginBrowserRoute =
  | { page: "landing" | "directory" }
  | { page: "plugin"; pluginId: string; version?: string };
export interface PluginDirectoryState {
  query: string;
  categories: string[];
  platforms: string[];
  statuses: string[];
  officialOnly: boolean;
  updatesOnly: boolean;
  installation: "all" | "installed" | "available";
  sort: string;
  view: "grid" | "list";
}
export const defaultDirectoryState = (): PluginDirectoryState => ({
  query: "",
  categories: [],
  platforms: [],
  statuses: [],
  officialOnly: false,
  updatesOnly: false,
  installation: "all",
  sort: "name",
  view: "grid",
});
import { titleCaseRegistryValue as titleCase } from "./community-presentation/model-adapter";
export { titleCase };
const compareName = (a: PluginCatalogEntry, b: PluginCatalogEntry) =>
  a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
const compareDate = (a: PluginCatalogEntry, b: PluginCatalogEntry) =>
  (b.latestRelease?.releasedAt ?? "").localeCompare(
    a.latestRelease?.releasedAt ?? "",
  ) || compareName(a, b);

export function categoriesFor(plugins: readonly PluginCatalogEntry[]) {
  const counts = new Map<string, number>();
  for (const plugin of plugins)
    for (const category of plugin.categories)
      counts.set(category, (counts.get(category) ?? 0) + 1);
  return [...counts]
    .map(([id, count]) => ({ id, count, label: titleCase(id) }))
    .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}
/** Community's existing landing selection rules; no separate popularity data. */
export function landingSections(
  plugins: readonly PluginCatalogEntry[],
  updateIds: ReadonlySet<string> = new Set(),
) {
  return {
    featured: plugins
      .filter((p) => (p.status ?? "active") === "active")
      .sort(compareName)
      .slice(0, 5),
    newlyReleased: [...plugins].sort(compareDate).slice(0, 5),
    recentlyUpdated: [...plugins].sort(compareDate).slice(0, 5),
    updates: plugins
      .filter((plugin) => updateIds.has(plugin.id))
      .sort(compareName),
    categories: categoriesFor(plugins).slice(0, 8),
  };
}
export function filterPlugins(
  plugins: readonly PluginCatalogEntry[],
  state: PluginDirectoryState,
  installed: Set<string>,
  downloads: (id: string) => number = () => 0,
  updateIds: ReadonlySet<string> = new Set(),
) {
  const text = state.query.trim().toLowerCase();
  return plugins
    .filter(
      (p) =>
        (!text ||
          `${p.name} ${p.id} ${p.description} ${p.author}`
            .toLowerCase()
            .includes(text)) &&
        (!state.categories.length ||
          p.categories.some((c) => state.categories.includes(c))) &&
        (!state.platforms.length ||
          p.platforms.some((v) => state.platforms.includes(v))) &&
        (!state.statuses.length ||
          state.statuses.includes(p.status ?? "active")) &&
        (!state.officialOnly || p.channel === "official") &&
        (!state.updatesOnly || updateIds.has(p.id)) &&
        (state.installation === "all" ||
          installed.has(p.id) === (state.installation === "installed")),
    )
    .sort(
      state.sort === "downloads"
        ? (a, b) => downloads(b.id) - downloads(a.id) || compareName(a, b)
        : ["new", "updated"].includes(state.sort)
          ? compareDate
          : state.sort === "status"
            ? (a, b) =>
                (a.status ?? "active").localeCompare(b.status ?? "active") ||
                compareName(a, b)
            : compareName,
    );
}
export function restoreBrowserState(value: Record<string, unknown>) {
  const routeValue = value.route as Record<string, unknown> | undefined;
  const route: PluginBrowserRoute =
    routeValue?.page === "plugin" &&
    typeof routeValue.pluginId === "string" &&
    routeValue.pluginId.length > 0 &&
    (routeValue.version === undefined ||
      (typeof routeValue.version === "string" &&
        /^[A-Za-z0-9][A-Za-z0-9.+-]{0,127}$/u.test(routeValue.version)))
      ? {
          page: "plugin",
          pluginId: routeValue.pluginId,
          ...(routeValue.version !== undefined
            ? { version: routeValue.version as string }
            : {}),
        }
      : { page: routeValue?.page === "directory" ? "directory" : "landing" };
  const directory = defaultDirectoryState();
  const input = value.directory as Record<string, unknown> | undefined;
  if (input && typeof input === "object") {
    if (typeof input.query === "string") directory.query = input.query;
    for (const key of ["categories", "platforms", "statuses"] as const)
      if (
        Array.isArray(input[key]) &&
        input[key].every((v) => typeof v === "string")
      )
        directory[key] = [...input[key]] as string[];
    if (typeof input.officialOnly === "boolean")
      directory.officialOnly = input.officialOnly;
    if (typeof input.updatesOnly === "boolean")
      directory.updatesOnly = input.updatesOnly;
    if (["all", "installed", "available"].includes(String(input.installation)))
      directory.installation =
        input.installation as PluginDirectoryState["installation"];
    if (
      ["name", "new", "updated", "status", "downloads"].includes(
        String(input.sort),
      )
    )
      directory.sort = String(input.sort);
    if (input.view === "list") directory.view = "list";
  }
  return { route, directory };
}
