import { describe, expect, it } from "vitest";

import {
  classifyVaultFsError,
  decodeVaultTextForBinding,
  toPortableVaultFsError,
} from "./vault-fs";

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

describe("Deno vault filesystem failure classification", () => {
  it.each([
    ["NotFound", "ENOENT"],
    ["PermissionDenied", "EACCES"],
    ["AlreadyExists", "EEXIST"],
    ["NotADirectory", "ENOTDIR"],
    ["IsADirectory", "EISDIR"],
    ["Busy", "EBUSY"],
  ])("maps %s to %s", (name, code) => {
    expect(classifyVaultFsError(Object.assign(new Error(name), { name }))).toBe(
      code,
    );
  });

  it("retains an existing portable code and the complete absolute target", () => {
    const error = toPortableVaultFsError(
      Object.assign(new Error("denied"), { code: "EPERM" }),
      "/Users/example/Desktop/notes",
    );
    expect(error.code).toBe("EPERM");
    expect(error.message).toContain("/Users/example/Desktop/notes");
  });

  it("reports unknown native failures as I/O errors instead of missing paths", () => {
    expect(classifyVaultFsError(new Error("native host unavailable"))).toBe(
      "EIO",
    );
  });
});
