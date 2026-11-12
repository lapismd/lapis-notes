import { Notice, type App, type Command } from "@lapis-notes/api";
import type {
  AppShellController,
  WorkspaceAction,
} from "@lapismd/design-core/workspace/core";

/** Lapis-owned policy; Design Core owns the transient mobile presentation. */
export function bindMobileWorkspaceCommands(
  app: App,
  controller: AppShellController,
): () => void {
  const navigation = controller.renderer.mobileNavigation;
  let disposed = false;
  let previousCreation: Promise<unknown> = Promise.resolve();
  const setMode = (mode: "auto" | "always" | "never") =>
    app.configuration.getConfiguration().update("workspace.mobile.mode", mode);
  const mobileOnly = (action: () => void) => {
    if (controller.renderer.displayMode === "mobile") action();
    else
      new Notice(
        "This action is only available while the mobile workspace layout is active.",
        undefined,
        app,
      );
  };
  const openSidebar = (side: "left" | "right") => {
    if (controller.renderer.displayMode === "mobile")
      navigation.openSidebar(side);
    else {
      app.workspace.exitFocusMode();
      (side === "left"
        ? app.workspace.leftSplit
        : app.workspace.rightSplit
      ).expand();
    }
  };
  const createNote = () => {
    const previous = previousCreation;
    const operation = app.fileEditingSessions.track(async () => {
      await previous;
      if (disposed) throw new Error("The workspace has closed.");
      const path = app.fileManager.getAvailablePathForAttachment("Untitled.md");
      const file = await app.fileManager.createFile(path, "");
      navigation.openEditor();
      await app.openFile(file);
      app.workspace.requestSaveLayout();
    });
    previousCreation = operation.catch(() => undefined);
    return operation;
  };
  const commands: Command[] = [
    {
      id: "app:new-note",
      name: "Create new note",
      icon: "file-plus",
      callback: createNote,
    },
    {
      id: "workspace:toggle-mobile-layout",
      name: "Workspace: Cycle mobile layout mode",
      icon: "smartphone",
      callback: () => {
        const mode = app.configuration
          .getConfiguration()
          .get("workspace.mobile.mode", "auto");
        return setMode(
          mode === "auto" ? "always" : mode === "always" ? "never" : "auto",
        );
      },
    },
    {
      id: "workspace:use-mobile-layout",
      name: "Workspace: Use mobile layout",
      icon: "smartphone",
      callback: () => setMode("always"),
    },
    {
      id: "workspace:use-desktop-layout",
      name: "Workspace: Use desktop layout",
      icon: "monitor",
      callback: () => setMode("never"),
    },
    {
      id: "workspace:open-mobile-tabs",
      name: "Workspace: Open mobile tabs",
      icon: "panel-top-open",
      callback: () => mobileOnly(() => navigation.openTabs()),
    },
    {
      id: "workspace:open-mobile-search",
      name: "Workspace: Open mobile search",
      icon: "search",
      callback: async () => {
        if (controller.renderer.displayMode !== "mobile")
          return mobileOnly(() => {});
        navigation.openEditor();
        await app.commands.executeCommand("search:open-search");
      },
    },
    {
      id: "workspace:open-mobile-left-sidebar",
      name: "Workspace: Open mobile left sidebar",
      icon: "panel-left-open",
      callback: () => openSidebar("left"),
    },
    {
      id: "workspace:open-mobile-right-sidebar",
      name: "Workspace: Open mobile right sidebar",
      icon: "panel-right-open",
      callback: () => openSidebar("right"),
    },
  ];
  const owned = commands.filter(
    (command) => !app.commands.getCommand(command.id),
  );
  owned.forEach((command) => app.commands.registerCommand(command));
  const registered = owned.map(
    (command) => app.commands.getCommand(command.id)!,
  );
  return () => {
    disposed = true;
    for (const command of registered) {
      if (app.commands.getCommand(command.id) === command)
        app.commands.unregisterCommand(command.id);
    }
  };
}

export function mobileWorkspaceActions(app: App): {
  search: WorkspaceAction;
  create: WorkspaceAction;
} {
  const execute = async (id: string) => {
    try {
      await app.commands.executeCommand(id);
    } catch (error) {
      new Notice(
        error instanceof Error ? error.message : String(error),
        undefined,
        app,
      );
    }
  };
  return {
    search: {
      id: "mobile-search",
      label: "Open search sidebar",
      icon: "search",
      disabled: !app.commands.getCommand("search:open-search"),
      onSelect: () => execute("workspace:open-mobile-search"),
    },
    create: {
      id: "mobile-new-note",
      label: "Create new note",
      icon: "plus",
      onSelect: () => execute("app:new-note"),
    },
  };
}
