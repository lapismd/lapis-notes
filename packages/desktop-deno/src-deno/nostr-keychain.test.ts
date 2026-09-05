import { describe, expect, it, vi } from "vitest";

import {
  createNostrKeychainCommand,
  DenoNostrKeychain,
  nostrKeychainAvailable,
  runNostrKeychainCommand,
} from "./nostr-keychain";

describe("Deno Nostr keychain", () => {
  it("passes macOS and Linux credentials over stdin instead of argv", () => {
    const credential = '{"secretKeyHex":"do-not-log"}';
    const macosCommand = createNostrKeychainCommand(
      "darwin",
      "put",
      "account-1",
      credential,
    );
    const credentialHex = Array.from(
      new TextEncoder().encode(credential),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");

    expect(macosCommand).toEqual({
      command: "/usr/bin/security",
      args: ["-i"],
      stdin:
        "add-generic-password -U -a account-1 " +
        `-s md.lapis.notes.nostr -X ${credentialHex}\n`,
    });
    expect(macosCommand.args).not.toContain(credential);
    expect(macosCommand.stdin).not.toContain(credential);

    const linuxCommand = createNostrKeychainCommand(
      "linux",
      "put",
      "account-1",
      credential,
    );
    expect(linuxCommand.args).not.toContain(credential);
    expect(linuxCommand.stdin).toBe(`${credential}\n`);
  });

  it("kills native credential commands after a bounded timeout", async () => {
    vi.useFakeTimers();
    const kill = vi.fn();
    const output = vi.fn(() => new Promise<never>(() => undefined));
    const spawn = vi.fn(() => ({ kill, output }));
    const Command = vi.fn(function () {
      return { spawn };
    });
    vi.stubGlobal("Deno", { Command });

    try {
      const result = runNostrKeychainCommand(
        { command: "credential-helper", args: [] },
        25,
      );
      const rejection = expect(result).rejects.toThrow(
        "Nostr keychain command timed out",
      );
      await vi.advanceTimersByTimeAsync(25);
      await rejection;
      expect(kill).toHaveBeenCalledWith("SIGKILL");
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
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
