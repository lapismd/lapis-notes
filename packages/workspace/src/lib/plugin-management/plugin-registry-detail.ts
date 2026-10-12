export type PluginMarkdownState =
  | { status: "idle" | "loading" | "missing" }
  | {
      status: "loaded";
      url: string;
      sourceUrl: string;
      markdown: string;
    }
  | { status: "error"; message: string; sourceUrl?: string };

export type PluginRegistryActionFeedback = {
  pluginId: string;
  state: "running" | "success" | "error";
  message: string;
};
