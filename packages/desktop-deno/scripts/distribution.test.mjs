import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createDistributionPlan,
  createLinuxDesktopEntry,
  createLinuxLauncher,
  createLinuxSigningArguments,
  createMacSigningArguments,
  readRequestedTarget,
  resolveCurrentDenoTarget,
} from "./distribution.mjs";
import { desktopDenoDynamicIncludes } from "./dev-command.mjs";

describe("Deno desktop distribution", () => {
  it("maps supported build hosts to explicit Deno targets", () => {
    expect(resolveCurrentDenoTarget("darwin", "arm64")).toBe(
      "aarch64-apple-darwin",
    );
    expect(resolveCurrentDenoTarget("linux", "x64")).toBe(
      "x86_64-unknown-linux-gnu",
    );
    expect(() => resolveCurrentDenoTarget("win32", "x64")).toThrow(
      "Unsupported Deno desktop build host",
    );
  });

  it("validates explicit target arguments", () => {
    expect(
      readRequestedTarget(
        ["--target", "x86_64-unknown-linux-gnu"],
        "darwin",
        "arm64",
      ),
    ).toBe("x86_64-unknown-linux-gnu");
    expect(() =>
      readRequestedTarget(
        ["--target", "x86_64-pc-windows-msvc"],
        "darwin",
        "arm64",
      ),
    ).toThrow("Unsupported Deno desktop target");
  });

  it("creates stable macOS and Linux artifact plans with Lapis icons", () => {
    const common = {
      packageDir: "/repo/packages/desktop-deno",
      releaseDir: "/repo/packages/desktop-deno/release",
      version: "2026.31.5",
    };
    const mac = createDistributionPlan({
      ...common,
      target: "aarch64-apple-darwin",
    });
    expect(
      mac.appBundle.endsWith(
        path.join("release", "Lapis-Notes-2026.31.5-macos-arm64.app"),
      ),
    ).toBe(true);
    expect(
      mac.archive.endsWith(
        path.join("release", "Lapis-Notes-2026.31.5-macos-arm64.zip"),
      ),
    ).toBe(true);
    expect(
      mac.icon.endsWith(path.join("desktop-deno", "build", "icon.icns")),
    ).toBe(true);

    const linux = createDistributionPlan({
      ...common,
      target: "x86_64-unknown-linux-gnu",
    });
    expect(
      linux.appImage.endsWith(
        path.join("release", "Lapis-Notes-2026.31.5-linux-x64.AppImage"),
      ),
    ).toBe(true);
    expect(
      linux.archive.endsWith(
        path.join("release", "Lapis-Notes-2026.31.5-linux-x64.tar.gz"),
      ),
    ).toBe(true);
    expect(
      linux.icon.endsWith(path.join("desktop-deno", "build", "icon.png")),
    ).toBe(true);
  });

  it("includes native and dynamic-worker inputs in the Deno bundle", () => {
    const source = readFileSync(
      new URL("./package-app.mjs", import.meta.url),
      "utf8",
    );
    expect(source).toContain(
      'path.resolve(packageDir, "../../../terminal-host")',
    );
    expect(source).toContain('"native-artifacts.json"');
    expect(source).toContain('"--include"');
    expect(source).toContain('"native"');
    expect(source).toContain('"build/icon-light.png"');
    expect(source).toContain('"build/icon-dark.png"');
    expect(source).toContain('createHash("sha256")');
    expect(source).toContain("createDenoDesktopDynamicIncludeArgs()");
    expect(desktopDenoDynamicIncludes).toContain(
      "src-deno/app-database-worker.ts",
    );
  });

  it("writes URL-aware Linux metadata", () => {
    const desktopEntry = createLinuxDesktopEntry();
    expect(desktopEntry).toContain("Exec=lapis-notes %u");
    expect(desktopEntry).toContain("Icon=lapis-notes");
    expect(desktopEntry).toContain("x-scheme-handler/lapis-notes");
  });

  it("launches the extracted Deno application bundle", () => {
    const launcher = createLinuxLauncher();
    expect(launcher).toContain("#!/bin/sh");
    expect(launcher).toContain("lib/lapis-notes/lapis-notes");
    expect(launcher).toContain('"$@"');
  });

  it("builds signing commands from non-secret selectors", () => {
    expect(
      createMacSigningArguments({
        appBundle: "/release/Lapis Notes.app",
        identity: "-",
        entitlements: "/repo/entitlements.plist",
      }),
    ).toEqual(["--force", "--deep", "--sign", "-", "/release/Lapis Notes.app"]);
    expect(
      createMacSigningArguments({
        appBundle: "/release/Lapis Notes.app",
        identity: "Developer ID Application: Example",
        entitlements: "/repo/entitlements.plist",
      }),
    ).toContain("runtime");
    expect(
      createLinuxSigningArguments({
        artifact: "/release/lapis.AppImage",
        keyId: "release@example.test",
      }),
    ).toEqual([
      "--batch",
      "--yes",
      "--armor",
      "--detach-sign",
      "--local-user",
      "release@example.test",
      "--output",
      "/release/lapis.AppImage.asc",
      "/release/lapis.AppImage",
    ]);
  });
});
