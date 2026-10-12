import { verifyEvent } from "nostr-tools/pure";
import { describe, expect, it, vi } from "vitest";

import type { App } from "../context.svelte";
import { Plugin, type PluginManifest } from "../plugin";
import type { HostedPluginCapability } from "../plugin-capability-facade";
import { SyncHostService, type HostChangeCursor } from "../sync-host";
import { MemoryAppDatabase, MemoryVaultAdapter, Vault } from "../storage";

const manifest: PluginManifest = {
  id: "sync-harness",
  name: "Sync harness",
  version: "1.0.0",
  minAppVersion: "0.0.0",
  description: "Exercises the public sync-host facade.",
  author: "Lapis Notes",
};

const grants: HostedPluginCapability[] = [
  "metadata:identity",
  "metadata:changes",
  "vault:stream",
  "plugin:generated-state",
  "network:connect",
  "crypto:nostr-sync",
];

class SyncHarnessPlugin extends Plugin {
  constructor(
    service: SyncHostService,
    readonly observations: Record<string, unknown> = {},
  ) {
    super({} as App, manifest);
    this.configureRuntime({
      source: "official",
      requestedCapabilities: grants,
      grantedCapabilities: grants,
      createSyncHostCapabilities: () => service.forPlugin(this.id, grants),
      revokeSyncHostCapabilities: () => service.revokePlugin(this.id),
    });
  }

  async onload(): Promise<void> {
    const initial = await this.syncHost.files.listChangedSince();
    const identity = await this.syncHost.files.getIdentity("notes/a.md");
    if (!identity) throw new Error("Harness seed identity is missing");

    const read = await this.syncHost.vault.openRead("notes/a.md");
    this.observations.content = await new Response(read.stream()).text();
    this.observations.fileId = identity.fileId;
    this.observations.cursor = initial.nextCursor;

    const encrypted = await this.syncHost.crypto.encryptObject({
      epoch: 1,
      type: "file-content",
      plaintext: new TextEncoder().encode("encrypted by host"),
    });
    this.observations.decrypted = new TextDecoder().decode(
      await this.syncHost.crypto.decryptObject({
        epoch: 1,
        type: "file-content",
        envelope: encrypted.bytes,
      }),
    );
    this.observations.signed = await this.syncHost.crypto.signEvent({
      kind: 78,
      created_at: 1,
      tags: [["d", "opaque"]],
      content: "encrypted",
    });

    await this.syncHost.network.requestOriginGrant("https://relay.example");
    const response = await this.syncHost.network.request({
      url: "https://relay.example/info",
    });
    this.observations.network = await response.text();

    const origin = await this.syncHost.origins.create();
    await this.syncHost.vault.atomicWrite(
      "notes/a.md",
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("own write"));
          controller.close();
        },
      }),
      {
        origin,
        expectedFileId: identity.fileId,
        expectedContentGeneration: identity.contentGeneration,
      },
    );

    const revision = await this.syncHost.generatedState.getRevision();
    const persisted = await this.syncHost.generatedState.transact({
      expectedRevision: revision,
      expectedSchemaVersion: 0,
      schemaVersion: 1,
      mutations: [
        {
          type: "set",
          key: "outbox",
          value: { cursor: initial.nextCursor, fileId: identity.fileId },
        },
      ],
    });
    if (!persisted.applied) throw new Error("Harness state transaction failed");
  }

  async changesSince(cursor: HostChangeCursor) {
    return this.syncHost.files.listChangedSince(cursor);
  }
}

describe("public sync-host plugin harness", () => {
  it("recovers durable facade state and own-origin changes across plugin restart", async () => {
    let now = 100;
    const database = new MemoryAppDatabase("sync-host-plugin-harness");
    await database.open();
    const vault = new Vault(
      new MemoryVaultAdapter(
        { "notes/a.md": "seed" },
        { vaultId: "sync-host-plugin-harness", clock: () => ++now },
      ),
    );
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("relay ok"));
    const grantMock = vi.fn(async () => true);
    const service = new SyncHostService(database, vault, () => ++now, {
      security: {
        fetch: fetchMock,
        argon2: { timeCost: 1, memoryKiB: 32, parallelism: 1 },
      },
      requestNetworkOriginGrant: grantMock,
    });
    await service.ready();
    await service.enrollPluginCrypto("sync-harness", "harness passphrase");

    const first = new SyncHarnessPlugin(service);
    await first.onload();
    expect(first.observations).toMatchObject({
      content: "seed",
      decrypted: "encrypted by host",
      network: "relay ok",
    });
    expect(verifyEvent(first.observations.signed as Parameters<typeof verifyEvent>[0])).toBe(
      true,
    );
    expect(grantMock).toHaveBeenCalledWith({
      pluginId: "sync-harness",
      origin: "https://relay.example",
      allowPrivateNetwork: false,
    });

    const cursor = first.observations.cursor as HostChangeCursor;
    const fileId = first.observations.fileId as string;
    service.revokePlugin(first.id);
    await expect(first.syncHost.files.getIdentity("notes/a.md")).rejects.toThrow(
      /revoked/,
    );

    const restarted = new SyncHarnessPlugin(service);
    const recovered = await restarted.syncHost.generatedState.get<{
      cursor: HostChangeCursor;
      fileId: string;
    }>("outbox");
    expect(recovered?.value).toEqual({ cursor, fileId });
    await expect(restarted.changesSince(cursor)).resolves.toMatchObject({
      changes: [expect.objectContaining({ selfOriginated: true })],
    });

    await vault.rename(vault.getFileByPath("notes/a.md")!, "archive/a.md");
    await service.ready();
    await expect(
      restarted.syncHost.files.getIdentity("archive/a.md"),
    ).resolves.toMatchObject({ fileId });

    const other = service.forPlugin("other-plugin", [
      "plugin:generated-state",
    ]);
    await expect(other.generatedState.get("outbox")).resolves.toBeNull();
    const stored = await database.scanMeta({ prefix: "sync-host:v1:" });
    expect(JSON.stringify(stored.entries)).not.toMatch(
      /harness passphrase|encrypted by host/,
    );
  });
});
