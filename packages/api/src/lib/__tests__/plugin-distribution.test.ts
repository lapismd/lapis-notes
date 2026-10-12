import { describe, expect, it } from "vitest";
import {
  assertPluginIdAllowedForProvenance,
  assertSafePluginRelativePath,
  bytesToBase64,
  canonicalJson,
  checkReleaseManifestCompatibility,
  PluginDistributionError,
  pluginCatalogIndexSchema,
  provenanceFromPluginManifest,
  sha256Hex,
  signedEnvelopeSchema,
  verifySha256,
  verifySignedEnvelope,
  type PluginReleaseManifest,
  type SignedEnvelope,
  type TrustedSigningKey,
} from "../plugin-distribution";

describe("plugin distribution primitives", () => {
  it("canonicalizes JSON with sorted object keys", () => {
    expect(canonicalJson({ z: true, a: [2, { b: "value", a: null }] })).toBe(
      '{"a":[2,{"a":null,"b":"value"}],"z":true}',
    );
  });

  it("rejects unsupported canonical JSON values", () => {
    expect(() => canonicalJson({ ok: true, missing: undefined })).toThrow(
      /Undefined values/,
    );
    expect(() => canonicalJson(Number.NaN)).toThrow(/finite/);
    expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });

  it("hashes bytes and reports typed verification failures", async () => {
    const digest = await sha256Hex("hello");
    expect(digest).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
    await expect(verifySha256("hello", digest)).resolves.toBeUndefined();

    await expect(verifySha256("hello", "0".repeat(64))).rejects.toMatchObject({
      code: "hash-mismatch",
    });
  });

  it("verifies Ed25519 signed envelopes and rejects tampering", async () => {
    const { envelope, trustedKey } = await signEnvelope({
      schemaVersion: 1,
      generatedAt: "2026-05-31T00:00:00.000Z",
      plugins: [],
    });

    await expect(verifySignedEnvelope(envelope, [trustedKey])).resolves.toEqual(
      envelope.signed,
    );

    const tampered: SignedEnvelope<typeof envelope.signed> = {
      ...envelope,
      signed: { ...envelope.signed, generatedAt: "2026-06-01T00:00:00.000Z" },
    };
    await expect(
      verifySignedEnvelope(tampered, [trustedKey]),
    ).rejects.toMatchObject({
      code: "signature-invalid",
    });
  });

  it("validates signed catalog metadata shape", () => {
    const schema = signedEnvelopeSchema(pluginCatalogIndexSchema);
    expect(() =>
      schema.parse({
        signed: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T00:00:00.000Z",
          plugins: [
            {
              id: "lapis-docs",
              name: "Docs",
              description: "Document editing",
              author: "Lapis Notes",
              channel: "official",
              latestVersion: "0.1.0",
              minAppVersion: "0.20.0",
              platforms: ["web", "electron"],
              categories: ["documents"],
              badges: ["official", "verified"],
              detail: "plugins/lapis-docs.json",
              contributes: {
                editorViews: [
                  {
                    id: "lapis-doc",
                    filenamePatterns: ["*.lapisdoc", "*.lapissheet"],
                  },
                ],
              },
            },
          ],
        },
        signatures: [{ keyId: "test", alg: "ed25519", sig: "abc" }],
      }),
    ).not.toThrow();
  });

  it("checks compatibility across app version, platform, trust, and revocation", () => {
    const manifest: PluginReleaseManifest = {
      schemaVersion: 1,
      type: "lapis.plugin.release",
      pluginId: "lapis-docs",
      version: "0.1.0",
      channel: "official",
      compatibility: {
        minAppVersion: "1.2.0",
        platforms: ["electron"],
        desktopOnly: true,
        requiresWorkspaceTrust: true,
      },
      files: [],
    };

    expect(
      checkReleaseManifestCompatibility(manifest, {
        appVersion: "1.1.0",
        platform: "web",
      }),
    ).toEqual({
      compatible: false,
      reasons: [
        "app-version-too-old",
        "platform-unsupported",
        "desktop-only",
        "workspace-trust-required",
      ],
    });

    expect(
      checkReleaseManifestCompatibility(manifest, {
        appVersion: "1.2.1",
        platform: "electron",
        workspaceTrusted: true,
      }),
    ).toEqual({ compatible: true, reasons: [] });
  });

  it("blocks reserved lapis ids for community and manual provenance", () => {
    expect(() =>
      assertPluginIdAllowedForProvenance("lapis-docs", "community"),
    ).toThrow(PluginDistributionError);
    expect(() =>
      assertPluginIdAllowedForProvenance("lapis-docs", "manual"),
    ).toThrow(PluginDistributionError);
    expect(() =>
      assertPluginIdAllowedForProvenance("lapis-docs", "official"),
    ).not.toThrow();
  });

  it("does not derive official provenance from plugin manifest content", () => {
    expect(
      provenanceFromPluginManifest({
        id: "lapis-docs",
        official: true,
        badges: ["official"],
      }),
    ).toBe("community");
  });

  it("rejects unsafe plugin release paths", () => {
    expect(() => assertSafePluginRelativePath("main.js")).not.toThrow();
    expect(() => assertSafePluginRelativePath("assets/icon.svg")).not.toThrow();
    expect(() => assertSafePluginRelativePath("../main.js")).toThrow(
      PluginDistributionError,
    );
    expect(() => assertSafePluginRelativePath("/main.js")).toThrow(
      PluginDistributionError,
    );
    expect(() => assertSafePluginRelativePath("assets\\icon.svg")).toThrow(
      PluginDistributionError,
    );
  });
});

const signEnvelope = async <T>(
  signed: T,
): Promise<{
  envelope: SignedEnvelope<T>;
  trustedKey: TrustedSigningKey;
}> => {
  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const payload = new TextEncoder().encode(canonicalJson(signed));
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "Ed25519" }, keyPair.privateKey, payload),
  );
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );

  return {
    envelope: {
      signed,
      signatures: [
        {
          keyId: "test-key",
          alg: "ed25519",
          sig: bytesToBase64(signature),
        },
      ],
    },
    trustedKey: {
      keyId: "test-key",
      alg: "ed25519",
      publicKey: bytesToBase64(publicKey),
      trustTier: "official",
    },
  };
};
