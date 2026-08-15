import { describe, expect, it, vi } from "vitest";
import { App } from "../context.svelte";

describe("editor extension registration", () => {
  it("unregisters from the original view after its association is removed", () => {
    const extension = { id: "bases-source" };
    const registered = new Set([extension]);
    const determineViewType = vi.fn(() => undefined);
    const app = {
      editors: new Map([["bases", registered]]),
      workspace: { determineViewType },
    } as unknown as App;

    App.prototype.unregisterEditorExtension.call(app, extension, "bases");

    expect(registered).not.toContain(extension);
    expect(determineViewType).not.toHaveBeenCalled();
  });
});
