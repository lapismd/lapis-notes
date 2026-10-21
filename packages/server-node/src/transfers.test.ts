import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { ServerHostError } from "@lapis-notes/api/server-host";

import { safeArchiveEntries } from "./transfers.ts";

describe("vault ZIP safety", () => {
  it("accepts normalized files and preserves binary bytes", () => {
    const entries = safeArchiveEntries(
      zipSync({
        "notes/welcome.md": strToU8("Welcome"),
        "image.bin": new Uint8Array([0, 1, 2]),
      }),
    );
    expect(new TextDecoder().decode(entries.get("notes/welcome.md"))).toBe(
      "Welcome",
    );
    expect([...entries.get("image.bin")!]).toEqual([0, 1, 2]);
  });

  it.each(["../escape.md", "/absolute.md", "folder/../../escape.md"])(
    "rejects unsafe entry %s",
    (path) => {
      expect(() =>
        safeArchiveEntries(zipSync({ [path]: strToU8("unsafe") })),
      ).toThrow(ServerHostError);
    },
  );

  it("rejects malformed archives", () => {
    expect(() => safeArchiveEntries(strToU8("not a zip"))).toThrow(
      "Invalid ZIP archive",
    );
  });
});
