import { describe, expect, it } from "vitest";
import {
  BacklinksLegacyViewTypes,
  BacklinksViewType,
} from "./backlinks";
import {
  FilePropertiesLegacyViewTypes,
  FilePropertiesViewType,
} from "./file-properties";
import { OutlineLegacyViewTypes, OutlineViewType } from "./outline";
import {
  OutgoingLinksLegacyViewTypes,
  OutgoingLinksViewType,
} from "./outgoing-links";
import { TagsLegacyViewTypes, TagsViewType } from "./tags";

describe("Obsidian-compatible view types", () => {
  it("exports canonical panel identifiers", () => {
    expect({
      backlinks: BacklinksViewType,
      fileProperties: FilePropertiesViewType,
      outline: OutlineViewType,
      outgoingLinks: OutgoingLinksViewType,
      tags: TagsViewType,
    }).toEqual({
      backlinks: "backlink",
      fileProperties: "file-properties",
      outline: "outline",
      outgoingLinks: "outgoing-link",
      tags: "tag",
    });
  });

  it("retains the previous Lapis identifiers as load aliases", () => {
    expect({
      backlinks: BacklinksLegacyViewTypes,
      fileProperties: FilePropertiesLegacyViewTypes,
      outline: OutlineLegacyViewTypes,
      outgoingLinks: OutgoingLinksLegacyViewTypes,
      tags: TagsLegacyViewTypes,
    }).toEqual({
      backlinks: ["file:backlinks"],
      fileProperties: ["file:properties"],
      outline: ["file:outline"],
      outgoingLinks: ["file:outgoing-links"],
      tags: ["tags"],
    });
  });
});
