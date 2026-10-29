import { expect, it } from "vitest";
import * as workspace from "../index";

it("exports the existing desktop recovery banner through the shared presentation boundary", () => {
  expect(workspace).toHaveProperty(
    "DesktopRecoveryBanner",
    expect.any(Function),
  );
});

it("keeps the retained Safe Mode actions and host-owned state", async () => {
  const { mount, unmount, tick } = await import("svelte");
  const { vi } = await import("vitest");
  const target = document.createElement("main");
  document.body.append(target);
  const metadata = vi.fn(async () => {}),
    search = vi.fn(async () => {}),
    restart = vi.fn(async () => {});
  const component = mount(workspace.DesktopRecoveryBanner, {
    target,
    props: {
      reasons: ["saved layout restore skipped"],
      lastFailure: "Broken layout",
      onRebuildMetadata: metadata,
      onRebuildSearch: search,
      onRestart: restart,
    },
  });
  try {
    await tick();
    const banner = target.querySelector('[aria-label="Safe Mode"]')!;
    expect(banner.getAttribute("data-desktop-drag-region")).toBe("false");
    expect(banner.textContent).toContain("saved layout restore skipped");
    expect(banner.textContent).toContain("Broken layout");
    const buttons = [...banner.querySelectorAll("button")];
    for (const label of [
      "Rebuild metadata",
      "Rebuild Search",
      "Restart normally",
    ])
      buttons.find((button) => button.textContent?.trim() === label)!.click();
    expect(metadata).toHaveBeenCalledOnce();
    expect(search).toHaveBeenCalledOnce();
    expect(restart).toHaveBeenCalledOnce();
    expect(banner.textContent).not.toContain("Community");
    expect(banner.textContent).not.toContain("notebook");
  } finally {
    await unmount(component);
    target.remove();
  }
});
