import type { App, MemoryVaultAdapter } from "@lapis-notes/api";

export interface HandoffFacts {
  protected: number;
  mutations: number;
}

/** Seed the real registry failure; the native transport is the catalog fixture. */
export async function prepareHandoff(
  app: App,
  adapter: MemoryVaultAdapter,
  original: string,
  facts: HandoffFacts,
): Promise<() => void> {
  let savedText = original;
  // The demo producer cannot acknowledge authoritative bytes yet, so the
  // in-guard saved-text reconciliation cannot repair the external drift and
  // the original yield comparison refuses the handoff (LN-CORE-028).
  let authorityUnavailable = true;
  const registration = app.fileEditingSessions.register("Note.md", {
    native: {
      hold: () => () => {},
      savedText: () => savedText,
      refreshSavedText: async (text) => {
        if (text === null)
          throw new Error("The catalog note must remain saved");
        if (authorityUnavailable)
          throw new Error(
            "The catalog producer cannot acknowledge saved bytes yet",
          );
        savedText = text;
      },
    },
    dirty: false,
    flush: async () => {},
    protect: async () => {
      facts.protected++;
      return () => {
        facts.protected--;
      };
    },
  });
  await registration.ready();
  const external = "# External saved note\n\nAn outside edit is preserved.\n";
  await adapter.write("Note.md", external);
  try {
    await app.fileEditingSessions.guard("Note.md", async () => {
      facts.mutations++;
    });
    throw new Error("The stale native handoff must refuse this mutation");
  } catch (error) {
    if ((error as { code?: string })?.code !== "ECONFLICT") throw error;
  }
  // The producer regains its protected saved-text authority. Only explicit
  // retry may release the failed guard; no mutation is replayed by it.
  authorityUnavailable = false;
  return registration;
}
