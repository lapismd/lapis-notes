import { describe, expect, it } from "vitest";
import { InMemoryDataAdapter } from "./data-adapter-conformance";
import { MemoryKeyValueStore } from "../storage/vault-state";
import { WorkspaceTrustService } from "../workspace-trust";

describe("WorkspaceTrustService", () => {
  it("persists trust state per workspace identity", async () => {
    const store = new MemoryKeyValueStore();
    const adapter = new InMemoryDataAdapter();
    const trust = new WorkspaceTrustService(adapter, store);

    await expect(trust.ready()).resolves.toMatchObject({
      identity: "adapter:memory",
      trusted: true,
      updatedAt: null,
    });

    const granted = await trust.grant();
    expect(granted.trusted).toBe(true);
    expect(typeof granted.updatedAt).toBe("number");

    const reloaded = new WorkspaceTrustService(adapter, store);
    await expect(reloaded.ready()).resolves.toMatchObject({
      identity: "adapter:memory",
      trusted: true,
    });

    await reloaded.revoke();
    const revoked = new WorkspaceTrustService(adapter, store);
    await expect(revoked.ready()).resolves.toMatchObject({
      identity: "adapter:memory",
      trusted: false,
    });
  });

  it("emits request and changed events", async () => {
    const store = new MemoryKeyValueStore();
    const adapter = new InMemoryDataAdapter();
    const trust = new WorkspaceTrustService(adapter, store);
    const requested: Array<{ reason?: string; pluginId?: string | null }> = [];
    const changed: boolean[] = [];

    trust.on("requested", (request) => {
      requested.push({
        reason: request.reason,
        pluginId: request.pluginId ?? null,
      });
    });
    trust.on("changed", (state) => {
      changed.push(state.trusted);
    });

    await trust.revoke();
    await expect(
      trust.request({
        reason: "desktop runtime",
        pluginId: "desktop-runtime",
      }),
    ).resolves.toBe(false);
    expect(requested).toEqual([
      { reason: "desktop runtime", pluginId: "desktop-runtime" },
    ]);

    await expect(trust.grant()).resolves.toMatchObject({ trusted: true });
    await expect(trust.request({ reason: "already trusted" })).resolves.toBe(
      true,
    );
    await expect(trust.revoke()).resolves.toMatchObject({ trusted: false });

    expect(changed).toEqual([false, true, false]);
  });
});
