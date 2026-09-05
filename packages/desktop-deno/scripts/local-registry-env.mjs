import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_LOCAL_REGISTRY_RELAY = "ws://registry.localhost:8281";
const DEFAULT_LOCAL_FIXTURE_ORIGIN = "http://127.0.0.1:8090";

export async function resolveDesktopLocalRegistryEnvironment(
  environment,
  packageRoot,
) {
  if (hasConfiguredRegistry(environment)) {
    return { values: {}, source: "configured" };
  }

  const fixturePath =
    environment.LAPIS_COMMUNITY_REGISTRY_FIXTURE_ENV?.trim() ||
    path.resolve(
      packageRoot,
      "../../../lapis-community/.local/registry-fixture/fixture.env",
    );
  let fixture;
  try {
    fixture = parseEnvironment(await readFile(fixturePath, "utf8"));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT" &&
      !environment.LAPIS_COMMUNITY_REGISTRY_FIXTURE_ENV?.trim()
    ) {
      return { values: {}, source: "unavailable" };
    }
    throw error;
  }

  const curatorPubkeys = fixture.REGISTRY_CURATOR_PUBKEYS?.trim();
  if (!curatorPubkeys) {
    throw new Error(
      `Local registry fixture is missing REGISTRY_CURATOR_PUBKEYS: ${fixturePath}`,
    );
  }

  const relayUrl =
    environment.LAPIS_COMMUNITY_REGISTRY_RELAY_URL?.trim() ||
    relayUrlForPort(environment.LAPIS_RELAY_PORT) ||
    DEFAULT_LOCAL_REGISTRY_RELAY;
  const fixtureOrigin =
    fixtureOriginForPort(environment.REGISTRY_FIXTURE_PORT) ||
    DEFAULT_LOCAL_FIXTURE_ORIGIN;
  return {
    values: {
      VITE_LAPIS_NOSTR_REGISTRY_RELAYS: relayUrl,
      VITE_LAPIS_NOSTR_CURATOR_PUBKEYS: curatorPubkeys,
      VITE_LAPIS_NOSTR_INSTALL_QUORUM: "1",
      VITE_LAPIS_NOSTR_BLOSSOM_URL: fixtureOrigin,
    },
    source: "local-fixture",
    relayUrl,
  };
}

function hasConfiguredRegistry(environment) {
  return Boolean(
    environment.VITE_LAPIS_NOSTR_REGISTRY_RELAYS?.trim() ||
      environment.VITE_LAPIS_NOSTR_CURATOR_PUBKEYS?.trim(),
  );
}

function relayUrlForPort(value) {
  const port = value?.trim();
  return port ? `ws://registry.localhost:${port}` : undefined;
}

function fixtureOriginForPort(value) {
  const port = value?.trim();
  return port ? `http://127.0.0.1:${port}` : undefined;
}

function parseEnvironment(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return separator < 1
          ? [line, ""]
          : [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}
