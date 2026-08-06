import { describe, expect, it, vi } from "vitest";
import { EditorViewRegistry } from "../editor-view-registry";

describe("EditorViewRegistry", () => {
  it("registers and unregisters editor view contributions", () => {
    const registry = new EditorViewRegistry();
    const events: string[] = [];
    registry.on("changed", (event) => events.push(event.action));

    const dispose = registry.register({
      id: "lapis.markdown.editor",
      viewType: "markdown",
      label: "Markdown",
      filenamePatterns: ["*.md"],
    });

    expect(registry.get("lapis.markdown.editor")).toMatchObject({
      id: "lapis.markdown.editor",
      viewType: "markdown",
      priority: "option",
      filenamePatterns: ["*.md"],
    });
    expect(registry.getByViewType("markdown")).toHaveLength(1);

    dispose();

    expect(registry.get("lapis.markdown.editor")).toBeUndefined();
    expect(events).toEqual(["registered", "unregistered"]);
  });

  it("warns on duplicate registrations without replacing the existing view", () => {
    const registry = new EditorViewRegistry();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    registry.register({ id: "markdown", label: "Markdown" });
    registry.register({ id: "markdown", label: "Other Markdown" });

    expect(registry.get("markdown")?.label).toBe("Markdown");
    expect(warn).toHaveBeenCalledWith(
      "Editor view markdown is already registered.",
    );

    warn.mockRestore();
  });

  it("upserts metadata and merges filename patterns", () => {
    const registry = new EditorViewRegistry();

    registry.upsert({
      id: "text",
      label: "Text",
      filenamePatterns: ["*.txt"],
    });
    registry.upsert({
      id: "text",
      label: "Plain Text",
      filenamePatterns: ["*.text", "*.txt"],
      priority: "default",
    });

    expect(registry.get("text")).toMatchObject({
      label: "Plain Text",
      filenamePatterns: ["*.txt", "*.text"],
      priority: "default",
    });
  });
});
