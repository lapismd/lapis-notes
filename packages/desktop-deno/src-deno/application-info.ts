import packageMetadata from "../package.json" with { type: "json" };

export const DESKTOP_APPLICATION_INFO = {
  name: "Lapis Notes",
  version: packageMetadata.version,
  buildTime: null,
  copyright: "Copyright © Lapis Notes contributors.",
} as const;

export type DesktopApplicationInfo = typeof DESKTOP_APPLICATION_INFO;
