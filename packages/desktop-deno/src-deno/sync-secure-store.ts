const SERVICE = "md.lapis.notes.sync";
const KEY_BYTES = 32;

export interface SyncSecureStoreBackend {
  readonly provider: string;
  load(account: string): Promise<string | null>;
  store(account: string, secret: string): Promise<void>;
}

export interface SecureCommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export type SecureCommandRunner = (
  command: string,
  args: string[],
  stdin?: string,
) => Promise<SecureCommandResult>;

export interface DesktopSyncWrappingKeyResult {
  provider: "os-credential-store";
  keyId: string;
  wrappingKeyBase64: string;
}

export async function getDesktopSyncWrappingKey(
  payload: Record<string, unknown>,
  options: {
    platform?: typeof Deno.build.os;
    backend?: SyncSecureStoreBackend;
    runner?: SecureCommandRunner;
  } = {},
): Promise<DesktopSyncWrappingKeyResult> {
  const vaultId = requireIdentifier(payload.vaultId, "vaultId");
  const pluginId = requireIdentifier(payload.pluginId, "pluginId");
  const create = payload.create === true;
  const account = `${vaultId}:${pluginId}`;
  const backend =
    options.backend ??
    createPlatformSyncSecureStore(
      options.platform ?? Deno.build.os,
      options.runner ?? runSecureCommand,
    );
  let secret = await backend.load(account);
  if (!secret) {
    if (!create) {
      throw new Error(
        `The OS credential for ${pluginId} is unavailable; sync recovery or re-enrollment is required`,
      );
    }
    secret = toBase64(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));
    await backend.store(account, secret);
  }
  requireWrappingKey(secret);
  return {
    provider: "os-credential-store",
    keyId: `${backend.provider}:${account}`,
    wrappingKeyBase64: secret,
  };
}

export function createPlatformSyncSecureStore(
  platform: typeof Deno.build.os,
  runner: SecureCommandRunner = runSecureCommand,
): SyncSecureStoreBackend {
  if (platform === "darwin") return createMacosKeychainBackend(runner);
  if (platform === "linux") return createLinuxSecretServiceBackend(runner);
  if (platform === "windows") return createWindowsCredentialBackend(runner);
  throw new Error(`OS credential storage is unsupported on ${platform}`);
}

function createMacosKeychainBackend(
  runner: SecureCommandRunner,
): SyncSecureStoreBackend {
  return {
    provider: "macos-keychain",
    async load(account) {
      const result = await runner("security", [
        "find-generic-password",
        "-s",
        SERVICE,
        "-a",
        account,
        "-w",
      ]);
      if (result.code === 44) return null;
      if (result.code !== 0) throw commandFailure("macOS Keychain lookup", result);
      return result.stdout.trim() || null;
    },
    async store(account, secret) {
      const result = await runner("security", ["-i"], [
        "add-generic-password -U",
        `-s ${securityQuote(SERVICE)}`,
        `-a ${securityQuote(account)}`,
        `-w ${securityQuote(secret)}`,
      ].join(" ") + "\n");
      if (result.code !== 0) throw commandFailure("macOS Keychain update", result);
    },
  };
}

function createLinuxSecretServiceBackend(
  runner: SecureCommandRunner,
): SyncSecureStoreBackend {
  return {
    provider: "linux-secret-service",
    async load(account) {
      const result = await runner("secret-tool", [
        "lookup",
        "service",
        SERVICE,
        "account",
        account,
      ]);
      if (result.code !== 0 || !result.stdout.trim()) return null;
      return result.stdout.trim();
    },
    async store(account, secret) {
      const result = await runner(
        "secret-tool",
        [
          "store",
          `--label=Lapis Notes Sync (${account})`,
          "service",
          SERVICE,
          "account",
          account,
        ],
        secret,
      );
      if (result.code !== 0) throw commandFailure("Secret Service update", result);
    },
  };
}

function createWindowsCredentialBackend(
  runner: SecureCommandRunner,
): SyncSecureStoreBackend {
  const root = Deno.env.get("LOCALAPPDATA")?.trim();
  if (!root) throw new Error("Windows local application storage is unavailable");
  const directory = `${root}\\Lapis Notes\\sync-credentials`;
  const pathFor = async (account: string) =>
    `${directory}\\${await sha256Hex(`${SERVICE}:${account}`)}.dpapi`;
  return {
    provider: "windows-dpapi-current-user",
    async load(account) {
      let encrypted: string;
      try {
        encrypted = await Deno.readTextFile(await pathFor(account));
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) return null;
        throw error;
      }
      const script = [
        "$ErrorActionPreference='Stop'",
        "$encrypted=[Convert]::FromBase64String([Console]::In.ReadToEnd())",
        "$clear=[Security.Cryptography.ProtectedData]::Unprotect($encrypted,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)",
        "try { [Console]::Out.Write([Convert]::ToBase64String($clear)) } finally { [Array]::Clear($clear,0,$clear.Length) }",
      ].join(";");
      const result = await runner("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
      ], encrypted);
      if (result.code !== 0) {
        throw commandFailure("Windows DPAPI unlock", result);
      }
      return result.stdout.trim() || null;
    },
    async store(account, secret) {
      const script = [
        "$ErrorActionPreference='Stop'",
        "$clear=[Convert]::FromBase64String([Console]::In.ReadToEnd())",
        "$protected=[Security.Cryptography.ProtectedData]::Protect($clear,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)",
        "try { [Console]::Out.Write([Convert]::ToBase64String($protected)) } finally { [Array]::Clear($clear,0,$clear.Length) }",
      ].join(";");
      const result = await runner(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", script],
        secret,
      );
      if (result.code !== 0) {
        throw commandFailure("Windows DPAPI protection", result);
      }
      await Deno.mkdir(directory, { recursive: true });
      await Deno.writeTextFile(await pathFor(account), result.stdout.trim(), {
        mode: 0o600,
      });
    },
  };
}

async function runSecureCommand(
  command: string,
  args: string[],
  stdin?: string,
): Promise<SecureCommandResult> {
  const child = new Deno.Command(command, {
    args,
    stdin: stdin === undefined ? "null" : "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  if (stdin !== undefined) {
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(stdin));
    await writer.close();
  }
  const output = await child.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

function requireIdentifier(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9._:-]{1,160}$/u.test(value)
  ) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function requireWrappingKey(value: string): void {
  try {
    if (fromBase64(value).byteLength !== KEY_BYTES) throw new Error();
  } catch {
    throw new Error("The OS credential contains invalid sync wrapping material");
  }
}

function securityQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function commandFailure(action: string, result: SecureCommandResult): Error {
  const detail = result.stderr.trim() || `exit ${result.code}`;
  return new Error(`${action} failed: ${detail}`);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
