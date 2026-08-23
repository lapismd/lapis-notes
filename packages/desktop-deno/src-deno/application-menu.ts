export const DENO_MENU_IDS = {
  about: "open-about",
  openVault: "open-vault",
  reload: "reload",
  toggleDevtools: "toggle-devtools",
  showRendererErrors: "show-renderer-errors",
  openInspector: "open-inspector",
  learnMore: "learn-more",
} as const;

type MenuRole =
  | "close"
  | "copy"
  | "cut"
  | "minimize"
  | "paste"
  | "quit"
  | "redo"
  | "selectAll"
  | "undo";

export type DenoMenuItem =
  | "separator"
  | { role: { role: MenuRole } }
  | {
      item: {
        label: string;
        id: string;
        accelerator?: string;
        enabled: boolean;
      };
    }
  | {
      submenu: {
        label: string;
        items: DenoMenuItem[];
      };
    };

function action(
  label: string,
  id: string,
  options: { accelerator?: string; enabled?: boolean } = {},
): DenoMenuItem {
  return {
    item: {
      label,
      id,
      accelerator: options.accelerator,
      enabled: options.enabled ?? true,
    },
  };
}

function role(value: MenuRole): DenoMenuItem {
  return { role: { role: value } };
}

function submenu(label: string, items: DenoMenuItem[]): DenoMenuItem {
  return { submenu: { label, items } };
}

/**
 * Projects the established Lapis menu into Deno Desktop's currently documented
 * role set. Unsupported native roles stay visible but disabled.
 */
export function createDenoApplicationMenu(platform: string): DenoMenuItem[] {
  const isMac = platform === "darwin";
  return [
    ...(isMac
      ? [
          submenu("Lapis Notes", [
            action("About Lapis Notes", DENO_MENU_IDS.about),
            "separator",
            role("quit"),
          ]),
        ]
      : []),
    submenu("File", [
      action("Open Vault…", DENO_MENU_IDS.openVault, {
        accelerator: "CmdOrCtrl+Shift+O",
      }),
      "separator",
      role(isMac ? "close" : "quit"),
    ]),
    submenu("Edit", [
      role("undo"),
      role("redo"),
      "separator",
      role("cut"),
      role("copy"),
      role("paste"),
      action("Delete", "unsupported-delete", { enabled: false }),
      "separator",
      role("selectAll"),
    ]),
    submenu("View", [
      action("Reload", DENO_MENU_IDS.reload, {
        accelerator: "CmdOrCtrl+R",
      }),
      action("Force Reload", "unsupported-force-reload", { enabled: false }),
      action("Toggle Developer Tools", DENO_MENU_IDS.toggleDevtools, {
        accelerator: "Alt+CmdOrCtrl+I",
      }),
      "separator",
      action("Actual Size", "unsupported-reset-zoom", { enabled: false }),
      action("Zoom In", "unsupported-zoom-in", { enabled: false }),
      action("Zoom Out", "unsupported-zoom-out", { enabled: false }),
      "separator",
      action("Toggle Full Screen", "unsupported-fullscreen", {
        enabled: false,
      }),
      "separator",
      action("Show Renderer Errors…", DENO_MENU_IDS.showRendererErrors),
      action("Deno Inspector…", DENO_MENU_IDS.openInspector),
    ]),
    submenu("Window", [
      role("minimize"),
      action("Zoom", "unsupported-window-zoom", { enabled: false }),
      ...(!isMac ? ["separator" as const, role("close")] : []),
    ]),
    submenu("Help", [
      ...(!isMac
        ? [
            action("About Lapis Notes", DENO_MENU_IDS.about),
            "separator" as const,
          ]
        : []),
      action("Learn More", DENO_MENU_IDS.learnMore),
    ]),
  ];
}
