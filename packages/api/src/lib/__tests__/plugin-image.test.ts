import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearVerifiedPluginImageCache,
  fetchVerifiedPluginImage,
  sha256Hex,
  type PluginImageReference,
} from "../plugin-distribution";

describe("fetchVerifiedPluginImage", () => {
  beforeEach(() => clearVerifiedPluginImageCache());

  it("verifies media type, byte size, and SHA-256 and caches immutable bytes", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const reference = await imageReference(bytes);
    const fetchImpl = vi.fn(async () => imageResponse(bytes));

    const first = await fetchVerifiedPluginImage(reference, fetchImpl);
    const second = await fetchVerifiedPluginImage(reference, fetchImpl);

    expect(first).toBe(second);
    expect(first.type).toBe("image/png");
    expect(first.size).toBe(bytes.byteLength);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects signed hash, byte-size, and response media mismatches", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const reference = await imageReference(bytes);

    await expect(
      fetchVerifiedPluginImage(
        { ...reference, sha256: "0".repeat(64) },
        async () => imageResponse(bytes),
      ),
    ).rejects.toMatchObject({ code: "hash-mismatch" });
    await expect(
      fetchVerifiedPluginImage(
        { ...reference, size: bytes.byteLength + 1 },
        async () => imageResponse(bytes),
      ),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    await expect(
      fetchVerifiedPluginImage(reference, async () =>
        imageResponse(bytes, "image/webp"),
      ),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
  });

  it("rejects insecure or out-of-bounds references before fetching", async () => {
    const bytes = new Uint8Array([1]);
    const reference = await imageReference(bytes);
    const fetchImpl = vi.fn(async () => imageResponse(bytes));

    await expect(
      fetchVerifiedPluginImage(
        { ...reference, sourceUrl: "http://example.test/image.png" },
        fetchImpl,
      ),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    await expect(
      fetchVerifiedPluginImage(
        { ...reference, width: 5000 },
        fetchImpl,
      ),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not cache a failed request and retries the same reference", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const reference = await imageReference(bytes);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("offline", { status: 503 }))
      .mockResolvedValueOnce(imageResponse(bytes));

    await expect(
      fetchVerifiedPluginImage(reference, fetchImpl),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    await expect(fetchVerifiedPluginImage(reference, fetchImpl)).resolves.toBeInstanceOf(
      Blob,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

async function imageReference(
  bytes: Uint8Array,
): Promise<PluginImageReference> {
  return {
    url: "https://registry.example.test/v1/assets/lapis-example/image.png",
    sourceUrl: "https://raw.githubusercontent.com/lapismd/example/main/image.png",
    sha256: await sha256Hex(bytes),
    size: bytes.byteLength,
    mediaType: "image/png",
    width: 1200,
    height: 800,
  };
}

function imageResponse(
  bytes: Uint8Array,
  mediaType = "image/png",
): Response {
  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": mediaType,
      "content-length": String(bytes.byteLength),
    },
  });
}
