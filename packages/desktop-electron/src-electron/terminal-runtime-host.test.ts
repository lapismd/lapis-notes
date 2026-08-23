import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop terminal-runtime host", () => {
  it("embeds @lapismd/terminal-host in-process and keeps node-pty out of the renderer", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src-electron/terminal-runtime-host.ts"),
      "utf8",
    );
    const preload = readFileSync(
      path.resolve(process.cwd(), "src-electron/preload.ts"),
      "utf8",
    );
    const manifest = readFileSync(
      path.resolve(process.cwd(), "package.json"),
      "utf8",
    );
    const vite = readFileSync(
      path.resolve(process.cwd(), "vite.config.ts"),
      "utf8",
    );
    const distPreparation = readFileSync(
      path.resolve(process.cwd(), "scripts/prepare-dist-electron.mjs"),
      "utf8",
    );
    expect(source).toContain("@lapismd/terminal-host");
    expect(source).toContain("createTerminalSessionService");
    expect(source).toContain("resolveDesktopTerminalWorkspace");
    expect(source).toContain("payload.workspace");
    expect(source).toContain("isAbsolute");
    expect(source).toContain("payload.cwd");
    expect(source).toContain("payload.shell");
    expect(source).not.toContain("node-pty");
    expect(preload).not.toContain("node-pty");
    expect(manifest).toContain("@lapismd/terminal-host");
    expect(manifest).toContain("@lapis-notes/lapis-plugin-terminal");
    expect(vite).toContain('assetsInclude: ["**/*.wasm"]');
    expect(vite).toContain('"ghostty-web"');
    expect(vite).toContain('"@xterm/xterm"');
    expect(vite).toContain("linkedTerminalPluginRoot");
    expect(vite).toContain("@lapis-notes/lapis-plugin-terminal");
    expect(distPreparation).toContain('"node-pty/package.json"');
    expect(distPreparation).toContain('path.join(distDir, "prebuilds")');
  });
});
