import { describe, expect, it } from "vitest";

import {
  basename,
  makeFsError,
  mkdirWhenPathExists,
  normalizeVaultPath,
  resolveAbsolutePath,
} from "./paths";

describe("Deno desktop path containment", () => {
  it("rejects traversal out of the vault root", () => {
    expect(() => normalizeVaultPath("../secret")).toThrow(/EINVAL/);
    expect(() => normalizeVaultPath("notes/../../etc/passwd")).toThrow(
      /EINVAL/,
    );
    expect(() => resolveAbsolutePath("/vault", "../outside")).toThrow(/EINVAL/);
  });

  it("resolves contained vault paths", () => {
    expect(resolveAbsolutePath("/Users/me/Notes", "")).toBe("/Users/me/Notes");
    expect(resolveAbsolutePath("/Users/me/Notes/", "daily/today.md")).toBe(
      "/Users/me/Notes/daily/today.md",
    );
    expect(basename("/Users/me/Notes")).toBe("Notes");
  });

  it("rejects a relative vault root", () => {
    expect(() => resolveAbsolutePath("Notes", "a.md")).toThrow(/EINVAL/);
    expect(makeFsError("ENOENT", "/missing").code).toBe("ENOENT");
  });

  it("treats an existing directory as a successful mkdir", () => {
    expect(mkdirWhenPathExists({ isDirectory: true })).toBe("skip");
    expect(mkdirWhenPathExists({ isDirectory: false })).toBe("eexist");
    expect(mkdirWhenPathExists(null)).toBe("create");
  });
});
