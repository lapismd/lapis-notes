import type { App, PluginHostRestrictions } from "@lapis-notes/api";

/** These identities now belong to bundled native desktop implementations. */
export const webPluginRestrictions: PluginHostRestrictions = Object.freeze({
  ai: "desktop-only",
  terminal: "desktop-only",
});

/** Retire only dedicated connection secrets; retain plugin data and preferences. */
export async function removeObsoleteServiceSecrets(
  app: Pick<App, "configuration">,
): Promise<void> {
  for (const key of ["web.agentRuntime.token", "web.terminalHost.token"])
    await app.configuration.removeConfigurationOption(key);
}
