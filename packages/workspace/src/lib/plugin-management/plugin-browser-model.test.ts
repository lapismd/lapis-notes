import { describe, expect, it } from "vitest";
import {
  categoriesFor,
  landingSections,
  filterPlugins,
  defaultDirectoryState,
  restoreBrowserState,
} from "./plugin-browser-model";
import type { PluginCatalogEntry } from "@lapis-notes/api";
const entry = (
  id: string,
  categories: string[],
  date: string,
  status = "active",
) =>
  ({
    id,
    name: id,
    description: "Notes",
    author: "Lapis",
    categories,
    platforms: ["web"],
    status,
    channel: "official",
    latestVersion: "1.0.0",
    latestRelease: { releasedAt: date, bundleSize: 1 },
  }) as PluginCatalogEntry;
const plugins = [
  entry("Alpha", ["writing"], "2026-10-01"),
  entry("Beta", ["writing", "data"], "2026-10-12"),
  entry("Revoked", ["data"], "2026-09-01", "revoked"),
];
describe("Plugins navigation and catalog", () => {
  it("restores the exact selected version and rejects invalid version state", () => {
    expect(
      restoreBrowserState({
        route: { page: "plugin", pluginId: "graph", version: "0.1.0-beta.1" },
      }).route,
    ).toEqual({ page: "plugin", pluginId: "graph", version: "0.1.0-beta.1" });
    for (const version of ["../latest", "", 42, "x".repeat(129)]) {
      expect(
        restoreBrowserState({
          route: { page: "plugin", pluginId: "graph", version },
        }).route,
      ).toEqual({ page: "landing" });
    }
  });
  it("counts every category and orders homepage sections deterministically", () => {
    expect(categoriesFor(plugins).map((c) => [c.id, c.count])).toEqual([
      ["data", 2],
      ["writing", 2],
    ]);
    expect(landingSections(plugins).featured.map((p) => p.id)).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(landingSections(plugins).newlyReleased[0].id).toBe("Beta");
  });
  it("combines category, query, and installation filters", () => {
    const state = {
      ...defaultDirectoryState(),
      categories: ["writing"],
      query: "bet",
      installation: "installed" as const,
    };
    expect(
      filterPlugins(plugins, state, new Set(["Beta"])).map((p) => p.id),
    ).toEqual(["Beta"]);
    expect(filterPlugins(plugins, state, new Set())).toEqual([]);
  });
  it("lists available updates separately from recently published releases", () => {
    const sections = landingSections(plugins, new Set(["Alpha"]));
    expect(sections.updates.map((p) => p.id)).toEqual(["Alpha"]);
    expect(sections.recentlyUpdated[0].id).toBe("Beta");
  });
  it("combines the Updates filter with category and search and clears as updates finish", () => {
    const state = {
      ...defaultDirectoryState(),
      updatesOnly: true,
      categories: ["writing"],
    };
    expect(
      filterPlugins(
        plugins,
        state,
        new Set(["Beta"]),
        () => 0,
        new Set(["Beta"]),
      ).map((p) => p.id),
    ).toEqual(["Beta"]);
    expect(
      filterPlugins(
        plugins,
        { ...state, query: "alpha" },
        new Set(["Beta"]),
        () => 0,
        new Set(["Beta"]),
      ),
    ).toEqual([]);
    expect(
      filterPlugins(plugins, state, new Set(["Beta"]), () => 0, new Set()),
    ).toEqual([]);
  });
  it("persists only boolean update filters and defaults old layouts to all plugins", () => {
    expect(
      restoreBrowserState({ directory: { updatesOnly: true } }).directory
        .updatesOnly,
    ).toBe(true);
    expect(
      restoreBrowserState({ directory: { updatesOnly: "true" } }).directory
        .updatesOnly,
    ).toBe(false);
    expect(restoreBrowserState({}).directory.updatesOnly).toBe(false);
  });
  it("sorts downloads with a stable name tie-break", () => {
    expect(
      filterPlugins(
        plugins,
        { ...defaultDirectoryState(), sort: "downloads" },
        new Set(),
        (id) => (id === "Beta" ? 20 : 0),
      ).map((p) => p.id),
    ).toEqual(["Beta", "Alpha", "Revoked"]);
  });
  it("restores routes and rejects invalid persisted state", () => {
    expect(
      restoreBrowserState({
        route: { page: "plugin", pluginId: "Alpha" },
        directory: { categories: ["writing"], view: "list" },
      }).route,
    ).toEqual({ page: "plugin", pluginId: "Alpha" });
    const invalid = restoreBrowserState({
      route: { page: "reviews" },
      directory: { sort: "bad", categories: [42], view: "bad" },
    });
    expect(invalid.route).toEqual({ page: "landing" });
    expect(invalid.directory).toEqual(defaultDirectoryState());
  });
});
