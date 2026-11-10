import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { registerSessionNativeChat } from "./native-chat-registration";

vi.mock("@lapis-notes/app-profile/native-chat", () => ({
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

it("retains the opt-in native AI default for other shared session hosts", () => {
  const registerStaticPlugins = vi.fn();
  registerSessionNativeChat(
    { plugins: { registerStaticPlugins } } as unknown as App,
    vi.fn(),
    "web-pwa",
  );
  expect(registerStaticPlugins.mock.calls[0][0][0].enabledByDefault).toBe(
    false,
  );
});
