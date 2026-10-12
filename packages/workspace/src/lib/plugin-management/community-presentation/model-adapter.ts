import {
  resolveRegistryMedia,
  type PluginCatalogEntry,
  type PluginCatalogDetail,
  type PluginCatalogRelease,
  type RegistryMediaV2,
} from "@lapis-notes/api";
export type RegistryCatalogEntry = PluginCatalogEntry;
export type RegistryImageReference = ReturnType<typeof resolveRegistryMedia>;
export type RegistryMediaItem = Omit<RegistryMediaV2, "images"> & {
  images: Record<"preview" | "full" | "light" | "dark", RegistryImageReference>;
};
export type RegistryGalleryItem = RegistryMediaItem & { id: string };
export type RegistryRelease = PluginCatalogRelease & {
  releaseSequence?: string;
  bundle: PluginCatalogRelease["bundle"] & { size: number; pending: boolean };
};
export type RegistryChangelogTag = NonNullable<
  NonNullable<PluginCatalogRelease["changelog"]>["tags"]
>[number];
export type RegistryResolvedDetail = {
  entry: PluginCatalogEntry;
  detail: Omit<
    PluginCatalogDetail,
    "appearance" | "media" | "gallery" | "versions" | "status"
  > & {
    status: NonNullable<PluginCatalogDetail["status"]>;
    appearance?: {
      icon: string;
      accent: string;
      logo?: RegistryImageReference & { alt: string };
    };
    media?: { banner?: RegistryMediaItem; overview?: RegistryMediaItem };
    gallery?: RegistryGalleryItem[];
    versions: Record<string, RegistryRelease>;
  };
};
export type RegistryInstallAction = {
  state: "available" | "installed" | "installing" | "disabled" | "rejected";
  label?: string;
  reason?: string;
  installedVersion?: string;
};
export type RegistryInstallRequest = {
  pluginId: string;
  version: string;
  bundle: RegistryRelease["bundle"];
};
export function imageReference(
  media: RegistryMediaV2,
): RegistryImageReference & { alt: string } {
  return { ...resolveRegistryMedia(media), alt: media.alt };
}
function mediaItem(media: RegistryMediaV2): RegistryMediaItem {
  return {
    ...media,
    images: {
      preview: resolveRegistryMedia(media, "preview"),
      full: resolveRegistryMedia(media, "full"),
      light: resolveRegistryMedia(media, "light"),
      dark: resolveRegistryMedia(media, "dark"),
    },
  };
}
export function communityDetail(
  entry: PluginCatalogEntry,
  detail: PluginCatalogDetail,
): RegistryResolvedDetail {
  return {
    entry,
    detail: {
      ...detail,
      status: detail.status ?? entry.status ?? "active",
      appearance: detail.appearance
        ? {
            ...detail.appearance,
            logo: detail.appearance.logo
              ? imageReference(detail.appearance.logo)
              : undefined,
          }
        : undefined,
      media: detail.media
        ? {
            banner: detail.media.banner
              ? mediaItem(detail.media.banner)
              : undefined,
            overview: detail.media.overview
              ? mediaItem(detail.media.overview)
              : undefined,
          }
        : undefined,
      gallery: detail.gallery?.map((item) => ({
        ...mediaItem(item),
        id: item.id,
      })),
      versions: Object.fromEntries(
        Object.entries(detail.versions).map(([version, release]) => [
          version,
          {
            ...release,
            bundle: {
              ...release.bundle,
              size: release.bundle.size ?? 0,
              pending:
                "pending" in release.bundle && release.bundle.pending === true,
            },
          },
        ]),
      ),
    },
  };
}
const statusLabels: Record<string, string> = {
  active: "Available",
  pending: "Coming soon",
  deprecated: "Deprecated",
  disabled: "Unavailable",
  revoked: "Revoked",
};

export function registryStatusLabel(status: string = "active"): string {
  return statusLabels[status] ?? titleCaseRegistryValue(status);
}

export function titleCaseRegistryValue(value: string): string {
  return value
    .split("-")
    .map((part) =>
      part.toLocaleLowerCase() === "ai"
        ? "AI"
        : `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`,
    )
    .join(" ");
}

export function formatRegistryBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "Unknown size";
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB"] as const;
  let value = size / 1024;
  for (const unit of units) {
    if (value < 1024 || unit === units.at(-1)) {
      return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
    }
    value /= 1024;
  }
  return `${size} B`;
}
