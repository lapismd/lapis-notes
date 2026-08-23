/// <reference path="./desktop.d.ts" />
import { serveDir } from "jsr:@std/http@1/file-server";

import { createPlatformInfo, handleDesktopInvoke } from "./bindings.ts";
import { createCapabilityRegistry } from "./capabilities.ts";
import {
  createUpstreamHeaders,
  isWebSocketUpgrade,
  rewriteUpstreamUrl,
  withIsolationHeaders,
} from "./renderer-http.ts";
import { rendererDistRoot } from "./production-build.ts";
import {
  DESKTOP_WINDOW_TITLE,
  assertSupportedDenoDesktopVersion,
  createDesktopWindowOptions,
  needsCreatedChromeWindow,
  rendererOriginFromServeAddress,
  setOverlayWindowControls,
} from "./window-chrome.ts";
import { installWindowBindings } from "./window-bindings.ts";
import {
  createWindowDragController,
  isWindowDragCommand,
} from "./window-drag.ts";

assertSupportedDenoDesktopVersion(Deno.version.deno);

const windowOptions = createDesktopWindowOptions(Deno.build.os);
const bootstrap = new Deno.BrowserWindow({
  ...windowOptions,
  frameless: false,
  transparentTitlebar: false,
});
const win = needsCreatedChromeWindow(Deno.build.os)
  ? new Deno.BrowserWindow(windowOptions)
  : bootstrap;
if (win !== bootstrap) {
  bootstrap.setTitle("");
  bootstrap.setOpacity(0);
  const keepBootstrapWindowParked = () => {
    bootstrap.hide();
    if (!win.isClosed()) win.focus();
  };
  bootstrap.addEventListener("load", keepBootstrapWindowParked);
  bootstrap.addEventListener("focus", keepBootstrapWindowParked);
  keepBootstrapWindowParked();
  win.setTitle("");
  win.show();
} else {
  win.setTitle(DESKTOP_WINDOW_TITLE);
  win.show();
}
setOverlayWindowControls(win !== bootstrap && Deno.build.os === "darwin");
const drag = createWindowDragController(win);

const INSPECT_ADDRESS = "127.0.0.1:9229";

function registerDesktopBindings(): void {
  installWindowBindings(win, [
    [
      "invoke",
      (...args: unknown[]) => {
        const command = typeof args[0] === "string" ? args[0] : "";
        const payload =
          args[1] && typeof args[1] === "object"
            ? (args[1] as Record<string, unknown>)
            : {};
        if (!isWindowDragCommand(command)) {
          console.log(`[desktop] invoke ${command}`);
        }
        if (isWindowDragCommand(command)) {
          const screenX = Number(payload.screenX ?? 0);
          const screenY = Number(payload.screenY ?? 0);
          if (command === "desktop_window_drag_begin")
            drag.begin(screenX, screenY);
          else if (command === "desktop_window_drag_move") {
            drag.move(screenX, screenY);
          } else drag.end();
          return;
        }
        return handleDesktopInvoke(command, payload);
      },
    ],
    ["platform", () => createPlatformInfo()],
    ["capabilities", () => createCapabilityRegistry()],
  ]);
}

registerDesktopBindings();
win.addEventListener("close", () => Deno.exit(0));

win.setApplicationMenu([
  {
    submenu: {
      label: "File",
      items: [
        {
          item: {
            label: "Open Vault…",
            id: "open-vault",
            accelerator: "CmdOrCtrl+Shift+O",
            enabled: true,
          },
        },
        { role: { role: "quit" } },
      ],
    },
  },
  {
    submenu: {
      label: "View",
      items: [
        {
          item: {
            label: "Reload",
            id: "reload",
            accelerator: "CmdOrCtrl+R",
            enabled: true,
          },
        },
        "separator",
        {
          item: {
            label: "Toggle Developer Tools",
            id: "toggle-devtools",
            accelerator: "Alt+CmdOrCtrl+I",
            enabled: true,
          },
        },
        {
          item: {
            label: "Show Renderer Errors…",
            id: "show-renderer-errors",
            enabled: true,
          },
        },
        {
          item: {
            label: "Deno Inspector…",
            id: "open-inspector",
            enabled: true,
          },
        },
      ],
    },
  },
]);

async function openDeveloperTools(): Promise<void> {
  try {
    win.openDevtools();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    alert(
      `In-app DevTools are not available on the OS webview (${detail}).\n\n` +
        `Attach Chrome or Edge instead:\n` +
        `1. Open chrome://inspect or edge://inspect\n` +
        `2. Configure ${INSPECT_ADDRESS}\n` +
        `3. Inspect the LapisNotes target.\n\n` +
        `Or restart with LAPIS_DENO_BACKEND=cef so Toggle Developer Tools can open a window.`,
    );
  }
}

async function showRendererErrors(): Promise<void> {
  const dumped = await win.executeJs(
    "JSON.stringify(globalThis.__LAPIS_RENDERER_ERRORS__ ?? [])",
  );
  const errors = typeof dumped === "string" ? dumped : JSON.stringify(dumped);
  alert(
    errors === "[]" || errors === "" ? "No captured renderer errors." : errors,
  );
}

win.addEventListener("menuclick", (event: Event) => {
  const id = (event as CustomEvent<{ id?: string }>).detail?.id;
  if (id === "open-vault") {
    void win.executeJs(
      "window.dispatchEvent(new CustomEvent('lapis-deno-open-vault'))",
    );
    return;
  }
  if (id === "reload") {
    win.reload();
    return;
  }
  if (id === "toggle-devtools") {
    void openDeveloperTools();
    return;
  }
  if (id === "show-renderer-errors") {
    void showRendererErrors();
    return;
  }
  if (id === "open-inspector") {
    alert(
      `This spike starts with --inspect=${INSPECT_ADDRESS}.\n\n` +
        `Open chrome://inspect or edge://inspect and inspect the LapisNotes target.`,
    );
  }
});

const distRoot = rendererDistRoot(Deno.cwd());
const devUrl = Deno.env
  .get("LAPIS_DESKTOP_DEV_SERVER_URL")
  ?.replace(/\/$/u, "");

function proxyViteWebSocket(
  request: Request,
  upstreamOrigin: string,
): Response {
  const target = rewriteUpstreamUrl(request.url, upstreamOrigin);
  target.protocol = target.protocol === "https:" ? "wss:" : "ws:";
  const { socket, response } = Deno.upgradeWebSocket(request);
  const upstream = new WebSocket(target);
  const queued: Array<string | ArrayBufferLike | Blob | ArrayBufferView> = [];
  socket.onmessage = (event) => {
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(event.data);
      return;
    }
    queued.push(event.data);
  };
  upstream.onopen = () => {
    for (const payload of queued) upstream.send(payload);
    queued.length = 0;
  };
  upstream.onmessage = (event) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(event.data);
  };
  socket.onclose = () => {
    if (upstream.readyState === WebSocket.OPEN) upstream.close();
  };
  upstream.onclose = () => {
    if (socket.readyState === WebSocket.OPEN) socket.close();
  };
  return response;
}

async function proxyVite(
  request: Request,
  upstreamOrigin: string,
): Promise<Response> {
  if (isWebSocketUpgrade(request)) {
    return proxyViteWebSocket(request, upstreamOrigin);
  }
  const upstream = rewriteUpstreamUrl(request.url, upstreamOrigin);
  const init: RequestInit = {
    method: request.method,
    headers: createUpstreamHeaders(request, upstream),
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }
  return withIsolationHeaders(await fetch(new Request(upstream, init)));
}

Deno.serve(async (request) => {
  if (devUrl) return await proxyVite(request, devUrl);
  const response = await serveDir(request, {
    fsRoot: distRoot,
    urlRoot: "",
    quiet: true,
  });
  return withIsolationHeaders(response);
});
if (win !== bootstrap) {
  bootstrap.hide();
  win.navigate(
    rendererOriginFromServeAddress(Deno.env.get("DENO_SERVE_ADDRESS")),
  );
  win.show();
}
