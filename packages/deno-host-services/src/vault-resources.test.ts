import { describe, expect, it, vi } from "vitest";

import { DenoVaultResourceService } from "./vault-resources";

const source = Uint8Array.from([80, 75, 0, 4, 255]);

describe("Deno vault resources", () => {
  it("returns encoded same-origin URLs and serves binary bytes", async () => {
    const stat = vi.fn(async () => ({
      isFile: true,
      size: source.byteLength,
    }));
    const service = new DenoVaultResourceService({
      stat,
      readFile: vi.fn(async () => source),
    });
    const url = service.getUrl({
      rootPath: "/vault",
      normalizedPath: "Attachments/Project brief #1.docx",
    });

    expect(url).toMatch(
      /^\/__lapis\/vault-resources\/[0-9a-f-]{36}\/Attachments\/Project%20brief%20%231\.docx$/u,
    );

    const response = await service.respond(
      new Request(`http://127.0.0.1${url}`),
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(response?.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(response?.headers.get("cross-origin-resource-policy")).toBe(
      "same-origin",
    );
    expect(response?.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response!.arrayBuffer())).toEqual(source);
    expect(stat).toHaveBeenCalledWith(
      "/vault/Attachments/Project brief #1.docx",
    );
  });

  it("rejects traversal and unknown or cleared capabilities", async () => {
    const service = new DenoVaultResourceService({
      stat: vi.fn(async () => ({ isFile: true, size: source.byteLength })),
      readFile: vi.fn(async () => source),
    });

    expect(() =>
      service.getUrl({
        rootPath: "/vault",
        normalizedPath: "../secret.pdf",
      }),
    ).toThrow("EINVAL");

    const unknown = await service.respond(
      new Request(
        "http://127.0.0.1/__lapis/vault-resources/00000000-0000-4000-8000-000000000000/file.pdf",
      ),
    );
    expect(unknown?.status).toBe(404);

    const url = service.getUrl({
      rootPath: "/vault",
      normalizedPath: "file.pdf",
    });
    service.clear();
    const cleared = await service.respond(
      new Request(`http://127.0.0.1${url}`),
    );
    expect(cleared?.status).toBe(404);
  });

  it("uses the same headers without a binary body for HEAD", async () => {
    const service = new DenoVaultResourceService({
      stat: vi.fn(async () => ({ isFile: true, size: source.byteLength })),
      readFile: vi.fn(async () => source),
    });
    const url = service.getUrl({
      rootPath: "/vault",
      normalizedPath: "document.pdf",
    });
    const response = await service.respond(
      new Request(`http://127.0.0.1${url}`, { method: "HEAD" }),
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-length")).toBe(
      String(source.byteLength),
    );
    expect(response?.headers.get("content-type")).toBe("application/pdf");
    expect((await response!.arrayBuffer()).byteLength).toBe(0);
  });
});
