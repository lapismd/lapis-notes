import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { readFile } from "node:fs/promises";

import { ServerHostError } from "@lapis-notes/api/server-host";

import type {
  ControlDatabase,
  ControlSession,
  ControlUser,
} from "./control-database.ts";

export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1_000;
export const SESSION_ABSOLUTE_MS = 30 * 24 * 60 * 60 * 1_000;
export const SESSION_COOKIE_NAME = "__Host-lapis_session";
export const INSECURE_SESSION_COOKIE_NAME = "lapis_session";
export const CSRF_HEADER_NAME = "x-lapis-csrf";

const SCRYPT_N = 2 ** 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_BYTES = 64;
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;
const LOGIN_WINDOW_MS = 10 * 60 * 1_000;
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_BLOCK_MS = 15 * 60 * 1_000;

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function opaqueToken(bytes = 32): string {
  return base64Url(randomBytes(bytes));
}

function derivePassword(password: string, salt: Uint8Array): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      SCRYPT_KEY_BYTES,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derived) => (error ? reject(error) : resolve(derived)),
    );
  });
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 1_024) {
    throw new Error("Password must contain between 12 and 1024 characters");
  }
  const salt = randomBytes(16);
  const derived = await derivePassword(password, salt);
  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    base64Url(salt),
    base64Url(derived),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, n, r, p, saltText, hashText, ...rest] = encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    Number(n) !== SCRYPT_N ||
    Number(r) !== SCRYPT_R ||
    Number(p) !== SCRYPT_P ||
    !saltText ||
    !hashText ||
    rest.length
  ) {
    return false;
  }
  try {
    const expected = decodeBase64Url(hashText);
    if (expected.byteLength !== SCRYPT_KEY_BYTES) return false;
    const actual = await derivePassword(password, decodeBase64Url(saltText));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function parseCookie(
  header: string | null,
  name: string,
): string | undefined {
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return undefined;
}

export function sessionCookie(token: string, secure = true): string {
  const name = secure ? SESSION_COOKIE_NAME : INSECURE_SESSION_COOKIE_NAME;
  return [
    `${name}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${Math.floor(SESSION_IDLE_MS / 1_000)}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(secure = true): string {
  const name = secure ? SESSION_COOKIE_NAME : INSECURE_SESSION_COOKIE_NAME;
  return [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
}

export function assertOrigin(request: Request, allowedOrigin: string): void {
  if (request.headers.get("origin") !== allowedOrigin) {
    throw new ServerHostError("FORBIDDEN", "Request Origin is not allowed");
  }
}

export function assertCsrf(
  request: Request,
  session: ControlSession,
  allowedOrigin: string,
): void {
  assertOrigin(request, allowedOrigin);
  const presented = request.headers.get(CSRF_HEADER_NAME);
  const left = Buffer.from(presented ?? "");
  const right = Buffer.from(session.csrfToken);
  if (left.byteLength !== right.byteLength || !timingSafeEqual(left, right)) {
    throw new ServerHostError("FORBIDDEN", "Invalid CSRF token");
  }
}

export async function resolveRequestSession(
  request: Request,
  control: ControlDatabase,
  now = Date.now(),
  secureCookie = true,
): Promise<ControlSession | undefined> {
  const name = secureCookie
    ? SESSION_COOKIE_NAME
    : INSECURE_SESSION_COOKIE_NAME;
  const token = parseCookie(request.headers.get("cookie"), name);
  if (!token) return undefined;
  const session = await control.resolveSession(sha256(token));
  if (
    !session ||
    session.revokedAt !== undefined ||
    session.expiresAt <= now ||
    session.lastSeenAt + SESSION_IDLE_MS <= now
  ) {
    if (session && session.revokedAt === undefined) {
      await control.revokeSession(session.id, now);
    }
    return undefined;
  }
  await control.touchSession(session.id, now);
  return { ...session, lastSeenAt: now };
}

export async function createLoginSession(
  control: ControlDatabase,
  user: ControlUser,
  now = Date.now(),
): Promise<{ session: ControlSession; token: string }> {
  const token = opaqueToken();
  const csrfToken = opaqueToken();
  const id = crypto.randomUUID();
  const expiresAt = now + SESSION_ABSOLUTE_MS;
  await control.createSession({
    id,
    userId: user.id,
    tokenHash: sha256(token),
    csrfToken,
    createdAt: now,
    expiresAt,
  });
  return {
    token,
    session: {
      id,
      userId: user.id,
      username: user.username,
      csrfToken,
      createdAt: now,
      lastSeenAt: now,
      expiresAt,
    },
  };
}

export async function assertLoginAllowed(
  control: ControlDatabase,
  username: string,
  remoteAddress: string,
  now = Date.now(),
): Promise<string> {
  const keyHash = sha256(
    `${username.toLocaleLowerCase("en-US")}\0${remoteAddress}`,
  );
  const attempt = await control.loginAttempt(keyHash);
  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    throw new ServerHostError("RATE_LIMITED", "Login temporarily blocked");
  }
  return keyHash;
}

export async function recordFailedLogin(
  control: ControlDatabase,
  keyHash: string,
  now = Date.now(),
): Promise<void> {
  const previous = await control.loginAttempt(keyHash);
  const withinWindow =
    previous && previous.windowStartedAt + LOGIN_WINDOW_MS > now;
  const count = withinWindow ? previous.count + 1 : 1;
  await control.recordLoginAttempt({
    keyHash,
    windowStartedAt: withinWindow ? previous.windowStartedAt : now,
    count,
    ...(count >= LOGIN_MAX_ATTEMPTS
      ? { blockedUntil: now + LOGIN_BLOCK_MS }
      : {}),
  });
}

export async function bootstrapFirstUser(
  control: ControlDatabase,
  env: Record<string, string | undefined> = process.env,
  now = Date.now(),
): Promise<boolean> {
  if ((await control.userCount()) > 0) return false;
  const username = env.LAPIS_SERVER_BOOTSTRAP_USERNAME?.trim();
  const passwordFile = env.LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE?.trim();
  if (!username || username.length > 200 || !passwordFile) {
    throw new Error(
      "Bootstrap username and password file are required when no users exist",
    );
  }
  const password = (await readFile(passwordFile, "utf8")).replace(
    /[\r\n]+$/u,
    "",
  );
  await control.createUser({
    id: crypto.randomUUID(),
    username,
    passwordHash: await hashPassword(password),
    now,
  });
  return true;
}
