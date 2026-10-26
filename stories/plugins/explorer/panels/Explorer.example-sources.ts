import { createPanelDemoLayout } from "../../_shared/panels/create-panel-demo";

export const PluginFileIconsSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, Plugin, FileView, MemoryVaultAdapter, MemoryAppDatabase, type TFile } from "@lapis-notes/api";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  class DiagramView extends FileView {
    getViewType() { return "example-diagram"; }
    getDisplayText() { return this.file?.name ?? "Diagram"; }
    async onLoadFile(file: TFile) { this.contentEl.textContent = file.name; }
  }
  class DiagramPlugin extends Plugin {
    constructor(app: App) {
      super(app, { id: "example-diagram", name: "Diagram", version: "1.0.0", minAppVersion: "0.1.0", author: "Example", description: "Diagram files" });
    }
    onload() {
      const fileIcon = this.registerIcon("diagram", '<svg viewBox="0 0 24 24"><path d="M2 3h7v9H2z"/></svg>');
      this.registerView("example-diagram", leaf => new DiagramView(leaf), { kind: "file" });
      this.registerEditorView({ id: "example.diagram", viewType: "example-diagram", label: "Diagram", filenamePatterns: ["*.diagram"], priority: "default", fileIcon });
    }
  }
  const app = new App({
    version: "0.1.0", configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({ ".lapis/app.json": "{}", "example.diagram": "{}" }, { name: "Custom icons", vaultId: "custom-icons" }),
    appDatabase: new MemoryAppDatabase("custom-icons"),
    markdownRenderer: async () => {},
  });
  app.plugins.registerCorePlugins([{ plugin: FileExplorerPlugin, required: false, enabledByDefault: true }, { plugin: DiagramPlugin, required: false, enabledByDefault: true }]);
  onMount(() => {
    const ready = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      await app.workspace.changeLayout(${JSON.stringify(createPanelDemoLayout("explorer", "middle-top-tabs"), null, 2)});
    })();
    return () => { void ready.finally(async () => {
      for (const plugin of [...app.plugins.corePlugins].reverse()) await plugin.disable();
      await app.workspace.disposeWorkspaceHost();
    }); };
  });
</script>

<WorkspaceShell {app} />`;
