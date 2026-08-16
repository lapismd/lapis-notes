export const compareCurrentSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let { app }: { app: App } = $props();

  app.plugins.registerCorePlugins([
    { plugin: HistoryPlugin, required: false, enabledByDefault: true },
  ]);

  const history = app.plugins.plugins.get("history");
  if (history instanceof HistoryPlugin) {
    void history.openHistoryCompareView({
      filePath: "Notes/Welcome.md",
      revisionId: "selected-revision",
      compareMode: "current",
    });
  }
</script>

<WorkspaceShell {app} />`;

export const comparePreviousSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let { app }: { app: App } = $props();

  const history = app.plugins.plugins.get("history");
  if (history instanceof HistoryPlugin) {
    void history.openHistoryCompareView({
      filePath: "Notes/Welcome.md",
      revisionId: "selected-revision",
      compareMode: "previous",
    });
  }
</script>

<WorkspaceShell {app} />`;

export const compareSelectedSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let { app }: { app: App } = $props();

  const history = app.plugins.plugins.get("history");
  if (history instanceof HistoryPlugin) {
    history.toggleCompareAnchor("Notes/Welcome.md", "older-revision");
    void history.openHistoryCompareView({
      filePath: "Notes/Welcome.md",
      revisionId: "newer-revision",
      compareMode: "selected",
      otherRevisionId: "older-revision",
    });
  }
</script>

<WorkspaceShell {app} />`;

export const restoreSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  let { app }: { app: App } = $props();

  const history = app.plugins.plugins.get("history");
  if (history instanceof HistoryPlugin) {
    const model = await history.getHistoryViewModel();
    const revision = model.history?.revisions.at(-1);
    if (model.filePath && revision) {
      await history.restoreRevision(model.filePath, revision);
    }
  }
</script>

<WorkspaceShell {app} />`;
