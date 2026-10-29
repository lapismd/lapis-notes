import type { NativeDesktopBridge } from "@lapis-notes/api";

/** Publishes connection metadata only. The AI plugin owns the shared SDK connection. */
export function createControllerConnectionBridge(options: {
  url: string;
  token: string;
  workspace?: string;
}): NativeDesktopBridge {
  const url = options.url.trim();
  const token = options.token.trim();
  if (!["ws:", "wss:"].includes(new URL(url).protocol))
    throw new Error("AI controller URL must use ws or wss");
  if (!token) throw new Error("AI controller token is required");
  return {
    runtime: "deno-desktop",
    capabilities: {
      "agent-runtime": {
        id: "agent-runtime",
        status: "available",
        provider: "lapis-ai-controller",
        details: { protocol: "lapis-ai-controller/1", url },
      },
    },
    async invoke<T>(command: string): Promise<T> {
      if (command !== "desktop_ai_controller_connection")
        throw new Error(`Unsupported AI controller command: ${command}`);
      return { url, token, workspace: options.workspace ?? "default" } as T;
    },
    toFileUrl: (path: string) => path,
  };
}
