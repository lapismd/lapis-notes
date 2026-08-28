import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type {
  WorkspaceSettingsController,
  WorkspaceSettingsSection,
} from "@lapismd/design-core/workspace/settings";
import CommunityPluginsSettingsPage from "./CommunityPluginsSettingsPage.svelte";
import CorePluginsSettingsPage from "./CorePluginsSettingsPage.svelte";
import PluginRegistrySettingsPage from "./PluginRegistrySettingsPage.svelte";
import {
  clearPluginManagementContext,
  PluginManagementRevealState,
  setPluginManagementContext,
} from "./plugin-management-context.svelte";

interface PluginSettingsSearchEntry {
  id: string;
  title: string;
  description?: string;
  keywords?: readonly string[];
  path?: readonly string[];
}

interface SearchableSettingsSection extends WorkspaceSettingsSection {
  searchEntries:
    | readonly PluginSettingsSearchEntry[]
    | (() => readonly PluginSettingsSearchEntry[]);
  revealSearchEntry(entryId: string): void | Promise<void>;
}

function coreSearchEntries(app: App): PluginSettingsSearchEntry[] {
  return app.plugins.corePluginEntries.map((entry) => ({
    id: `core:${entry.manifest.id}`,
    title: entry.manifest.name,
    description: entry.manifest.description,
    keywords: [entry.manifest.id, entry.distribution, "plugin"],
    path: ["Core plugins", entry.manifest.name],
  }));
}

function communitySearchEntries(app: App): PluginSettingsSearchEntry[] {
  const loaded = app.plugins.communityPlugins.map((plugin) => ({
    id: `community:${plugin.manifest.id}`,
    title: plugin.manifest.name,
    description: plugin.manifest.description,
    keywords: [plugin.manifest.id, plugin.provenance, "plugin"],
    path: ["Community plugins", plugin.manifest.name],
  }));
  const loadedIds = new Set(
    app.plugins.communityPlugins.map((plugin) => plugin.manifest.id),
  );
  const indexed = app.plugins.communityPluginDiagnostics
    .filter((entry) => !loadedIds.has(entry.pluginId))
    .map((entry) => ({
      id: `community:${entry.pluginId}`,
      title: entry.name ?? entry.pluginId,
      description: entry.description ?? undefined,
      keywords: [entry.pluginId, entry.provenance, "plugin"],
      path: ["Community plugins", entry.name ?? entry.pluginId],
    }));
  return [...loaded, ...indexed];
}

function registrySearchEntries(app: App): PluginSettingsSearchEntry[] {
  try {
    return app.pluginDistribution.search({ channel: "all" }).map((entry) => ({
      id: `registry:${entry.id}`,
      title: entry.name,
      description: entry.description,
      keywords: [entry.id, entry.author, entry.channel, ...entry.categories],
      path: ["Plugin registry", "Browse", entry.name],
    }));
  } catch {
    return [];
  }
}

function registerSearchableSection(
  controller: WorkspaceSettingsController,
  section: SearchableSettingsSection,
): () => void {
  return controller.registerSection(section as WorkspaceSettingsSection);
}

/** Register the three Lapis Notes-owned plugin settings pages. */
export function registerPluginManagementSettings(app: App): () => void {
  const { controller } = getWorkspaceHostBinding(app.workspace);
  const settings = controller.settings;
  const reveal = new PluginManagementRevealState();
  setPluginManagementContext(settings, { app, reveal });

  const disposers = [
    registerSearchableSection(settings, {
      id: "plugin-registry",
      title: "Plugin registry",
      description:
        "Browse verified plugins, manage installed provenance, and review updates.",
      icon: "package",
      order: 94,
      page: PluginRegistrySettingsPage,
      searchEntries: () => registrySearchEntries(app),
      revealSearchEntry: (entryId) =>
        reveal.request("plugin-registry", entryId),
    }),
    registerSearchableSection(settings, {
      id: "core-plugins",
      title: "Core plugins",
      description: "Enable, inspect, and configure this app's static plugins.",
      icon: "blocks",
      order: 100,
      page: CorePluginsSettingsPage,
      searchEntries: () => coreSearchEntries(app),
      revealSearchEntry: (entryId) => reveal.request("core-plugins", entryId),
    }),
    registerSearchableSection(settings, {
      id: "community-plugins",
      title: "Community plugins",
      description:
        "Review installed plugins, workspace trust, and runtime diagnostics.",
      icon: "puzzle",
      order: 101,
      page: CommunityPluginsSettingsPage,
      searchEntries: () => communitySearchEntries(app),
      revealSearchEntry: (entryId) =>
        reveal.request("community-plugins", entryId),
    }),
  ];

  return () => {
    for (const dispose of disposers.reverse()) dispose();
    clearPluginManagementContext(settings);
  };
}
