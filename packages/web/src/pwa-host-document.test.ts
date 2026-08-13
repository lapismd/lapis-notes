import { describe, expect, it } from "vitest";

import { initializeWebHostDocument } from "./pwa-host-document";

describe("initializeWebHostDocument", () => {
  it("initializes the web runtime before window-controls synchronization", () => {
    initializeWebHostDocument();

    expect(document.documentElement.dataset.pwaHost).toBe("true");
    expect(document.documentElement.dataset.runtime).toBe("web-pwa");
    expect(document.documentElement.dataset.pwaTitlebarHidden).toBe("false");
  });
});
