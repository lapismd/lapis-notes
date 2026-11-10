import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { createNativeChatPlugin, prepareNativeChatLeave } from "./plugin";
import type { NativeChatHost, NativeChatSession } from "./session";

vi.mock("@lapis-notes/api", () => ({
  Plugin: class {
    constructor(readonly app: App) {}
    registerSidebarView() {}
    addRibbonIcon() {}
  },
}));
vi.mock("./view", () => ({ NativeChatView: class {} }));
vi.mock("./navigation", () => ({ NativeChatNavigation: class {} }));

it("creates a fresh AI feature session after disable and re-enable", async () => {
  const host: NativeChatHost = {
    allowed: () => true,
    activate: vi.fn(async () => {}),
    leave: vi.fn(async () => {}),
    readText: vi.fn(async () => ""),
    call: vi.fn(async (command) =>
      command.kind === "set_enabled"
        ? { kind: "availability", enabled: command.enabled }
        : { kind: "records", records: [] },
    ),
  };
  const Constructor = createNativeChatPlugin(() => host);
  const app = {} as App;
  const plugin = new Constructor(app) as unknown as {
    session: NativeChatSession;
    onload(): Promise<void>;
    onunload(): Promise<void>;
  };
  await plugin.onload();
  await plugin.session.call({ kind: "list" });
  const previous = plugin.session;
  prepareNativeChatLeave(app, "detach");
  await plugin.onunload();
  await plugin.onload();
  await expect(plugin.session.call({ kind: "list" })).resolves.toEqual({
    kind: "records",
    records: [],
  });
  await expect(previous.call({ kind: "list" })).rejects.toThrow("closed");
  expect(host.activate).toHaveBeenCalledTimes(2);
  await plugin.onunload();
  expect(vi.mocked(host.leave).mock.calls.map(([mode]) => mode)).toEqual([
    "detach",
    "disable",
  ]);
});
