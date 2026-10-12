import { z } from "zod";
import {
  registryCatalogEntrySchema,
  registryCatalogDetailSchema,
  registryCatalogStatusSchema,
  registryImageReferenceSchema,
  registryReleaseSchema,
  registryReleaseChangelogSchema,
} from "./catalog-v1.js";

export {
  registryCatalogStatusSchema,
  registryImageReferenceSchema,
  registryReleaseChangelogSchema,
};

/** Authored variants remain optional; display fallbacks never rewrite metadata. */
export const registryImageSetSchema = z
  .object({
    preview: registryImageReferenceSchema.optional(),
    full: registryImageReferenceSchema.optional(),
    light: registryImageReferenceSchema.optional(),
    dark: registryImageReferenceSchema.optional(),
  })
  .refine(
    (images) => Object.values(images).some(Boolean),
    "At least one image variant is required",
  );
export const registryMediaV2Schema = z.object({
  alt: z.string().min(1),
  images: registryImageSetSchema,
});
export const registryGalleryV2Schema = registryMediaV2Schema.extend({
  id: z.string().min(1),
});
export const registryAppearanceV2Schema = z.object({
  icon: z.string().min(1),
  accent: z.string().min(1),
  logo: registryMediaV2Schema.optional(),
});
export const registryReleaseV2Schema = registryReleaseSchema.omit({
  releaseEventId: true,
  manifestSha256: true,
  releaseSequence: true,
});
export const registryCatalogV2EntrySchema = registryCatalogEntrySchema.extend({
  schemaVersion: z.literal(2).optional(),
  appearance: registryAppearanceV2Schema.optional(),
  links: registryCatalogDetailSchema.shape.links,
});
export const registryCatalogV2IndexSchema = z.object({
  schemaVersion: z.literal(2),
  generatedAt: z.string().datetime({ offset: true }),
  plugins: z.array(registryCatalogV2EntrySchema),
});
export const registryCatalogV2DetailSchema = registryCatalogDetailSchema.extend(
  {
    schemaVersion: z.literal(2),
    appearance: registryAppearanceV2Schema.optional(),
    media: z
      .object({
        banner: registryMediaV2Schema.optional(),
        overview: registryMediaV2Schema.optional(),
      })
      .optional(),
    gallery: z.array(registryGalleryV2Schema).optional(),
    versions: z.record(z.string().min(1), registryReleaseV2Schema),
  },
);
export type RegistryImageSet = z.infer<typeof registryImageSetSchema>;
export type RegistryMediaV2 = z.infer<typeof registryMediaV2Schema>;
export type RegistryCatalogV2Entry = z.infer<
  typeof registryCatalogV2EntrySchema
>;
export type RegistryCatalogV2Index = z.infer<
  typeof registryCatalogV2IndexSchema
>;
export type RegistryCatalogV2Detail = z.infer<
  typeof registryCatalogV2DetailSchema
>;
export type RegistryReleaseV2 = z.infer<typeof registryReleaseV2Schema>;
export type RegistryReleaseChangelog = z.infer<
  typeof registryReleaseChangelogSchema
>;

export function resolveRegistryMedia(
  media: RegistryMediaV2,
  variant: keyof RegistryImageSet = "preview",
) {
  const images = media.images;
  const reference =
    images[variant] ??
    images.full ??
    images.light ??
    images.dark ??
    images.preview;
  if (!reference) throw new Error("Media has no usable image variant");
  return reference;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected registry object");
  return value as Record<string, unknown>;
}
function appearance(value: unknown) {
  if (value === undefined) return undefined;
  const result = record(value);
  if (result.logo === undefined) return result;
  const logo = record(result.logo);
  return {
    ...result,
    logo: logo.images ? logo : { alt: logo.alt, images: { full: logo } },
  };
}

/** Call only after the source adapter has verified the original signed input. */
export function normalizeRegistryCatalogEntry(
  value: unknown,
): RegistryCatalogV2Entry {
  const entry = record(value);
  const author = entry.author ?? record(entry.owner ?? {}).name;
  return registryCatalogV2EntrySchema.parse({
    ...entry,
    schemaVersion: 2,
    appearance: appearance(entry.appearance),
    status: entry.status ?? "active",
    badges: entry.badges ?? [],
    links: {
      ...((entry.links as object) ?? {}),
      ...(!(entry.links as Record<string, unknown> | undefined)
        ?.documentation && typeof entry.readmeUrl === "string"
        ? { documentation: entry.readmeUrl }
        : {}),
    },
    owner: entry.owner ?? {
      name: author,
      verified: entry.channel === "official",
    },
  });
}
export function normalizeRegistryCatalogIndex(
  value: unknown,
): RegistryCatalogV2Index {
  const index = record(value);
  if (index.schemaVersion !== 1 && index.schemaVersion !== 2)
    throw new Error("Unsupported registry schema version");
  if (!Array.isArray(index.plugins))
    throw new Error("Expected registry plugin list");
  return registryCatalogV2IndexSchema.parse({
    ...index,
    schemaVersion: 2,
    plugins: index.plugins.map(normalizeRegistryCatalogEntry),
  });
}
export function normalizeRegistryCatalogDetail(
  value: unknown,
): RegistryCatalogV2Detail {
  const detail = record(value);
  if (detail.schemaVersion !== 1 && detail.schemaVersion !== 2)
    throw new Error("Unsupported registry schema version");
  const owner = record(detail.owner ?? {});
  return registryCatalogV2DetailSchema.parse({
    ...detail,
    schemaVersion: 2,
    author: detail.author ?? owner.name,
    authorUrl: detail.authorUrl ?? owner.url,
    status: detail.status ?? "active",
    links: {
      ...((detail.links as object) ?? {}),
      ...(!(detail.links as Record<string, unknown> | undefined)
        ?.documentation && typeof detail.readmeUrl === "string"
        ? { documentation: detail.readmeUrl }
        : {}),
    },
    owner: { ...owner, verified: owner.verified ?? false },
    appearance: appearance(detail.appearance),
  });
}

export { registryChangelogFromMarkdown } from "./release-notes.js";
