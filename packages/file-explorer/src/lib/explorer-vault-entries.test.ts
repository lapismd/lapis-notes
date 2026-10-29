import { describe, expect, it, vi } from "vitest";

const { FakeFile, FakeFolder } = vi.hoisted(() => {
  class FakeFile {
    constructor(readonly path: string) {}
    get name() {
      return this.path.split("/").pop() ?? this.path;
    }
  }
  class FakeFolder extends FakeFile {}
  return { FakeFile, FakeFolder };
});

vi.mock("@lapis-notes/api", () => ({
  TFolder: FakeFolder,
  TFile: FakeFile,
}));

import { listExplorerVaultEntries } from "./explorer-vault-entries";

describe("listExplorerVaultEntries", () => {
  it("keeps dotted vault names so Design Core can filter them", () => {
    const entries = listExplorerVaultEntries([
      new FakeFolder("/"),
      new FakeFolder("Notes"),
      new FakeFile("Notes/welcome.md"),
      new FakeFile(".env"),
      new FakeFolder(".lapis"),
      new FakeFile(".lapis/app.json"),
    ] as never);

    expect(entries.map((entry) => entry.path)).toEqual([
      "Notes",
      "Notes/welcome.md",
      ".env",
      ".lapis",
      ".lapis/app.json",
    ]);
    expect(entries.find((entry) => entry.path === ".lapis")?.kind).toBe(
      "folder",
    );
    expect(entries.find((entry) => entry.path === ".env")?.kind).toBe("file");
  });
});
