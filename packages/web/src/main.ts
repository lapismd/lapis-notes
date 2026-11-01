import {
  getBootstrapAppearanceMode,
  setBrowserSearchEmbeddingWorkerFactory,
} from "@lapis-notes/api";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import { mount } from "svelte";
import { observeHostThemeColor } from "./host-theme-color";
import { applyWebHostAppearance } from "./host-appearance";
import "./web-host.css";

document.documentElement.dataset.lapisBuildCommit =
  import.meta.env.VITE_APP_COMMIT_HASH;

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
applyWebHostAppearance(await getBootstrapAppearanceMode());
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
