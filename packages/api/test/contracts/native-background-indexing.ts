import type {
  MetadataCache,
  NativeBackgroundIndexing,
  VaultSession,
} from "../../dist/index.js";

declare const cache: MetadataCache;
declare const session: VaultSession;
const port: NativeBackgroundIndexing = {
  async call(command) {
    if (command.kind === "register_projection") {
      const version: number = command.contribution.schema_version;
      void version;
    }
    return { status: null, contribution: null };
  },
};
session.backgroundIndexing = port;
cache.registerNativeProjection("docs", "docs/note", {
  id: "note",
  version: 1,
  fields: {},
  project: () => ({ rows: [] }),
});
const ready: Promise<void> = cache.finishNativeContributions("docs");
const disabled: Promise<void> = cache.disableNativeContributions("docs");
const availability: string[] = cache.nativeContributionStatuses.map(
  (status) => status.placement,
);
cache.addProcessor(
  "md",
  { read: async (_content, { cache }) => cache, write: () => "" },
  "markdown",
);
void [ready, disabled, availability];
