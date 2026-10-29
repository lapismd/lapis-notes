import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";

const seed = {
  ".git/config": "Git metadata",
  ".jj/repo/store": "JJ metadata",
  "Notes/.git/config": "Nested Git metadata",
  "Notes/.jj/repo/config": "Nested JJ metadata",
  "Notes/config": "Ordinary configuration",
  "Notes/Welcome.md": "# Welcome",
  "Private/draft.md": "Private draft",
  ".github/workflows/check.yml": "name: Check",
  "Notes/.gitignore": "*.tmp",
  "Notes/.jj-notes.md": "Ordinary note",
};
const visible = [
  ".github/workflows/check.yml",
  "Notes/.gitignore",
  "Notes/.jj-notes.md",
  "Notes/Welcome.md",
  "Notes/config",
  "Private/draft.md",
].sort();
const paths = (items: Iterable<{ path: string }>) =>
  [...items].map((it) => it.path).sort();

afterEach(() => vi.restoreAllMocks());

describe("core vault listing exclusions", () => {
  it("excludes metadata trees from every default enumeration and retains direct access", async () => {
    const adapter = new MemoryVaultAdapter(seed);
    const vault = new Vault(adapter);
    await vault.load();
    expect(paths(vault.getFiles())).toEqual(visible);
    expect(paths(vault.iterateFiles())).toEqual(visible);
    for (const items of [vault.getAllLoadedFiles(), vault.getAllFolders()])
      expect(
        paths(items).filter((path) =>
          path.split("/").some((part) => part === ".git" || part === ".jj"),
        ),
      ).toEqual([]);
    expect((await vault.list()).folders).not.toEqual(
      expect.arrayContaining([".git", ".jj"]),
    );
    expect(await vault.list(".git")).toEqual({ files: [], folders: [] });
    expect(await vault.read(vault.getFileByPath(".git/config")!)).toBe(
      "Git metadata",
    );
    expect(await adapter.read(".jj/repo/store")).toBe("JJ metadata");
  });

  it("filters indexed exact-name and path-glob lookups without additional IO", async () => {
    const adapter = new MemoryVaultAdapter(seed);
    const vault = new Vault(adapter);
    await vault.load();
    const listed = vi.spyOn(adapter, "list");
    expect(
      paths(vault.getFilesByGlob("config", { caseSensitive: true })),
    ).toEqual(["Notes/config"]);
    expect(paths(vault.getFilesByGlob("**/*"))).toEqual(visible);
    expect(listed).not.toHaveBeenCalled();
  });

  it("uses current configured patterns and restores discovery without changing data", async () => {
    let exclusions = [".git", ".jj"];
    const adapter = new MemoryVaultAdapter(seed);
    const vault = new Vault(adapter, undefined, {
      listingExclusions: () => exclusions,
    });
    await vault.load();
    exclusions = [...exclusions, "Private"];
    expect(paths(vault.getFiles())).not.toContain("Private/draft.md");
    expect(paths(vault.getAllFolders())).not.toContain("Private");
    expect(await adapter.read("Private/draft.md")).toBe("Private draft");
    exclusions = [];
    expect(paths(vault.getFiles())).toContain(".git/config");
    expect(paths(vault.getFiles())).toContain("Private/draft.md");
  });
});
