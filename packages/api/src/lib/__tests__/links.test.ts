import { describe, expect, it } from "vitest";
import {
  defaultLinkSettings,
  generateInternalLink,
  getLinkPath,
  type VaultIndex,
} from "../links";

function createVaultIndex(paths: string[]): VaultIndex {
  return {
    getFiles() {
      return paths.map((path) => {
        const segments = path.split("/");
        const name = segments[segments.length - 1] ?? path;
        const dotIndex = name.lastIndexOf(".");
        const extension = dotIndex === -1 ? "" : name.slice(dotIndex + 1);
        const basename = dotIndex === -1 ? name : name.slice(0, dotIndex);
        return { path, basename, extension };
      });
    },
  };
}

describe("getLinkPath", () => {
  it("uses the basename in shortest mode when unique", () => {
    const vaultIndex = createVaultIndex(["Notes/Foo.md", "Notes/Bar.md"]);

    expect(
      getLinkPath("Notes/Foo.md", "Index.md", defaultLinkSettings, vaultIndex),
    ).toBe("Foo");
  });

  it("falls back to the absolute path in shortest mode for duplicate basenames", () => {
    const vaultIndex = createVaultIndex(["Projects/Foo.md", "Archive/Foo.md"]);

    expect(
      getLinkPath(
        "Projects/Foo.md",
        "Index.md",
        defaultLinkSettings,
        vaultIndex,
      ),
    ).toBe("Projects/Foo");
  });

  it("uses the basename in shortest mode for unique non-markdown files", () => {
    const vaultIndex = createVaultIndex(["Assets/Guide.pdf", "Notes/Foo.md"]);

    expect(
      getLinkPath(
        "Assets/Guide.pdf",
        "Notes/Index.md",
        defaultLinkSettings,
        vaultIndex,
      ),
    ).toBe("Guide.pdf");
  });

  it("falls back to the absolute path in shortest mode for duplicate non-markdown files", () => {
    const vaultIndex = createVaultIndex([
      "Assets/Guide.pdf",
      "Archive/Guide.pdf",
    ]);

    expect(
      getLinkPath(
        "Assets/Guide.pdf",
        "Notes/Index.md",
        defaultLinkSettings,
        vaultIndex,
      ),
    ).toBe("Assets/Guide.pdf");
  });

  it("supports relative path generation", () => {
    const vaultIndex = createVaultIndex(["Areas/Foo.md"]);

    expect(
      getLinkPath(
        "Areas/Foo.md",
        "Projects/Index.md",
        {
          ...defaultLinkSettings,
          newLinkFormat: "relative",
        },
        vaultIndex,
      ),
    ).toBe("../Areas/Foo");
  });

  it("supports shortest unique suffix mode", () => {
    const vaultIndex = createVaultIndex([
      "A/Work/Foo.md",
      "B/Work/Foo.md",
      "C/Personal/Foo.md",
    ]);

    expect(
      getLinkPath(
        "C/Personal/Foo.md",
        "Index.md",
        {
          ...defaultLinkSettings,
          useShortestUniqueSuffix: true,
        },
        vaultIndex,
      ),
    ).toBe("Personal/Foo");
  });

  it("supports shortest unique suffix mode for non-markdown files", () => {
    const vaultIndex = createVaultIndex([
      "A/Work/Guide.pdf",
      "B/Work/Guide.pdf",
      "C/Personal/Guide.pdf",
    ]);

    expect(
      getLinkPath(
        "C/Personal/Guide.pdf",
        "Index.md",
        {
          ...defaultLinkSettings,
          useShortestUniqueSuffix: true,
        },
        vaultIndex,
      ),
    ).toBe("Personal/Guide.pdf");
  });
});

describe("generateInternalLink", () => {
  it("generates wikilinks with aliases", () => {
    const vaultIndex = createVaultIndex(["Notes/Foo.md"]);

    expect(
      generateInternalLink({
        targetPath: "Notes/Foo.md",
        sourcePath: "Index.md",
        alias: "Foo note",
        vaultIndex,
      }),
    ).toBe("[[Foo|Foo note]]");
  });

  it("generates markdown links and honors omitMarkdownExtension", () => {
    const vaultIndex = createVaultIndex(["Notes/Foo.md"]);

    expect(
      generateInternalLink({
        targetPath: "Notes/Foo.md",
        sourcePath: "Projects/Index.md",
        settings: {
          useWikilinks: false,
          newLinkFormat: "relative",
        },
        vaultIndex,
      }),
    ).toBe("[Foo](../Notes/Foo)");
  });

  it("generates embed wikilinks", () => {
    expect(
      generateInternalLink({
        targetPath: "Images/diagram.png",
        sourcePath: "Notes/Index.md",
        embed: true,
        vaultIndex: createVaultIndex([]),
      }),
    ).toBe("![[Images/diagram.png]]");
  });

  it("appends heading and block fragments", () => {
    const vaultIndex = createVaultIndex(["Notes/Foo.md"]);

    expect(
      generateInternalLink({
        targetPath: "Notes/Foo.md",
        sourcePath: "Index.md",
        heading: "Overview",
        vaultIndex,
      }),
    ).toBe("[[Foo#Overview]]");

    expect(
      generateInternalLink({
        targetPath: "Notes/Foo.md",
        sourcePath: "Index.md",
        blockId: "abc123",
        vaultIndex,
      }),
    ).toBe("[[Foo#^abc123]]");
  });
});
