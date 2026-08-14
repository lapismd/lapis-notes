import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DESKTOP_INVOKE_COMMANDS,
  createDesktopCapabilityRegistry,
} from "./desktop-capabilities";
import { normalizeVaultPath, resolveAbsolutePath } from "./native-paths";
import {
  getAppRendererContentType,
  resolveAppRendererFilePath,
} from "./app-renderer-protocol";

describe("desktop capability contract", () => {
  it("advertises exactly the retained partial-host capabilities", () => {
    const registry = createDesktopCapabilityRegistry();
    const available = Object.entries(registry)
      .filter(([, capability]) => capability?.status === "available")
      .map(([id]) => id)
      .sort();

    expect(available).toEqual(
      [
        "resource",
        "database",
        "search",
        "language-service",
        "plugin-sidecar",
        "plugin-assets",
        "file-watch",
        "notifications",
        "file-system-actions",
        "agent-runtime",
      ].sort(),
    );
    expect(registry.notebook).toMatchObject({ status: "unavailable" });
    expect(registry.model).toMatchObject({ status: "unavailable" });
    expect(registry["language-service"]?.details).toEqual(
      expect.objectContaining({ markdown: "markdownlint-node" }),
    );
    expect(registry["language-service"]?.details).not.toHaveProperty(
      "typescript",
    );
  });

  it("does not expose demo, notebook, model, or raw transport commands", () => {
    const registry = createDesktopCapabilityRegistry();
    expect([...DESKTOP_INVOKE_COMMANDS]).not.toContain("desktop_open_demo_vault");
    expect([...DESKTOP_INVOKE_COMMANDS].some((id) => id.includes("notebook"))).toBe(false);
    expect([...DESKTOP_INVOKE_COMMANDS].some((id) => id.includes("model"))).toBe(false);
    expect(DESKTOP_INVOKE_COMMANDS).toContain("desktop_pick_vault_folder");
    expect(DESKTOP_INVOKE_COMMANDS).toContain("desktop_plugin_host_shutdown");
    expect(DESKTOP_INVOKE_COMMANDS).toContain("desktop_db_open");
    expect(DESKTOP_INVOKE_COMMANDS).toContain("desktop_db_call");
    expect(DESKTOP_INVOKE_COMMANDS).toContain("desktop_db_close");
    expect(
      [...DESKTOP_INVOKE_COMMANDS].some((id) =>
        /(?:load_state|save_state|search_vector_documents)/u.test(id),
      ),
    ).toBe(false);
    expect(registry.database).toMatchObject({
      status: "available",
      details: { engine: "turso" },
    });
    expect(registry.search).toMatchObject({
      status: "available",
      provider: "turso-fts-vector",
    });
  });
});

describe("native vault path containment", () => {
  it("normalizes safe relative paths", () => {
    expect(normalizeVaultPath("notes/../notes/today.md")).toBe(
      "notes/today.md",
    );
    expect(normalizeVaultPath("/")).toBe("");
  });

  it.each(["../secret", "notes/../../secret", "/etc/passwd", "\\etc\\passwd"])(
    "rejects traversal or absolute input %s",
    (candidate) => {
      expect(() => normalizeVaultPath(candidate)).toThrow(/EINVAL/u);
    },
  );

  it("resolves safe paths beneath the selected root", () => {
    const root = path.resolve("/tmp/lapis-vault");
    expect(resolveAbsolutePath(root, "notes/today.md")).toBe(
      path.join(root, "notes", "today.md"),
    );
    expect(() => resolveAbsolutePath("relative-root", "note.md")).toThrow(
      /EINVAL/u,
    );
  });
});

describe("packaged renderer protocol containment", () => {
  const root = path.resolve("/tmp/lapis-renderer");

  it("maps the app root and assets beneath the packaged renderer", () => {
    expect(resolveAppRendererFilePath(root, "/")).toBe(
      path.join(root, "index.html"),
    );
    expect(resolveAppRendererFilePath(root, "/assets/app.js")).toBe(
      path.join(root, "assets", "app.js"),
    );
    expect(getAppRendererContentType("font.woff2")).toBe("font/woff2");
  });

  it.each(["/../secret", "/%2e%2e/secret", "/assets/%2e%2e/%2e%2e/secret"])(
    "rejects renderer traversal %s",
    (candidate) => {
      expect(() => resolveAppRendererFilePath(root, candidate)).toThrow(
        /outside/u,
      );
    },
  );
});
