import { describe, expect, it, vi } from "vitest";

import {
  createNostrKeychainCommand,
  DenoNostrKeychain,
  nostrKeychainAvailable,
} from "./nostr-keychain";

describe("Deno Nostr keychain", () => {
  it("passes macOS and Linux credentials over stdin instead of argv", () => {
    const credential = '{"secretKeyHex":"do-not-log"}';
    for (const platform of ["darwin", "linux"] as const) {
      const command = createNostrKeychainCommand(
        platform,
        "put",
        "account-1",
        credential,
      );
      expect(command.args).not.toContain(credential);
      expect(command.stdin).toBe(`${credential}\n`);
    }
    expect(
      createNostrKeychainCommand(
        "darwin",
        "put",
        "account-1",
        credential,
      ).args.at(-1),
    ).toBe("-w");
  });

  it("uses a fixed service namespace and validates account identifiers", () => {
    expect(createNostrKeychainCommand("linux", "get", "account-1")).toEqual({
      command: "secret-tool",
      args: [
        "lookup",
        "service",
        "md.lapis.notes.nostr",
        "account",
        "account-1",
      ],
    });
    expect(() =>
      createNostrKeychainCommand("windows", "get", "account-1"),
    ).toThrow("unavailable");
    expect(nostrKeychainAvailable("darwin")).toBe(true);
    expect(nostrKeychainAvailable("linux")).toBe(true);
    expect(nostrKeychainAvailable("windows")).toBe(false);
  });

  it("returns missing entries without exposing native command output", async () => {
    const run = vi.fn(async () => ({ success: false, stdout: "" }));
    const keychain = new DenoNostrKeychain("darwin", run);
    await expect(keychain.get("account-1")).resolves.toBeNull();
    await expect(keychain.put("account-1", "credential")).rejects.toThrow(
      "Unable to save",
    );
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("rejects account identifiers that could alter the native command", async () => {
    const keychain = new DenoNostrKeychain("darwin", vi.fn());
    await expect(keychain.get("--all")).rejects.toThrow(
      "Invalid Nostr account",
    );
    await expect(keychain.get("account/../../other")).rejects.toThrow(
      "Invalid Nostr account",
    );
  });
});
