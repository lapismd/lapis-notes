import type {
  AppPluginDistributionOptions,
  TrustedSigningKey,
} from "@lapis-notes/api";

/** Test-only trust and transport configuration; normal release builds ignore it. */
export function createConfiguredNotesLocalPluginDistribution(
  environment: Record<string, string | boolean | undefined>,
  explicit?: AppPluginDistributionOptions,
): AppPluginDistributionOptions | undefined {
  if (explicit !== undefined) return explicit;
  if (environment.MODE === "production" || environment.MODE === "server") {
    return undefined;
  }
  if (environment.DEV !== true && environment.MODE !== "registry-acceptance") {
    return undefined;
  }
  const catalog = stringValue(environment.VITE_LAPIS_LOCAL_REGISTRY_URL);
  const origin = stringValue(
    environment.VITE_LAPIS_LOCAL_REGISTRY_ARTIFACT_ORIGIN,
  );
  const keys = stringValue(environment.VITE_LAPIS_LOCAL_REGISTRY_TRUSTED_KEYS);
  if (!catalog && !origin && !keys) return undefined;
  if (!catalog || !origin || !keys) {
    throw new Error(
      "Local registry URL, artifact origin and public keys must be configured together.",
    );
  }
  const transport = publicUrl(
    catalog,
    "Local registry requires a loopback catalog URL.",
  );
  if (
    !["http:", "https:"].includes(transport.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(transport.hostname) ||
    transport.search !== "" ||
    !transport.pathname.endsWith("/index.json")
  ) {
    throw new Error("Local registry requires a loopback catalog URL.");
  }
  const artifactOrigin = publicUrl(
    origin,
    "Local registry artifacts require an exact HTTPS origin.",
  );
  if (
    artifactOrigin.protocol !== "https:" ||
    artifactOrigin.pathname !== "/" ||
    artifactOrigin.search !== ""
  ) {
    throw new Error("Local registry artifacts require an exact HTTPS origin.");
  }
  const trustedKeys = publicKeys(keys);
  const fetch = globalThis.fetch.bind(globalThis);
  return {
    registries: [
      {
        id: "lapis-local",
        name: "Local plugin release fixture",
        kind: "http",
        url: transport.href,
        trustTier: "official",
        enabled: true,
        builtin: true,
      },
    ],
    trustedKeys,
    fetch: (url, init) => {
      const requested = new URL(url);
      const target =
        requested.origin === artifactOrigin.origin
          ? new URL(requested.pathname + requested.search, transport.origin)
              .href
          : url;
      return fetch(target, init);
    },
  };
}

function stringValue(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function publicUrl(value: string, message: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(message);
  }
  if (url.username || url.password || url.hash) throw new Error(message);
  return url;
}

function publicKeys(value: string): TrustedSigningKey[] {
  const message = "Local registry requires unique, valid public signing keys.";
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(message);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error(message);
  const ids = new Set<string>();
  const allowed = new Set(["keyId", "alg", "publicKey", "trustTier"]);
  for (const entry of parsed) {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      Object.keys(entry).some((key) => !allowed.has(key)) ||
      typeof entry.keyId !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(entry.keyId) ||
      ids.has(entry.keyId) ||
      entry.alg !== "ed25519" ||
      typeof entry.publicKey !== "string" ||
      !/^[A-Za-z0-9+/]{43}=$/u.test(entry.publicKey) ||
      !["official", "community", "local"].includes(entry.trustTier)
    ) {
      throw new Error(message);
    }
    ids.add(entry.keyId);
  }
  return parsed;
}
