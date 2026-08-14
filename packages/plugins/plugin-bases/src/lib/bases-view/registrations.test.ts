import { describe, expect, it } from "vitest";
import { BUILT_IN_BASES_VIEW_ITEMS } from "./view-registration-inventory";

describe("legacy Bases view registrations", () => {
  it("retains every built-in view item in legacy order", () => {
    expect(BUILT_IN_BASES_VIEW_ITEMS).toEqual([
      { id: "table", name: "Table", icon: "lucide-table" },
      { id: "unknown", name: "Unknown", icon: "lucide-file" },
      { id: "cards", name: "Cards", icon: "lucide-layout-grid" },
      { id: "list", name: "List", icon: "lucide-list" },
      { id: "map", name: "Map", icon: "lucide-map" },
    ]);
  });
});
