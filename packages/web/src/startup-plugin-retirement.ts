import type { App } from "@lapis-notes/api";
import { prepareNativeChatLeave } from "@lapis-notes/app-profile/native-chat";

/** Retire this App's plugin observations before retrying startup. */
export async function retirePluginsForRetry(app: App): Promise<void> {
  prepareNativeChatLeave(app, "detach");
  for (const plugin of [...app.plugins.plugins.values()].reverse()) {
    await plugin.disable().catch(() => undefined);
  }
}
