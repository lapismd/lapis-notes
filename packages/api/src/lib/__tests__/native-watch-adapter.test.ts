import { afterEach, expect, it, vi } from "vitest";
import {
  NativeDesktopVaultAdapter,
  setNativeDesktopBridge,
} from "../storage/desktop-native";

afterEach(() => setNativeDesktopBridge(null));

it("preserves pending and failed native readiness across array subscriptions", async () => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  setNativeDesktopBridge({
    runtime: "tauri-desktop",
    toFileUrl: (path) => path,
    invoke: async () => {
      throw new Error("unexpected IO");
    },
    watch: () => ({ ready, close() {} }),
  });
  const adapter = new NativeDesktopVaultAdapter("/owned", {}, "tauri-desktop");
  const subscription = adapter.watch(["Notes", "Other"], {}, () => {});
  let done = false;
  const starting = Promise.resolve(subscription?.ready).then(() => {
    done = true;
  });
  await Promise.resolve();
  expect(done).toBe(false);
  release();
  await starting;
  expect(done).toBe(true);
  await subscription?.close();
});

it("awaits every array subscription even when one native stop throws", async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const stop = vi
    .fn()
    .mockImplementationOnce(() => {
      throw new Error("stop failed");
    })
    .mockImplementationOnce(() => pending);
  const watch = vi.fn(() => ({ close: stop }));
  setNativeDesktopBridge({
    runtime: "tauri-desktop",
    toFileUrl: (path) => path,
    invoke: async () => {
      throw new Error("unexpected IO");
    },
    watch,
  });
  const adapter = new NativeDesktopVaultAdapter("/owned", {}, "tauri-desktop");
  const subscription = adapter.watch(
    ["Notes", "Other"],
    { recursive: true },
    () => {},
  );
  let done = false;
  const closing = Promise.resolve(subscription?.close()).finally(() => {
    done = true;
  });
  const asserted = expect(closing).rejects.toThrow("stop failed");
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toBe(false);
  expect(stop).toHaveBeenCalledTimes(2);
  expect(watch.mock.calls.map((args) => args.slice(0, 3))).toEqual([
    ["/owned", "Notes", { recursive: true }],
    ["/owned", "Other", { recursive: true }],
  ]);
  release();
  await asserted;
});
