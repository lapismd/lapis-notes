import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearVerifiedPluginMarkdownCache,
  fetchVerifiedPluginMarkdown,
  parsePluginDistributionMetadata,
  pluginCatalogDetailSchema,
  pluginCatalogEntrySchema,
  sha256Hex,
  type PluginMarkdownReference,
} from "../plugin-distribution";

describe("structured plugin catalog metadata", () => {
  it("parses both legacy and enriched V1 metadata while retaining future fields", () => {
    const legacy = parsePluginDistributionMetadata(pluginCatalogEntrySchema, {
      id: "lapis-example",
      name: "Example",
      description: "Legacy entry",
      readmeUrl: "https://example.test/README.md",
      appearance: {
        icon: "sparkles",
        accent: "#A855F7",
      },
      author: "Lapis Notes",
      channel: "official",
      latestVersion: "0.1.0",
      minAppVersion: "0.1.0",
      platforms: ["web"],
      categories: ["example"],
      detail: "plugins/lapis-example.json",
      futureField: { retained: true },
    });
    expect(legacy).toMatchObject({
      readmeUrl: "https://example.test/README.md",
      futureField: { retained: true },
    });

    const enriched = parsePluginDistributionMetadata(pluginCatalogDetailSchema, {
      schemaVersion: 1,
      id: "lapis-example",
      name: "Example",
      description: "Enriched entry",
      channel: "official",
      status: "active",
      owner: {
        name: "Lapis Notes",
        verified: true,
        url: "https://github.com/lapismd",
      },
      latestVersion: "0.1.0",
      license: "AGPL-3.0-or-later",
      links: {
        repository: "https://github.com/lapismd/lapis-plugins",
        documentation: "https://lapis.md/plugins/example",
      },
      highlights: ["A concise plain-text highlight."],
      appearance: {
        icon: "sparkles",
        accent: "#A855F7",
        futureIdentityField: true,
      },
      gallery: [
        {
          id: "overview",
          surface: "desktop",
          alt: "Example plugin overview.",
          caption: "A verified preview.",
          url: "https://registry.example.test/v1/assets/lapis-example/preview.png",
          sourceUrl: "https://raw.githubusercontent.com/lapismd/example/main/preview.png",
          sha256: "c".repeat(64),
          size: 1024,
          mediaType: "image/png",
          width: 1200,
          height: 800,
        },
      ],
      content: {
        overview: referenceFor("overview", 10, "a".repeat(64)),
        changelog: referenceFor("changelog", 12, "b".repeat(64)),
      },
      contributes: { commands: [{ id: "open", name: "Open Example" }] },
      versions: {},
    });
    expect(enriched.status).toBe("active");
    expect(enriched.content?.changelog?.mediaType).toBe("text/markdown");
    expect(enriched.links?.repository).toContain("lapis-plugins");
    expect(enriched.appearance?.icon).toBe("sparkles");
    expect(enriched.gallery?.[0]?.surface).toBe("desktop");
  });
});

describe("fetchVerifiedPluginMarkdown", () => {
  beforeEach(() => clearVerifiedPluginMarkdownCache());

  it("verifies byte size and SHA-256 and caches one immutable reference", async () => {
    const markdown = "# Overview\n\nVerified content.\n";
    const bytes = new TextEncoder().encode(markdown);
    const reference = referenceFor(
      "overview",
      bytes.byteLength,
      await sha256Hex(bytes),
    );
    const fetchImpl = vi.fn(async () => response(bytes));

    await expect(fetchVerifiedPluginMarkdown(reference, fetchImpl)).resolves.toBe(
      markdown,
    );
    await expect(fetchVerifiedPluginMarkdown(reference, fetchImpl)).resolves.toBe(
      markdown,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects signed size and hash mismatches with existing error codes", async () => {
    const bytes = new TextEncoder().encode("# Changed\n");
    await expect(
      fetchVerifiedPluginMarkdown(
        referenceFor("overview", bytes.byteLength + 1, await sha256Hex(bytes)),
        async () => response(bytes),
      ),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    await expect(
      fetchVerifiedPluginMarkdown(
        referenceFor("overview", bytes.byteLength, "0".repeat(64)),
        async () => response(bytes),
      ),
    ).rejects.toMatchObject({ code: "hash-mismatch" });
  });

  it("rejects malformed references, oversized content, and invalid UTF-8", async () => {
    await expect(
      fetchVerifiedPluginMarkdown({
        ...referenceFor("overview", 300_000, "0".repeat(64)),
        url: "http://example.test/overview.md",
      }),
    ).rejects.toMatchObject({ code: "metadata-invalid" });

    const invalidUtf8 = new Uint8Array([0xc3, 0x28]);
    await expect(
      fetchVerifiedPluginMarkdown(
        referenceFor(
          "overview",
          invalidUtf8.byteLength,
          await sha256Hex(invalidUtf8),
        ),
        async () => response(invalidUtf8),
      ),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
  });

  it("does not cache a failed request and can retry the same reference", async () => {
    const bytes = new TextEncoder().encode("# Retry\n");
    const reference = referenceFor(
      "overview",
      bytes.byteLength,
      await sha256Hex(bytes),
    );
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("offline", { status: 503 }))
      .mockResolvedValueOnce(response(bytes));
    await expect(
      fetchVerifiedPluginMarkdown(reference, fetchImpl),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    await expect(fetchVerifiedPluginMarkdown(reference, fetchImpl)).resolves.toBe(
      "# Retry\n",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

function referenceFor(
  kind: "overview" | "changelog",
  size: number,
  sha256: string,
): PluginMarkdownReference {
  return {
    url: `https://registry.example.test/v1/content/lapis-example/${kind}.md`,
    sourceUrl: `https://raw.githubusercontent.com/lapismd/lapis-plugins/${"a".repeat(40)}/packages/example/${kind}.md`,
    sha256,
    size,
    mediaType: "text/markdown",
  };
}

function response(bytes: Uint8Array): Response {
  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-length": String(bytes.byteLength),
    },
  });
}
