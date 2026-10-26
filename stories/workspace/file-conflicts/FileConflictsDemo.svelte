<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    provideApplicationState,
  } from "@lapis-notes/api";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  const original = "---\nstatus: ready\n---\n# Saved note\n";
  const external = "---\nstatus: external\nowner: outside\n---\n# Saved note\n";
  const adapter = new MemoryVaultAdapter({
    "Note.md": original,
    ".lapis/app.json": "{}",
  });
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    async writeTextIfUnchanged(path: string, text: string, expected: string | null) {
      const current = (await adapter.exists(path)) ? await adapter.read(path) : null;
      if (current !== expected)
        throw Object.assign(new Error("File changed"), { code: "ECONFLICT" });
      await adapter.write(path, text);
    },
  });
  const app = new App({
    version: "0.0.0-story",
    adapter,
    appDatabase: new MemoryAppDatabase(`conflict-${crypto.randomUUID()}`),
    markdownRenderer: async () => {},
  });
  provideApplicationState(app);
  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
  ]);
  let ready = $state(false);
  let frame = $state<HTMLDivElement>();
  $effect(() => {
    if (!frame) return;
    const owned = frame as HTMLDivElement & { __lapisApp?: App };
    owned.__lapisApp = app;
    return () => { delete owned.__lapisApp; };
  });
  onMount(() => {
    let active = true;
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await app.workspace.loadLayout();
      if (!active) return;
      ready = true;
      await tick();
      const file = app.vault.getFileByPath("Note.md")!;
      await app.vault.modify(file, external);
      try {
        await app.fileManager.processFrontMatter(file, (record) => {
          for (const key of Object.keys(record)) delete record[key];
          record.status = "local";
        }, { expectedFrontmatter: { status: "ready" } });
        throw new Error("The disposable stale writer unexpectedly saved");
      } catch (error) {
        if (app.fileEditingSessions.textConflicts.entries.length !== 1) throw error;
      }
    })();
    return () => {
      active = false;
      void (async () => {
        // Dispose test-owned unresolved input after a failed play; successful
        // plays must resolve through the visible production review first.
        for (const conflict of app.fileEditingSessions.textConflicts.entries)
          await conflict.resolve("use-external");
        await app.plugins.unloadPlugin("markdown");
        await app.fileEditingSessions.dispose();
        await app.workspace.disposeWorkspaceHost();
      })();
    };
  });
</script>

<div bind:this={frame} class="file-conflicts-demo" data-file-conflicts-ready={ready}>
  {#if ready}<WorkspaceShell {app} />{/if}
</div>

<style>
  .file-conflicts-demo {
    width: 100%;
    height: 100dvh;
    min-height: 0;
  }
</style>
