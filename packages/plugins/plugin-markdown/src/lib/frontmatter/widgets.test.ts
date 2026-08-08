import { describe, expect, it } from "vitest";
import { widgets } from "./widgets";

const EXPECTED_TYPES = [
  "unknown",
  "text",
  "number",
  "checkbox",
  "tags",
  "aliases",
  "multitext",
  "date",
  "datetime",
  "array",
  "object",
] as const;

describe("markdown type widgets", () => {
  it("registers every Lapis property type with icon and name", () => {
    const byType = Object.fromEntries(
      widgets.map((widget) => [widget.type, widget]),
    );
    for (const type of EXPECTED_TYPES) {
      expect(byType[type]?.icon).toMatch(/^lucide-/);
      expect(byType[type]?.name.length).toBeGreaterThan(0);
      expect(typeof byType[type]?.validate).toBe("function");
      expect(typeof byType[type]?.default).toBe("function");
      expect(typeof byType[type]?.render).toBe("function");
    }
  });

  it("exposes text widget icon for type manager lookups", () => {
    expect(widgets.find((widget) => widget.type === "text")?.icon).toBe(
      "lucide-text",
    );
  });
});
