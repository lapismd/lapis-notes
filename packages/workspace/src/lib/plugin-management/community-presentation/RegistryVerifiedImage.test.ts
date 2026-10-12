import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, unmount, tick } from "svelte";
vi.mock("@lapis-notes/api", () => ({ fetchVerifiedPluginImage: vi.fn() }));
import { fetchVerifiedPluginImage } from "@lapis-notes/api";
import RegistryVerifiedImage from "./RegistryVerifiedImage.svelte";
let component: ReturnType<typeof mount> | null = null;
let target: HTMLDivElement;
const reference = {
  url: "https://fixture.invalid/image.webp",
  sourceUrl: "https://fixture.invalid/image.webp",
  sha256: "a".repeat(64),
  size: 10,
  mediaType: "image/webp" as const,
  width: 640,
  height: 400,
};
afterEach(async () => {
  if (component) await unmount(component);
  component = null;
  target?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function render() {
  target = document.createElement("div");
  document.body.append(target);
  component = mount(RegistryVerifiedImage, {
    target,
    props: { reference, alt: "Graph screenshot", width: 640, height: 400 },
  });
}
describe("verified plugin image presentation", () => {
  it("reserves space and shows a skeleton until image decoding completes", async () => {
    vi.mocked(fetchVerifiedPluginImage).mockResolvedValue(new Blob(["image"]));
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:fixture",
      revokeObjectURL: vi.fn(),
    });
    render();
    await tick();
    await tick();
    expect(
      target.querySelector('[data-ui-component="skeleton"]'),
    ).not.toBeNull();
    expect(
      target.querySelector<HTMLElement>('[data-image-state="loading"]')?.style
        .aspectRatio,
    ).toBe("640 / 400");
    target.querySelector("img")!.dispatchEvent(new Event("load"));
    await tick();
    expect(target.querySelector('[data-ui-component="skeleton"]')).toBeNull();
    expect(target.querySelector('[data-image-state="loaded"]')).not.toBeNull();
  });
  it("shows an empty state when verified fetching fails", async () => {
    vi.mocked(fetchVerifiedPluginImage).mockRejectedValue(
      new Error("not found"),
    );
    render();
    await tick();
    await tick();
    expect(target.querySelector('[data-ui-component="empty"]')).not.toBeNull();
    expect(target.textContent).toContain("Image unavailable");
    expect(target.querySelector('[data-ui-component="skeleton"]')).toBeNull();
  });
  it("shows an empty state when verified bytes fail browser image decoding", async () => {
    vi.mocked(fetchVerifiedPluginImage).mockResolvedValue(
      new Blob(["invalid"]),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:fixture",
      revokeObjectURL: vi.fn(),
    });
    render();
    await tick();
    await tick();
    target.querySelector("img")!.dispatchEvent(new Event("error"));
    await tick();
    expect(target.querySelector('[data-image-state="failed"]')).not.toBeNull();
    expect(target.querySelector('[data-ui-component="empty"]')).not.toBeNull();
    expect(target.querySelector("img")).toBeNull();
  });
});
