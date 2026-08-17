<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    bootAiWorkspaceDemo,
    createLiveHostReloadConversationFiles,
    LIVE_HOST_VAULT_ID,
    seedPortableConversationStorage,
    type AiWorkspaceScenario,
  } from "./shell/create-shell-demo";
  import { isLiveAgentAttachConfigured } from "./live-agent-attach";
  import "@lapis-notes/ai/styles.css";

  let {
    scenario = "default",
  }: {
    scenario?: Extract<AiWorkspaceScenario, "default" | "reload-resume">;
  } = $props();

  const attached = isLiveAgentAttachConfigured();
  const persistReload = $derived(scenario === "reload-resume");
  let app = $state<App | null>(null);
  let status = $state("booting");
  let error = $state("");
  let root = $state<HTMLDivElement>();

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & { __lapisApp?: App };
    ownedRoot.__lapisApp = app;
    return () => {
      if (ownedRoot.__lapisApp === app) delete ownedRoot.__lapisApp;
    };
  });

  onMount(() => {
    if (!attached && !persistReload) {
      status = "missing";
      return;
    }
    if (persistReload) {
      seedPortableConversationStorage(
        LIVE_HOST_VAULT_ID,
        createLiveHostReloadConversationFiles(),
      );
    }
    let cancelled = false;
    const runtimePromise = bootAiWorkspaceDemo({
      defaultRuntime: attached ? "acp" : "fake",
      vaultId: LIVE_HOST_VAULT_ID,
      persistVaultData: true,
      scenario,
    });
    void runtimePromise
      .then((runtime) => {
        if (cancelled) return;
        app = runtime.app;
        status = "ready";
      })
      .catch((reason) => {
        if (cancelled) return;
        status = "failed";
        error = reason instanceof Error ? reason.message : String(reason);
      });
    return () => {
      cancelled = true;
      void runtimePromise
        .then((runtime) => runtime.dispose())
        .catch(() => undefined);
    };
  });
</script>

{#if !attached && !persistReload}
  <section
    class="ai-live-host-setup"
    data-testid="ai-live-host-setup"
    data-attach="missing"
  >
    <h1>Live AI host</h1>
    <p>
      This story is the manual live ACP lane. Default Plugins/AI stories stay
      Fake. Use the seeded supervisor, then return to this story.
    </p>
    <ol>
      <li>
        In another terminal, run <code>pnpm ai:smoke:storybook</code>.
      </li>
      <li>
        The supervisor seeds the workspace and injects a one-run host attach
        without writing its token.
      </li>
      <li>Return to this story and send prompts manually. Plays never send.</li>
    </ol>
  </section>
{:else}
  <div
    bind:this={root}
    class="ai-workspace-demo"
    data-testid="ai-workspace-demo"
    data-status={status}
    data-attach="configured"
  >
    <output class="ai-workspace-demo__status" data-testid="ai-workspace-status">
      {status}
    </output>
    {#if error}
      <div role="alert">{error}</div>
    {:else if app}
      <WorkspaceShell
        {app}
        displayMode="desktop"
        workspaceLabel="Lapis Notes"
      />
    {/if}
  </div>
{/if}

<style>
  .ai-live-host-setup {
    box-sizing: border-box;
    min-height: 100%;
    padding: 2rem;
    color: var(--foreground);
    background: var(--background);
    font-family: var(--font-sans, inherit);
    line-height: 1.5;
  }

  .ai-live-host-setup h1 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
  }

  .ai-live-host-setup p,
  .ai-live-host-setup li {
    max-width: 40rem;
  }

  .ai-live-host-setup code {
    font-size: 0.875em;
  }

  :global(
      body.sb-main-fullscreen:has(#storybook-root .ai-workspace-demo)
        #storybook-root
    ) {
    box-sizing: border-box;
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(body:has(#storybook-root .ai-workspace-demo)) {
    overflow: hidden;
  }

  .ai-workspace-demo {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    min-height: 36rem;
    overflow: hidden;
  }

  .ai-workspace-demo > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
    max-height: 100%;
  }

  .ai-workspace-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
