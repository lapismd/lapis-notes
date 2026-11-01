import type { Plugin } from "vite";
import { pluginHostModuleRegistry } from "../generated/plugin-host-modules.schema.generated.js";

export interface RendererHostModuleOptions {
  /** Plugin producers externalize imports; npm hosts resolve admitted providers. */
  mode: "plugin" | "host";
  /** The exact installed compiler/runtime version, never a semver range. */
  svelteVersion: string;
}

/** Bind compiled plugins to the host's public versioned renderer catalog. */
export function rendererHostModulePlugin(options: RendererHostModuleOptions) {
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][\w.-]+)?$/.test(options.svelteVersion))
    throw Error("Renderer binding requires an exact Svelte version");
  if (options.mode !== "plugin" && options.mode !== "host")
    throw Error("Renderer mode must be plugin or host");
  const entries = Object.values(pluginHostModuleRegistry).filter(
    (entry) =>
      entry.source === "renderer-abi" &&
      entry.public &&
      entry.version === options.svelteVersion,
  );
  if (!entries.length)
    throw Error(
      `The host catalog does not admit Svelte ${options.svelteVersion}`,
    );
  const providers = new Map(
    entries.map((entry) => [entry.specifier as string, entry.entry as string]),
  );
  const specifiers = new Map(
    entries.map((entry) => [entry.entry as string, entry.specifier as string]),
  );
  return {
    name: "lapis-renderer-host-modules",
    enforce: "pre",
    config() {
      return {
        optimizeDeps: {
          // These are host ABI identifiers, not exports of the npm Svelte package.
          exclude: options.mode === "host" ? [...providers.keys()] : [],
        },
      };
    },
    async resolveId(
      source: string,
      importer?: string,
    ): Promise<{
      id: string;
      external?: boolean | "absolute" | "relative";
    } | null> {
      if (source.startsWith("svelte/renderer/")) {
        const provider = providers.get(source);
        if (!provider) throw Error(`Unadmitted renderer module: ${source}`);
        if (options.mode === "plugin") return { id: source, external: true };
        const resolved = await this.resolve(provider, importer, {
          skipSelf: true,
        });
        if (!resolved)
          throw Error(`Missing host renderer provider: ${provider}`);
        return resolved;
      }
      if (
        options.mode !== "plugin" ||
        !(source === "svelte" || source.startsWith("svelte/"))
      )
        return null;
      const specifier = specifiers.get(source);
      if (!specifier)
        throw Error(`Unadmitted compiler renderer module: ${source}`);
      return { id: specifier, external: true };
    },
  } satisfies Plugin;
}
