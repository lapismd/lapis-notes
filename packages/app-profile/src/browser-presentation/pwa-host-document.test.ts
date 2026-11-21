// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { initializePwaHostDocument } from "./pwa-host-document";

describe("initializePwaHostDocument", () => {
  it.each(["web-pwa", "rust-server"] as const)(
    "initializes the %s runtime before window-controls synchronization",
    (runtime) => {
      initializePwaHostDocument(runtime);

      expect(document.documentElement.dataset.pwaHost).toBe("true");
      expect(document.documentElement.dataset.runtime).toBe(runtime);
      expect(document.documentElement.dataset.pwaTitlebarHidden).toBe("false");
    },
  );
});
