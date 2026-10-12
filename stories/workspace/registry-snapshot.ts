import type {
  AppPluginDistributionOptions,
  PluginRegistrySource,
  TrustedSigningKey,
} from "@lapis-notes/api";
import keys from "./registry-snapshot/trusted-keys.json";

// Preserve signed URLs and bytes. Only the transport maps them to bundled assets.
const metadata = import.meta.glob<string>("./registry-snapshot/v2/**/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});
const assets = import.meta.glob<string>(
  "./registry-snapshot/v2/assets/**/*.webp",
  {
    query: "?url",
    import: "default",
    eager: true,
  },
);
const origin = "https://registry.local.lapis.md";
export const snapshotSource: PluginRegistrySource = {
  id: "lapis-official",
  name: "Lapis local registry snapshot",
  kind: "http",
  url: `${origin}/v2/index.json`,
  trustTier: "official",
  enabled: true,
  builtin: true,
};
export const snapshotKeys: TrustedSigningKey[] = keys.map((key) => ({
  ...key,
  alg: "ed25519",
  trustTier: "official",
}));

export function snapshotFetch(originalFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      origin,
    );
    const key = `./registry-snapshot${url.pathname}`;
    if (url.origin !== origin)
      return new Response("Not included in this review snapshot", {
        status: 404,
      });
    if (metadata[key])
      return new Response(metadata[key], {
        headers: { "content-type": "application/json" },
      });
    if (assets[key]) return originalFetch(assets[key], init);
    return new Response("Not included in this review snapshot", {
      status: 404,
    });
  };
}

export function snapshotDistributionOptions(
  fetch: typeof globalThis.fetch,
): AppPluginDistributionOptions {
  return { registries: [snapshotSource], trustedKeys: snapshotKeys, fetch };
}

export function snapshotMediaFetch(originalFetch: typeof fetch): typeof fetch {
  const localFetch = snapshotFetch(originalFetch);
  return (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.startsWith(`${origin}/`)
      ? localFetch(input, init)
      : originalFetch(input, init);
  };
}
