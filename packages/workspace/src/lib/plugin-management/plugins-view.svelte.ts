import { ItemView, type WorkspaceLeaf } from "@lapis-notes/api";
import { getPluginRegistryController } from "./plugin-registry-controller.svelte";
import { mount, unmount } from "svelte";
import PluginBrowser, {
  type PluginBrowserNavigation,
} from "./PluginBrowser.svelte";
import {
  defaultDirectoryState,
  restoreBrowserState,
} from "./plugin-browser-model";

/** App-owned browser view; registration lives in the private default profile. */
export class PluginsView extends ItemView {
  private disposeHeader: (() => void) | null = null;
  private component: ReturnType<typeof mount> | null = null;
  readonly navigation = $state<PluginBrowserNavigation>({
    route: { page: "landing" },
    directory: defaultDirectoryState(),
    returnPage: "landing",
    scrollTop: 0,
  });
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.icon = "package";
  }
  getViewType() {
    return "plugins";
  }
  getDisplayText() {
    if (this.navigation.route.page === "plugin") {
      const pluginId = this.navigation.route.pluginId;
      return (
        getPluginRegistryController(this.app).catalogEntries.find(
          (entry) => entry.id === pluginId,
        )?.name ?? "Plugins"
      );
    }
    return "Plugins";
  }
  getBreadcrumbs(): ReturnType<ItemView["getBreadcrumbs"]> {
    if (this.navigation.route.page === "landing") return [];
    const crumbs: ReturnType<ItemView["getBreadcrumbs"]> = [
      { id: "registry", label: "Registry", onSelect: () => this.home() },
    ];
    if (this.navigation.route.page === "plugin")
      crumbs.push({
        id: "plugins",
        label: "Plugins",
        onSelect: () => {
          this.navigation.route = { page: this.navigation.returnPage };
          this.app.workspace.requestSaveLayout();
        },
      });
    return crumbs;
  }
  getState() {
    return {
      route: { ...this.navigation.route },
      directory: structuredClone($state.snapshot(this.navigation.directory)),
      returnPage: this.navigation.returnPage,
      scrollTop: this.navigation.scrollTop,
    };
  }
  async setState(state: Record<string, unknown>) {
    Object.assign(this.navigation, restoreBrowserState(state));
    this.navigation.returnPage =
      state.returnPage === "directory" ? "directory" : "landing";
    this.navigation.scrollTop =
      typeof state.scrollTop === "number" && Number.isFinite(state.scrollTop)
        ? Math.max(0, state.scrollTop)
        : 0;
  }
  showPlugin(pluginId: string) {
    if (this.navigation.route.page !== "plugin")
      this.navigation.returnPage = this.navigation.route.page;
    this.navigation.route = { page: "plugin", pluginId };
    this.app.workspace.requestSaveLayout();
  }
  home() {
    this.navigation.route = { page: "landing" };
    this.navigation.scrollTop = 0;
    this.app.workspace.requestSaveLayout();
  }
  load() {
    this.unload();
    this.containerEl.replaceChildren();
    const registry = getPluginRegistryController(this.app);
    this.actions = [];
    this.addAction(
      "refresh-cw",
      "Refresh plugins",
      () => void registry.refresh(true),
    );
    this.disposeHeader = $effect.root(() => {
      $effect(() => {
        this.actions[0].disabled = registry.refreshing;
      });
    });
    this.component = mount(PluginBrowser, {
      target: this.containerEl,
      props: {
        app: this.app,
        navigation: this.navigation,
        onstatechange: () => this.app.workspace.requestSaveLayout(),
      },
    });
  }
  unload() {
    this.disposeHeader?.();
    this.disposeHeader = null;
    this.actions = [];
    if (this.component) void unmount(this.component);
    this.component = null;
  }
  protected async onOpen() {}
  protected async onClose() {}
}
