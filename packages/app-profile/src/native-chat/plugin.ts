import { Plugin, type App, type PluginConstructor } from "@lapis-notes/api";
import {
  NativeChatSession,
  type NativeChatHost,
  type NativeChatLeave,
} from "./session";
import { NativeChatView } from "./view";
import { NativeChatNavigation } from "./navigation";

const modes = new WeakMap<App, NativeChatLeave>();
export function prepareNativeChatLeave(
  app: App,
  reason: NativeChatLeave,
): void {
  modes.set(app, reason);
}

/** Hosts inject authority; the same plugin/screen never instantiates renderer AI writers. */
export function createNativeChatPlugin(
  factory: (app: App) => NativeChatHost,
): PluginConstructor {
  return class NativeChatPlugin extends Plugin {
    readonly session: NativeChatSession;
    readonly views = new Set<NativeChatView>();
    readonly navigation: NativeChatNavigation;
    constructor(app: App) {
      super(app, {
        id: "ai",
        name: "AI",
        version: "0.1.0",
        minAppVersion: "0.0.1",
        author: "Lapis Notes",
        description: "Chat with your configured agents.",
      });
      this.session = new NativeChatSession(factory(app));
      this.navigation = new NativeChatNavigation(app);
    }
    async onload(): Promise<void> {
      for (const [type, title, icon] of [
        ["ai", "AI", "sparkles"],
        ["ai-conversation-history", "AI conversations", "history"],
      ]) {
        const open = async () => {
          if (type === "ai") await this.navigation.chat();
          else await this.navigation.history();
        };
        this.registerSidebarView(
          type,
          (leaf) =>
            new NativeChatView(
              leaf,
              this.session,
              this.views,
              type,
              this.navigation,
            ),
          { side: "right", title, icon },
          {
            kind: "command",
            command: {
              id: type === "ai" ? "open-chat" : "open-history",
              name: type === "ai" ? "Open Chat" : "Open History",
              callback: () => {
                void open().catch((error) => this.session.report(error));
              },
            },
          },
        );
        if (type === "ai")
          this.addRibbonIcon(icon, "Open Chat", () => {
            void open().catch((error) => this.session.report(error));
          });
      }
    }
    async onunload(): Promise<void> {
      await Promise.all([...this.views].map((view) => view.close()));
      await this.session.close(modes.get(this.app) ?? "disable");
      modes.delete(this.app);
    }
  };
}
