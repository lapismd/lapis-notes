import {
  getBootstrapAppearanceMode,
  setBrowserSearchEmbeddingWorkerFactory,
  type BootstrapAppearanceMode,
} from "@lapis-notes/api";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import { mount } from "svelte";
import { observeHostThemeColor } from "./host-theme-color";
import "./web-host.css";

function applyAppearance(mode: BootstrapAppearanceMode): void {
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
  document.documentElement.classList.toggle("theme-dark", dark);
  document.documentElement.classList.toggle("theme-light", !dark);
  document.documentElement.dataset.uiTheme = "lapis";
}

let disposeWindowControls = () => {};
let disposePwa = () => {};
if (!__LAPIS_SERVER_MODE__) {
  const [documentHost, pwa, controls, worker] = await Promise.all([
    import("./pwa-host-document"),
    import("./pwa"),
    import("./pwa-window-controls"),
    import("@lapis-notes/api/search-embedding-worker?worker"),
  ]);
  documentHost.initializeWebHostDocument();
  setBrowserSearchEmbeddingWorkerFactory(
    () => new worker.default({ name: "lapis-search-embeddings" }),
  );
  disposeWindowControls = controls.registerPwaWindowControlsOverlay();
  disposePwa = pwa.registerWebPwa();
}
applyAppearance(await getBootstrapAppearanceMode());
const disposeThemeColor = observeHostThemeColor();
const target = document.getElementById("app");
if (!target) throw new Error("Web renderer root is missing");
if (__LAPIS_SERVER_MODE__) {
  throw new Error(
    "The hosted Rust client belongs to lapis-server and is not compiled by @lapis-notes/web.",
  );
}
const mounted = mount((await import("./WebVaultHost.svelte")).default, {
  target,
});

window.addEventListener(
  "pagehide",
  () => {
    disposePwa();
    disposeThemeColor();
    disposeWindowControls();
  },
  { once: true },
);

export default mounted;
