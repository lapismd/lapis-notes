import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import {
  _electron as electron,
  type ConsoleMessage,
  type ElectronApplication,
  type Page,
} from "playwright";
import {
  DESKTOP_SMOKE_DEV_SERVER_URL,
  usesDesktopDevRenderer,
} from "./smoke-mode";

const packageDir = path.resolve(import.meta.dirname, "..");
const builtMainPath = path.join(packageDir, "dist-electron/main.js");

export type DesktopTestState = {
  root: string;
  userDataDir: string;
  vaultA: string;
  vaultB: string;
  cleanup(): Promise<void>;
};

export async function createDesktopTestState(): Promise<DesktopTestState> {
  const root = await mkdtemp(path.join(os.tmpdir(), "lapis-electron-e2e-"));
  const userDataDir = path.join(root, "user-data");
  const vaultA = path.join(root, "vault-a");
  const vaultB = path.join(root, "vault-b");
  await Promise.all([mkdir(userDataDir), mkdir(vaultA), mkdir(vaultB)]);
  return {
    root,
    userDataDir,
    vaultA,
    vaultB,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

function launchEnvironment(overrides: Record<string, string>): Record<string, string> {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
  Object.assign(env, overrides);
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

export async function launchDesktopApp(options: {
  userDataDir: string;
  vaultPath?: string;
  pickerCancel?: boolean;
  captureLoadingGeometry?: boolean;
}): Promise<{
  electronApp: ElectronApplication;
  page: Page;
  mainProcessMessages: string[];
  rendererErrors: string[];
  close(): Promise<void>;
}> {
  if (!fs.existsSync(options.userDataDir)) {
    await mkdir(options.userDataDir, { recursive: true });
  }
  const overrides: Record<string, string> = {
    LAPIS_DESKTOP_DISABLE_DEVTOOLS: "1",
    LAPIS_DESKTOP_TRACE_CLOSE: "1",
    LAPIS_DESKTOP_USER_DATA_DIR: options.userDataDir,
  };
  if (options.vaultPath) {
    overrides.LAPIS_DESKTOP_TEST_VAULT_PATH = options.vaultPath;
  }
  if (options.pickerCancel) {
    overrides.LAPIS_DESKTOP_TEST_PICKER_CANCEL = "1";
  }
  if (options.captureLoadingGeometry) {
    overrides.LAPIS_DESKTOP_TEST_LOADING_DELAY_MS = "150";
  }
  if (usesDesktopDevRenderer()) {
    overrides.NODE_ENV = "development";
    overrides.LAPIS_DESKTOP_DEV_SERVER_URL =
      process.env.LAPIS_DESKTOP_DEV_SERVER_URL?.trim() ||
      DESKTOP_SMOKE_DEV_SERVER_URL;
  }

  const rendererErrors: string[] = [];
  const mainProcessMessages: string[] = [];
  const electronApp = await electron.launch({
    args: [builtMainPath],
    cwd: packageDir,
    env: launchEnvironment(overrides),
  });
  electronApp.process().stderr?.on("data", (chunk: Buffer | string) => {
    mainProcessMessages.push(String(chunk));
  });
  electronApp.on("window", (window) => {
    trackRendererDiagnostics(window, rendererErrors);
  });
  const page = await electronApp.firstWindow();
  await page.waitForLoadState("domcontentloaded", {
    timeout: usesDesktopDevRenderer() ? 120_000 : 30_000,
  });
  if (options.captureLoadingGeometry) {
    await page.evaluate(() => {
      const testWindow = globalThis as typeof globalThis & {
        __LAPIS_TEST_LOADING_GEOMETRY__?: {
          centerDeltaX: number;
          centerDeltaY: number;
        };
      };
      const capture = () => {
        const content = document.querySelector<HTMLElement>(
          '[data-ui-component="workspace-startup"]',
        );
        if (!content) return;
        const rect = content.getBoundingClientRect();
        testWindow.__LAPIS_TEST_LOADING_GEOMETRY__ = {
          centerDeltaX: Math.abs(rect.left + rect.width / 2 - innerWidth / 2),
          centerDeltaY: Math.abs(rect.top + rect.height / 2 - innerHeight / 2),
        };
        observer.disconnect();
      };
      const observer = new MutationObserver(capture);
      observer.observe(document.body, { childList: true, subtree: true });
      capture();
    });
  }
  if (options.vaultPath) {
    const openVault = page.getByRole("button", { name: /^Open Vault/u });
    await openVault.waitFor({ state: "visible", timeout: 60_000 });
    await openVault.click();
  }
  return {
    electronApp,
    page,
    mainProcessMessages,
    rendererErrors,
    close: () => electronApp.close(),
  };
}

export async function launchSecondDesktopInstance(options: {
  electronApp: ElectronApplication;
  userDataDir: string;
  appUrl: string;
}): Promise<{ exitCode: number | null; stderr: string }> {
  const child = spawn(
    options.electronApp.process().spawnfile,
    [builtMainPath, options.appUrl],
    {
      cwd: packageDir,
      env: launchEnvironment({
        LAPIS_DESKTOP_DISABLE_DEVTOOLS: "1",
        LAPIS_DESKTOP_USER_DATA_DIR: options.userDataDir,
      }),
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer | string) => {
    stderr += String(chunk);
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Second desktop instance did not exit: ${stderr}`));
    }, 15_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (exitCode) => {
      clearTimeout(timeout);
      resolve({ exitCode, stderr });
    });
  });
}

export async function waitForDesktopWorkspace(
  page: Page,
  rendererErrors: string[] = [],
): Promise<void> {
  try {
    await page.locator('[data-native-runtime="electron-desktop"]').waitFor({
      state: "visible",
      timeout: 60_000,
    });
    await page.locator('[data-ui-component="lapis-workspace-shell"]').waitFor({
      state: "visible",
      timeout: 60_000,
    });
  } catch (error) {
    const diagnostics = await page.evaluate((capturedErrors) => ({
      hostState: document.querySelector("main")?.getAttribute(
        "data-desktop-host-state",
      ),
      text: document.body.innerText,
      hasApp: Boolean(
        (globalThis as typeof globalThis & { app?: unknown }).app,
      ),
      rendererErrors: capturedErrors,
      html: document.querySelector("main")?.innerHTML.slice(0, 2_000),
    }), rendererErrors);
    throw new Error(
      `Desktop workspace did not become ready: ${JSON.stringify(diagnostics)}`,
      { cause: error },
    );
  }
}

export function trackRendererDiagnostics(page: Page, sink: string[]): void {
  page.on("pageerror", (error) => sink.push(error.stack ?? error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !/Failed to load source map/iu.test(message.text())
    ) {
      sink.push(formatConsoleDiagnostic(message));
    }
  });
}

function formatConsoleDiagnostic(message: ConsoleMessage): string {
  const location = message.location();
  return location.url
    ? `${message.text()} @ ${location.url}:${location.lineNumber}:${location.columnNumber}`
    : message.text();
}

export async function resetMainProcessUnhandledErrors(
  electronApp: ElectronApplication,
): Promise<void> {
  await electronApp.evaluate(() => {
    const root = globalThis as typeof globalThis & {
      __lapisTestMainProcessErrors?: string[];
      __lapisTestMainProcessTracking?: boolean;
    };
    root.__lapisTestMainProcessErrors = [];
    if (root.__lapisTestMainProcessTracking) return;
    root.__lapisTestMainProcessTracking = true;
    const capture = (error: unknown) => {
      root.__lapisTestMainProcessErrors?.push(
        error instanceof Error ? error.stack ?? error.message : String(error),
      );
    };
    process.on("uncaughtException", capture);
    process.on("unhandledRejection", capture);
  });
}

export async function getMainProcessUnhandledErrors(
  electronApp: ElectronApplication,
): Promise<string[]> {
  return electronApp.evaluate(() => {
    const root = globalThis as typeof globalThis & {
      __lapisTestMainProcessErrors?: string[];
    };
    return [...(root.__lapisTestMainProcessErrors ?? [])];
  });
}

export async function switchTestVault(
  electronApp: ElectronApplication,
  page: Page,
  vaultPath: string,
): Promise<void> {
  await electronApp.evaluate(
    ({ BrowserWindow, Menu }, selectedPath) => {
      process.env.LAPIS_DESKTOP_TEST_VAULT_PATH = selectedPath;
      const file = Menu.getApplicationMenu()?.items.find(
        (item) => item.label === "File",
      );
      const open = file?.submenu?.items.find(
        (item) => item.label === "Open Vault…",
      );
      const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      if (!open?.click || !win) throw new Error("Open Vault menu is unavailable");
      open.click(open, win);
    },
    vaultPath,
  );
  const launcher = page.locator("[data-desktop-vault-launcher]");
  await launcher.waitFor({ state: "visible", timeout: 60_000 });
  await page.getByRole("button", { name: /^Open Vault/u }).click();
}
