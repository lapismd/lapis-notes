import { DEFAULT_VAULT_EXCLUDES } from "./storage/vault-listing";

/** Core application settings; no plugin owns file discovery policy. */
export const FILES_CONFIGURATION_SCHEMA = {
  id: "files",
  title: "Files",
  type: "object",
  properties: {
    exclude: {
      type: "array",
      title: "Excluded paths",
      description:
        "Glob patterns hidden from vault file and folder listings. Matching folders hide their contents at any depth. Explicit metadata access and backup exclusions are separate.",
      items: { type: "string" },
      default: [...DEFAULT_VAULT_EXCLUDES],
    },
  },
} as const;
