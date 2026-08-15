import { describe, expect, it } from "vitest";
import {
  collectMetadataSuggestions,
  metadataPropertyKey,
} from "./cell-editor-options";

describe("Bases cell editor options", () => {
  it("maps dotted note property IDs to metadata-manager keys", () => {
    expect(metadataPropertyKey("note.owner")).toBe("owner");
    expect(metadataPropertyKey("note.project.owner")).toBe("project.owner");
    expect(metadataPropertyKey("owner")).toBe("owner");
    expect(metadataPropertyKey("file.folder")).toBe("file.folder");
  });

  it("flattens and deduplicates existing metadata values", () => {
    expect(
      collectMetadataSuggestions([
        "Maya Chen",
        ["Priya Shah", "Maya Chen"],
        null,
        undefined,
        "",
      ]),
    ).toEqual(["Maya Chen", "Priya Shah"]);
  });

  it("splits delimited tag values while preserving stable order", () => {
    expect(
      collectMetadataSuggestions(
        ["product, launch", ["research", "product"], "mobile; research"],
        true,
      ),
    ).toEqual(["product", "launch", "research", "mobile"]);
  });

  it("returns no suggestions for empty metadata", () => {
    expect(collectMetadataSuggestions([])).toEqual([]);
    expect(collectMetadataSuggestions([null, undefined, ""])).toEqual([]);
  });
});
