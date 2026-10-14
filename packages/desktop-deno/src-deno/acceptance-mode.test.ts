import { describe, expect, it } from "vitest";
import { resolveDesktopAcceptanceMode } from "./acceptance-mode";

describe("desktop installation acceptance mode", () => {
  it("keeps full controller acceptance as the default", () => {
    expect(resolveDesktopAcceptanceMode("1", "/report.json", undefined)).toBe(
      "full",
    );
    expect(resolveDesktopAcceptanceMode("1", "/report.json", "invalid")).toBe(
      "full",
    );
  });
  it("permits core mode only inside explicitly enabled acceptance", () => {
    expect(resolveDesktopAcceptanceMode("1", "/report.json", "core")).toBe(
      "core",
    );
    expect(
      resolveDesktopAcceptanceMode(undefined, "/report.json", "core"),
    ).toBeUndefined();
    expect(resolveDesktopAcceptanceMode("1", "", "core")).toBeUndefined();
  });
});
