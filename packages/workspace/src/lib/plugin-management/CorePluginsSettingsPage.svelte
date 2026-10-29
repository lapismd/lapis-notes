<script lang="ts">
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import { onMount, tick, untrack } from "svelte";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { getPluginManagementContext } from "./plugin-management-context.svelte";
  import "./plugin-management.css";
  import PluginSettingsRow from "./PluginSettingsRow.svelte";
  import {
    openPluginSettings,
    pluginDiagnosticRows,
    pluginSettingsSectionId,
  } from "./plugin-settings-navigation";

  let { controller }: WorkspaceSettingsPageProps = $props();
  const context = untrack(() => getPluginManagementContext(controller));
  const app = context.app;
  const managed = untrack(
    () => getWorkspaceHostBinding(app.workspace).controller.managedPlugins,
  );
  let revision = $state(0);
  let expandedPluginIds = $state(new Set<string>());
  let entries = $derived.by(() => {
    revision;
    const staticEntries = app.plugins.corePluginEntries;
    return managed.states.map((entry) => {
      const plugin =
        entry.sourceId === "lapis"
          ? staticEntries.find((plugin) => plugin.manifest.id === entry.id)
          : undefined;
      return {
        ...entry,
        manifest: {
          id: entry.id,
          name: entry.name,
          description: entry.description,
          version: plugin?.manifest.version,
        },
        errorMessage:
          entry.error instanceof Error
            ? entry.error.message
            : entry.error == null
              ? null
              : String(entry.error),
      };
    });
  });

  $effect(() => {
    const revealRevision = context.reveal.revision;
    if (
      !revealRevision ||
      context.reveal.sectionId !== "core-plugins" ||
      !context.reveal.entryId.startsWith("core:")
    ) {
      return;
    }
    const target = context.reveal.entryId.slice("core:".length);
    const entry = entries.find(
      (entry) => entry.key === target || entry.id === target,
    );
    if (!entry) return;
    const pluginId = entry.id;
    expandedPluginIds = new Set([...expandedPluginIds, entry.key]);
    void tick().then(() => {
      document
        .querySelector(`[data-settings-plugin-id="${CSS.escape(pluginId)}"]`)
        ?.scrollIntoView({ block: "center" });
    });
  });

  onMount(() => {
    const refresh = () => (revision += 1);
    const loaded = app.plugins.on("plugins-loaded", refresh);
    const enabled = app.plugins.on("plugin-enabled", refresh);
    const disabled = app.plugins.on("plugin-disabled", refresh);
    const error = app.plugins.on("plugin-error", refresh);
    return () => {
      app.plugins.offref(loaded);
      app.plugins.offref(enabled);
      app.plugins.offref(disabled);
      app.plugins.offref(error);
    };
  });
</script>

<section
  class="lapis-plugin-management"
  data-ui-component="lapis-plugin-management"
  data-ui-part="core-plugins"
>
  <header class="lapis-plugin-management__header">
    <div>
      <h1>Installed Core Plugins</h1>
      <p>Enable, inspect, and configure this app's static plugins.</p>
    </div>
  </header>

  <div class="lapis-plugin-management__rows">
    {#if entries.length === 0}
      <p class="lapis-plugin-management__empty">
        No core plugins are registered.
      </p>
    {/if}
    {#each entries as entry (entry.key)}
      <PluginSettingsRow
        pluginId={entry.manifest.id}
        name={entry.manifest.name}
        description={entry.manifest.description}
        version={entry.manifest.version}
        provenance={entry.distribution}
        status={entry.errorMessage
          ? "Failed"
          : entry.enabled
            ? "Enabled"
            : "Disabled"}
        error={entry.errorMessage ?? undefined}
        enabled={entry.enabled}
        required={entry.required}
        expanded={expandedPluginIds.has(entry.key)}
        hasOptions={Boolean(
          pluginSettingsSectionId(controller, entry.manifest.id),
        )}
        diagnostics={entry.sourceId === "lapis"
          ? pluginDiagnosticRows(app, entry.manifest.id)
          : [
              { label: "State", value: entry.status },
              { label: "Source", value: entry.sourceId },
            ]}
        onOptions={() => openPluginSettings(controller, entry.manifest.id)}
        onRestart={entry.sourceId === "lapis"
          ? async () => {
              await app.plugins.restartPlugin(entry.manifest.id);
            }
          : undefined}
        onToggle={async (enabled) => {
          if (enabled) await managed.enable(entry.key);
          else await managed.disable(entry.key);
        }}
      />
    {/each}
  </div>
</section>
