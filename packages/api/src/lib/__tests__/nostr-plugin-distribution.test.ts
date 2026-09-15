import { describe, expect, it, vi } from "vitest";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import {
  createNostrPluginRegistryAdapter,
  parseNostrPluginBundle,
  sha256Hex,
  verifyNostrPluginPayload,
  type NostrReleaseProofVerifier,
  type PluginCatalogDetail,
  type PluginCatalogEntry,
  type PluginReleaseManifest,
  type PluginRegistrySource,
} from "../plugin-distribution";

describe("Nostr plugin distribution", () => {
  it("verifies a rootless plugin payload against the curated Nostr manifest", async () => {
    const fixture = await createNostrFixture();

    await expect(
      verifyNostrPluginPayload({
        artifact: fixture.artifact,
        proof: fixture.proof,
        trustedCuratorPubkeys: new Set([fixture.curatorPubkey]),
        verifyReleaseProof: fixture.verifyReleaseProof,
      }),
    ).resolves.toMatchObject({
      releaseManifest: {
        pluginId: "community-clock",
        version: "1.2.3",
        channel: "community",
      },
      releaseEnvelope: { signatures: [] },
      nostrProof: {
        authorizationEventId: "authorization-event",
        releaseEventId: "release-event",
        decisionEventId: "decision-event",
        requiresRelayRefresh: true,
      },
    });
  });

  it("rejects tampered and undeclared payload files", async () => {
    const fixture = await createNostrFixture();
    const tamperedArtifact = createPayload(
      new Map([
        ["manifest.json", fixture.files.get("manifest.json")!],
        ["main.mjs", "export default 'tampered';"],
      ]),
    );
    const extraArtifact = createPayload(
      new Map([...fixture.files, ["undeclared.txt", "not curated"]]),
    );

    await expect(
      verifyNostrPluginPayload({
        artifact: tamperedArtifact,
        proof: fixture.proof,
        trustedCuratorPubkeys: new Set([fixture.curatorPubkey]),
        verifyReleaseProof: fixture.verifyReleaseProof,
      }),
    ).rejects.toMatchObject({ code: "hash-mismatch" });
    await expect(
      verifyNostrPluginPayload({
        artifact: extraArtifact,
        proof: fixture.proof,
        trustedCuratorPubkeys: new Set([fixture.curatorPubkey]),
        verifyReleaseProof: fixture.verifyReleaseProof,
      }),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
  });

  it("adapts a relay catalog into the host source and install contracts", async () => {
    const fixture = await createNostrFixture();
    const loadReleaseProof = vi.fn(async () => fixture.proof);
    const source: PluginRegistrySource = {
      id: "community-nostr",
      name: "Community plugins",
      kind: "nostr",
      url: "nostr://community-plugins",
      relays: ["wss://one.example", "wss://two.example"],
      curatorPubkeys: [fixture.curatorPubkey],
      installQuorum: 2,
      trustTier: "community",
      enabled: true,
    };
    const catalogEntry: PluginCatalogEntry = {
      id: "community-clock",
      name: "Community Clock",
      description: "Shows the time",
      author: "Example Publisher",
      channel: "community",
      latestVersion: "1.2.3",
      minAppVersion: "0.20.0",
      platforms: ["web"],
      categories: ["utility"],
      badges: ["verified"],
      detail: "nostr:release-event",
    };
    const detail: PluginCatalogDetail = {
      schemaVersion: 1,
      id: catalogEntry.id,
      name: catalogEntry.name,
      description: catalogEntry.description,
      channel: "community",
      owner: { name: catalogEntry.author, verified: true },
      latestVersion: "1.2.3",
      versions: {
        "1.2.3": {
          version: "1.2.3",
          minAppVersion: "0.20.0",
          releasedAt: "2026-09-05T00:00:00.000Z",
          platforms: ["web"],
          bundle: {
            url: "ipfs://payload-cid",
            downloadUrl: "https://cdn.example/community-clock-1.2.3.zip",
            sha256: await sha256Hex(fixture.artifact),
            size: fixture.artifact.byteLength,
          },
        },
      },
    };
    const adapter = createNostrPluginRegistryAdapter({
      catalogSource: {
        loadIndex: async () => ({
          schemaVersion: 1,
          generatedAt: "2026-09-05T00:00:00.000Z",
          plugins: [
            {
              ...catalogEntry,
              readmeUrl: "nostr://readme-event",
            },
          ],
        }),
        loadPluginDetail: async () => ({
          ...detail,
          readmeUrl: "README.md",
        }),
        loadReleaseProof,
        getStatus: () => ({ installReady: true, fresh: true }),
      },
      verifyReleaseProof: fixture.verifyReleaseProof,
      fetch: async () => new Response(fixture.artifact),
    });

    await expect(adapter.refresh(source)).resolves.toMatchObject({
      installReady: true,
      stale: false,
      index: { plugins: [{ id: "community-clock" }] },
    });
    await expect(adapter.refresh(source)).resolves.toMatchObject({
      index: { plugins: [expect.not.objectContaining({ readmeUrl: expect.anything() })] },
    });
    await expect(adapter.getDetail(source, catalogEntry)).resolves.toEqual(
      expect.not.objectContaining({ readmeUrl: expect.anything() }),
    );
    const verified = await adapter.getVerifiedBundle!(
      source,
      catalogEntry,
      detail,
      "1.2.3",
    );
    expect(new TextDecoder().decode(verified.files.get("main.mjs"))).toBe(
      fixture.files.get("main.mjs"),
    );
    expect(loadReleaseProof).toHaveBeenCalledWith(
      "community-clock",
      "1.2.3",
      { signal: undefined },
    );
    expect(verified.nostrProof?.requiresRelayRefresh).toBe(false);
  });

  it("verifies a portable offline container and preserves its freshness warning", async () => {
    const fixture = await createNostrFixture();
    const source: PluginRegistrySource = {
      id: "community-nostr",
      name: "Community plugins",
      kind: "nostr",
      url: "nostr://community-plugins",
      curatorPubkeys: [fixture.curatorPubkey],
      trustTier: "community",
      enabled: true,
    };
    const adapter = createNostrPluginRegistryAdapter({
      catalogSource: {
        loadIndex: async () => ({ schemaVersion: 1, generatedAt: "", plugins: [] }),
        loadPluginDetail: async () => ({}),
        loadReleaseProof: async () => fixture.proof,
        getStatus: () => ({ installReady: true, fresh: true }),
      },
      verifyReleaseProof: fixture.verifyReleaseProof,
    });
    const portable = parseNostrPluginBundle(
      createOfflineBundle(fixture.proof, fixture.artifact),
    );

    expect(portable).not.toBeNull();
    await expect(
      adapter.verifyOfflineBundle!(source, portable!),
    ).resolves.toMatchObject({
      releaseManifest: { pluginId: "community-clock", version: "1.2.3" },
      nostrProof: { requiresRelayRefresh: true },
    });

    await expect(
      adapter.revalidateInstalledProof!(source, {
        pluginId: "community-clock",
        installedVersion: "1.2.3",
        installedAt: "2026-09-05T00:00:00.000Z",
        updatedAt: "2026-09-05T00:00:00.000Z",
        provenance: "community",
        registryId: source.id,
        files: [],
        nostrProof: {
          authorizationEventId: "authorization-event",
          releaseEventId: "release-event",
          decisionEventId: "decision-event",
          manifestSha256: fixture.manifestSha256,
          artifactSha256: await sha256Hex(fixture.artifact),
          artifactSize: fixture.artifact.byteLength,
          requiresRelayRefresh: true,
        },
      }),
    ).resolves.toMatchObject({
      releaseEventId: "release-event",
      artifactSha256: await sha256Hex(fixture.artifact),
      requiresRelayRefresh: false,
    });
  });
});

const createNostrFixture = async () => {
  const files = new Map([
    [
      "manifest.json",
      JSON.stringify({
        id: "community-clock",
        name: "Community Clock",
        version: "1.2.3",
        minAppVersion: "0.20.0",
      }),
    ],
    ["main.mjs", "export default class CommunityClock {}"],
  ]);
  const releaseManifest: PluginReleaseManifest = {
    schemaVersion: 1,
    type: "lapis.plugin.release",
    pluginId: "community-clock",
    version: "1.2.3",
    channel: "community",
    compatibility: {
      minAppVersion: "0.20.0",
      platforms: ["web"],
    },
    files: await Promise.all(
      [...files].map(async ([path, content]) => ({
        path,
        sha256: await sha256Hex(content),
        size: new TextEncoder().encode(content).byteLength,
      })),
    ),
  };
  const artifact = createPayload(files);
  const curatorPubkey = "a".repeat(64);
  const proof = { version: 2, releaseEvent: { id: "release-event" } };
  const manifestSha256 = await sha256Hex(JSON.stringify(releaseManifest));
  const verifyReleaseProof: NostrReleaseProofVerifier = vi.fn(
    async (_proof, options) => {
      expect(options.trustedCuratorPubkeys).toEqual(new Set([curatorPubkey]));
      const artifact =
        options.artifact instanceof Uint8Array
          ? {
              sha256: await sha256Hex(options.artifact),
              size: options.artifact.byteLength,
            }
          : options.artifact;
      return {
        pluginId: "community-clock",
        version: "1.2.3",
        authorizationEventId: "authorization-event",
        releaseEventId: "release-event",
        decisionEventId: "decision-event",
        manifestSha256,
        artifactSha256: artifact.sha256,
        artifactSize: artifact.size,
        requiresRelayRefresh: true,
        manifest: { release: { metadata: { lapisRelease: releaseManifest } } },
      };
    },
  );
  return {
    artifact,
    curatorPubkey,
    files,
    manifestSha256,
    proof,
    releaseManifest,
    verifyReleaseProof,
  };
};

const createPayload = (files: Map<string, string>): Uint8Array => {
  const chunks: Uint8Array[] = [];
  let zipError: unknown;
  const zip = new Zip((error, chunk) => {
    if (error) zipError = error;
    else chunks.push(new Uint8Array(chunk));
  });
  for (const [path, content] of files) {
    const stream = new ZipDeflate(path, { level: 6 });
    stream.mtime = new Date(1980, 0, 1, 0, 0, 0);
    zip.add(stream);
    stream.push(new TextEncoder().encode(content), true);
  }
  zip.end();
  if (zipError) throw zipError;
  const output = new Uint8Array(
    chunks.reduce((size, chunk) => size + chunk.byteLength, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

const createOfflineBundle = (proof: unknown, payload: Uint8Array): Uint8Array => {
  const chunks: Uint8Array[] = [];
  let zipError: unknown;
  const zip = new Zip((error, chunk) => {
    if (error) zipError = error;
    else chunks.push(new Uint8Array(chunk));
  });
  for (const [path, bytes, deflate] of [
    [
      "release.nostr.json",
      new TextEncoder().encode(JSON.stringify(proof)),
      false,
    ],
    ["payload.zip", payload, true],
  ] as const) {
    const stream = deflate
      ? new ZipDeflate(path, { level: 6 })
      : new ZipPassThrough(path);
    stream.mtime = new Date(1980, 0, 1, 0, 0, 0);
    zip.add(stream);
    stream.push(bytes, true);
  }
  zip.end();
  if (zipError) throw zipError;
  const output = new Uint8Array(
    chunks.reduce((size, chunk) => size + chunk.byteLength, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};
