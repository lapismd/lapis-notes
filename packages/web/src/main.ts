import {
  getBootstrapAppearanceMode,
  setBrowserSearchEmbeddingWorkerFactory,
  type BootstrapAppearanceMode,
} from "@lapis-notes/api";
import SearchEmbeddingWorker from "@lapis-notes/api/search-embedding-worker?worker";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import { mount } from "svelte";
import { observeHostThemeColor } from "./host-theme-color";
import { initializeWebHostDocument } from "./pwa-host-document";
import { registerWebPwa } from "./pwa";
import { registerPwaWindowControlsOverlay } from "./pwa-window-controls";
import WebVaultHost from "./WebVaultHost.svelte";
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

initializeWebHostDocument();
setBrowserSearchEmbeddingWorkerFactory(
  () => new SearchEmbeddingWorker({ name: "lapis-search-embeddings" }),
);
const disposeWindowControls = registerPwaWindowControlsOverlay();
applyAppearance(await getBootstrapAppearanceMode());
const disposeThemeColor = observeHostThemeColor();
const target = document.getElementById("app");
if (!target) throw new Error("Web renderer root is missing");
const mounted = mount(WebVaultHost, { target });
const disposePwa = registerWebPwa();

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
