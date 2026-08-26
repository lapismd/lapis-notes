/// <reference path="./desktop.d.ts" />
import { serveDir } from "jsr:@std/http@1/file-server";

import { createPlatformInfo, handleDesktopInvoke } from "./bindings.ts";
import { DenoAgentRuntimeHost } from "./agent-runtime.ts";
import { DenoAppDatabaseHost } from "./app-database.ts";
import { createDesktopAboutWindowManager } from "./about-window.ts";
import { DESKTOP_APPLICATION_INFO } from "./application-info.ts";
import {
  createDenoApplicationMenu,
  DENO_MENU_IDS,
} from "./application-menu.ts";
import { createCapabilityRegistry } from "./capabilities.ts";
import {
  createDenoCloseCoordinator,
  installDenoWindowCloseRouting,
} from "./close-coordinator.ts";
import { createDesktopCloseSignal } from "./close-signal.ts";
import { createDesktopLogger } from "./desktop-logging.ts";
import {
  createMacosTrafficLightController,
  createNativeMacosTrafficLightDriver,
  type MacosTrafficLightController,
  type MacosTrafficLightDriver,
} from "./macos-traffic-lights.ts";
import {
  createNativeDesktopTelemetry,
  writeStructuredRendererLog,
} from "./native-telemetry.ts";
import { DenoFileWatchService } from "./file-watch.ts";
import { openExternalUrl } from "./native-actions.ts";
import {
  createUpstreamHeaders,
  isWebSocketUpgrade,
  rewriteUpstreamUrl,
  withIsolationHeaders,
} from "./renderer-http.ts";
import { createRendererEventEmitter } from "./renderer-events.ts";
import { rendererDistRoot } from "./production-build.ts";
import { DenoPluginAssetService } from "./plugin-assets.ts";
import { acquireDenoSingleInstance } from "./single-instance.ts";
import { resolveDenoPtyLibrary } from "./terminal-native-library.ts";
import { DenoTerminalRuntimeHost } from "./terminal-runtime.ts";
import { userDataDir } from "./user-data.ts";
import { DenoVaultResourceService } from "./vault-resources.ts";
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
import { unwrapDesktopInvokeEnvelope } from "../src/desktop-invoke-envelope.ts";
import { classifyDesktopTelemetryOperation } from "../src/telemetry-operations.ts";

assertSupportedDenoDesktopVersion(Deno.version.deno);
const desktopLog = createDesktopLogger({
  level: Deno.env.get("LAPIS_DENO_LOG_LEVEL"),
});
const nativeTelemetry = createNativeDesktopTelemetry();

const instance = await acquireDenoSingleInstance(userDataDir(), Deno.args);
if (!instance.primary) {
  Deno.exit(instance.delivered ? 0 : 1);
}
const singleInstance = instance.host;

const windowOptions = createDesktopWindowOptions(Deno.build.os);
const rendererOrigin = rendererOriginFromServeAddress(
  Deno.env.get("DENO_SERVE_ADDRESS"),
);
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
let trafficLightDriver: MacosTrafficLightDriver | undefined;
let trafficLights: MacosTrafficLightController | undefined;
let trafficLightFailureReported = false;
const alignTrafficLights = () => {
  try {
    if (!trafficLights) {
      trafficLightDriver = createNativeMacosTrafficLightDriver();
      if (!trafficLightDriver) return;
      trafficLights = createMacosTrafficLightController({
        platform: Deno.build.os,
        driver: trafficLightDriver,
      });
    }
    trafficLights.apply();
  } catch (error) {
    if (!trafficLightFailureReported) {
      trafficLightFailureReported = true;
      desktopLog.warn("[desktop] native traffic-light alignment failed", error);
    }
  }
};
let trafficLightLayoutTimer: number | undefined;
const scheduleTrafficLightAlignment = () => {
  queueMicrotask(alignTrafficLights);
  if (trafficLightLayoutTimer !== undefined) {
    clearTimeout(trafficLightLayoutTimer);
  }
  trafficLightLayoutTimer = setTimeout(alignTrafficLights, 50);
};
win.addEventListener("load", scheduleTrafficLightAlignment);
win.addEventListener("resize", scheduleTrafficLightAlignment);
scheduleTrafficLightAlignment();
const aboutWindow = createDesktopAboutWindowManager({
  createWindow: (options) => new Deno.BrowserWindow(options),
  rendererOrigin,
  applicationInfo: DESKTOP_APPLICATION_INFO,
});
const drag = createWindowDragController(win);
const emitRendererEvent = createRendererEventEmitter(win);
const fileWatch = new DenoFileWatchService(emitRendererEvent);
const pluginAssets = new DenoPluginAssetService();
const vaultResources = new DenoVaultResourceService();
const agentRuntime = new DenoAgentRuntimeHost(emitRendererEvent);
const appDatabase = new DenoAppDatabaseHost(userDataDir(), emitRendererEvent);
let terminalRuntime: DenoTerminalRuntimeHost | undefined;
try {
  terminalRuntime = new DenoTerminalRuntimeHost(emitRendererEvent, {
    libraryPath: await resolveDenoPtyLibrary(),
  });
} catch (error) {
  desktopLog.error("[desktop] terminal runtime unavailable", error);
}
let removeCloseRouting = () => {};
const closeSignal = createDesktopCloseSignal();
const closeCoordinator = createDenoCloseCoordinator({
  emitBeforeClose() {
    desktopLog.info("[desktop-close] request");
    closeSignal.requestClose();
  },
  async shutdown() {
    desktopLog.info("[desktop-close] shutdown");
    removeCloseRouting();
    win.removeEventListener("load", scheduleTrafficLightAlignment);
    win.removeEventListener("resize", scheduleTrafficLightAlignment);
    if (trafficLightLayoutTimer !== undefined) {
      clearTimeout(trafficLightLayoutTimer);
    }
    trafficLights?.close();
    closeSignal.close();
    fileWatch.shutdown();
    pluginAssets.clear();
    vaultResources.clear();
    await terminalRuntime?.shutdown();
    await appDatabase.closeAll();
    await agentRuntime.shutdown();
    await singleInstance.close();
  },
  exit(code) {
    desktopLog.info(`[desktop-close] exit:${code}`);
    Deno.exit(code);
  },
});
removeCloseRouting = installDenoWindowCloseRouting(closeCoordinator, [
  bootstrap,
  win,
]);

const INSPECT_ADDRESS = "127.0.0.1:9229";
let laterLaunchFocusCount = 0;

function registerDesktopBindings(): void {
  installWindowBindings(win, [
    [
      "invoke",
      (...args: unknown[]) => {
        const command = typeof args[0] === "string" ? args[0] : "";
        const rawPayload =
          args[1] && typeof args[1] === "object"
            ? (args[1] as Record<string, unknown>)
            : {};
        const { payload, trace } = unwrapDesktopInvokeEnvelope(rawPayload);
        if (!isWindowDragCommand(command)) {
          desktopLog.debug(`[desktop] invoke ${command}`);
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
        return nativeTelemetry.run(
          classifyDesktopTelemetryOperation(command, payload),
          trace,
          () =>
            handleDesktopInvoke(command, payload, {
              fileWatch,
              pluginAssets,
              vaultResources,
              agentRuntime,
              appDatabase,
              terminalRuntime,
              rendererCloseReady: () => {
                desktopLog.info("[desktop-close] renderer-ready");
                closeCoordinator.rendererReady();
              },
              requestClose: () => closeCoordinator.requestClose(),
              takePendingAppUrls: () => singleInstance.queue.takePending(),
              acceptanceDetails: () => ({ laterLaunchFocusCount }),
              telemetryLog: (logPayload) =>
                writeStructuredRendererLog(logPayload, desktopLog),
            }),
        );
      },
    ],
    ["platform", () => createPlatformInfo()],
    [
      "capabilities",
      () =>
        createCapabilityRegistry(Deno.build.os, {
          terminalAvailable: Boolean(terminalRuntime),
        }),
    ],
  ]);
}

registerDesktopBindings();
singleInstance.queue.onLaterLaunch(() => {
  if (!win.isClosed()) {
    win.show();
    win.focus();
    laterLaunchFocusCount += 1;
  }
  void emitRendererEvent({
    channel: "desktop_app_url_available",
    payload: null,
  });
});
win.setApplicationMenu(createDenoApplicationMenu(Deno.build.os));

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
  if (id === DENO_MENU_IDS.openVault) {
    void emitRendererEvent({
      channel: "desktop_menu_open_vault_picker",
      payload: null,
    });
    return;
  }
  if (id === DENO_MENU_IDS.about) {
    aboutWindow.open();
    return;
  }
  if (id === DENO_MENU_IDS.reload) {
    win.reload();
    return;
  }
  if (id === DENO_MENU_IDS.toggleDevtools) {
    void openDeveloperTools();
    return;
  }
  if (id === DENO_MENU_IDS.showRendererErrors) {
    void showRendererErrors();
    return;
  }
  if (id === DENO_MENU_IDS.openInspector) {
    alert(
      `Native inspection is off by default because Deno 2.9.5 logs desktop binding payloads while it is enabled.\n\n` +
        `For a nonsensitive test vault, restart with LAPIS_DENO_INSPECT=1 and attach to ${INSPECT_ADDRESS} from chrome://inspect or edge://inspect.`,
    );
    return;
  }
  if (id === DENO_MENU_IDS.learnMore) {
    void openExternalUrl("https://github.com/lapis-notes/lapis").catch(
      (error) => desktopLog.error("[desktop] Learn More failed", error),
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
  const closeResponse = closeSignal.respond(request);
  if (closeResponse) return await closeResponse;
  const agentToolResponse = await agentRuntime.respond(request);
  if (agentToolResponse) return agentToolResponse;
  const vaultResourceResponse = await vaultResources.respond(request);
  if (vaultResourceResponse) {
    return withIsolationHeaders(vaultResourceResponse);
  }
  if (devUrl) return await proxyVite(request, devUrl);
  const pluginAssetResponse = await pluginAssets.respond(request.url);
  if (pluginAssetResponse) return withIsolationHeaders(pluginAssetResponse);
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
    rendererOrigin,
  );
  win.show();
}
