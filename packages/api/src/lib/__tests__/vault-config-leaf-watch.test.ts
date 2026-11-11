import { expect, it, vi } from "vitest";
import { Configuration } from "../configuration.svelte";
import { VaultChangeService } from "../vault-changes";
import { Vault } from "../storage/vault.svelte";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import { EventDispatcher } from "../events";
import type { ChangeEvent, WatchErrorEvent } from "../storage/fs";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

vi.mock("../settings.svelte", () => ({ SettingTab: class {} }));
class Adapter extends InMemoryDataAdapter {
  callbacks = new Map<string, (e: ChangeEvent | WatchErrorEvent) => void>();
  getCapabilities() {
    return { nativeWatch: true, conditionalTextWrite: true };
  }
  async writeTextIfUnchanged(
    path: string,
    text: string,
    expected: string | null,
  ) {
    if ((await this.read(path).catch(() => null)) !== expected)
      throw Object.assign(new Error("changed"), { code: "ECONFLICT" });
    await this.write(path, text);
  }
  watch(
    path: string | string[],
    _options: unknown,
    accept: (e: ChangeEvent | WatchErrorEvent) => void,
  ) {
    const key = String(path);
    this.callbacks.set(key, accept);
    return {
      close: async () => {
        this.callbacks.delete(key);
      },
    };
  }
}
it("isolates app config as a leaf subscription and reloads it without scanning app state", async () => {
  const adapter = new Adapter();
  await adapter.mkdir(".lapis");
  await adapter.write(".lapis/app.json", JSON.stringify({ keep: "before" }));
  await adapter.write("Note.md", "user content");
  const operations = new FileEditingSessionRegistry();
  const vault = new Vault(adapter, operations);
  await vault.load();
  const workspace = Object.assign(new EventDispatcher(), {
    iterateAllLeaves: vi.fn(),
    requestSaveLayout: vi.fn(),
    reconcileFileReference: vi.fn(),
  });
  const app = {
    vault,
    workspace,
    fileEditingSessions: operations,
    notifications: { notify: vi.fn() },
  } as any;
  app.configuration = new Configuration(app, ".lapis/app.json");
  await app.configuration.load();
  app.configuration.schema.register({
    id: "late",
    title: "Late settings",
    type: "object",
    properties: { setting: { type: "boolean", default: true } },
  });
  const changes = new VaultChangeService(app);
  try {
    await changes.start();
    expect([...adapter.callbacks.keys()].sort()).toEqual([
      ".lapis/app.json",
      "/",
    ]);
    const reconcile = vi.spyOn(vault, "reconcile");
    await adapter.write(
      ".lapis/app.json",
      JSON.stringify({ keep: "external" }),
    );
    adapter.callbacks.get(".lapis/app.json")!({
      type: "modify",
      path: ".lapis/app.json",
    });
    adapter.callbacks.get("/")!({
      type: "modify",
      path: ".lapis/plugin-registry-cache/index.json",
    });
    await changes.settle();
    expect(app.configuration.getConfiguration().get("keep")).toBe("external");
    expect(JSON.parse(await adapter.read(".lapis/app.json"))).toEqual({
      keep: "external",
    });
    expect(reconcile).not.toHaveBeenCalled();
    expect(await adapter.read("Note.md")).toBe("user content");
    expect(app.notifications.notify).not.toHaveBeenCalled();
  } finally {
    await changes.stop();
  }
  expect(adapter.callbacks.size).toBe(0);
});
