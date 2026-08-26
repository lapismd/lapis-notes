import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import { mount } from "svelte";

import DesktopAboutWindow from "./DesktopAboutWindow.svelte";
import lapisLogo from "./assets/lapis-logo.svg";
import "./about-window.css";
import type { DesktopAppInfo } from "./main";

type DesktopAboutBindings = {
  aboutInfo(): Promise<DesktopAppInfo>;
  closeAboutWindow(): Promise<void>;
};

const bindings = (globalThis as { bindings?: DesktopAboutBindings }).bindings;
const target = document.getElementById("app");
if (!bindings || !target) {
  throw new Error("The native About window bindings are unavailable");
}

const info = await bindings.aboutInfo();
document.documentElement.dataset.uiTheme = "lapis";
document.documentElement.classList.toggle(
  "dark",
  globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches === true,
);
document.title = `About ${info.name}`;

mount(DesktopAboutWindow, {
  target,
  props: {
    info: {
      ...info,
      logoUrl: lapisLogo,
      commitHash: import.meta.env.VITE_APP_COMMIT_HASH?.trim(),
    },
    onClose: () => void bindings.closeAboutWindow(),
  },
});
