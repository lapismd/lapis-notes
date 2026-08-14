export const RolesWorkspaceExample = `<script lang="ts">
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { RolesPlugin } from "@lapis-notes/roles";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import roleSource from "./role.md?raw";
  import cvSource from "./engineering-lead.cv.yml?raw";

  const rolesLeaf = { id: "roles", type: "leaf", state: {
    type: "roles", title: "Roles", icon: "briefcase-business", state: {},
  } };
  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": "{}",
    ".obsidian/workspace.json": JSON.stringify({
      main: { id: "main", type: "split", direction: "vertical", sizes: [100],
        children: [{ id: "main-tabs", type: "tabs", stacked: false,
          currentTab: 0, children: [rolesLeaf] }],
      },
      left: { id: "left", type: "split", direction: "vertical",
        sizes: [], children: [], width: "0px" },
      right: { id: "right", type: "split", direction: "vertical",
        sizes: [], children: [], width: "0px" },
      bottom: { id: "bottom", type: "tabs", currentTab: 0,
        children: [], height: "0px" },
      floating: [], active: "roles",
    }),
    "Roles/atlas-platform/role.md": roleSource,
    "CVs/engineering-lead.cv.yml": cvSource,
  });
  const app = new App({
    adapter,
    appDatabase: new MemoryAppDatabase("roles-workspace"),
    configPath: ".obsidian/app.json",
    version: "1.0.0",
    markdownRenderer: async () => {},
  });
  app.plugins.registerCorePlugins([
    { plugin: RolesPlugin, required: false, enabledByDefault: true },
  ]);
</script>

<WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
`;
