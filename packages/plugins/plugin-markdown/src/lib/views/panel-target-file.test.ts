import type { App, TFile } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import { resolvePanelTargetFile } from "./panel-target-file";

function file(path: string): TFile {
  const name = path.split("/").pop() ?? path;
  return { path, name, basename: name.replace(/\.md$/, "") } as TFile;
}

describe("resolvePanelTargetFile", () => {
  it("prefers workspace.getActiveFile over a root FileView scan", () => {
    const active = file("Notes/Active.md");
    const other = file("Notes/Other.md");
    const iterateRootLeaves = vi.fn((callback: (leaf: { view: unknown }) => void) => {
      callback({ view: { file: other } });
    });
    const app = {
      workspace: {
        getActiveFile: () => active,
        iterateRootLeaves,
      },
    } as unknown as App;

    expect(resolvePanelTargetFile(app)).toBe(active);
    expect(iterateRootLeaves).not.toHaveBeenCalled();
  });

  it("returns the most recently active file when a sidebar leaf has focus", () => {
    const recent = file("Notes/Recent.md");
    const app = {
      workspace: {
        getActiveFile: () => recent,
        iterateRootLeaves: vi.fn(),
      },
    } as unknown as App;

    expect(resolvePanelTargetFile(app)).toBe(recent);
  });
});
