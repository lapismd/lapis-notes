<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    installApplicationCompatibility,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    provideApplicationState,
    View,
    type WorkspaceLeaf,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import type { WorkspaceRequestedDisplayMode } from "@lapismd/design-core/workspace/core";
  import { PROBLEMS_VIEW_TYPE } from "@lapismd/design-core/workspace/problems";
  import "./workspace-shell-story.css";

  let {
    displayMode = "desktop",
    workspaceLabel = "Lapis Notes",
    scenario = "standard",
    seedNotifications = false,
  }: {
    displayMode?: WorkspaceRequestedDisplayMode;
    workspaceLabel?: string;
    scenario?: "standard" | "mobile" | "stacked" | "bottom-settings";
    seedNotifications?: boolean;
  } = $props();
  let workspaceNavigationStatus = $state("No workspace action selected");
  let workspaceNavigation = $derived.by<WorkspaceNavigation>(() => ({
    currentLabel: workspaceLabel,
    menuLabel: "Recent vaults",
    items: [
      {
        id: "lapis-notes",
        label: workspaceLabel,
        description: "/Users/demo/Lapis Notes",
        disabled: true,
      },
    ],
    manageLabel: "Manage Vaults",
    onSelect: () => {},
    onManage: () => {
      workspaceNavigationStatus = "Manage Vaults selected";
    },
  }));

  class StoryWorkspaceView extends View {
    type: string;
    title: string;

    constructor(
      leaf: WorkspaceLeaf,
      type: string,
      title: string,
      icon: string,
    ) {
      super(leaf);
      this.type = type;
      this.title = title;
      this.icon = icon;
    }

    onload() {
      const content = document.createElement("div");
      const inlineTitle = document.createElement("h1");
      const heading = document.createElement("h2");
      const description = document.createElement("p");
      content.className = "workspace-shell-story-view";
      inlineTitle.className = "workspace-shell-story-view__inline-title";
      inlineTitle.dataset.uiComponent = "workspace-story-view";
      inlineTitle.dataset.uiPart = "inline-title";
      inlineTitle.textContent = this.title;
      heading.className = "workspace-shell-story-view__preview-title";
      heading.textContent = this.title;
      description.textContent = `${this.title} workspace preview`;
      content.append(inlineTitle, heading, description);
      this.containerEl.replaceChildren(content);
    }

    onunload() {}

    protected onOpen() {
      return Promise.resolve();
    }

    protected onClose() {
      return Promise.resolve();
    }

    getViewType() {
      return this.type;
    }

    getDisplayText() {
      return this.title;
    }
  }

  const storyViewDefinitions = {
    start: { title: "Start", icon: "ghost" },
    notes: { title: "Notes", icon: "notebook-tabs" },
    reference: { title: "Reference", icon: "book-open" },
    archive: { title: "Archive", icon: "archive" },
    files: { title: "Files", icon: "files" },
    outline: { title: "Outline", icon: "list-tree" },
    terminal: { title: "Terminal", icon: "terminal" },
    problems: { title: "Problems", icon: "circle-alert" },
  } as const;

  function leaf(id: string, title: string, icon: string, type = "empty") {
    return {
      id,
      type: "leaf",
      state: { type, state: {}, icon, title },
    };
  }

  function tabs(
    id: string,
    children: ReturnType<typeof leaf>[],
    stacked = false,
  ) {
    return {
      id,
      type: "tabs",
      stacked,
      currentTab: 0,
      children,
    };
  }

  function createInitialLayout(
    selectedScenario: "standard" | "mobile" | "stacked" | "bottom-settings",
  ) {
    const mainChildren =
      selectedScenario === "standard"
        ? [leaf("start", "Start", "ghost")]
        : selectedScenario === "bottom-settings"
          ? [leaf("notes", "Notes", "notebook-tabs", "story-notes")]
          : [
              leaf("start", "Start", "ghost", "story-start"),
              leaf("notes", "Notes", "notebook-tabs", "story-notes"),
              leaf("reference", "Reference", "book-open", "story-reference"),
              ...(selectedScenario === "stacked"
                ? [leaf("archive", "Archive", "archive", "story-archive")]
                : []),
            ];
    const mobile = selectedScenario === "mobile";
    const bottomSettings = selectedScenario === "bottom-settings";
    return {
      main: {
        id: "main",
        type: "split",
        direction: "vertical",
        sizes: [100],
        children: [
          tabs("main-tabs", mainChildren, selectedScenario === "stacked"),
        ],
      },
      left: {
        id: "left",
        type: "split",
        direction: "vertical",
        sizes: mobile || bottomSettings ? [100] : [],
        children:
          mobile || bottomSettings
            ? [
                tabs("left-tabs", [
                  leaf("files", "Files", "files", "story-files"),
                ]),
              ]
            : [],
        width: mobile || bottomSettings ? "18rem" : "0px",
      },
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        sizes: mobile || bottomSettings ? [100] : [],
        children:
          mobile || bottomSettings
            ? [
                tabs("right-tabs", [
                  leaf("outline", "Outline", "list-tree", "story-outline"),
                ]),
              ]
            : [],
        width: mobile || bottomSettings ? "18rem" : "0px",
      },
      bottom: {
        ...tabs(
          "bottom-panel",
          bottomSettings
            ? [
                leaf("terminal", "Terminal", "terminal", "story-terminal"),
                leaf("problems", "Problems", "circle-alert", PROBLEMS_VIEW_TYPE),
              ]
            : [],
        ),
        height: bottomSettings ? "240px" : "0px",
      },
      floating: [],
      active: bottomSettings ? "notes" : "start",
    };
  }

  const initialScenario = untrack(() => scenario);
  const initialLayout = createInitialLayout(initialScenario);

  const workspacePath = ".obsidian/workspace.json";
  const initialJson = JSON.stringify(initialLayout, null, 2);
  const adapter = new MemoryVaultAdapter({
    [`/${workspacePath}`]: initialJson,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian",
    adapter,
    appDatabase: new MemoryAppDatabase(
      `workspace-story-${untrack(() => displayMode)}-${untrack(() => scenario)}`,
    ),
    markdownRenderer: async () => {},
  });
  provideApplicationState(app);
  const disposeApplicationCompatibility =
    installApplicationCompatibility(app);

  if (initialScenario !== "standard") {
    for (const [id, definition] of Object.entries(storyViewDefinitions)) {
      const type = `story-${id}`;
      app.workspace.registerView(
        type,
        (leaf) =>
          new StoryWorkspaceView(leaf, type, definition.title, definition.icon),
      );
    }
  }

  let ready = $state(false);
  let bootStatus = $state("booting");
  let controllerLayout = $state(initialJson);
  let lastControllerOperation = $state("none");
  let compatibilityLayout = $state(initialJson);
  let lastLayoutOperation = $state("none");
  let persistedLayout = $state(initialJson);
  let writeCount = $state(0);
  let showInlineTitle = $derived(controller.renderer.showInlineTitle);

  app.workspace.on("layout-change", (event) => {
    compatibilityLayout = JSON.stringify(app.workspace.getLayout());
    lastLayoutOperation = event.operation ?? event.source;
  });

  const { controller } = getWorkspaceHostBinding(app.workspace);
  controller.on("layout-change", (event) => {
    controllerLayout = JSON.stringify(controller.getLayout());
    lastControllerOperation = event.operation ?? event.source;
  });

  adapter.onWrite = (path, data, count) => {
    if (path !== workspacePath) return;
    persistedLayout = data;
    writeCount = count;
  };

  onMount(() => {
    let disposed = false;
    void (async () => {
      await app.vault.load();
      await app.workspace.loadLayout();
      await controller.start();
      if (untrack(() => seedNotifications)) {
        await controller.notifications.clearAll();
        controller.notifications.notify({
          id: "workspace-restored",
          title: "Workspace restored",
          message: "Your persisted Lapis layout is ready.",
          severity: "info",
          source: "Lapis Notes",
          persist: true,
          duration: 0,
        });
        controller.notifications.dismiss("workspace-restored");
      }
      if (disposed) return;
      persistedLayout = await adapter.read(workspacePath);
      bootStatus = "ready";
      ready = true;
    })();
    return () => {
      disposed = true;
      disposeApplicationCompatibility();
    };
  });
</script>

<div
  class="workspace-shell-story-frame"
  data-testid="workspace-shell-frame"
  data-workspace-inline-title={showInlineTitle ? "true" : "false"}
>
  {#if ready}
    <WorkspaceShell
      {app}
      {displayMode}
      {workspaceLabel}
      {workspaceNavigation}
    />
  {:else}
    <div class="workspace-shell-story-boot">Loading workspace…</div>
  {/if}

  <div class="workspace-shell-story-observer" aria-live="polite">
    <span data-testid="workspace-shell-status">{bootStatus}</span>
    <span data-testid="workspace-write-count">{writeCount}</span>
    <span data-testid="workspace-bottom-size"
      >{app.workspace.bottomPanel.size}</span
    >
    <span data-testid="workspace-bottom-collapsed"
      >{app.workspace.bottomPanel.collapsed}</span
    >
    <span data-testid="workspace-layout-operation">{lastLayoutOperation}</span>
    <span data-testid="workspace-navigation-status"
      >{workspaceNavigationStatus}</span
    >
    <span data-testid="workspace-controller-operation"
      >{lastControllerOperation}</span
    >
    <output data-testid="workspace-controller-layout">{controllerLayout}</output
    >
    <output data-testid="workspace-compatibility-layout"
      >{compatibilityLayout}</output
    >
    <output data-testid="workspace-persisted-layout">{persistedLayout}</output>
  </div>
</div>
