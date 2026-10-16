import { mount, unmount, tick } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesktopVaultLauncher, DesktopWorkspaceStartup } from "./index";

const mounted: ReturnType<typeof mount>[] = [];
afterEach(async () => {
  for (const component of mounted.splice(0)) await unmount(component);
  document.body.replaceChildren();
});

function render(props: Record<string, unknown> = {}) {
  const target = document.createElement("main");
  document.body.append(target);
  const onCreate = vi.fn(async () => {});
  const onOpen = vi.fn(async () => {});
  const onOpenRecent = vi.fn(async () => {});
  const host = {
    listProfiles: vi.fn(async () => []),
    getAppearance: vi.fn(async () => "system" as const),
    saveAppearance: vi.fn(async () => {}),
  };
  mounted.push(
    mount(DesktopVaultLauncher, {
      target,
      props: {
        status: "landing",
        host,
        onCreate,
        onOpen,
        onOpenRecent,
        ...props,
      },
    }),
  );
  return { target, host, onCreate, onOpen, onOpenRecent };
}

describe("shared desktop presentation", () => {
  it("exports the Deno chooser and startup through the public package", () => {
    expect(DesktopVaultLauncher).toBeTypeOf("function");
    expect(DesktopWorkspaceStartup).toBeTypeOf("function");
  });
  it("retains Deno branding, actions and drag exclusions", async () => {
    const { target, onCreate, onOpen } = render();
    await tick();
    await vi.waitFor(() =>
      expect(target.textContent).toContain("Create a vault"),
    );
    expect(target.textContent).toContain("New Desktop Vault");
    expect(target.textContent).toContain("Recent Projects");
    expect(
      target
        .querySelector("[data-desktop-vault-launcher]")
        ?.hasAttribute("data-desktop-drag-region"),
    ).toBe(true);
    expect(
      target
        .querySelector("[data-desktop-vault-launcher-content]")
        ?.getAttribute("data-desktop-drag-region"),
    ).toBe("false");
    const buttons = [...target.querySelectorAll("button")];
    buttons
      .find((button) => button.textContent?.includes("Create New Vault"))!
      .click();
    buttons
      .find((button) => button.textContent?.includes("Open Vault"))!
      .click();
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledOnce();
    expect(target.textContent).not.toContain("Open notes");
  });
  it("loads host-owned recent profiles and reopens their plain records", async () => {
    const profile = {
      id: "first",
      name: "Café",
      kind: "desktop-folder",
      handle: { rootPath: "/notes/café" },
      createdAt: 1,
      updatedAt: 1,
    };
    const { target, onOpenRecent } = render({
      host: {
        listProfiles: async () => [profile],
        getAppearance: async () => "system",
        saveAppearance: async () => {},
      },
    });
    await vi.waitFor(() => expect(target.textContent).toContain("Café"));
    expect(target.querySelector("h1")?.textContent).toContain("Open a vault");
    target
      .querySelector<HTMLButtonElement>("[data-ui-part='recent-open']")!
      .click();
    expect(onOpenRecent).toHaveBeenCalledWith(profile);
    expect(
      target.querySelector("[aria-label='Open actions for Café']"),
    ).toBeNull();
  });
  it("keeps host failures visible without inventing another screen", async () => {
    const { target } = render({ errorMessage: "Folder is unavailable" });
    await tick();
    expect(target.querySelector("[role='alert']")?.textContent).toContain(
      "Folder is unavailable",
    );
    expect(target.textContent).toContain("Create New Vault");
  });
});
