<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    provideApplicationState,
  } from "@lapis-notes/api";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { editingRecoveryPort } from "./port";
  import { prepareHandoff } from "./handoff";

  let {
    scenario = "detached",
  }: { scenario?: "detached" | "admission" | "handoff" } = $props();
  const selected = untrack(() => scenario);
  const saved =
    "# Saved note\n\nThis is the saved file, not an unsaved draft.\n";
  const adapter = new MemoryVaultAdapter({
    "Note.md": saved,
    ".lapis/app.json": "{}",
  });
  const app = new App({
    version: "0.0.0-story",
    adapter,
    appDatabase: new MemoryAppDatabase(`editing-${selected}`),
    nativeEditingIntents: editingRecoveryPort(adapter, selected),
    markdownRenderer: async () => {},
  });
  provideApplicationState(app);
  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
  ]);
  let ready = $state(false);
  let frame = $state<HTMLDivElement>();
  const handoffFacts = { protected: 0, mutations: 0 };
  $effect(() => {
    if (!frame) return;
    const element = frame as HTMLDivElement & {
      __lapisApp?: App;
      __handoffFacts?: typeof handoffFacts;
    };
    element.__lapisApp = app;
    if (selected === "handoff") element.__handoffFacts = handoffFacts;
    return () => {
      delete element.__lapisApp;
      delete element.__handoffFacts;
    };
  });
  onMount(() => {
    let active = true;
    let unregister = () => {};
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await app.workspace.loadLayout();
      if (selected === "admission") {
        const registration = app.fileEditingSessions.register("Note.md", {
          native: { hold: () => () => {}, savedText: () => saved },
          dirty: false,
          flush: async () => {},
          protect: async () => () => {},
        });
        unregister = registration;
        await registration.ready().catch(() => {});
      }
      if (selected === "handoff")
        unregister = await prepareHandoff(app, adapter, saved, handoffFacts);
      const { controller } = getWorkspaceHostBinding(app.workspace);
      await controller.start();
      await controller.commands.execute("app-shell:show-problems");
      if (active) ready = true;
    })();
    return () => {
      active = false;
      unregister();
      void (async () => {
        await app.plugins.unloadPlugin("markdown");
        await app.fileEditingSessions.dispose();
        await app.workspace.disposeWorkspaceHost();
      })();
    };
  });
</script>

<div
  bind:this={frame}
  class="editing-recovery-demo"
  data-editing-recovery-ready={ready}
>
  {#if ready}<WorkspaceShell {app} />{/if}
</div>

<style>
  .editing-recovery-demo {
    width: 100%;
    height: 100dvh;
    min-height: 0;
  }
</style>
