import type { App, MetadataType } from "@lapis-notes/api";

type MetadataTypeInfo = {
  type: MetadataType;
  icon: string;
};

export function getMetadataTypeInfo(
  key: string,
  fallbackType: MetadataType = "text",
  app?: Pick<App, "metadataTypeManager">,
): MetadataTypeInfo {
  const metadataTypeManager = app?.metadataTypeManager;
  const type = metadataTypeManager?.properties?.[key]?.type ?? fallbackType;
  const icon =
    metadataTypeManager?.registeredTypeWidgets?.[type ?? ""]?.icon ??
    "lucide-file";

  return {
    type,
    icon,
  };
}
