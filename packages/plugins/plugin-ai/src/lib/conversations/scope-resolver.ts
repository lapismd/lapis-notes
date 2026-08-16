import type { TFile } from "@lapis-notes/api/vault";
import { normalizeConversationScope, parentScopeForFile } from "./paths";

export type ConversationScopeResolution = {
  scopeDir: string;
  source: "explicit" | "active-file" | "vault-root";
};

export class ConversationScopeResolver {
  resolve(input: {
    explicitFolder?: string | null;
    activeFile?: Pick<TFile, "path"> | null;
  }): ConversationScopeResolution {
    if (input.explicitFolder != null) {
      return {
        scopeDir: normalizeConversationScope(input.explicitFolder),
        source: "explicit",
      };
    }
    if (input.activeFile?.path) {
      return {
        scopeDir: parentScopeForFile(input.activeFile.path),
        source: "active-file",
      };
    }
    return { scopeDir: "", source: "vault-root" };
  }
}
