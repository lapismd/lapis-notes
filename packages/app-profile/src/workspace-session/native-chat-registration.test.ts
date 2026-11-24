import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { registerSessionNativeChat } from "./native-chat-registration";

vi.mock("../native-chat/index", () => ({
  createNativeChatPlugin: vi.fn(() => class NativeChatPlugin {}),
}));

it("bundles user-disableable AI by default for the Rust server without selecting an agent", () => {
  const registerStaticPlugins = vi.fn();
  const factory = vi.fn();
  registerSessionNativeChat(
    { plugins: { registerStaticPlugins } } as unknown as App,
    factory,
    "rust-server",
  );
  const registration = registerStaticPlugins.mock.calls[0][0][0];
  expect(registration).toMatchObject({
    required: false,
    enabledByDefault: true,
  });
  expect(factory).not.toHaveBeenCalled();
});

it.each(["tauri-mobile", "web-pwa"] as const)(
  "retains the opt-in native AI default on %s",
  (runtime) => {
    const registerStaticPlugins = vi.fn();
    registerSessionNativeChat(
      { plugins: { registerStaticPlugins } } as unknown as App,
      vi.fn(),
      runtime,
    );
    expect(registerStaticPlugins.mock.calls[0][0][0].enabledByDefault).toBe(
      false,
    );
  },
);
