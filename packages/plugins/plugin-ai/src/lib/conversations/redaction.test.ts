import { describe, expect, it } from "vitest";
import { MAX_DURABLE_FIELD_BYTES, sanitizeDurableField } from "./redaction";

describe("durable transcript redaction", () => {
  it("removes environment maps, credentials, known secrets, and local roots", () => {
    const result = sanitizeDurableField(
      {
        command: "curl -H 'Authorization: Bearer abc.def' /Users/me/vault",
        env: { OPENAI_API_KEY: "top-secret" },
        password: "hunter2",
        output: "workspace=/Users/me/work secret-value",
      },
      {
        vaultRoot: "/Users/me/vault",
        workspaceRoot: "/Users/me/work",
        knownSecrets: ["secret-value"],
      },
    );

    expect(result.redacted).toBe(true);
    expect(result.text).toContain("<vault>");
    expect(result.text).toContain("<workspace>");
    expect(result.text).not.toContain("abc.def");
    expect(result.text).not.toContain("top-secret");
    expect(result.text).not.toContain("hunter2");
    expect(result.text).not.toContain("secret-value");
  });

  it("bounds each durable field to 64 KiB and records truncation", () => {
    const result = sanitizeDurableField("x".repeat(80 * 1024));
    expect(result.truncated).toBe(true);
    expect(
      new TextEncoder().encode(result.text).byteLength,
    ).toBeLessThanOrEqual(MAX_DURABLE_FIELD_BYTES);
    expect(result.text?.endsWith("...[truncated]")).toBe(true);
  });
});
