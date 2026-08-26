import type { DesktopApplicationInfo } from "./application-info.ts";

export const DESKTOP_ABOUT_WINDOW_SIZE = {
  width: 380,
  height: 470,
} as const;

type AboutWindowOptions = {
  title: string;
  width: number;
  height: number;
  resizable: boolean;
  frameless: boolean;
  transparentTitlebar: boolean;
};

type AboutWindow = {
  bind(name: string, handler: (...args: unknown[]) => unknown): void;
  addEventListener(type: string, listener: () => void): void;
  navigate(url: string): void;
  close(): void;
  show(): void;
  focus(): void;
  isClosed(): boolean;
};

export type DesktopAboutWindowManager = {
  open(): void;
  hasOpenWindow(): boolean;
};

export function createDesktopAboutWindowManager(options: {
  createWindow(options: AboutWindowOptions): AboutWindow;
  rendererOrigin: string;
  applicationInfo: DesktopApplicationInfo;
}): DesktopAboutWindowManager {
  let current: AboutWindow | undefined;

  function open(): void {
    if (current && !current.isClosed()) {
      current.show();
      current.focus();
      return;
    }

    const about = options.createWindow({
      title: `About ${options.applicationInfo.name}`,
      ...DESKTOP_ABOUT_WINDOW_SIZE,
      resizable: false,
      frameless: false,
      transparentTitlebar: false,
    });
    current = about;

    const registerBindings = () => {
      about.bind("aboutInfo", () => options.applicationInfo);
      about.bind("closeAboutWindow", () => {
        queueMicrotask(() => {
          if (!about.isClosed()) about.close();
        });
      });
    };
    registerBindings();
    about.addEventListener("load", registerBindings);
    about.addEventListener("close", () => {
      if (current === about) current = undefined;
    });

    about.navigate(new URL("about.html", options.rendererOrigin).href);
    about.show();
    about.focus();
  }

  return {
    open,
    hasOpenWindow: () => Boolean(current && !current.isClosed()),
  };
}
