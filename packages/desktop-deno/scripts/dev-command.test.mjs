import { lstat, mkdir, mkdtemp, readlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createDenoDesktopDevArgs,
  ensureDesktopDevSiblingLinks,
} from "./dev-command.mjs";

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
    expect(args).toContain("--hmr");
    expect(args).toContain("--inspect=127.0.0.1:9229");
    expect(args).toContain("--sloppy-imports");
    expect(args).not.toContain("--no-npm");
    expect(args).toEqual(
      expect.arrayContaining([
        "--exclude",
        "node_modules",
        "dist",
        "src",
        "-A",
        "src-deno/main.ts",
      ]),
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
    await expect(lstat(path.join(packageRoot, "ai-host"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
