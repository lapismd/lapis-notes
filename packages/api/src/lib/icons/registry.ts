import type { IconifyJSON } from "@iconify/types";
import {
  convertParsedSVG,
  getIconData,
  iconToHTML,
  iconToSVG,
  parseSVGContent,
  replaceIDs,
} from "@iconify/utils";
import { resolveRegisteredIcon, type IconLoader } from "./index";
import { iconRevision, onIconsChanged } from "./changes";
import { assertSafeIconSvg } from "./safe-svg";

export type IconResolution =
  | { status: "found"; svg: string }
  | { status: "missing" | "failed" };
type Pack = { input: IconLoader; promise?: Promise<IconifyJSON> };
function loadPack(input: IconLoader): Promise<IconifyJSON> {
  try {
    return Promise.resolve("icons" in input ? input.icons : input.loader());
  } catch (error) {
    return Promise.reject(error);
  }
}
function namespace(owner: string): string {
  if (!owner.trim()) throw new Error("Icon owner must not be empty.");
  return (
    "plugin-" +
    [...new TextEncoder().encode(owner)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}
function localName(id: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id))
    throw new Error("Use a lowercase icon name with hyphens.");
  return id;
}
function render(data: Parameters<typeof iconToSVG>[0]): string {
  const rendered = iconToSVG(data);
  const svg = iconToHTML(replaceIDs(rendered.body), rendered.attributes);
  assertSafeIconSvg(svg);
  return svg;
}

/**
 * App-owned artwork with an explicit compatibility fallback to legacy global
 * icons.
 */
export class IconRegistry {
  private readonly icons = new Map<string, object & { svg: string }>();
  private readonly packs = new Map<string, Pack>();
  private readonly listeners = new Set<() => void>();
  private readonly cache = new Map<string, Promise<IconResolution>>();
  private revision = 0;
  private legacyRevision = iconRevision();
  private stopLegacy?: () => void;
  private disposed = false;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => {};
    if (!this.stopLegacy)
      this.stopLegacy = onIconsChanged(() => this.changed());
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        this.stopLegacy?.();
        this.stopLegacy = undefined;
      }
    };
  };

  private changed(): void {
    this.revision++;
    this.cache.clear();
    this.legacyRevision = iconRevision();
    for (const listener of [...this.listeners]) listener();
  }

  registerIcon(
    owner: string,
    id: string,
    svg: string,
  ): { id: string; dispose: () => void } {
    if (this.disposed) throw new Error("Icon registry is disposed.");
    assertSafeIconSvg(svg);
    const parsed = parseSVGContent(svg);
    const data = parsed && convertParsedSVG(parsed);
    if (!data) throw new Error("Invalid icon SVG.");
    const name = `${namespace(owner)}:${localName(id)}`;
    const entry = { svg: render(data) };
    this.icons.set(name, entry);
    this.changed();
    return {
      id: name,
      dispose: () => {
        if (this.icons.get(name) === entry) {
          this.icons.delete(name);
          this.changed();
        }
      },
    };
  }

  registerIconPack(
    owner: string,
    input: IconLoader,
  ): { prefix: string; dispose: () => void } {
    if (this.disposed) throw new Error("Icon registry is disposed.");
    const prefix = `${namespace(owner)}-${localName(input.name)}`;
    const entry: Pack = { input };
    this.packs.set(prefix, entry);
    this.changed();
    return {
      prefix,
      dispose: () => {
        if (this.packs.get(prefix) === entry) {
          this.packs.delete(prefix);
          this.changed();
        }
      },
    };
  }

  resolveIcon(name: string): Promise<IconResolution> {
    if (this.disposed) return Promise.resolve({ status: "missing" });
    if (this.legacyRevision !== iconRevision()) this.changed();
    const cached = this.cache.get(name);
    if (cached) return cached;
    const revision = this.revision;
    const pending = this.lookup(name)
      .then((result) =>
        this.disposed || revision !== this.revision
          ? { status: "missing" as const }
          : result,
      )
      .catch(() => ({ status: "failed" as const }));
    this.cache.set(name, pending);
    return pending;
  }

  resolve = async (name: string): Promise<string | null> => {
    const result = await this.resolveIcon(name);
    return result.status === "found" ? result.svg : null;
  };

  private async lookup(name: string): Promise<IconResolution> {
    const icon = this.icons.get(name);
    if (icon) return { status: "found", svg: icon.svg };
    const [prefix, id, ...extra] = name.split(":");
    const pack = this.packs.get(prefix);
    if (pack && id && extra.length === 0) {
      pack.promise ??= loadPack(pack.input);
      const data = getIconData(await pack.promise, id);
      return data
        ? { status: "found", svg: render(data) }
        : { status: "missing" };
    }
    // Owned IDs never resolve through a different App's compatibility registry.
    if (/^plugin-(?:[a-f0-9]{2})+(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?:/u.test(name))
      return { status: "missing" };
    return resolveRegisteredIcon(name);
  }

  dispose(): void {
    this.disposed = true;
    this.stopLegacy?.();
    this.stopLegacy = undefined;
    this.icons.clear();
    this.packs.clear();
    this.cache.clear();
    this.listeners.clear();
    this.revision++;
  }
}
