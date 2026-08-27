import { describe, expect, it, vi } from "vitest";

import {
  dismissDesktopBootPresentation,
  showDesktopClosingPresentation,
} from "./desktop-close-presentation";

function createDocument() {
  const attributes = new Map<string, string>();
  const rootAttributes = new Map<string, string>();
  const status = {
    hidden: false,
    setAttribute: vi.fn((name: string, value: string) => {
      attributes.set(name, value);
    }),
    removeAttribute: vi.fn((name: string) => {
      attributes.delete(name);
    }),
  };
  const document = {
    documentElement: {
      setAttribute: vi.fn((name: string, value: string) => {
        rootAttributes.set(name, value);
      }),
    },
    getElementById: vi.fn(() => status),
  };
  return { attributes, document, rootAttributes, status };
}

describe("desktop close presentation", () => {
  it("retains the boot surface hidden after the workspace mounts", () => {
    const fixture = createDocument();

    dismissDesktopBootPresentation(fixture.document);

    expect(fixture.status.hidden).toBe(true);
    expect(fixture.attributes.get("aria-hidden")).toBe("true");
  });

  it("restores the branded status surface before renderer teardown", () => {
    const fixture = createDocument();
    dismissDesktopBootPresentation(fixture.document);

    showDesktopClosingPresentation(fixture.document);

    expect(fixture.rootAttributes.get("data-desktop-closing")).toBe("true");
    expect(fixture.status.hidden).toBe(false);
    expect(fixture.attributes.has("aria-hidden")).toBe(false);
    expect(fixture.attributes.get("role")).toBe("status");
    expect(fixture.attributes.get("aria-live")).toBe("polite");
    expect(fixture.attributes.get("aria-label")).toBe("Closing Lapis Notes");
  });
});
