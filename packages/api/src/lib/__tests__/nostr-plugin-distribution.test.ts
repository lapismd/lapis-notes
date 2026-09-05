import { describe, expect, it, vi } from "vitest";
import { Zip, ZipDeflate } from "fflate";
import {
  createNostrPluginRegistryAdapter,
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
          plugins: [catalogEntry],
        }),
        loadPluginDetail: async () => detail,
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
      return {
        pluginId: "community-clock",
        version: "1.2.3",
        authorizationEventId: "authorization-event",
        releaseEventId: "release-event",
        decisionEventId: "decision-event",
        manifestSha256,
        artifactSha256: await sha256Hex(options.artifact),
        artifactSize: options.artifact.byteLength,
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
    else chunks.push(chunk);
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
