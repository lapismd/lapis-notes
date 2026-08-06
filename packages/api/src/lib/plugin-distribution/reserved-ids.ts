import { PluginDistributionError } from "./errors";
import type { PluginProvenance } from "./types";

const RESERVED_PREFIXES = ["lapis-"];

export const isReservedPluginId = (pluginId: string): boolean =>
  RESERVED_PREFIXES.some((prefix) => pluginId.startsWith(prefix));

export const assertPluginIdAllowedForProvenance = (
  pluginId: string,
  provenance: PluginProvenance,
): void => {
  if (
    isReservedPluginId(pluginId) &&
    (provenance === "community" || provenance === "manual")
  ) {
    throw new PluginDistributionError(
      "reserved-id",
      `Plugin id ${pluginId} is reserved for bundled, official, or development plugins.`,
      { details: { pluginId, provenance } },
    );
  }
};

export const provenanceFromPluginManifest = (
  _manifest?: unknown,
): "community" => "community";
