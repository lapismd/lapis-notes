import { describe, expect, it, vi } from "vitest";
import { rendererHostModulePlugin } from "./renderer";

const version = "5.56.10";
function resolver(
  mode: "host" | "plugin",
  resolved: unknown = { id: "/host/svelte.js" },
) {
  const plugin = rendererHostModulePlugin({ mode, svelteVersion: version });
  const handler = plugin.resolveId;
  const resolve = vi.fn(async () => resolved);
  const call = (id: string) =>
    handler.call({ resolve } as never, id, "/plugin/main.mjs");
  return { call, resolve };
}

describe("public renderer build adapter", () => {
  it.each([
    "svelte",
    "svelte/store",
    "svelte/reactivity",
    "svelte/transition",
    "svelte/internal/client",
    "svelte/internal/flags/async",
  ])("externalizes %s to the admitted compiler namespace", async (source) => {
    const { call } = resolver("plugin");
    await expect(call(source)).resolves.toEqual({
      id: `svelte/renderer/${version}${source.slice("svelte".length)}`,
      external: true,
    });
  });
  it("keeps admitted renderer IDs out of Vite package prebundling", () => {
    const plugin = rendererHostModulePlugin({
      mode: "host",
      svelteVersion: version,
    });
    const hook = plugin.config;
    expect(hook).toBeTypeOf("function");
    const config = (hook as () => { optimizeDeps: { exclude: string[] } })();
    expect(config.optimizeDeps.exclude).toContain(
      `svelte/renderer/${version}/internal/client`,
    );
    expect(config.optimizeDeps.exclude).not.toContain("svelte/internal/client");
  });
  it("binds versioned imports to the host's existing runtime", async () => {
    const { call, resolve } = resolver("host");
    await expect(
      call(`svelte/renderer/${version}/internal/client`),
    ).resolves.toEqual({ id: "/host/svelte.js" });
    expect(resolve).toHaveBeenCalledExactlyOnceWith(
      "svelte/internal/client",
      "/plugin/main.mjs",
      { skipSelf: true },
    );
    await expect(call("svelte")).resolves.toBeNull();
  });
  it.each(["host", "plugin"] as const)(
    "rejects unknown and foreign renderer entries in %s mode",
    async (mode) => {
      const { call } = resolver(mode);
      await expect(
        call("svelte/renderer/9.0.0/internal/client"),
      ).rejects.toThrow(/Unadmitted/);
      await expect(call(`svelte/renderer/${version}/private`)).rejects.toThrow(
        /Unadmitted/,
      );
      await expect(
        call("@lapismd/design-core/shadcn/canvas-table"),
      ).resolves.toBeNull();
    },
  );
  it("rejects unlisted compiler internals", async () => {
    await expect(
      resolver("plugin").call("svelte/internal/unlisted"),
    ).rejects.toThrow(/Unadmitted/);
  });
  it("fails when the host cannot resolve its admitted provider", async () => {
    await expect(
      resolver("host", null).call(`svelte/renderer/${version}`),
    ).rejects.toThrow(/Missing host/);
  });
  it.each(["^5.56.10", "5.57.3"])(
    "rejects an unsupported compiler/runtime %s",
    (svelteVersion) => {
      expect(() =>
        rendererHostModulePlugin({ mode: "plugin", svelteVersion }),
      ).toThrow(/exact|does not admit/);
    },
  );
});
