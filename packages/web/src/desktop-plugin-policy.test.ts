import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  webPluginRestrictions,
  webPluginRestrictionsFor,
  removeObsoleteServiceSecrets,
} from "./desktop-plugin-policy";

it("marks legacy service identities desktop-only independently of their manifests", () => {
  expect(webPluginRestrictions).toEqual({
    ai: "desktop-only",
    terminal: "desktop-only",
  });
  expect(Object.isFrozen(webPluginRestrictions)).toBe(true);
});

it("removes only obsolete connection secrets and remains idempotent", async () => {
  const values = new Map<string, unknown>([
    ["web.agentRuntime.token", "old-agent-secret"],
    ["web.terminalHost.token", "old-terminal-secret"],
    ["web.agentRuntime.url", "ws://127.0.0.1:7347"],
    [
      "pluginData",
      { ai: { conversations: ["kept"] }, terminal: { shell: "/bin/sh" } },
    ],
    ["other.token", "unrelated-secret"],
  ]);
  const app = {
    configuration: {
      removeConfigurationOption: async (key: string) => {
        values.delete(key);
      },
    },
  };
  await removeObsoleteServiceSecrets(app as never);
  await removeObsoleteServiceSecrets(app as never);
  expect([...values.keys()]).toEqual([
    "web.agentRuntime.url",
    "pluginData",
    "other.token",
  ]);
  expect(values.get("pluginData")).toEqual({
    ai: { conversations: ["kept"] },
    terminal: { shell: "/bin/sh" },
  });
  expect(values.get("other.token")).toBe("unrelated-secret");
});

it("web startup applies restrictions and secret cleanup without service bridge registration", () => {
  const source = readFileSync("src/web-session-host.ts", "utf8");
  const session = readFileSync(
    "../app-profile/src/workspace-session/NotesWorkspaceSession.svelte",
    "utf8",
  );
  expect(source).toContain(
    "unavailablePlugins: webPluginRestrictionsFor(nativeChat)",
  );
  expect(
    session.indexOf("await options.host?.configure?.(app)"),
  ).toBeGreaterThan(session.indexOf("await app.configuration.load()"));
  expect(session.indexOf("await options.host?.configure?.(app)")).toBeLessThan(
    session.indexOf("await app.plugins.loadPlugins"),
  );
  expect(source).not.toMatch(/(?:register|sync)Web(?:Agent|Terminal)Runtime/);
});

it("keeps default AI restrictions while allowing only the selected native observer profile", () => {
  expect(webPluginRestrictionsFor(false)).toBe(webPluginRestrictions);
  expect(webPluginRestrictionsFor(true)).toEqual({ terminal: "desktop-only" });
  expect(Object.isFrozen(webPluginRestrictionsFor(true))).toBe(true);
});
