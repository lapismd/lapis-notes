<script lang="ts">
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import { onMount, tick, untrack } from "svelte";
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
  let revision = $state(0);
  let expandedPluginIds = $state(new Set<string>());
  let entries = $derived.by(() => {
    revision;
    const seen = new Set<string>();
    return app.plugins.corePluginEntries.filter((entry) => {
      if (seen.has(entry.manifest.id)) return false;
      seen.add(entry.manifest.id);
      return true;
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
    const pluginId = context.reveal.entryId.slice("core:".length);
    expandedPluginIds = new Set([...expandedPluginIds, pluginId]);
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
    {#each entries as entry (entry.manifest.id)}
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
        expanded={expandedPluginIds.has(entry.manifest.id)}
        hasOptions={Boolean(
          pluginSettingsSectionId(controller, entry.manifest.id),
        )}
        diagnostics={pluginDiagnosticRows(app, entry.manifest.id)}
        onOptions={() => openPluginSettings(controller, entry.manifest.id)}
        onRestart={async () => {
          await app.plugins.restartPlugin(entry.manifest.id);
        }}
        onToggle={async (enabled) => {
          if (enabled) await app.plugins.enablePlugin(entry.manifest.id);
          else await app.plugins.disablePlugin(entry.manifest.id);
        }}
      />
    {/each}
  </div>
</section>
