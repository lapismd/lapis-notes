import { z } from "zod";

const nonEmptyString = z.string().min(1);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/u);

export const registryCatalogStatusSchema = z.enum([
  "active",
  "pending",
  "deprecated",
  "disabled",
  "revoked",
]);

export const registryImageReferenceSchema = z.object({
  url: nonEmptyString,
  sourceUrl: z.string().url(),
  sha256,
  size: z.number().int().nonnegative(),
  mediaType: z.enum(["image/png", "image/webp", "image/svg+xml"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const registryAppearanceSchema = z.object({
  icon: nonEmptyString,
  accent: nonEmptyString,
  logo: registryImageReferenceSchema
    .extend({
      alt: z.string(),
      images: z
        .object({
          full: registryImageReferenceSchema.optional(),
          light: registryImageReferenceSchema.optional(),
          dark: registryImageReferenceSchema.optional(),
        })
        .optional(),
    })
    .optional(),
});

export const registryGalleryItemSchema = z.object({
  id: nonEmptyString,
  alt: nonEmptyString,
  images: z.object({
    preview: registryImageReferenceSchema,
    full: registryImageReferenceSchema,
    light: registryImageReferenceSchema,
    dark: registryImageReferenceSchema,
  }),
});

export const registryMediaItemSchema = z.object({
  alt: nonEmptyString,
  images: registryGalleryItemSchema.shape.images,
});

export const registryChangelogTagSchema = z.enum([
  "feature",
  "improvement",
  "fix",
  "security",
  "breaking",
  "deprecation",
  "removal",
]);

export const registryReleaseChangelogSchema = z
  .object({
    title: nonEmptyString.max(200),
    description: z.string().min(1).max(4_000).optional(),
    tags: z
      .array(registryChangelogTagSchema)
      .max(8)
      .refine(
        (tags) => new Set(tags).size === tags.length,
        "Changelog tags must be unique",
      )
      .optional(),
  })
  .strict();

export const registryReleaseSchema = z.object({
  version: nonEmptyString,
  releaseEventId: sha256.optional(),
  manifestSha256: sha256.optional(),
  releaseSequence: z
    .string()
    .regex(/^[1-9][0-9]*$/u)
    .optional(),
  minAppVersion: nonEmptyString,
  releasedAt: z.string().datetime({ offset: true }),
  platforms: z.array(nonEmptyString).min(1),
  changelog: registryReleaseChangelogSchema.optional(),
  releasePost: z.string().min(1).optional(),
  bundle: z.object({
    url: nonEmptyString,
    downloadUrl: nonEmptyString.optional(),
    sha256,
    size: z.number().int().nonnegative(),
    pending: z.boolean().optional(),
  }),
});

const registryOwnerSchema = z.object({
  name: nonEmptyString,
  verified: z.boolean(),
  url: z.string().url().optional(),
});

const registryContributionsSchema = z
  .object({
    editorViews: z
      .array(
        z
          .object({
            id: nonEmptyString,
            label: nonEmptyString.optional(),
            filenamePatterns: z.array(nonEmptyString).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const registryCatalogEntrySchema = z.object({
  schemaVersion: z.literal(1).optional(),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/u),
  name: nonEmptyString,
  description: nonEmptyString,
  author: nonEmptyString,
  authorUrl: z.string().url().optional(),
  authorAvatarUrl: z.string().url().optional(),
  appearance: registryAppearanceSchema.optional(),
  channel: z.enum(["official", "community"]),
  status: registryCatalogStatusSchema,
  latestVersion: nonEmptyString,
  minAppVersion: nonEmptyString,
  platforms: z.array(nonEmptyString).min(1),
  categories: z.array(nonEmptyString),
  badges: z.array(nonEmptyString).default([]),
  owner: registryOwnerSchema,
  latestRelease: z
    .object({
      releasedAt: z.string().datetime({ offset: true }),
      bundleSize: z.number().int().nonnegative(),
    })
    .optional(),
  detail: nonEmptyString,
  contributes: registryContributionsSchema.optional(),
});

export const registryCatalogIndexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }),
  plugins: z.array(registryCatalogEntrySchema),
});

export const registryCatalogDetailSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/u),
  name: nonEmptyString,
  description: nonEmptyString,
  author: nonEmptyString,
  authorUrl: z.string().url().optional(),
  authorAvatarUrl: z.string().url().optional(),
  appearance: registryAppearanceSchema.optional(),
  media: z
    .object({
      banner: registryMediaItemSchema.optional(),
      overview: registryMediaItemSchema.optional(),
    })
    .optional(),
  gallery: z.array(registryGalleryItemSchema).optional(),
  channel: z.enum(["official", "community"]),
  status: registryCatalogStatusSchema,
  owner: registryOwnerSchema,
  latestVersion: nonEmptyString,
  license: nonEmptyString.optional(),
  links: z
    .object({
      homepage: z.string().url().optional(),
      repository: z.string().url().optional(),
      documentation: z.string().url().optional(),
      issues: z.string().url().optional(),
    })
    .optional(),
  highlights: z.array(nonEmptyString).optional(),
  contributes: registryContributionsSchema.optional(),
  versions: z.record(nonEmptyString, registryReleaseSchema),
});

export type RegistryCatalogStatus = z.infer<typeof registryCatalogStatusSchema>;
export type RegistryImageReference = z.infer<
  typeof registryImageReferenceSchema
>;
export type RegistryAppearance = z.infer<typeof registryAppearanceSchema>;
export type RegistryGalleryItem = z.infer<typeof registryGalleryItemSchema>;
export type RegistryMediaItem = z.infer<typeof registryMediaItemSchema>;
export type RegistryChangelogTag = z.infer<typeof registryChangelogTagSchema>;
export type RegistryReleaseChangelog = z.infer<
  typeof registryReleaseChangelogSchema
>;
export type RegistryRelease = z.infer<typeof registryReleaseSchema>;
export type RegistryCatalogEntry = z.infer<typeof registryCatalogEntrySchema>;
export type RegistryCatalogIndex = z.infer<typeof registryCatalogIndexSchema>;
export type RegistryCatalogDetail = z.infer<typeof registryCatalogDetailSchema>;
