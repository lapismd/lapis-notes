import { describe, expect, it } from "vitest";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import {
  bytesToBase64,
  canonicalJson,
  DefaultPluginDistributionManager,
  sha256Hex,
  type PluginBinaryFetch,
  type PluginCatalogDetail,
  type PluginCatalogIndex,
  type PluginInstallProgressEvent,
  type PluginReleaseManifest,
  type PluginRevocationIndex,
  type SignatureRecord,
  type SignedEnvelope,
  type TrustedSigningKey,
} from "../plugin-distribution";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

describe("DefaultPluginDistributionManager", () => {
  it("refreshes, installs, and emits progress phases", async () => {
    const fixture = await createManagerFixture();
    const events: PluginInstallProgressEvent[] = [];
    const managerCalls: string[] = [];
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
      pluginManager: {
        loadPlugin: async (pluginPath) => {
          managerCalls.push(`load:${pluginPath}`);
          return {};
        },
        enablePlugin: async (pluginId) => {
          managerCalls.push(`enable:${pluginId}`);
          return true;
        },
      },
    });
    manager.addProgressListener((event) => events.push(event));

    await manager.refreshCatalog();
    expect(manager.getCatalogEntry("lapis-docs")).toMatchObject({
      id: "lapis-docs",
      badges: ["official", "verified"],
      contributes: {
        editorViews: [
          expect.objectContaining({
            filenamePatterns: ["*.lapisdoc", "*.lapissheet"],
            extensions: ["lapisdoc", "lapissheet"],
          }),
        ],
      },
    });
    await expect(manager.install("lapis-docs")).resolves.toMatchObject({
      pluginId: "lapis-docs",
      provenance: "official",
    });

    expect(events.map((event) => event.phase)).toContain("fetching-catalog");
    expect(events.map((event) => event.phase)).toContain("downloading-bundle");
    expect(events.map((event) => event.phase)).toContain("verifying-bundle");
    expect(events.map((event) => event.phase)).toContain("extracting-files");
    expect(events.map((event) => event.phase)).toContain("verifying-files");
    expect(events.map((event) => event.phase)).toContain("staging");
    expect(events.map((event) => event.phase)).toContain("installing");
    expect(events.map((event) => event.phase)).toContain("loading");
    expect(events.map((event) => event.phase)).toContain("enabling");
    expect(events.at(-1)?.phase).toBe("complete");
    expect(managerCalls).toEqual([
      "load:.obsidian/plugins/lapis-docs",
      "enable:lapis-docs",
    ]);

    const downloadEvents = events.filter(
      (event) =>
        event.phase === "downloading-bundle" &&
        typeof event.downloadedBytes === "number",
    );
    expect(downloadEvents.length).toBeGreaterThan(0);
    const finalDownload = downloadEvents.at(-1);
    expect(finalDownload).toMatchObject({
      pluginId: "lapis-docs",
    });
    expect(finalDownload?.downloadedBytes).toBe(finalDownload?.totalBytes);
    expect(finalDownload?.totalBytes).toBeGreaterThan(0);
    expect(
      events.some(
        (event) =>
          event.phase === "extracting-files" &&
          typeof event.processedBytes === "number" &&
          typeof event.totalBytes === "number",
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.phase === "staging" &&
          typeof event.processedBytes === "number" &&
          typeof event.fileIndex === "number" &&
          typeof event.fileCount === "number",
      ),
    ).toBe(true);
  });

  it("installs local .lapis-plugin bundles through the manager", async () => {
    const fixture = await createManagerFixture();
    const adapter = new InMemoryDataAdapter();
    const manager = new DefaultPluginDistributionManager({
      adapter,
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
    });

    await expect(
      manager.installBundle(fixture.bundles["0.1.0"]),
    ).resolves.toMatchObject({
      pluginId: "lapis-docs",
    });
    await expect(
      adapter.exists(".obsidian/plugins/lapis-docs/manifest.json"),
    ).resolves.toBe(true);
  });

  it("rejects platform-incompatible plugins before installation", async () => {
    const fixture = await createManagerFixture({ platforms: ["electron"] });
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
    });

    await manager.refreshCatalog();
    await expect(manager.install("lapis-docs")).rejects.toMatchObject({
      code: "compatibility-failed",
    });
  });

  it("blocks privileged desktop installs when workspace trust is revoked", async () => {
    const fixture = await createManagerFixture({
      platforms: ["electron"],
      requiresWorkspaceTrust: true,
    });
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "electron",
      workspaceTrusted: () => false,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
    });

    await manager.refreshCatalog();
    await expect(manager.install("lapis-docs")).rejects.toMatchObject({
      code: "compatibility-failed",
    });
  });

  it("lists compatible official updates and preserves enabled state", async () => {
    const fixture = await createManagerFixture({
      versions: ["0.1.0", "0.2.0"],
    });
    const enabled = new Set<string>();
    const events: PluginInstallProgressEvent[] = [];
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
      pluginManager: {
        isPluginEnabled: (pluginId) => enabled.has(pluginId),
        loadPlugin: async () => ({}),
        enablePlugin: async (pluginId) => {
          enabled.add(pluginId);
          return true;
        },
      },
    });
    manager.addProgressListener((event) => events.push(event));

    await manager.refreshCatalog();
    await manager.install("lapis-docs", { version: "0.1.0", enable: true });

    await expect(manager.listUpdates()).resolves.toEqual([
      expect.objectContaining({
        id: "lapis-docs",
        currentVersion: "0.1.0",
        latestVersion: "0.2.0",
        targetVersion: "0.2.0",
        status: "update-available",
        canUpdate: true,
      }),
    ]);

    events.length = 0;
    await expect(manager.update("lapis-docs")).resolves.toMatchObject({
      pluginId: "lapis-docs",
      installedVersion: "0.2.0",
    });
    expect(enabled.has("lapis-docs")).toBe(true);
    expect(
      events.some(
        (event) =>
          event.phase === "downloading-bundle" &&
          typeof event.downloadedBytes === "number" &&
          typeof event.totalBytes === "number",
      ),
    ).toBe(true);
  });

  it("cancels streamed install downloads without recording the install", async () => {
    const fixture = await createManagerFixture();
    const controller = new AbortController();
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses, {
        streamUrls: new Set([
          "https://registry.example.test/v1/releases/lapis-docs-0.1.0.lapis-plugin",
        ]),
      }),
    });
    manager.addProgressListener((event) => {
      if (
        event.phase === "downloading-bundle" &&
        (event.downloadedBytes ?? 0) < (event.totalBytes ?? 0)
      ) {
        controller.abort();
      }
    });

    await manager.refreshCatalog();
    await expect(
      manager.install("lapis-docs", { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    await expect(manager.getInstalled("lapis-docs")).resolves.toBeNull();
  });

  it("surfaces incompatible official updates without enabling the action", async () => {
    const fixture = await createManagerFixture({
      versions: ["0.1.0", "0.2.0"],
      releasePlatforms: { "0.2.0": ["electron"] },
    });
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
    });

    await manager.refreshCatalog();
    await manager.install("lapis-docs", { version: "0.1.0" });

    await expect(manager.listUpdates()).resolves.toEqual([
      expect.objectContaining({
        status: "incompatible",
        canUpdate: false,
        reasons: ["platform-unsupported"],
      }),
    ]);
    await expect(manager.update("lapis-docs")).rejects.toMatchObject({
      code: "compatibility-failed",
    });
  });

  it("applies signed revocations to installed official records", async () => {
    const fixture = await createManagerFixture({
      versions: ["0.1.0", "0.2.0"],
      revoked: [
        {
          pluginId: "lapis-docs",
          versions: ["0.1.0"],
          reason: "security",
          message: "Update to a fixed Docs release.",
          revokedAt: "2026-05-31T00:00:00.000Z",
          replacementVersion: "0.2.0",
        },
      ],
    });
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
    });

    await manager.refreshCatalog();
    await manager.install("lapis-docs", { version: "0.1.0" });
    await manager.refreshCatalog();

    await expect(manager.getInstalled("lapis-docs")).resolves.toMatchObject({
      revoked: {
        reason: "security",
        message: "Update to a fixed Docs release.",
        replacementVersion: "0.2.0",
      },
    });
    await expect(manager.listUpdates()).resolves.toEqual([
      expect.objectContaining({
        status: "revoked",
        targetVersion: "0.2.0",
        canUpdate: true,
        revoked: expect.objectContaining({ reason: "security" }),
      }),
    ]);
  });

  it("rejects update releases with invalid file hashes", async () => {
    const fixture = await createManagerFixture({
      versions: ["0.1.0", "0.2.0"],
      corruptFiles: { "0.2.0": ["main.mjs"] },
    });
    const manager = new DefaultPluginDistributionManager({
      adapter: new InMemoryDataAdapter(),
      appVersion: "0.20.0",
      platform: "web",
      workspaceTrusted: () => true,
      registries: [fixture.source],
      trustedKeys: [fixture.trustedKey],
      fetch: fakeFetch(fixture.responses),
    });

    await manager.refreshCatalog();
    await manager.install("lapis-docs", { version: "0.1.0" });

    await expect(manager.update("lapis-docs")).rejects.toMatchObject({
      code: "hash-mismatch",
    });
    await expect(manager.getInstalled("lapis-docs")).resolves.toMatchObject({
      installedVersion: "0.1.0",
    });
  });
});

const fakeFetch =
  (
    responses: Record<string, string | Uint8Array>,
    options: { streamUrls?: Set<string> } = {},
  ): PluginBinaryFetch =>
  async (url) => {
    const body = responses[url];
    if (body === undefined) {
      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        arrayBuffer: async () => new ArrayBuffer(0),
        text: async () => "",
      };
    }
    const bytes =
      typeof body === "string" ? new TextEncoder().encode(body) : body;
    const stream =
      options.streamUrls?.has(url) === true
        ? new ReadableStream<Uint8Array>({
            start(controller) {
              for (const chunk of splitBytes(bytes)) {
                controller.enqueue(chunk);
              }
              controller.close();
            },
          })
        : undefined;
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      body: stream,
      arrayBuffer: async () => exactArrayBuffer(bytes),
      text: async () =>
        typeof body === "string" ? body : new TextDecoder().decode(body),
    };
  };

const splitBytes = (bytes: Uint8Array): Uint8Array[] => {
  if (bytes.byteLength <= 1) return [bytes];
  const midpoint = Math.ceil(bytes.byteLength / 2);
  return [bytes.slice(0, midpoint), bytes.slice(midpoint)];
};

const createManagerFixture = async (
  options: {
    platforms?: Array<"web" | "electron">;
    versions?: string[];
    releasePlatforms?: Record<string, Array<"web" | "electron">>;
    requiresWorkspaceTrust?: boolean;
    revoked?: PluginRevocationIndex["revoked"];
    corruptFiles?: Record<string, string[]>;
  } = {},
) => {
  const platforms = options.platforms ?? ["web", "electron"];
  const versions = options.versions ?? ["0.1.0"];
  const latestVersion = versions.at(-1) ?? "0.1.0";
  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  const trustedKey: TrustedSigningKey = {
    keyId: "lapis-manager-test",
    alg: "ed25519",
    publicKey: bytesToBase64(publicKey),
    trustTier: "official",
  };

  const responses: Record<string, string | Uint8Array> = {};
  const bundles: Record<string, Uint8Array> = {};
  const detailVersions: PluginCatalogDetail["versions"] = {};

  for (const version of versions) {
    const runtime = {
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["@lapis-notes/api", "svelte", "clsx"],
        },
      },
    } satisfies NonNullable<PluginReleaseManifest["runtime"]>;
    const files = {
      "manifest.json": JSON.stringify({
        id: "lapis-docs",
        name: "Docs",
        version,
        minAppVersion: "0.20.0",
        author: "Lapis Notes",
        description: "Rich document and spreadsheet editing for Lapis",
        isDesktopOnly: false,
        supportedRuntimes: ["browser", "electron"],
        lapis: {
          manifestVersion: 1,
          runtime,
        },
      }),
      "main.mjs": `export default class DocsPlugin${version.replace(/\D/g, "")} {};`,
      "styles.css": ".docs-view { display: flex; }",
    };
    const releaseFiles: PluginReleaseManifest["files"] = [
      await releaseFile("manifest.json", files["manifest.json"]),
      await releaseFile("main.mjs", files["main.mjs"]),
      await releaseFile("styles.css", files["styles.css"]),
    ];
    const releaseManifestJson = JSON.stringify(
      await signEnvelope<PluginReleaseManifest>(
        {
          schemaVersion: 1,
          type: "lapis.plugin.release",
          pluginId: "lapis-docs",
          version,
          channel: "official",
          compatibility: {
            minAppVersion: "0.20.0",
            platforms: options.releasePlatforms?.[version] ?? platforms,
            ...(options.requiresWorkspaceTrust
              ? { requiresWorkspaceTrust: true }
              : {}),
          },
          runtime,
          files: releaseFiles,
        },
        keyPair.privateKey,
      ),
    );
    const bundleFiles = new Map<string, string | Uint8Array>([
      ["release.signed.json", releaseManifestJson],
    ]);
    for (const [path, content] of Object.entries(files)) {
      const corrupt = options.corruptFiles?.[version]?.includes(path);
      bundleFiles.set(path, corrupt ? `${content} corrupted` : content);
    }
    const bundle = createPluginBundle(bundleFiles);
    bundles[version] = bundle;
    responses[
      `https://registry.example.test/v1/releases/lapis-docs-${version}.lapis-plugin`
    ] = bundle;
    detailVersions[version] = {
      version,
      minAppVersion: "0.20.0",
      releasedAt: "2026-05-31T00:00:00.000Z",
      platforms: options.releasePlatforms?.[version] ?? platforms,
      bundle: {
        url: `../releases/lapis-docs-${version}.lapis-plugin`,
        sha256: await sha256Hex(bundle),
        size: bundle.byteLength,
      },
    };
  }

  const detail = await signInline<PluginCatalogDetail>(
    {
      schemaVersion: 1,
      id: "lapis-docs",
      name: "Docs",
      description: "Rich document and spreadsheet editing for Lapis",
      channel: "official",
      owner: { name: "Lapis Notes", verified: true },
      latestVersion,
      versions: detailVersions,
    },
    keyPair.privateKey,
  );
  const revocations = await signInline<PluginRevocationIndex>(
    {
      schemaVersion: 1,
      generatedAt: "2026-05-31T00:00:00.000Z",
      revoked: options.revoked ?? [],
    },
    keyPair.privateKey,
  );
  const index = await signInline<PluginCatalogIndex>(
    {
      schemaVersion: 1,
      generatedAt: "2026-05-31T00:00:00.000Z",
      plugins: [
        {
          id: "lapis-docs",
          name: "Docs",
          description: "Rich document and spreadsheet editing for Lapis",
          author: "Lapis Notes",
          channel: "official",
          latestVersion,
          minAppVersion: "0.20.0",
          platforms,
          categories: ["documents", "editor"],
          badges: ["official", "verified"],
          detail: "plugins/lapis-docs.json",
          contributes: {
            editorViews: [
              {
                id: "lapis-doc",
                filenamePatterns: ["*.lapisdoc", "*.lapissheet"],
                extensions: ["lapisdoc", "lapissheet"],
              },
            ],
          },
        },
      ],
    },
    keyPair.privateKey,
  );

  return {
    trustedKey,
    source: {
      id: "lapis-official",
      name: "Lapis Official Plugins",
      url: "https://registry.example.test/v1/index.json",
      trustTier: "official" as const,
      enabled: true,
      builtin: true,
    },
    responses: {
      ...responses,
      "https://registry.example.test/v1/index.json": JSON.stringify(index),
      "https://registry.example.test/v1/revoked.json":
        JSON.stringify(revocations),
      "https://registry.example.test/v1/plugins/lapis-docs.json":
        JSON.stringify(detail),
    },
    bundles,
  };
};

const releaseFile = async (
  path: string,
  content: string,
): Promise<PluginReleaseManifest["files"][number]> => ({
  path,
  sha256: await sha256Hex(content),
  size: new TextEncoder().encode(content).byteLength,
});

const signInline = async <T extends object>(
  signed: T,
  privateKey: CryptoKey,
): Promise<T & { signatures: SignatureRecord[] }> => {
  const envelope = await signEnvelope(signed, privateKey);
  return { ...signed, signatures: envelope.signatures };
};

const signEnvelope = async <T>(
  signed: T,
  privateKey: CryptoKey,
): Promise<SignedEnvelope<T>> => {
  const payload = new TextEncoder().encode(canonicalJson(signed));
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "Ed25519" }, privateKey, payload),
  );
  return {
    signed,
    signatures: [
      {
        keyId: "lapis-manager-test",
        alg: "ed25519",
        sig: bytesToBase64(signature),
      },
    ],
  };
};

const pluginBundleMtime = new Date(1980, 0, 1, 0, 0, 0);

const createPluginBundle = (
  files: Map<string, string | Uint8Array>,
): Uint8Array => {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let zipError: unknown;
  const zip = new Zip((error, chunk) => {
    if (error) {
      zipError = error;
      return;
    }
    chunks.push(chunk);
  });

  let index = 0;
  for (const [path, content] of files) {
    const data =
      typeof content === "string" ? encoder.encode(content) : content;
    const stream =
      index === 0
        ? new ZipPassThrough(path)
        : new ZipDeflate(path, { level: 6 });
    stream.mtime = pluginBundleMtime;
    zip.add(stream);
    stream.push(data, true);
    index += 1;
  }
  zip.end();
  if (zipError) {
    throw zipError;
  }
  return concatUint8(chunks);
};

const concatUint8 = (chunks: Uint8Array[]): Uint8Array => {
  const bytes = new Uint8Array(
    chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

const exactArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? (bytes.buffer as ArrayBuffer)
    : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
