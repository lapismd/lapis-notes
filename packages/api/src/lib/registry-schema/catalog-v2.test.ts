import { describe, expect, it } from "vitest";
import {
  registryCatalogV2DetailSchema,
  normalizeRegistryCatalogDetail,
  resolveRegistryMedia,
} from "./catalog-v2.js";

const image = (name: string) => ({
  url: `assets/${name}.webp`,
  sourceUrl: `https://source.example/${name}.webp`,
  sha256: "a".repeat(64),
  size: 10,
  mediaType: "image/webp" as const,
  width: 1200,
  height: 800,
});
const detail = {
  schemaVersion: 2,
  id: "lapis-graph",
  name: "Graph",
  description: "Relationships",
  author: "Lapis",
  channel: "official",
  status: "active",
  owner: { name: "Lapis", verified: true },
  latestVersion: "1.0.0",
  appearance: {
    icon: "network",
    accent: "#123456",
    logo: {
      alt: "Logo",
      images: { light: image("light"), dark: image("dark") },
    },
  },
  versions: {
    "1.0.0": {
      version: "1.0.0",
      minAppVersion: "0.1.0",
      releasedAt: "2026-10-11T00:00:00Z",
      platforms: ["web", "mobile"],
      changelog: {
        title: "New graphs",
        description: "**Faster** navigation",
        tags: ["improvement"],
      },
      bundle: {
        url: "https://example.com/graph.lapis-plugin",
        sha256: "b".repeat(64),
        size: 100,
      },
    },
  },
};

describe("transport-neutral registry V2", () => {
  it("preserves authored logo variants without inventing missing variants", () => {
    const parsed = registryCatalogV2DetailSchema.parse(detail);
    expect(parsed.appearance?.logo?.images).toEqual(
      detail.appearance.logo.images,
    );
    expect(parsed.appearance?.logo?.images.full).toBeUndefined();
    expect(resolveRegistryMedia(parsed.appearance!.logo!, "dark")).toEqual(
      image("dark"),
    );
    expect(resolveRegistryMedia(parsed.appearance!.logo!, "full")).toEqual(
      image("light"),
    );
  });
  it("rejects an image set with no usable variant", () => {
    expect(() =>
      registryCatalogV2DetailSchema.parse({
        ...detail,
        media: { banner: { alt: "Banner", images: {} } },
      }),
    ).toThrow();
  });
  it("retains structured notes and extra platform labels", () => {
    const parsed = registryCatalogV2DetailSchema.parse(detail);
    expect(parsed.versions["1.0.0"]?.changelog).toEqual(
      detail.versions["1.0.0"].changelog,
    );
    expect(parsed.versions["1.0.0"]?.platforms).toContain("mobile");
  });
  it("rejects duplicate tags and oversized notes", () => {
    for (const changelog of [
      { title: "Update", tags: ["fix", "fix"] },
      { title: "Update", description: "x".repeat(4001) },
    ]) {
      expect(() =>
        registryCatalogV2DetailSchema.parse({
          ...detail,
          versions: { "1.0.0": { ...detail.versions["1.0.0"], changelog } },
        }),
      ).toThrow();
    }
  });
  it("normalizes legacy detail after verification without carrying Markdown references or proof", () => {
    const legacy = {
      ...detail,
      schemaVersion: 1,
      author: undefined,
      readmeUrl: "https://example.com/readme",
      content: { overview: {} },
      appearance: {
        icon: "network",
        accent: "#123456",
        logo: { ...image("logo"), alt: "Logo" },
      },
    };
    const parsed = normalizeRegistryCatalogDetail(legacy);
    expect(parsed.author).toBe("Lapis");
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.appearance?.logo?.images.full).toEqual(image("logo"));
    expect(parsed).not.toHaveProperty("content");
    expect(parsed).not.toHaveProperty("readmeUrl");
    expect(legacy).toHaveProperty("readmeUrl");
  });
});
