<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import Puzzle from "@lucide/svelte/icons/puzzle";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import ShieldAlert from "@lucide/svelte/icons/shield-alert";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Sparkles from "@lucide/svelte/icons/sparkles";
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
    const trustChanged = app.workspaceTrust.on("changed", refresh);
    void app.workspaceTrust.ready().then(refresh);
    return () => {
      app.plugins.offref(loaded);
      app.plugins.offref(enabled);
      app.plugins.offref(disabled);
      app.plugins.offref(error);
      app.workspaceTrust.offref(trustChanged);
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

  function browsePlugins(): void {
    context.reveal.request("plugin-registry", "registry:");
    controller.selectSection("plugin-registry");
  }
</script>

<section
  class="lapis-plugin-management"
  data-ui-component="lapis-plugin-management"
  data-ui-part="community-plugins"
>
  <section
    class="lapis-plugin-management__trust"
    data-ui-component="workspace-trust-status"
    data-ui-part="status-card"
    data-trust-state={trustState.trusted ? "trusted" : "untrusted"}
    aria-labelledby="lapis-workspace-trust-title"
  >
    <div
      class="lapis-plugin-management__trust-icon"
      data-ui-part="status-icon"
      data-trust-icon={trustState.trusted ? "shield-check" : "shield-alert"}
      aria-hidden="true"
    >
      {#if trustState.trusted}
        <ShieldCheck />
      {:else}
        <ShieldAlert />
      {/if}
    </div>

    <div class="lapis-plugin-management__trust-content">
      <div class="lapis-plugin-management__trust-title-line">
        <h1 id="lapis-workspace-trust-title">
          {trustState.trusted
            ? "Workspace trusted"
            : "Workspace not trusted"}
        </h1>
        <span
          class="lapis-plugin-management__trust-badge"
          data-ui-part="status-badge"
        >
          {#if trustState.trusted}
            <Check aria-hidden="true" />
            Trusted
          {:else}
            <span aria-hidden="true"></span>
            Not trusted
          {/if}
        </span>
      </div>
      <p>
        {trustState.trusted
          ? "Community plugins and desktop capabilities can run in this vault."
          : "Community plugins and desktop capabilities are disabled until this vault is trusted."}
      </p>
      {#if !trustState.trusted}
        <Button.Root
          class="lapis-plugin-management__trust-action"
          disabled={trustBusy}
          onclick={() => void updateTrust(true)}
        >Trust workspace</Button.Root>
      {/if}
    </div>

    {#if trustState.trusted}
      <Button.Root
        class="lapis-plugin-management__trust-action lapis-plugin-management__trust-action--revoke"
        variant="outline"
        disabled={trustBusy}
        onclick={() => void updateTrust(false)}
      >Revoke</Button.Root>
    {/if}
  </section>

  <header class="lapis-plugin-management__header">
    <div>
      <h1>Installed Plugins</h1>
      <p>Manage installed community and registry plugins for this vault.</p>
    </div>
    <Button.Root
      class="lapis-plugin-management__reload"
      variant="outline"
      onclick={() => globalThis.location?.reload()}
    >
      <RefreshCw
        class="lapis-plugin-management__icon"
        data-reload-icon="refresh-cw"
        aria-hidden="true"
      />
      Reload plugins
    </Button.Root>
  </header>

  {#if plugins.length === 0 && indexedDiagnostics.length === 0}
    <div
      class="lapis-plugin-management__community-empty"
      data-ui-part="community-empty-state"
    >
      <div
        class="lapis-plugin-management__community-empty-icon"
        data-empty-icon="puzzle"
        aria-hidden="true"
      >
        <Puzzle />
        <Sparkles />
      </div>
      <h2>No community plugins found</h2>
      <p>
        Looks like you haven’t installed any community plugins yet.<br />
        Browse the community plugins list to get started.
      </p>
      <Button.Root onclick={browsePlugins}>Browse plugins</Button.Root>
    </div>
  {:else}
    <div class="lapis-plugin-management__rows">
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
  {/if}
</section>
