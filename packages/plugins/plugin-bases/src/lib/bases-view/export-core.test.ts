import { describe, expect, test } from "vitest";
import { serializeResultsToCsv } from "./export-core";

describe("Bases CSV export", () => {
  test("serializes displayed properties with escaping", () => {
    const csv = serializeResultsToCsv(
      [
        {
          getValue(propertyId: "note.title" | "note.status") {
            if (propertyId === "note.title") return 'Hello, "world"';
            return "draft";
          },
        },
      ],
      ["note.title", "note.status"],
      (propertyId) => {
        return propertyId === "note.title" ? "Title" : "Status";
      },
    );

    expect(csv).toBe('Title,Status\n"Hello, ""world""",draft');
  });
});
