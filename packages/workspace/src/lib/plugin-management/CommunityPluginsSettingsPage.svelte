<script lang="ts">
  import * as Button from "@lapismd/design-core/shadcn/button";
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
  let trustBusy = $state(false);
  let trustState = $derived.by(() => {
    revision;
    return app.workspaceTrust.getState();
  });
  let expandedPluginIds = $state(new Set<string>());
  let plugins = $derived.by(() => {
    revision;
    return app.plugins.communityPlugins;
  });
  let indexedDiagnostics = $derived.by(() => {
    revision;
    const loaded = new Set(plugins.map((plugin) => plugin.manifest.id));
    const core = new Set(
      app.plugins.corePluginEntries.map((entry) => entry.manifest.id),
    );
    return app.plugins.communityPluginDiagnostics.filter(
      (entry) => !loaded.has(entry.pluginId) && !core.has(entry.pluginId),
    );
  });

  $effect(() => {
    const revealRevision = context.reveal.revision;
    if (
      !revealRevision ||
      context.reveal.sectionId !== "community-plugins" ||
      !context.reveal.entryId.startsWith("community:")
    ) {
      return;
    }
    const pluginId = context.reveal.entryId.slice("community:".length);
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
    void app.workspaceTrust.ready().then(refresh);
    return () => {
      app.plugins.offref(loaded);
      app.plugins.offref(enabled);
      app.plugins.offref(disabled);
      app.plugins.offref(error);
    };
  });

  async function updateTrust(trusted: boolean): Promise<void> {
    if (trustBusy) return;
    trustBusy = true;
    try {
      if (trusted) await app.workspaceTrust.grant();
      else await app.workspaceTrust.revoke();
      revision += 1;
    } finally {
      trustBusy = false;
    }
  }
</script>

<section
  class="lapis-plugin-management"
  data-ui-component="lapis-plugin-management"
  data-ui-part="community-plugins"
>
  <div class="lapis-plugin-management__trust">
    <div>
      <h1>Workspace Trust</h1>
      <p>
        {trustState.trusted
          ? "This vault is trusted. Trusted desktop plugins and brokered capabilities may run for this workspace identity."
          : "This vault is untrusted. Trusted desktop plugins, brokered capabilities, and community plugin settings surfaces stay blocked until you trust this workspace."}
      </p>
    </div>
    <div class="lapis-plugin-management__actions">
      <Button.Root
        disabled={trustState.trusted || trustBusy}
        onclick={() => void updateTrust(true)}
      >Trust workspace</Button.Root>
      <Button.Root
        variant="destructive"
        disabled={!trustState.trusted || trustBusy}
        onclick={() => void updateTrust(false)}
      >Revoke trust</Button.Root>
    </div>
  </div>

  <header class="lapis-plugin-management__header">
    <div>
      <h1>Installed Plugins</h1>
      <p>Manage installed community and registry plugins for this vault.</p>
    </div>
    <Button.Root
      variant="outline"
      onclick={() => globalThis.location?.reload()}
    >Reload plugins</Button.Root>
  </header>

  <div class="lapis-plugin-management__rows">
    {#if plugins.length === 0 && indexedDiagnostics.length === 0}
      <p class="lapis-plugin-management__empty">
        No community plugins found in .obsidian/plugins.
      </p>
    {/if}

    {#each plugins as plugin (plugin.manifest.id)}
      <PluginSettingsRow
        pluginId={plugin.manifest.id}
        name={plugin.manifest.name}
        description={plugin.manifest.description}
        version={plugin.manifest.version}
        provenance={plugin.provenance}
        status={plugin.state === "failed"
          ? "Failed"
          : plugin.enabled
            ? "Enabled"
            : "Disabled"}
        error={plugin.lastFailureMessage ?? plugin.errorMessage ?? undefined}
        enabled={plugin.enabled}
        expanded={expandedPluginIds.has(plugin.manifest.id)}
        hasOptions={Boolean(
          pluginSettingsSectionId(controller, plugin.manifest.id),
        )}
        diagnostics={pluginDiagnosticRows(app, plugin.manifest.id)}
        onOptions={() => openPluginSettings(controller, plugin.manifest.id)}
        onRestart={async () => {
          await app.plugins.restartPlugin(plugin.manifest.id);
        }}
        onToggle={async (enabled) => {
          if (enabled) await app.plugins.enablePlugin(plugin.manifest.id);
          else await app.plugins.disablePlugin(plugin.manifest.id);
        }}
      />
    {/each}

    {#each indexedDiagnostics as diagnostics (diagnostics.pluginId)}
      <PluginSettingsRow
        pluginId={diagnostics.pluginId}
        name={diagnostics.name ?? diagnostics.pluginId}
        description={diagnostics.description ?? undefined}
        version={diagnostics.version ?? undefined}
        provenance={diagnostics.provenance}
        status={diagnostics.state}
        error={diagnostics.lastFailureMessage ?? undefined}
        enabled={false}
        expanded={expandedPluginIds.has(diagnostics.pluginId)}
        hasOptions={Boolean(
          pluginSettingsSectionId(controller, diagnostics.pluginId),
        )}
        diagnostics={pluginDiagnosticRows(app, diagnostics.pluginId)}
        onOptions={() => openPluginSettings(controller, diagnostics.pluginId)}
        onRestart={async () => {
          await app.plugins.restartPlugin(diagnostics.pluginId);
        }}
      />
    {/each}
  </div>
</section>
