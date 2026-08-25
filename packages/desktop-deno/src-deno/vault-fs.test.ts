import { describe, expect, it } from "vitest";

import { decodeVaultTextForBinding } from "./vault-fs";

describe("Deno vault filesystem text responses", () => {
  it("decodes ordinary UTF-8 text", () => {
    expect(
      decodeVaultTextForBinding(
        new TextEncoder().encode("# Project notes\n"),
        "/vault/Project.md",
      ),
    ).toBe("# Project notes\n");
  });

  it("rejects NUL-bearing binary data before it reaches Laufey", () => {
    expect(() =>
      decodeVaultTextForBinding(
        Uint8Array.from([37, 80, 68, 70, 45, 0, 255]),
        "/vault/attachment.pdf",
      ),
    ).toThrow("EILSEQ");
  });
});
