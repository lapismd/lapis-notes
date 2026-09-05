export type NostrKeychainPlatform = "darwin" | "linux" | "windows" | string;

export interface NostrKeychainCommand {
  command: string;
  args: string[];
  stdin?: string;
}

export interface NostrKeychainCommandResult {
  success: boolean;
  stdout: string;
}

export type NostrKeychainCommandRunner = (
  command: NostrKeychainCommand,
) => Promise<NostrKeychainCommandResult>;

export interface NostrCredentialStore {
  get(accountId: string): Promise<string | null>;
  put(accountId: string, credential: string): Promise<void>;
  delete(accountId: string): Promise<void>;
}

const KEYCHAIN_SERVICE = "md.lapis.notes.nostr";
const ACCOUNT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u;

export class DenoNostrKeychain implements NostrCredentialStore {
  constructor(
    readonly platform: NostrKeychainPlatform = Deno.build.os,
    readonly run: NostrKeychainCommandRunner = runKeychainCommand,
  ) {}

  async get(accountId: string): Promise<string | null> {
    const command = createNostrKeychainCommand(
      this.platform,
      "get",
      validateAccountId(accountId),
    );
    const result = await this.run(command);
    if (!result.success) return null;
    return result.stdout.replace(/[\r\n]+$/u, "");
  }

  async put(accountId: string, credential: string): Promise<void> {
    if (!credential) throw new TypeError("Nostr credential is required");
    const command = createNostrKeychainCommand(
      this.platform,
      "put",
      validateAccountId(accountId),
      credential,
    );
    const result = await this.run(command);
    if (!result.success) throw new Error("Unable to save Nostr credential");
  }

  async delete(accountId: string): Promise<void> {
    const command = createNostrKeychainCommand(
      this.platform,
      "delete",
      validateAccountId(accountId),
    );
    const result = await this.run(command);
    if (!result.success) throw new Error("Unable to delete Nostr credential");
  }
}

export function nostrKeychainAvailable(
  platform: NostrKeychainPlatform,
): boolean {
  return platform === "darwin" || platform === "linux";
}

export function createNostrKeychainCommand(
  platform: NostrKeychainPlatform,
  operation: "get" | "put" | "delete",
  accountId: string,
  credential?: string,
): NostrKeychainCommand {
  if (platform === "darwin") {
    if (operation === "get") {
      return {
        command: "/usr/bin/security",
        args: [
          "find-generic-password",
          "-a",
          accountId,
          "-s",
          KEYCHAIN_SERVICE,
          "-w",
        ],
      };
    }
    if (operation === "delete") {
      return {
        command: "/usr/bin/security",
        args: [
          "delete-generic-password",
          "-a",
          accountId,
          "-s",
          KEYCHAIN_SERVICE,
        ],
      };
    }
    return {
      command: "/usr/bin/security",
      args: [
        "add-generic-password",
        "-U",
        "-a",
        accountId,
        "-s",
        KEYCHAIN_SERVICE,
        "-w",
      ],
      stdin: `${credential ?? ""}\n`,
    };
  }
  if (platform === "linux") {
    if (operation === "get") {
      return {
        command: "secret-tool",
        args: ["lookup", "service", KEYCHAIN_SERVICE, "account", accountId],
      };
    }
    if (operation === "delete") {
      return {
        command: "secret-tool",
        args: ["clear", "service", KEYCHAIN_SERVICE, "account", accountId],
      };
    }
    return {
      command: "secret-tool",
      args: [
        "store",
        "--label=Lapis Notes Nostr identity",
        "service",
        KEYCHAIN_SERVICE,
        "account",
        accountId,
      ],
      stdin: `${credential ?? ""}\n`,
    };
  }
  throw new Error(`Nostr keychain is unavailable on ${platform}`);
}

async function runKeychainCommand(
  command: NostrKeychainCommand,
): Promise<NostrKeychainCommandResult> {
  const child = new Deno.Command(command.command, {
    args: command.args,
    stdin: command.stdin === undefined ? "null" : "piped",
    stdout: "piped",
    stderr: "null",
  }).spawn();
  if (command.stdin !== undefined) {
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(command.stdin));
    await writer.close();
  }
  const output = await child.output();
  return {
    success: output.success,
    stdout: new TextDecoder().decode(output.stdout),
  };
}

function validateAccountId(value: string): string {
  if (!ACCOUNT_ID_PATTERN.test(value)) {
    throw new TypeError("Invalid Nostr account identifier");
  }
  return value;
}
