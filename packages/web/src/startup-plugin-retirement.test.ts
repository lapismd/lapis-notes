import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { retirePluginsForRetry } from "./startup-plugin-retirement";

const modes = vi.hoisted(() => new WeakMap<object, string>());
vi.mock("@lapis-notes/app-profile/native-chat", () => ({
  prepareNativeChatLeave: (app: object, mode: string) => modes.set(app, mode),
}));

it("detaches native AI before retry cleanup instead of disabling its accepted work", async () => {
  const leave = vi.fn();
  const app = { plugins: { plugins: new Map() } } as unknown as App;
  app.plugins.plugins.set("ai", {
    disable: async () => leave(modes.get(app) ?? "disable"),
  } as never);
  await retirePluginsForRetry(app);
  expect(leave).toHaveBeenCalledExactlyOnceWith("detach");
});
