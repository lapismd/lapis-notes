import path from "node:path";
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  createDistributionPlan,
  createLinuxDesktopEntry,
  createLinuxLauncher,
  createLinuxSigningArguments,
  createMacSigningArguments,
  createMacApplicationMetadata,
  readRequestedTarget,
  resolveCurrentDenoTarget,
} from "./distribution.mjs";
import { desktopDenoDynamicIncludes } from "./dev-command.mjs";

describe("Deno desktop distribution", () => {
  it("stamps the release version and stable identity into the macOS bundle", () => {
    expect(createMacApplicationMetadata("2026.31.5")).toMatchObject({
      CFBundleIdentifier: "notes.lapis.desktop",
      CFBundleName: "Lapis Notes",
      CFBundleShortVersionString: "2026.31.5",
      CFBundleVersion: "2026.31.5",
      LSMinimumSystemVersion: "15.0",
    });
  });

  function withLinuxBundle(run) {
    const root = mkdtempSync(path.join(os.tmpdir(), "lapis-distribution-"));
    try {
      const bundle = path.join(root, "bundle with spaces");
      const bin = path.join(root, "bin");
      mkdirSync(path.join(bundle, "lib/lapis-notes"), { recursive: true });
      mkdirSync(bin);
      writeFileSync(path.join(bundle, "lapis-notes"), createLinuxLauncher(), {
        mode: 0o755,
      });
      writeFileSync(
        path.join(bundle, "lib/lapis-notes/lapis-notes"),
        '#!/bin/sh\nprintf "%s\\n" "$@"\n',
        { mode: 0o755 },
      );
      writeFileSync(
        path.join(bin, "ldconfig"),
        '#!/bin/sh\nprintf "%s\\n" "libwebkit2gtk-4.1.so.0 (libc6)" "libgtk-3.so.0 (libc6)" "libayatana-appindicator3.so.1 (libc6)"\n',
        { mode: 0o755 },
      );
      symlinkSync(
        "../bundle with spaces/lapis-notes",
        path.join(bin, "lapis-notes"),
      );
      run({
        root,
        bundle,
        bin,
        env: { ...process.env, PATH: `${bin}:/usr/bin:/bin` },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  it("launches through a relative Homebrew symlink from another directory", () => {
    withLinuxBundle(({ root, bin, env }) => {
      const result = spawnSync(
        path.join(bin, "lapis-notes"),
        ["lapis://vault?a=one two", "--literal"],
        { cwd: root, env, encoding: "utf8" },
      );
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("lapis://vault?a=one two\n--literal\n");
    });
  });

  it("checks native prerequisites without launching the application", () => {
    withLinuxBundle(({ bin, env }) => {
      const result = spawnSync(
        path.join(bin, "lapis-notes"),
        ["--check-runtime"],
        { env, encoding: "utf8" },
      );
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toBe("");
    });
  });

  it("reports missing WebKit libraries with an actionable installation command", () => {
    withLinuxBundle(({ bin, env }) => {
      writeFileSync(path.join(bin, "ldconfig"), "#!/bin/sh\nexit 0\n", {
        mode: 0o755,
      });
      const result = spawnSync(
        path.join(bin, "lapis-notes"),
        ["--check-runtime"],
        { env, encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("libwebkit2gtk-4.1.so.0");
      expect(result.stderr).toContain("sudo apt-get install");
      expect(result.stdout).toBe("");
    });
  });
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
    expect(mac.desktopOutput).toBe(path.join(common.releaseDir, mac.baseName));
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
      'import.meta.resolve("@lapismd/terminal-host/native-artifacts.json")',
    );
    expect(source).not.toContain("../../../terminal-host");
    expect(source).toMatch(/"--include",\s*"dist"/u);
    expect(source).not.toMatch(/"--exclude",\s*"dist"/u);
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
