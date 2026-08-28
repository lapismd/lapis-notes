import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { installWindowBindings } from "./window-bindings";

describe("Deno desktop window bindings", () => {
  it("registers bindings initially and again after navigation", () => {
    const bind = vi.fn();
    let onLoad: (() => void) | undefined;
    const removeEventListener = vi.fn();
    const installed = installWindowBindings(
      {
        bind,
        addEventListener(_type, listener) {
          onLoad = listener;
        },
        removeEventListener,
      },
      [
        ["invoke", () => undefined],
        ["platform", () => ({ runtime: "deno-desktop" })],
      ],
    );

    expect(bind.mock.calls.map(([name]) => name)).toEqual([
      "invoke",
      "platform",
    ]);

    installed.refresh();
    expect(bind.mock.calls.map(([name]) => name)).toEqual([
      "invoke",
      "platform",
      "invoke",
      "platform",
    ]);

    onLoad?.();
    expect(bind.mock.calls.map(([name]) => name)).toEqual([
      "invoke",
      "platform",
      "invoke",
      "platform",
      "invoke",
      "platform",
    ]);

    installed.dispose();
    expect(removeEventListener).toHaveBeenCalledWith("load", onLoad);
  });

  it("does not patch the global Map implementation", () => {
    const originalGet = Map.prototype.get;
    installWindowBindings(
      {
        bind() {},
        addEventListener() {},
        removeEventListener() {},
      },
      [["invoke", () => undefined]],
    );

    expect(Map.prototype.get).toBe(originalGet);
  });

  it("keeps metadata invoke dispatch synchronous for packaged bindings", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src-deno/bindings.ts"),
      "utf8",
    );
    expect(source).toContain("export function handleDesktopInvoke(");
    expect(source).not.toContain("export async function handleDesktopInvoke(");
  });
});
