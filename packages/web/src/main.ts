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
} else {
  const serverDocument = await import("./server-host-document");
  serverDocument.initializeServerHostDocument(
    __LAPIS_RUST_SERVER__ ? "rust-server" : "node-server",
  );
}
applyAppearance(await getBootstrapAppearanceMode());
const disposeThemeColor = observeHostThemeColor();
const target = document.getElementById("app");
if (!target) throw new Error("Web renderer root is missing");
async function mountHosted(target: HTMLElement) {
  const Host = (await import("./ServerVaultHost.svelte")).default;
  const backend = __LAPIS_RUST_SERVER__
    ? (await import("./hosted/rust/backend")).createRustHostedBackend()
    : (await import("./hosted/node-backend")).createNodeHostedBackend();
  return mount(Host, { target, props: { backend } });
}
const mounted = __LAPIS_SERVER_MODE__
  ? await mountHosted(target)
  : mount((await import("./WebVaultHost.svelte")).default, { target });

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
