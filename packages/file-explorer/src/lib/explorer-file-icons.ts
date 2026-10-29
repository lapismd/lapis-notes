import type { App } from "@lapis-notes/api";
import { registerWorkspaceIcon } from "@lapismd/design-core/workspace/icon";
import type { Component } from "svelte";
import ArtworkIcon from "./ArtworkIcon.svelte";
import { listExplorerVaultEntries } from "./explorer-vault-entries";

type IconComponent = (
  anchor: unknown,
  props: Record<string, unknown>,
) => void;

function artworkComponent(svg: string): Component {
  const Icon: IconComponent = (anchor, props) =>
    (ArtworkIcon as unknown as IconComponent)(anchor, { ...props, svg });
  return Icon as unknown as Component;
}

/** Publish the selected file-view artwork through Design Core's scoped resolver. */
export function createExplorerFileIcons(app: App) {
  const disposers = new Map<string, () => void>();
  const published = new Map<string, string>();
  let generation = 0;

  function names(): Set<string> {
    return new Set(
      listExplorerVaultEntries(app.vault.getAllLoadedFiles()).flatMap(
        (node) => {
          if (node.kind !== "file") return [];
          const name = app.workspace.getFileIconForPath(node.path);
          return name ? [name] : [];
        },
      ),
    );
  }

  return {
    nameForPath(path: string): string | undefined {
      const name = app.workspace.getFileIconForPath(path);
      return name && published.has(name) ? name : undefined;
    },
    async publish(): Promise<void> {
      const current = ++generation;
      const selected = names();
      const artwork = await Promise.all(
        [...selected].map(
          async (name) => [name, await app.icons.resolve(name)] as const,
        ),
      );
      if (current !== generation) return;
      for (const [name, svg] of artwork) {
        if (!svg || published.get(name) === svg) continue;
        disposers.get(name)?.();
        published.set(name, svg);
        disposers.set(name, registerWorkspaceIcon(name, artworkComponent(svg)));
      }
      for (const name of [...disposers.keys()]) {
        if (selected.has(name)) continue;
        disposers.get(name)?.();
        disposers.delete(name);
        published.delete(name);
      }
    },
    release(): void {
      generation += 1;
      for (const dispose of disposers.values()) dispose();
      disposers.clear();
      published.clear();
    },
  };
}
