import { describe, expect, it } from "vitest";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import {
  bytesToBase64,
  canonicalJson,
  InstalledPluginStateStore,
  sha256Hex,
  VerifiedPluginInstaller,
  verifyPluginBundlePayload,
  type PluginBinaryFetch,
  type PluginCatalogDetail,
  type PluginCatalogEntry,
  type PluginReleaseManifest,
  type RemoteFileReference,
  type SignatureRecord,
  type SignedEnvelope,
  type TrustedSigningKey,
} from "../plugin-distribution";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

describe("VerifiedPluginInstaller", () => {
  it("installs verified official plugin files and records external provenance", async () => {
    const fixture = await createInstallFixture();
    const adapter = new InMemoryDataAdapter();
    const managerCalls: string[] = [];
    const stateSeenDuringLoad: unknown[] = [];
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
      pluginManager: {
        loadPlugin: async (path) => {
          managerCalls.push(`load:${path}`);
          stateSeenDuringLoad.push(
            (await new InstalledPluginStateStore(adapter).get("lapis-docs"))
              ?.provenance,
          );
          return {};
        },
        enablePlugin: async (pluginId) => {
          managerCalls.push(`enable:${pluginId}`);
          return true;
        },
      },
      now: () => new Date("2026-05-31T01:00:00.000Z"),
    });

    const record = await installer.install({
      entry: fixture.entry,
      detail: fixture.detail,
      registryId: "lapis-official",
      registryUrl: "https://registry.example.test/v1/index.json",
      enable: true,
    });

    expect(
      await adapter.read(".obsidian/plugins/lapis-docs/manifest.json"),
    ).toBe(fixture.files["manifest.json"]);
    expect(record).toMatchObject({
      pluginId: "lapis-docs",
      installedVersion: "0.1.0",
      provenance: "official",
      registryId: "lapis-official",
    });
    expect(managerCalls).toEqual([
      "load:.obsidian/plugins/lapis-docs",
      "enable:lapis-docs",
    ]);
    expect(stateSeenDuringLoad).toEqual(["official"]);

    const state = await new InstalledPluginStateStore(adapter).load();
    expect(state.plugins["lapis-docs"]).toMatchObject({
      provenance: "official",
      registryUrl: "https://registry.example.test/v1/index.json",
    });
  });

  it("aborts before final install on hash mismatch", async () => {
    const fixture = await createInstallFixture({
      responseOverrides: { "main.mjs": "tampered" },
    });
    const adapter = new InMemoryDataAdapter();
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
    });

    await expect(
      installer.install({ entry: fixture.entry, detail: fixture.detail }),
    ).rejects.toMatchObject({ code: "hash-mismatch" });
    expect(await adapter.exists(".obsidian/plugins/lapis-docs")).toBe(false);
  });

  it("aborts before signature verification when bundle metadata is tampered", async () => {
    const fixture = await createInstallFixture({ corruptBundleResponse: true });
    const installer = new VerifiedPluginInstaller({
      adapter: new InMemoryDataAdapter(),
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
    });

    await expect(
      installer.install({ entry: fixture.entry, detail: fixture.detail }),
    ).rejects.toMatchObject({ code: "hash-mismatch" });
  });

  it("aborts before final install when the embedded release signature is invalid", async () => {
    const fixture = await createInstallFixture({ tamperSignature: true });
    const installer = new VerifiedPluginInstaller({
      adapter: new InMemoryDataAdapter(),
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
    });

    await expect(
      installer.install({ entry: fixture.entry, detail: fixture.detail }),
    ).rejects.toMatchObject({ code: "signature-invalid" });
  });

  it("installs a local .lapis-plugin bundle through the same verification path", async () => {
    const fixture = await createInstallFixture();
    const adapter = new InMemoryDataAdapter();
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      bundleVerification: "main-thread",
    });

    const record = await installer.installBundle({
      bundle: fixture.bundle,
      enable: false,
    });

    expect(record).toMatchObject({
      pluginId: "lapis-docs",
      installedVersion: "0.1.0",
      provenance: "official",
    });
    expect(
      await adapter.read(".obsidian/plugins/lapis-docs/manifest.json"),
    ).toBe(fixture.files["manifest.json"]);
  });

  it("verifies bundles in a worker when auto mode can use Worker", async () => {
    const fixture = await createInstallFixture();
    const adapter = new InMemoryDataAdapter();
    const progressPhases: string[] = [];
    const fakeWorker = installFakePluginBundleWorker(
      async (worker, message) => {
        const payload = await verifyPluginBundlePayload({
          bundle: message.bundle,
          trustedKeys: message.trustedKeys,
          expectedBundle: message.expectedBundle,
          onProgress: (progress) => {
            worker.emitMessage({ type: "progress", progress });
          },
        });
        worker.emitMessage({
          type: "result",
          payload: {
            releaseEnvelope: payload.releaseEnvelope,
            releaseManifest: payload.releaseManifest,
            releaseManifestSha256: payload.releaseManifestSha256,
            files: [...payload.files.entries()],
          },
        });
      },
    );
    try {
      const installer = new VerifiedPluginInstaller({
        adapter,
        trustedKeys: [fixture.trustedKey],
      });

      await expect(
        installer.installBundle({
          bundle: fixture.bundle,
          onProgress: (event) => {
            progressPhases.push(event.phase);
          },
        }),
      ).resolves.toMatchObject({
        pluginId: "lapis-docs",
        installedVersion: "0.1.0",
      });

      expect(fakeWorker.workers).toHaveLength(1);
      expect(fakeWorker.workers[0].terminated).toBe(true);
      expect(progressPhases).toContain("verifying-bundle");
      expect(progressPhases).toContain("verifying-files");
      expect(
        await adapter.read(".obsidian/plugins/lapis-docs/manifest.json"),
      ).toBe(fixture.files["manifest.json"]);
    } finally {
      fakeWorker.restore();
    }
  });

  it("terminates pending worker verification when aborted", async () => {
    const fixture = await createInstallFixture();
    const adapter = new InMemoryDataAdapter();
    const posted = deferred<void>();
    const fakeWorker = installFakePluginBundleWorker(async () => {
      posted.resolve();
    });
    const controller = new AbortController();
    try {
      const installer = new VerifiedPluginInstaller({
        adapter,
        trustedKeys: [fixture.trustedKey],
      });
      const installPromise = installer.installBundle({
        bundle: fixture.bundle,
        signal: controller.signal,
      });

      await posted.promise;
      controller.abort();

      await expect(installPromise).rejects.toMatchObject({
        name: "AbortError",
      });
      expect(fakeWorker.workers).toHaveLength(1);
      expect(fakeWorker.workers[0].terminated).toBe(true);
      expect(await adapter.exists(".obsidian/plugins/lapis-docs")).toBe(false);
    } finally {
      fakeWorker.restore();
    }
  });

  it("accepts stored .lapis-plugin bundles", async () => {
    const fixture = await createInstallFixture({ storedBundle: true });
    const adapter = new InMemoryDataAdapter();
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      bundleVerification: "main-thread",
    });

    await expect(
      installer.installBundle({ bundle: fixture.bundle }),
    ).resolves.toMatchObject({
      pluginId: "lapis-docs",
      installedVersion: "0.1.0",
    });
  });

  it("aborts on unsafe paths and manifest mismatches", async () => {
    const unsafe = await createInstallFixture({
      releaseFilePath: "../manifest.json",
    });
    const unsafeInstaller = new VerifiedPluginInstaller({
      adapter: new InMemoryDataAdapter(),
      trustedKeys: [unsafe.trustedKey],
      fetch: fakeBinaryFetch(unsafe.responses),
    });
    await expect(
      unsafeInstaller.install({ entry: unsafe.entry, detail: unsafe.detail }),
    ).rejects.toMatchObject({ code: "invalid-path" });

    const mismatch = await createInstallFixture({
      manifestOverride: { id: "other-plugin" },
    });
    const adapter = new InMemoryDataAdapter();
    const mismatchInstaller = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [mismatch.trustedKey],
      fetch: fakeBinaryFetch(mismatch.responses),
    });
    await expect(
      mismatchInstaller.install({
        entry: mismatch.entry,
        detail: mismatch.detail,
      }),
    ).rejects.toMatchObject({ code: "metadata-invalid" });
    expect(await adapter.exists(".obsidian/plugins/lapis-docs")).toBe(false);
  });

  it("aborts before final install on invalid official runtime metadata", async () => {
    const runtime = {
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["@lapis-notes/api"],
        },
      },
    } satisfies NonNullable<PluginReleaseManifest["runtime"]>;
    const fixture = await createInstallFixture({
      manifestOverride: {
        lapis: {
          manifestVersion: 1,
          runtime,
        },
      },
      fileOverrides: {
        "main.mjs": `import { z } from "zod"; export default class DocsPlugin {};`,
      },
      releaseRuntime: runtime,
    });
    const adapter = new InMemoryDataAdapter();
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
    });

    await expect(
      installer.install({ entry: fixture.entry, detail: fixture.detail }),
    ).rejects.toMatchObject({
      code: "metadata-invalid",
      details: {
        diagnostics: [
          expect.objectContaining({ code: "runtime-dependency-undeclared" }),
        ],
      },
    });
    expect(await adapter.exists(".obsidian/plugins/lapis-docs")).toBe(false);
  });

  it("records runtime compatibility warnings for manual legacy CommonJS releases", async () => {
    const fixture = await createInstallFixture({
      pluginId: "community-docs",
      channel: "community",
      manifestOverride: {
        id: "community-docs",
        lapis: undefined,
      },
    });
    const adapter = new InMemoryDataAdapter();
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
    });

    const record = await installer.install({
      entry: fixture.entry,
      detail: fixture.detail,
    });

    expect(record.runtimeWarnings).toContainEqual(
      expect.objectContaining({ code: "runtime-legacy-commonjs" }),
    );
  });

  it("uninstalls plugin code while preserving data by default", async () => {
    const fixture = await createInstallFixture();
    const adapter = new InMemoryDataAdapter();
    const installer = new VerifiedPluginInstaller({
      adapter,
      trustedKeys: [fixture.trustedKey],
      fetch: fakeBinaryFetch(fixture.responses),
      pluginManager: {
        disablePlugin: async () => true,
      },
    });
    await installer.install({ entry: fixture.entry, detail: fixture.detail });
    await adapter.write(".obsidian/plugins/lapis-docs/data.json", "{}");
    await adapter.write(
      ".obsidian/community-plugins.json",
      JSON.stringify(["lapis-docs"]),
    );

    await installer.uninstall("lapis-docs");

    expect(await adapter.exists(".obsidian/plugins/lapis-docs/data.json")).toBe(
      true,
    );
    expect(await adapter.exists(".obsidian/plugins/lapis-docs/main.mjs")).toBe(
      false,
    );
    expect(
      JSON.parse(await adapter.read(".obsidian/community-plugins.json")),
    ).toEqual([]);
    expect(await new InstalledPluginStateStore(adapter).get("lapis-docs")).toBe(
      null,
    );
  });
});

const fakeBinaryFetch =
  (responses: Record<string, string | Uint8Array>): PluginBinaryFetch =>
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
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: async () => exactArrayBuffer(bytes),
      text: async () =>
        typeof body === "string" ? body : new TextDecoder().decode(body),
    };
  };

const createInstallFixture = async (
  options: {
    pluginId?: string;
    releaseFilePath?: string;
    fileOverrides?: Record<string, string>;
    responseOverrides?: Record<string, string>;
    manifestOverride?: Record<string, unknown>;
    releaseRuntime?: PluginReleaseManifest["runtime"];
    channel?: "official" | "community";
    corruptBundleResponse?: boolean;
    tamperSignature?: boolean;
    storedBundle?: boolean;
  } = {},
): Promise<{
  trustedKey: TrustedSigningKey;
  entry: PluginCatalogEntry;
  detail: PluginCatalogDetail;
  responses: Record<string, string | Uint8Array>;
  files: Record<string, string>;
  bundle: Uint8Array;
}> => {
  const pluginId = options.pluginId ?? "lapis-docs";
  const channel = options.channel ?? "official";
  const defaultRuntime: NonNullable<PluginReleaseManifest["runtime"]> = {
    entries: {
      workspace: {
        path: "main.mjs",
        format: "esm",
        sharedDependencies: ["@lapis-notes/api", "svelte", "clsx"],
      },
    },
  };
  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  const trustedKey: TrustedSigningKey = {
    keyId: "lapis-release-test",
    alg: "ed25519",
    publicKey: bytesToBase64(publicKey),
    trustTier: "official",
  };

  const manifest = {
    id: pluginId,
    name: "Docs",
    version: "0.1.0",
    minAppVersion: "0.20.0",
    author: "Lapis Notes",
    description: "Document editing",
    lapis: {
      manifestVersion: 1,
      runtime: defaultRuntime,
    },
    ...options.manifestOverride,
  };
  const files = {
    "manifest.json": JSON.stringify(manifest),
    "main.mjs": "export default class DocsPlugin {};",
    ...((manifest as { lapis?: unknown }).lapis
      ? {}
      : { "main.js": "module.exports = class DocsPlugin {};" }),
    ...(options.fileOverrides ?? {}),
  };
  const manifestPath = options.releaseFilePath ?? "manifest.json";
  const releaseFiles: PluginReleaseManifest["files"] = [];
  const releaseFileContents = new Map<string, string>();
  for (const [filePath, content] of Object.entries(files).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const releasePath = filePath === "manifest.json" ? manifestPath : filePath;
    releaseFiles.push(await releaseFile(releasePath, content));
    releaseFileContents.set(releasePath, content);
  }
  const manifestRuntime = (
    manifest as { lapis?: { runtime?: PluginReleaseManifest["runtime"] } }
  ).lapis?.runtime;
  const releaseRuntime =
    options.releaseRuntime ??
    manifestRuntime ??
    (channel === "official" ? defaultRuntime : undefined);

  const releaseManifest = await signEnvelope<PluginReleaseManifest>(
    {
      schemaVersion: 1,
      type: "lapis.plugin.release",
      pluginId,
      version: "0.1.0",
      channel,
      compatibility: {
        minAppVersion: "0.20.0",
        platforms: ["web", "desktop"],
      },
      ...(releaseRuntime ? { runtime: releaseRuntime } : {}),
      files: releaseFiles,
    },
    keyPair.privateKey,
  );
  if (options.tamperSignature) {
    releaseManifest.signatures[0].sig = bytesToBase64(
      new Uint8Array([1, 2, 3]),
    );
  }
  const releaseManifestJson = JSON.stringify(releaseManifest);
  const bundleFiles = new Map<string, string | Uint8Array>([
    ["release.signed.json", releaseManifestJson],
  ]);
  for (const [filePath, content] of releaseFileContents) {
    bundleFiles.set(filePath, options.responseOverrides?.[filePath] ?? content);
  }
  const bundle = createPluginBundle(bundleFiles, {
    stored: options.storedBundle,
  });
  const bundleResponse = options.corruptBundleResponse
    ? concatUint8([bundle, new Uint8Array([0])])
    : bundle;

  const entry: PluginCatalogEntry = {
    id: pluginId,
    name: "Docs",
    description: "Document editing",
    author: "Lapis Notes",
    channel,
    latestVersion: "0.1.0",
    minAppVersion: "0.20.0",
    platforms: ["web", "desktop"],
    categories: ["documents"],
    detail: `https://registry.example.test/v1/plugins/${pluginId}.json`,
  };
  const detail: PluginCatalogDetail = {
    schemaVersion: 1,
    id: pluginId,
    name: "Docs",
    description: "Document editing",
    channel,
    owner: { name: "Lapis Notes", verified: true },
    latestVersion: "0.1.0",
    versions: {
      "0.1.0": {
        version: "0.1.0",
        minAppVersion: "0.20.0",
        releasedAt: "2026-05-31T00:00:00.000Z",
        platforms: ["web", "desktop"],
        bundle: {
          url: `../releases/${pluginId}-0.1.0.lapis-plugin`,
          sha256: await sha256Hex(bundle),
          size: bundle.byteLength,
        },
      },
    },
  };

  const responses: Record<string, string | Uint8Array> = {
    [`https://registry.example.test/v1/releases/${pluginId}-0.1.0.lapis-plugin`]:
      bundleResponse,
  };

  return {
    trustedKey,
    entry,
    detail,
    files,
    responses,
    bundle,
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
        keyId: "lapis-release-test",
        alg: "ed25519",
        sig: bytesToBase64(signature),
      } satisfies SignatureRecord,
    ],
  };
};

interface FakePluginBundleWorkerVerifyMessage {
  bundle: ArrayBuffer;
  trustedKeys: TrustedSigningKey[];
  expectedBundle?: RemoteFileReference;
}

interface InstalledFakePluginBundleWorker {
  terminated: boolean;
  emitMessage(data: unknown): void;
}

const installFakePluginBundleWorker = (
  handler: (
    worker: InstalledFakePluginBundleWorker,
    message: FakePluginBundleWorkerVerifyMessage,
  ) => Promise<void> | void,
): {
  workers: InstalledFakePluginBundleWorker[];
  restore: () => void;
} => {
  const globalWithWorker = globalThis as typeof globalThis & {
    Worker?: unknown;
  };
  const hadPreviousWorker = "Worker" in globalWithWorker;
  const previousWorker = globalWithWorker.Worker;
  const workers: InstalledFakePluginBundleWorker[] = [];

  class FakePluginBundleWorker implements InstalledFakePluginBundleWorker {
    readonly listeners = new Map<
      string,
      Array<(event: MessageEvent) => void>
    >();
    terminated = false;

    constructor(_url: URL, _options?: WorkerOptions) {
      workers.push(this);
    }

    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
    ): void {
      const callback =
        typeof listener === "function"
          ? (listener as (event: MessageEvent) => void)
          : (event: MessageEvent) => listener.handleEvent(event);
      const listeners = this.listeners.get(type) ?? [];
      listeners.push(callback);
      this.listeners.set(type, listeners);
    }

    postMessage(message: FakePluginBundleWorkerVerifyMessage): void {
      void Promise.resolve(handler(this, message)).catch((error: unknown) => {
        this.emitMessage({
          type: "error",
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { name: "Error", message: String(error) },
        });
      });
    }

    terminate(): void {
      this.terminated = true;
    }

    emitMessage(data: unknown): void {
      for (const listener of this.listeners.get("message") ?? []) {
        listener({ data } as MessageEvent);
      }
    }
  }

  globalWithWorker.Worker = FakePluginBundleWorker;
  return {
    workers,
    restore: () => {
      if (hadPreviousWorker) {
        globalWithWorker.Worker = previousWorker;
      } else {
        delete globalWithWorker.Worker;
      }
    },
  };
};

const deferred = <T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const pluginBundleMtime = new Date(1980, 0, 1, 0, 0, 0);

const createPluginBundle = (
  files: Map<string, string | Uint8Array>,
  options: { stored?: boolean } = {},
): Uint8Array => {
  if (options.stored) {
    return createStoredZip(files);
  }
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

const createStoredZip = (
  files: Map<string, string | Uint8Array>,
): Uint8Array => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [path, content] of files) {
    const name = encoder.encode(path);
    const data =
      typeof content === "string" ? encoder.encode(content) : content;
    const crc32 = crc32For(data);
    const local = new Uint8Array(30);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc32, true);
    localView.setUint32(18, data.byteLength, true);
    localView.setUint32(22, data.byteLength, true);
    localView.setUint16(26, name.byteLength, true);
    localParts.push(local, name, data);

    const central = new Uint8Array(46);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc32, true);
    centralView.setUint32(20, data.byteLength, true);
    centralView.setUint32(24, data.byteLength, true);
    centralView.setUint16(28, name.byteLength, true);
    centralView.setUint32(42, offset, true);
    centralParts.push(central, name);

    offset += local.byteLength + name.byteLength + data.byteLength;
  }

  const centralSize = centralParts.reduce(
    (sum, part) => sum + part.byteLength,
    0,
  );
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.size, true);
  endView.setUint16(10, files.size, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return concatUint8([...localParts, ...centralParts, end]);
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

const crc32For = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const exactArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    ? (bytes.buffer as ArrayBuffer)
    : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
