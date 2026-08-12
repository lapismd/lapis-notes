import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  createDesktopTestState,
  launchDesktopApp,
  waitForDesktopWorkspace,
} from "./helpers";

test("native adapter CRUD, watch, and resource URLs stay vault-contained", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    const result = await app.page.evaluate(async (rootPath) => {
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
            getResourceUrl?(root: string, path: string): Promise<string>;
            watch?(
              root: string,
              path: string,
              options: { recursive?: boolean },
              listener: (event: { type: string; path: string }) => void,
            ): { close(): void } | void;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__;
      await bridge.invoke("desktop_fs_mkdir", {
        rootPath,
        normalizedPath: "notes",
        recursive: true,
      });
      const eventPromise = new Promise<{ type: string; path: string }>((resolve) => {
        const timeout = setTimeout(
          () => resolve({ type: "timeout", path: "" }),
          5_000,
        );
        const subscription = bridge.watch?.(
          rootPath,
          "notes",
          { recursive: true },
          (event) => {
            if (event.path.endsWith("native.md")) {
              clearTimeout(timeout);
              subscription?.close();
              resolve(event);
            }
          },
        );
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
      await bridge.invoke("desktop_fs_write_text", {
        rootPath,
        normalizedPath: "notes/native.md",
        data: "native storage",
      });
      const content = await bridge.invoke<string>("desktop_fs_read_text", {
        rootPath,
        normalizedPath: "notes/native.md",
      });
      const url = await bridge.getResourceUrl!(rootPath, "notes/native.md");
      const resource = await fetch(url).then((response) => response.text());
      let traversalRejected = false;
      try {
        await bridge.invoke("desktop_fs_read_text", {
          rootPath,
          normalizedPath: "../outside.md",
        });
      } catch {
        traversalRejected = true;
      }
      return { content, resource, event: await eventPromise, traversalRejected };
    }, state.vaultA);
    expect(result.content).toBe("native storage");
    expect(result.resource).toBe("native storage");
    expect(result.event.type).not.toBe("timeout");
    expect(result.event.path).toContain("native.md");
    expect(result.traversalRejected).toBe(true);
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("native database and lexical search survive a full relaunch", async () => {
  const state = await createDesktopTestState();
  const first = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  let vaultId = "";
  try {
    await waitForDesktopWorkspace(first.page);
    vaultId = await first.page.locator("[data-vault-id]").getAttribute("data-vault-id") ?? "";
    const inserted = await first.page.evaluate(async (id) => {
      const desktop = globalThis as typeof globalThis & {
        app: {
          appDatabase: {
            upsertSearchDocument(document: Record<string, unknown>): Promise<void>;
          };
        };
        __LAPIS_NATIVE_DESKTOP__: {
          invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
        };
      };
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__;
      await desktop.app.appDatabase.upsertSearchDocument({
        path: "persistent.md",
        name: "persistent",
        extension: "md",
        checksum: "desktop-test",
        content: "persistent electron search token",
        tags: [],
        tagParts: [],
        tagHierarchy: [],
        metadataText: "",
      });
      return bridge.invoke<Array<{ path: string }>>(
        "desktop_db_search_documents",
        { vaultId: id, terms: ["electron"], limit: 10 },
      );
    }, vaultId);
    expect(inserted).toEqual([expect.objectContaining({ path: "persistent.md" })]);
  } finally {
    await first.close();
  }
  expect(first.mainProcessMessages.join(""))
    .toContain("[desktop-close] ready:");
  expect(first.mainProcessMessages.join(""))
    .not.toContain("[desktop-close] timeout:");

  const second = await launchDesktopApp({ userDataDir: state.userDataDir });
  try {
    await waitForDesktopWorkspace(second.page);
    const restored = await second.page.evaluate(async (id) => {
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__;
      return bridge.invoke<Array<{ path: string }>>(
        "desktop_db_search_documents",
        { vaultId: id, terms: ["electron"], limit: 10 },
      );
    }, vaultId);
    expect(restored).toEqual([expect.objectContaining({ path: "persistent.md" })]);
    expect(fs.existsSync(path.join(state.userDataDir, "vault-state"))).toBe(true);
  } finally {
    await second.close();
    await state.cleanup();
  }
});
