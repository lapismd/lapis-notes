import { describe, expect, it } from "vitest";

import {
  LAPIS_SERVER_PROTOCOL_MAJOR,
  ServerHostError,
  VaultConflictError,
} from "./server-host";

describe("server host contracts", () => {
  it("uses a positive integer protocol major", () => {
    expect(Number.isSafeInteger(LAPIS_SERVER_PROTOCOL_MAJOR)).toBe(true);
    expect(LAPIS_SERVER_PROTOCOL_MAJOR).toBeGreaterThan(0);
  });

  it("provides stable typed conflict errors", () => {
    const error = new VaultConflictError();
    expect(error).toBeInstanceOf(ServerHostError);
    expect(error.code).toBe("CONFLICT");
    expect(error.name).toBe("VaultConflictError");
  });
});
