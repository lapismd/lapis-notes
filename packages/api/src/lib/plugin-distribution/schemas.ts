import { z } from "zod";
import { PluginDistributionError } from "./errors";

const isoDate = z.string().datetime({ offset: true });
const sha256 = z.string().regex(/^[a-fA-F0-9]{64}$/);
const nonEmpty = z.string().min(1);
const urlOrRelative = z.string().min(1);
const httpsUrl = z.string().url().startsWith("https://");

export const registryTrustTierSchema = z.enum([
  "official",
  "community",
  "local",
]);

export const pluginProvenanceSchema = z.enum([
  "bundled",
  "official",
  "community",
  "manual",
  "development",
]);

export const pluginRegistryChannelSchema = z.enum(["official", "community"]);
export const pluginCatalogStatusSchema = z.enum([
  "active",
  "pending",
  "revoked",
]);
export const pluginPlatformSchema = z.enum(["web", "electron", "desktop"]);
export const pluginBadgeSchema = z.enum([
  "official",
  "verified",
  "community",
  "desktop-only",
  "requires-trust",
  "update-available",
  "revoked",
]);

export const signatureRecordSchema = z.object({
  keyId: nonEmpty,
  alg: z.literal("ed25519"),
  sig: nonEmpty,
});

export const trustedSigningKeySchema = z.object({
  keyId: nonEmpty,
  alg: z.literal("ed25519"),
  publicKey: nonEmpty,
  trustTier: registryTrustTierSchema,
  expiresAt: isoDate.optional(),
});

export const remoteFileReferenceSchema = z
  .object({
    url: urlOrRelative,
    sha256,
    size: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export const pluginMarkdownReferenceSchema = z
  .object({
    url: httpsUrl,
    sourceUrl: httpsUrl,
    sha256,
    size: z.number().int().nonnegative().max(256 * 1024),
    mediaType: z.literal("text/markdown"),
  })
  .passthrough();

export const pluginCatalogContentSchema = z
  .object({
    overview: pluginMarkdownReferenceSchema.optional(),
    changelog: pluginMarkdownReferenceSchema.optional(),
  })
  .passthrough();

export const pluginCatalogLinksSchema = z
  .object({
    homepage: httpsUrl.optional(),
    repository: httpsUrl.optional(),
    documentation: httpsUrl.optional(),
    issues: httpsUrl.optional(),
  })
  .passthrough();

export const pluginReleaseFileSchema = z
  .object({
    path: nonEmpty,
    sha256,
    size: z.number().int().nonnegative(),
  })
  .passthrough();

const pluginReleaseRuntimeHostFields = {
  workspace: true,
  electronRenderer: true,
  electronSidecar: true,
  desktop: true,
  trustedDesktop: true,
} as const;

export const pluginReleaseModuleFormatSchema = z.enum([
  "esm",
  "commonjs",
  "node-esm",
]);

export const pluginReleaseRuntimeEntryDescriptorSchema = z
  .object({
    path: nonEmpty,
    format: pluginReleaseModuleFormatSchema,
    fallbackPath: nonEmpty.optional(),
    sharedDependencies: z.array(nonEmpty).optional(),
    requiresReloadOnUpdate: z.boolean().optional(),
  })
  .passthrough();

export const pluginReleaseRuntimeEntriesSchema = z
  .object(
    Object.fromEntries(
      Object.keys(pluginReleaseRuntimeHostFields).map((field) => [
        field,
        pluginReleaseRuntimeEntryDescriptorSchema.optional(),
      ]),
    ) as Record<
      keyof typeof pluginReleaseRuntimeHostFields,
      z.ZodOptional<typeof pluginReleaseRuntimeEntryDescriptorSchema>
    >,
  )
  .passthrough();

export const pluginReleaseRuntimeSharedDependenciesSchema = z
  .object(
    Object.fromEntries(
      Object.keys(pluginReleaseRuntimeHostFields).map((field) => [
        field,
        z.array(nonEmpty).optional(),
      ]),
    ) as Record<
      keyof typeof pluginReleaseRuntimeHostFields,
      z.ZodOptional<z.ZodArray<typeof nonEmpty>>
    >,
  )
  .passthrough();

export const pluginReleaseRuntimeCompatibilityOverridesSchema = z
  .object({
    deprecatedHostModules:
      pluginReleaseRuntimeSharedDependenciesSchema.optional(),
  })
  .passthrough();

export const pluginReleaseRuntimeMetadataSchema = z
  .object({
    entries: pluginReleaseRuntimeEntriesSchema.optional(),
    sharedDependencies: pluginReleaseRuntimeSharedDependenciesSchema.optional(),
    compatibilityOverrides:
      pluginReleaseRuntimeCompatibilityOverridesSchema.optional(),
  })
  .passthrough();

export const pluginReleaseRuntimeDiagnosticSchema = z
  .object({
    severity: z.enum(["error", "warning"]),
    code: z.enum([
      "lapis-manifest-invalid",
      "runtime-metadata-missing",
      "runtime-metadata-mismatch",
      "runtime-entry-file-missing",
      "runtime-entry-format-mismatch",
      "runtime-fallback-file-missing",
      "runtime-fallback-format-mismatch",
      "runtime-main-missing",
      "runtime-commonjs-not-allowed",
      "runtime-dependency-unknown",
      "runtime-dependency-private",
      "runtime-dependency-platform-unsupported",
      "runtime-dependency-undeclared",
      "runtime-dependency-deprecated",
      "runtime-legacy-commonjs",
    ]),
    message: nonEmpty,
    details: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const pluginContributionSummarySchema = z
  .object({
    commands: z
      .array(z.object({ id: nonEmpty, name: nonEmpty }).passthrough())
      .optional(),
    editorViews: z
      .array(
        z
          .object({
            id: nonEmpty,
            filenamePatterns: z.array(nonEmpty).optional(),
            extensions: z.array(nonEmpty).optional(),
            mimeTypes: z.array(nonEmpty).optional(),
          })
          .passthrough(),
      )
      .optional(),
    markdownProcessors: z
      .array(
        z.object({ id: nonEmpty, name: nonEmpty.optional() }).passthrough(),
      )
      .optional(),
    notebookRenderers: z
      .array(
        z.object({ id: nonEmpty, name: nonEmpty.optional() }).passthrough(),
      )
      .optional(),
    configuration: z
      .array(
        z.object({ id: nonEmpty, name: nonEmpty.optional() }).passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const pluginCatalogEntrySchema = z
  .object({
    id: nonEmpty,
    name: nonEmpty,
    description: z.string(),
    readmeUrl: httpsUrl.optional(),
    author: nonEmpty,
    authorUrl: httpsUrl.optional(),
    channel: pluginRegistryChannelSchema,
    status: pluginCatalogStatusSchema.optional(),
    latestVersion: nonEmpty,
    minAppVersion: nonEmpty,
    platforms: z.array(pluginPlatformSchema).min(1),
    categories: z.array(nonEmpty),
    badges: z.array(pluginBadgeSchema).optional(),
    latestRelease: z
      .object({
        releasedAt: isoDate,
        bundleSize: z.number().int().nonnegative(),
      })
      .passthrough()
      .optional(),
    detail: urlOrRelative,
    contributes: pluginContributionSummarySchema.optional(),
  })
  .passthrough();

export const pluginCatalogIndexSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: isoDate,
    registries: z
      .record(
        z.object({
          name: nonEmpty,
          trustTier: registryTrustTierSchema,
        }),
      )
      .optional(),
    plugins: z.array(pluginCatalogEntrySchema),
    signatures: z.array(signatureRecordSchema).optional(),
  })
  .passthrough();

export const pluginRevocationRecordSchema = z.object({
  revokedAt: isoDate,
  reason: nonEmpty,
  message: z.string().optional(),
  replacementVersion: nonEmpty.optional(),
});

export const pluginRevokedVersionRecordSchema =
  pluginRevocationRecordSchema.extend({
    pluginId: nonEmpty,
    versions: z.array(nonEmpty).min(1),
  });

export const pluginRevocationIndexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: isoDate,
  revoked: z.array(pluginRevokedVersionRecordSchema),
  signatures: z.array(signatureRecordSchema).optional(),
});

export const pluginCatalogReleaseSchema = z
  .object({
    version: nonEmpty,
    minAppVersion: nonEmpty,
    releasedAt: isoDate,
    platforms: z.array(pluginPlatformSchema).min(1),
    bundle: remoteFileReferenceSchema,
    revoked: pluginRevocationRecordSchema.optional(),
  })
  .passthrough();

export const pluginCatalogDetailSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: nonEmpty,
    name: nonEmpty,
    description: z.string(),
    readmeUrl: httpsUrl.optional(),
    channel: pluginRegistryChannelSchema,
    status: pluginCatalogStatusSchema.optional(),
    owner: z.object({
      name: nonEmpty,
      verified: z.boolean().optional(),
      url: z.string().url().optional(),
    }),
    latestVersion: nonEmpty,
    readme: remoteFileReferenceSchema.optional(),
    license: nonEmpty.optional(),
    links: pluginCatalogLinksSchema.optional(),
    highlights: z.array(nonEmpty.max(160)).max(8).optional(),
    content: pluginCatalogContentSchema.optional(),
    contributes: pluginContributionSummarySchema.optional(),
    versions: z.record(pluginCatalogReleaseSchema),
    signatures: z.array(signatureRecordSchema).optional(),
  })
  .passthrough();

export const pluginReleaseManifestSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.literal("lapis.plugin.release"),
  pluginId: nonEmpty,
  version: nonEmpty,
  channel: pluginRegistryChannelSchema,
  source: z
    .object({
      repo: nonEmpty.optional(),
      commit: nonEmpty.optional(),
      package: nonEmpty.optional(),
    })
    .optional(),
  compatibility: z.object({
    minAppVersion: nonEmpty,
    platforms: z.array(pluginPlatformSchema).min(1),
    desktopOnly: z.boolean().optional(),
    requiresWorkspaceTrust: z.boolean().optional(),
  }),
  runtime: pluginReleaseRuntimeMetadataSchema.optional(),
  files: z.array(pluginReleaseFileSchema),
  revoked: pluginRevocationRecordSchema.optional(),
});

export const signedEnvelopeSchema = <T extends z.ZodTypeAny>(signed: T) =>
  z.object({
    signed,
    signatures: z.array(signatureRecordSchema).min(1),
  });

export const installedPluginRecordSchema = z
  .object({
    pluginId: nonEmpty,
    installedVersion: nonEmpty,
    installedAt: isoDate,
    updatedAt: isoDate,
    provenance: pluginProvenanceSchema,
    registryId: nonEmpty.optional(),
    registryUrl: nonEmpty.optional(),
    releaseManifestSha256: sha256.optional(),
    files: z.array(
      z.object({
        path: nonEmpty,
        sha256,
        size: z.number().int().nonnegative(),
      }),
    ),
    runtimeWarnings: z.array(pluginReleaseRuntimeDiagnosticSchema).optional(),
    signature: signatureRecordSchema.optional(),
    revoked: pluginRevocationRecordSchema.optional(),
    restartRequired: z.boolean().optional(),
  })
  .passthrough();

export const installedPluginsStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    updatedAt: isoDate,
    plugins: z.record(installedPluginRecordSchema),
    migrations: z
      .record(
        z.object({
          oldId: nonEmpty.optional(),
          newId: nonEmpty.optional(),
          dataMigratedAt: isoDate.optional(),
          source: nonEmpty.optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

export const parsePluginDistributionMetadata = <T>(
  schema: z.ZodType<T>,
  value: unknown,
): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new PluginDistributionError(
      "metadata-invalid",
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`)
        .join("; "),
      { cause: result.error },
    );
  }
  return result.data;
};
