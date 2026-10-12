import { resolve } from "node:path";

export type ServerConfig = {
  dataRoot: string;
  staticRoot: string;
  hostname: string;
  port: number;
  origin: string;
  secureCookie: boolean;
  trustForwardedHeaders: boolean;
  buildId: string;
};

export const LAPIS_SERVER_ENV_NAMES = [
  "LAPIS_SERVER_BOOTSTRAP_USERNAME",
  "LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE",
  "LAPIS_SERVER_DATA_ROOT",
  "LAPIS_SERVER_STATIC_ROOT",
  "LAPIS_SERVER_HOST",
  "LAPIS_SERVER_PORT",
  "LAPIS_SERVER_ORIGIN",
  "LAPIS_SERVER_INSECURE_COOKIE",
  "LAPIS_SERVER_TRUST_PROXY",
  "LAPIS_SERVER_BUILD_ID",
] as const;

export function readServerEnvironment(): Record<string, string | undefined> {
  return Object.fromEntries(
    LAPIS_SERVER_ENV_NAMES.map((name) => [name, Deno.env.get(name)]),
  );
}

function requiredAbsolutePath(value: string | undefined, name: string): string {
  const path = value?.trim();
  if (!path) throw new Error(`${name} is required`);
  const absolute = resolve(path);
  if (absolute !== path) throw new Error(`${name} must be an absolute path`);
  return absolute;
}

function port(value: string | undefined): number {
  const parsed = Number(value ?? "8787");
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error("LAPIS_SERVER_PORT must be an integer from 1 to 65535");
  }
  return parsed;
}

export function loadServerConfig(
  env: Record<string, string | undefined> = readServerEnvironment(),
): ServerConfig {
  const dataRoot = requiredAbsolutePath(
    env.LAPIS_SERVER_DATA_ROOT,
    "LAPIS_SERVER_DATA_ROOT",
  );
  const staticRoot = requiredAbsolutePath(
    env.LAPIS_SERVER_STATIC_ROOT,
    "LAPIS_SERVER_STATIC_ROOT",
  );
  const origin = new URL(env.LAPIS_SERVER_ORIGIN ?? "");
  if (origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error(
      "LAPIS_SERVER_ORIGIN must contain only scheme and authority",
    );
  }
  if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
    throw new Error("LAPIS_SERVER_ORIGIN must use HTTPS outside localhost");
  }
  const insecureCookie = env.LAPIS_SERVER_INSECURE_COOKIE === "1";
  if (insecureCookie && origin.hostname !== "localhost") {
    throw new Error(
      "Insecure cookies are allowed only for localhost development",
    );
  }
  return {
    dataRoot,
    staticRoot,
    hostname: env.LAPIS_SERVER_HOST?.trim() || "127.0.0.1",
    port: port(env.LAPIS_SERVER_PORT),
    origin: origin.origin,
    secureCookie: !insecureCookie,
    trustForwardedHeaders: env.LAPIS_SERVER_TRUST_PROXY === "1",
    buildId: env.LAPIS_SERVER_BUILD_ID?.trim() || "development",
  };
}
