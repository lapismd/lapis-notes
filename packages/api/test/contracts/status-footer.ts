import type { App, StatusBarAlignment } from "../../dist/index";

const alignment: StatusBarAlignment = "center";
export function contribute(app: App): () => void {
  return app.statusBar.registerItem({
    id: "footer:center",
    alignment,
    text: "Working",
  });
}
