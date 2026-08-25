import { describe, expect, it } from "vitest";
import { shouldShowWorkingIndicator } from "./chat-status";

describe("shouldShowWorkingIndicator", () => {
  it("shows progress only while preparation or an error-free turn is active", () => {
    expect(shouldShowWorkingIndicator(true, false, null)).toBe(true);
    expect(shouldShowWorkingIndicator(false, true, null)).toBe(true);
    expect(shouldShowWorkingIndicator(false, false, null)).toBe(false);
  });

  it("removes the working state as soon as an error is visible", () => {
    expect(
      shouldShowWorkingIndicator(false, true, "Agent runtime failed"),
    ).toBe(false);
    expect(shouldShowWorkingIndicator(true, false, "Agent setup failed")).toBe(
      false,
    );
  });
});
