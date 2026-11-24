import { describe, expect, it, vi } from "vitest";
import { bindPluginSecrets } from "../plugin-secrets";

describe("plugin secret sessions", () => {
  it("opens one scope and revokes saved capabilities on close", async () => {
    const get = vi.fn(async () => "fixture");
    const close = vi.fn();
    const open = vi.fn(async () => ({
      secrets: { get, set: vi.fn(), delete: vi.fn() },
      close,
    }));
    const lease = bindPluginSecrets(
      { allows: () => true, open },
      "fixture-plugin",
    );
    const facade = lease.secrets;
    await expect(facade.get("token")).resolves.toBe("fixture");
    await expect(facade.get("token")).resolves.toBe("fixture");
    expect(open).toHaveBeenCalledExactlyOnceWith("fixture-plugin");
    await lease.close();
    await expect(facade.get("token")).rejects.toThrow("closed");
    expect(get).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed names and refuses to contact the host after approval is revoked", async () => {
    const open = vi.fn();
    let allowed = true;
    const lease = bindPluginSecrets(
      { allows: () => allowed, open },
      "fixture-plugin",
    );
    await expect(lease.secrets.get("../native/token")).rejects.toThrow("name");
    await expect(lease.secrets.set("token", "a".repeat(32769))).rejects.toThrow(
      "limit",
    );
    allowed = false;
    await expect(lease.secrets.get("token")).rejects.toThrow("unavailable");
    expect(open).not.toHaveBeenCalled();
  });
});
