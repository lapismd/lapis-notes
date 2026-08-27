import { lstat, mkdir, mkdtemp, readFile, readlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createDenoDesktopDevHostBuildArgs,
  createDenoDesktopDevArgs,
  desktopDenoDynamicIncludes,
  createMacosDesktopDevHostSignArgs,
  createMacosDesktopDevHostVerifyArgs,
  ensureDesktopDevSiblingLinks,
  isMacosDesktopDevHostIdentityCurrent,
  isMacosDesktopDevHostCurrent,
  resolveMacosDesktopDevHost,
  resolveDesktopDevIcon,
  resolveDenoDesktopInspector,
} from "./dev-command.mjs";
import {
  createDesktopRendererTelemetryDefines,
  createDesktopTelemetryEnvironment,
  isDesktopTelemetryRequested,
} from "./telemetry-env.mjs";

async function createDesktopDevWorkspace() {
  const workspaceRoot = await mkdtemp(
    path.join(os.tmpdir(), "lapis-desktop-deno-dev-"),
  );
  const packageRoot = path.join(
    workspaceRoot,
    "lapis-notes",
    "packages",
    "desktop-deno",
  );

  await mkdir(packageRoot, { recursive: true });
  await mkdir(path.join(workspaceRoot, "ai-host"));
  await mkdir(path.join(workspaceRoot, "terminal-host"));

  return { packageRoot };
}

describe("Deno desktop development command", () => {
  it("allows declared npm imports while preserving development exclusions", () => {
    const args = createDenoDesktopDevArgs();

    expect(args).toContain("desktop");
    expect(args).toContain("--quiet");
    expect(args).toContain("--hmr");
    expect(args).not.toContain("--inspect=127.0.0.1:9229");
    expect(args).toContain("--sloppy-imports");
    expect(args).not.toContain("--no-npm");
    expect(args).toEqual(
      expect.arrayContaining([
        "--include",
        "src-deno/app-database-worker.ts",
        "--include",
        "build/icon-light.png",
        "build/icon-dark.png",
        "--exclude",
        "node_modules",
        "dist",
        "src",
        "-A",
        "src-deno/main.ts",
      ]),
    );
    expect(desktopDenoDynamicIncludes).toEqual([
      "src-deno/app-database-worker.ts",
    ]);
  });

  it("keeps native inspection explicit and rejects it during telemetry", () => {
    expect(resolveDenoDesktopInspector(undefined)).toBe(false);
    expect(resolveDenoDesktopInspector("1")).toBe(true);
    expect(createDenoDesktopDevArgs(undefined, { inspect: true })).toContain(
      "--inspect=127.0.0.1:9229",
    );
    expect(() => resolveDenoDesktopInspector("1", true)).toThrow(
      "cannot be combined with desktop telemetry",
    );
  });

  it("passes only supported backend selections", () => {
    expect(createDenoDesktopDevArgs("webview")).toEqual(
      expect.arrayContaining(["--backend", "webview"]),
    );
    expect(createDenoDesktopDevArgs("cef")).toEqual(
      expect.arrayContaining(["--backend", "cef"]),
    );
    expect(createDenoDesktopDevArgs("unknown")).not.toContain("--backend");
  });

  it("passes the tracked platform application icon", () => {
    const macIcon = resolveDesktopDevIcon("/workspace/desktop-deno", "darwin");
    const linuxIcon = resolveDesktopDevIcon("/workspace/desktop-deno", "linux");

    expect(macIcon).toBe("/workspace/desktop-deno/build/icon.icns");
    expect(linuxIcon).toBe("/workspace/desktop-deno/build/icon.png");
    expect(createDenoDesktopDevArgs(undefined, { icon: macIcon })).toEqual(
      expect.arrayContaining(["--icon", macIcon]),
    );
  });

  it("prepares an app-named package-local macOS host bundle", () => {
    const webview = resolveMacosDesktopDevHost(
      "/workspace/desktop-deno",
      "webview",
    );
    const cef = resolveMacosDesktopDevHost("/workspace/desktop-deno", "cef");

    expect(webview.bundle).toBe(
      "/workspace/desktop-deno/release/dev-laufey/webview/build/laufey_webview.app",
    );
    expect(
      webview.executable.endsWith(
        "/laufey_webview.app/Contents/MacOS/laufey_webview",
      ),
    ).toBe(true);
    expect(webview.runtimeLibrary).toBe(
      "/workspace/desktop-deno/release/dev-laufey/webview/build/laufey_webview.app/Contents/MacOS/libruntime.dylib",
    );
    expect(
      cef.bundle.endsWith("/release/dev-laufey/cef/build/Release/laufey.app"),
    ).toBe(true);
    expect(cef.executable.endsWith("/laufey.app/Contents/MacOS/laufey")).toBe(
      true,
    );
    expect(cef.runtimeLibrary.endsWith("/Contents/MacOS/laufey.dylib")).toBe(
      true,
    );
    expect(
      createDenoDesktopDevHostBuildArgs({
        backend: webview.backend,
        output: webview.bundle,
        icon: "/workspace/icon.icns",
      }),
    ).toEqual([
      "desktop",
      "--quiet",
      "--output",
      webview.bundle,
      "--backend",
      "webview",
      "--icon",
      "/workspace/icon.icns",
      "--no-check",
      "src-deno/application-info.ts",
    ]);
  });

  it("reuses only a matching Deno host identity", () => {
    const expected = {
      denoVersion: "deno 2.9.5",
      backend: "webview",
      name: "Lapis Notes",
      identifier: "md.lapis.notes.desktop-deno",
    };
    expect(
      isMacosDesktopDevHostCurrent({
        expected,
        marker: { ...expected },
        executable: true,
        signatureValid: true,
        bundleName: "Lapis Notes",
      }),
    ).toBe(true);

    for (const marker of [
      { ...expected, denoVersion: "deno 2.9.6" },
      { ...expected, backend: "cef" },
      { ...expected, name: "Deno" },
      { ...expected, identifier: "com.deno.desktop" },
    ]) {
      expect(
        isMacosDesktopDevHostCurrent({
          expected,
          marker,
          executable: true,
          signatureValid: true,
          bundleName: "Lapis Notes",
        }),
      ).toBe(false);
    }

    expect(
      isMacosDesktopDevHostCurrent({
        expected,
        marker: { ...expected },
        executable: true,
        signatureValid: false,
        bundleName: "Lapis Notes",
      }),
    ).toBe(false);
    expect(
      isMacosDesktopDevHostIdentityCurrent({
        expected,
        marker: { ...expected },
        executable: true,
        signatureValid: false,
        bundleName: "Lapis Notes",
      }),
    ).toBe(true);
  });

  it("signs generated macOS hosts only after identity patching", () => {
    const bundle = "/workspace/release/dev-laufey/laufey.app";
    expect(createMacosDesktopDevHostSignArgs(bundle)).toEqual([
      "--force",
      "--deep",
      "--sign",
      "-",
      bundle,
    ]);
    expect(createMacosDesktopDevHostVerifyArgs(bundle)).toEqual([
      "--verify",
      "--deep",
      "--strict",
      bundle,
    ]);
  });

  it("exposes root and package CEF debug commands", async () => {
    const rootManifest = JSON.parse(
      await readFile(new URL("../../../package.json", import.meta.url), "utf8"),
    );
    const packageManifest = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    );

    expect(rootManifest.scripts["dev:desktop:cef"]).toContain(
      "LAPIS_DENO_BACKEND=cef",
    );
    expect(rootManifest.scripts["dev:desktop:cef"]).toContain(
      "@lapis-notes/desktop-deno dev",
    );
    expect(rootManifest.scripts["dev:desktop:chrome"]).toBe(
      "pnpm dev:desktop:cef",
    );
    expect(packageManifest.scripts["dev:cef"]).toBe(
      "LAPIS_DENO_BACKEND=cef node scripts/dev.mjs",
    );
    expect(packageManifest.scripts["dev:chrome"]).toBe("pnpm dev:cef");
    expect(rootManifest.scripts["dev:desktop:telemetry"]).toContain(
      "@lapis-notes/desktop-deno dev:telemetry",
    );
    expect(rootManifest.scripts["dev:desktop:telemetry:cef"]).toContain(
      "@lapis-notes/desktop-deno dev:telemetry:cef",
    );
    expect(packageManifest.scripts["telemetry:lgtm"]).toBe(
      "node scripts/run-lgtm.mjs",
    );
  });

  it("creates local-only native and renderer telemetry environments", () => {
    const environment = createDesktopTelemetryEnvironment(
      {},
      {
        enabled: true,
        version: "2026.31.5",
      },
    );

    expect(environment).toMatchObject({
      LAPIS_DESKTOP_TELEMETRY: "1",
      OTEL_DENO: "true",
      OTEL_SERVICE_NAME: "lapis-notes-desktop",
      OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf",
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318",
      OTEL_DENO_CONSOLE: "capture",
      VITE_LAPIS_DESKTOP_TELEMETRY: "1",
      VITE_LAPIS_DESKTOP_OTLP_TRACES_ENDPOINT:
        "http://127.0.0.1:4318/v1/traces",
      VITE_LAPIS_DESKTOP_TELEMETRY_SERVICE_NAME: "lapis-notes-renderer",
    });
    expect(environment.OTEL_RESOURCE_ATTRIBUTES).toContain(
      "service.namespace=lapismd",
    );
    expect(environment.OTEL_RESOURCE_ATTRIBUTES).toContain(
      "deployment.environment.name=local",
    );
    expect(
      createDesktopRendererTelemetryDefines(environment, true),
    ).toMatchObject({
      "import.meta.env.VITE_LAPIS_DESKTOP_TELEMETRY": '"1"',
      "import.meta.env.VITE_LAPIS_DESKTOP_OTLP_TRACES_ENDPOINT":
        '"http://127.0.0.1:4318/v1/traces"',
      "import.meta.env.VITE_LAPIS_DESKTOP_TELEMETRY_SERVICE_NAME":
        '"lapis-notes-renderer"',
    });
  });

  it("leaves normal development untouched and rejects remote exporters", () => {
    expect(
      createDesktopTelemetryEnvironment(
        { KEEP: "yes" },
        {
          enabled: false,
          version: "1.0.0",
        },
      ),
    ).toEqual({ KEEP: "yes" });
    expect(() =>
      createDesktopTelemetryEnvironment(
        { OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example.com" },
        { enabled: true, version: "1.0.0" },
      ),
    ).toThrow("local-only");
    expect(isDesktopTelemetryRequested(["--telemetry"])).toBe(true);
    expect(isDesktopTelemetryRequested([])).toBe(false);
    expect(createDesktopRendererTelemetryDefines({}, false)).toMatchObject({
      "import.meta.env.VITE_LAPIS_DESKTOP_TELEMETRY": "undefined",
      "import.meta.env.VITE_LAPIS_DESKTOP_OTLP_TRACES_ENDPOINT": "undefined",
    });
  });

  it("creates package-local source links for Deno Desktop embedded path resolution", async () => {
    const { packageRoot } = await createDesktopDevWorkspace();

    await ensureDesktopDevSiblingLinks(packageRoot);

    for (const [name, target] of [
      ["lapis-notes", "../.."],
      ["ai-host", "../../../ai-host"],
      ["terminal-host", "../../../terminal-host"],
    ]) {
      const linkPath = path.join(packageRoot, name);
      expect((await lstat(linkPath)).isSymbolicLink()).toBe(true);
      expect(await readlink(linkPath)).toBe(target);
    }
  });

  it("refuses to replace non-owned sibling paths", async () => {
    const { packageRoot } = await createDesktopDevWorkspace();
    await mkdir(path.join(packageRoot, "ai-host"));

    await expect(ensureDesktopDevSiblingLinks(packageRoot)).rejects.toThrow(
      "Refusing to replace non-symlink desktop dev sibling path",
    );
  });

  it("fails before creating a dangling link when a source checkout is missing", async () => {
    const workspaceRoot = await mkdtemp(
      path.join(os.tmpdir(), "lapis-desktop-deno-dev-"),
    );
    const packageRoot = path.join(
      workspaceRoot,
      "lapis-notes",
      "packages",
      "desktop-deno",
    );
    await mkdir(packageRoot, { recursive: true });

    await expect(ensureDesktopDevSiblingLinks(packageRoot)).rejects.toThrow(
      "Missing desktop dev source target",
    );
    await expect(
      lstat(path.join(packageRoot, "ai-host")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
