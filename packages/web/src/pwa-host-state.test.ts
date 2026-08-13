import { get } from "svelte/store";
import { describe, expect, it } from "vitest";

import { createPwaHostStateController } from "./pwa-host-state";

describe("pwa host state controller", () => {
  it("tracks pending updates with dismiss and reopen semantics", () => {
    const controller = createPwaHostStateController();

    controller.announceUpdateAvailable();
    expect(get(controller)).toMatchObject({
      updateAvailable: true,
      updatePromptVisible: true,
      updateApplying: false,
    });

    controller.dismissUpdatePrompt();
    expect(get(controller).updatePromptVisible).toBe(false);

    controller.reopenUpdatePrompt();
    expect(get(controller).updatePromptVisible).toBe(true);
  });

  it("tracks offline readiness independently from the current connection", () => {
    const controller = createPwaHostStateController();

    controller.setOnline(false);
    controller.markOfflineReady();
    expect(get(controller)).toMatchObject({ offline: true, offlineReady: true });

    controller.setOnline(true);
    expect(get(controller)).toMatchObject({ offline: false, offlineReady: true });
  });
});
