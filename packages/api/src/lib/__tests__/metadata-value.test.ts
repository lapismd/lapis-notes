import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
  inferMetadataPropertyType,
  inferMetadataType,
  normalizeMetadataValue,
} from "../metadata-value";

describe("inferMetadataType", () => {
  it("infers native booleans and numbers", () => {
    expect(inferMetadataType(true)).toBe("checkbox");
    expect(inferMetadataType(42)).toBe("number");
  });

  it("infers checkbox and number types from common string encodings", () => {
    expect(inferMetadataType("true")).toBe("checkbox");
    expect(inferMetadataType("42")).toBe("number");
  });

  it("falls back to text for non-coercible strings", () => {
    expect(inferMetadataType("maybe")).toBe("text");
    expect(inferMetadataType("3.14")).toBe("text");
  });

  it("keeps primitive arrays as multitext and marks complex arrays and objects", () => {
    expect(inferMetadataType(["a", 2])).toBe("multitext");
    expect(inferMetadataType([{ name: "a" }])).toBe("array");
    expect(inferMetadataType({ name: "a" })).toBe("object");
  });
});

describe("inferMetadataPropertyType", () => {
  it("treats top-level tags and aliases as semantic property types", () => {
    expect(inferMetadataPropertyType("tags", ["work"])).toBe("tags");
    expect(inferMetadataPropertyType("tag", "work")).toBe("tags");
    expect(inferMetadataPropertyType("aliases", ["Daily"])).toBe("aliases");
    expect(inferMetadataPropertyType("alias", "Daily")).toBe("aliases");
  });
});

describe("normalizeMetadataValue", () => {
  describe("checkbox", () => {
    it("coerces string true/false to booleans", () => {
      expect(normalizeMetadataValue("checkbox", "true")).toBe(true);
      expect(normalizeMetadataValue("checkbox", "FALSE")).toBe(false);
      expect(normalizeMetadataValue("checkbox", "  True  ")).toBe(true);
    });

    it("passes through native booleans", () => {
      expect(normalizeMetadataValue("checkbox", true)).toBe(true);
      expect(normalizeMetadataValue("checkbox", false)).toBe(false);
    });

    it("falls back to the original value when coercion is impossible", () => {
      expect(normalizeMetadataValue("checkbox", "maybe")).toBe("maybe");
      expect(normalizeMetadataValue("checkbox", 1)).toBe(1);
    });
  });

  describe("number", () => {
    it("coerces numeric strings", () => {
      expect(normalizeMetadataValue("number", "42")).toBe(42);
      expect(normalizeMetadataValue("number", "3.14")).toBe(3.14);
      expect(normalizeMetadataValue("number", " 7 ")).toBe(7);
    });

    it("passes through native numbers", () => {
      expect(normalizeMetadataValue("number", 42)).toBe(42);
      expect(normalizeMetadataValue("number", 0)).toBe(0);
    });

    it("falls back to the original value for non-numeric strings", () => {
      expect(normalizeMetadataValue("number", "abc")).toBe("abc");
      expect(normalizeMetadataValue("number", "")).toBe("");
    });
  });

  describe("date", () => {
    it("passes through valid date strings", () => {
      expect(normalizeMetadataValue("date", "2026-05-21")).toBe("2026-05-21");
    });

    it("coerces Date and DateTime values", () => {
      expect(
        normalizeMetadataValue("date", new Date("2026-05-21T12:00:00.000Z")),
      ).toBe("2026-05-21");
      expect(
        normalizeMetadataValue("date", DateTime.fromISO("2026-05-21")),
      ).toBe("2026-05-21");
    });

    it("falls back for invalid date values", () => {
      expect(normalizeMetadataValue("date", "not-a-date")).toBe("not-a-date");
    });
  });

  describe("datetime", () => {
    it("passes through valid datetime strings", () => {
      expect(normalizeMetadataValue("datetime", "2026-05-21T14:30")).toBe(
        "2026-05-21T14:30",
      );
    });

    it("falls back for invalid datetime values", () => {
      expect(normalizeMetadataValue("datetime", "soon")).toBe("soon");
    });
  });

  describe("aliases, multitext, and tags", () => {
    it("passes through string arrays", () => {
      expect(normalizeMetadataValue("multitext", ["a", "b"])).toEqual([
        "a",
        "b",
      ]);
    });

    it("wraps a single string in an array", () => {
      expect(normalizeMetadataValue("tags", "alpha")).toEqual(["alpha"]);
      expect(normalizeMetadataValue("aliases", "Daily")).toEqual(["Daily"]);
    });

    it("splits comma- or semicolon-separated strings", () => {
      expect(normalizeMetadataValue("tags", "a, b;c")).toEqual(["a", "b", "c"]);
    });

    it("falls back for non-string array entries", () => {
      expect(normalizeMetadataValue("multitext", [1, 2])).toEqual([1, 2]);
    });
  });

  describe("delete semantics", () => {
    it("returns null and undefined unchanged", () => {
      expect(normalizeMetadataValue("number", null)).toBeNull();
      expect(normalizeMetadataValue("checkbox", undefined)).toBeUndefined();
    });
  });

  describe("passthrough types", () => {
    it("returns text and unknown values unchanged", () => {
      expect(normalizeMetadataValue("text", "hello")).toBe("hello");
      expect(normalizeMetadataValue("unknown", { ok: true })).toEqual({
        ok: true,
      });
    });
  });
});
