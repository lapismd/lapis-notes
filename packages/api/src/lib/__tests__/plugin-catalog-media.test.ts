import { expect, it } from "vitest";
import { fetchVerifiedPluginImage, sha256Hex } from "../plugin-distribution";

it("verifies image bytes before creating a Blob and rejects tampering and oversized streams", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const reference = {
    url: "https://registry.example/image.webp",
    sourceUrl: "https://source.example/image.webp",
    sha256: await sha256Hex(bytes),
    size: 3,
    mediaType: "image/webp" as const,
    width: 1,
    height: 1,
  };
  const fetchBytes = (body: Uint8Array) =>
    (async () => new Response(body)) as typeof fetch;
  const blob = await fetchVerifiedPluginImage(reference, fetchBytes(bytes));
  expect(blob.size).toBe(3);
  expect(blob.type).toBe("image/webp");
  await expect(
    fetchVerifiedPluginImage(reference, fetchBytes(new Uint8Array([3, 2, 1]))),
  ).rejects.toMatchObject({ code: "hash-mismatch" });
  await expect(
    fetchVerifiedPluginImage(
      reference,
      fetchBytes(new Uint8Array([1, 2, 3, 4])),
    ),
  ).rejects.toMatchObject({ code: "metadata-invalid" });
});
