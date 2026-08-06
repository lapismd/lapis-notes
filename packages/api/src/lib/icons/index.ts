import type {
  ExtendedIconifyIcon,
  IconifyAliases,
  IconifyIcon,
  IconifyJSON,
} from "@iconify/types";
import { icons as lucideIcons } from "@iconify-json/lucide";
import {
  iconToSVG,
  parseSVGContent,
  iconToHTML,
  getIconData,
  stringToIcon,
  type IconifyIconCustomisations,
  replaceIDs,
  convertParsedSVG,
  type IconifyIconName,
} from "@iconify/utils";
import { cn } from "../utils";
import lucideTags from "lucide-static/tags.json";

interface AsyncIconLoader {
  name: string;
  loader: () => Promise<IconifyJSON>;
}

interface SyncIconLoader {
  name: string;
  icons: IconifyJSON;
}

export type IconLoader = AsyncIconLoader | SyncIconLoader;
export type IconName = string;

export type CodiconLabelSegment =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "codicon";
      name: string;
      raw: string;
      modifier?: "spin";
    }
  | {
      type: "icon";
      name: string;
      raw: string;
      modifier?: "spin";
    };

const codiconNamePattern = /^[a-z0-9-]+$/u;
const qualifiedIconNamePattern = /^[a-z0-9-]+:[a-z0-9-]+(?:-[a-z0-9-]+)*$/u;
const labelIconAvailabilityCache = new Map<string, Promise<boolean>>();

const iconsStore = new Map<string, IconifyJSON>();
const loaderStore = new Map<string, AsyncIconLoader["loader"]>();
const codiconLabelPattern = /\$\(([^)]+)\)/g;
const customIcons: IconifyJSON = {
  prefix: "custom",
  aliases: {},
  icons: {
    blank: {
      body: "<g></g>",
      height: 24,
      width: 24,
    },
  },
};

export const unknownIcon: IconifyIcon = {
  body: '<path stroke="currentColor" d="M19.95,5.54l-3.49-3.49c-1.32-1.32-3.08-2.05-4.95-2.05H7C4.24,0,2,2.24,2,5v14c0,2.76,2.24,5,5,5h10c2.76,0,5-2.24,5-5V10.49c0-1.87-.73-3.63-2.05-4.95Zm-1.41,1.41c.32,.32,.59,.67,.81,1.05h-4.34c-.55,0-1-.45-1-1V2.66c.38,.22,.73,.49,1.05,.81l3.49,3.49ZM7,2h4.51c.16,0,.33,0,.49,.02V7c0,1.65,1.35,3,3,3h4.98c.02,.16,.02,.32,.02,.49v4.58l-2.41-2.41c-.87-.87-2.28-.87-3.15,0l-2.27,2.27c-.09,.09-.23,.09-.32,0l-2.27-2.27c-.87-.87-2.28-.87-3.15,0l-2.44,2.44V5c0-1.65,1.35-3,3-3Zm10,20H7c-1.65,0-3-1.35-3-3v-1.07l3.86-3.86c.09-.09,.23-.09,.32,0l2.27,2.27c.87,.87,2.28,.87,3.15,0l2.27-2.27c.09-.09,.23-.09,.32,0l3.83,3.83v1.1c0,1.65-1.35,3-3,3Z"/>',
  height: 24,
  width: 24,
};

export const registerIconPacks = (iconLoaders: IconLoader[]) => {
  for (const iconLoader of iconLoaders) {
    if (!iconLoader.name) {
      throw new Error(
        'Invalid icon loader. Must have a "name" property with non-empty string value.',
      );
    }
    console.debug("Registering icon pack:", iconLoader.name);
    if ("loader" in iconLoader) {
      loaderStore.set(iconLoader.name, iconLoader.loader);
    } else if ("icons" in iconLoader) {
      iconsStore.set(iconLoader.name, iconLoader.icons);
    } else {
      console.error("Invalid icon loader:", iconLoader);
      throw new Error(
        'Invalid icon loader. Must have either "icons" or "loader" property.',
      );
    }
  }
};

function getIconCandidates(iconName: string): IconifyIconName[] {
  return [
    stringToIcon(iconName, true, false),
    stringToIcon(`lucide:${iconName}`, true, false),
    stringToIcon(`custom:${iconName}`, true, false),
  ].filter(Boolean) as IconifyIconName[];
}

const getRegisteredIconData = async (
  iconName: string,
): Promise<[ExtendedIconifyIcon, IconifyIconName]> => {
  iconName ||= "";
  const candidates = getIconCandidates(iconName);
  let sawRegisteredPrefix = false;

  for (const candidate of candidates) {
    const prefix = candidate.prefix;
    if (!prefix || (!iconsStore.has(prefix) && !loaderStore.has(prefix))) {
      continue;
    }

    sawRegisteredPrefix = true;
    let icons = iconsStore.get(prefix);
    if (!icons) {
      const loader = loaderStore.get(prefix);
      if (!loader) {
        continue;
      }
      try {
        const loaded = await loader();
        icons = { ...loaded, prefix };
        iconsStore.set(prefix, icons);
      } catch (e) {
        console.error(e);
        throw new Error(`Failed to load icon set: ${prefix}`);
      }
    }

    const iconData = getIconData(icons, candidate.name);
    if (iconData) {
      return [iconData, candidate];
    }
  }

  if (!sawRegisteredPrefix) {
    throw new Error(`Invalid icon name: ${iconName}`);
  }

  throw new Error(`Icon not found: ${iconName}`);
};

export const getSvg = async (
  iconName: string | string[],
  customisations?: IconifyIconCustomisations & { class?: string },
) => {
  let icons: string[] = Array.isArray(iconName) ? iconName : [iconName];
  let iconDef: [ExtendedIconifyIcon, IconifyIconName];

  for (const icon of icons) {
    try {
      iconDef = await getRegisteredIconData(icon);
      if (iconDef) {
        break;
      }
    } catch (e) {}
  }

  iconDef ||= [
    unknownIcon,
    {
      name: icons.map((it) => `unknown-${it}`).join(" "),
      prefix: "unknown",
      provider: "unknown",
    },
  ];
  const [iconData, name] = iconDef;

  const renderData = iconToSVG(iconData, customisations);
  let className = cn(
    `${name.prefix}-icon ${name.prefix}-${name.name}`,
    customisations?.class,
  );
  const svg = iconToHTML(
    replaceIDs(renderData.body),
    renderData.attributes,
  ).replace(`width=`, `class=${JSON.stringify(className)} width=`);
  return svg;
};

export const isIconAvailable = async (iconName: string) => {
  try {
    await getRegisteredIconData(iconName);
    return true;
  } catch {
    return false;
  }
};

export function isLabelIconAvailable(iconName: string): Promise<boolean> {
  const cached = labelIconAvailabilityCache.get(iconName);
  if (cached) {
    return cached;
  }

  const pending = isIconAvailable(iconName).then((available) => {
    labelIconAvailabilityCache.set(iconName, Promise.resolve(available));
    return available;
  });
  labelIconAvailabilityCache.set(iconName, pending);
  return pending;
}

function parseCodiconToken(
  tokenBody: string,
  raw: string,
): CodiconLabelSegment | null {
  const trimmed = tokenBody.trim();
  if (!trimmed) {
    return null;
  }

  const [name, modifier, ...rest] = trimmed.split("~");
  if (rest.length > 0 || (modifier && modifier !== "spin")) {
    return null;
  }

  const spin = modifier ? ({ modifier: "spin" as const } as const) : {};

  if (qualifiedIconNamePattern.test(name)) {
    return { type: "icon", name, raw, ...spin };
  }

  if (codiconNamePattern.test(name)) {
    return { type: "codicon", name, raw, ...spin };
  }

  return null;
}

export function parseCodiconLabel(
  label: string | null | undefined,
): CodiconLabelSegment[] {
  const value = label ?? "";
  if (!value) {
    return [];
  }

  const segments: CodiconLabelSegment[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(codiconLabelPattern)) {
    const raw = match[0];
    const tokenBody = match[1] ?? "";
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        text: value.slice(lastIndex, matchIndex),
      });
    }

    const token = parseCodiconToken(tokenBody, raw);
    if (token) {
      segments.push(token);
    } else {
      segments.push({ type: "text", text: raw });
    }

    lastIndex = matchIndex + raw.length;
  }

  if (lastIndex < value.length) {
    segments.push({ type: "text", text: value.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return [{ type: "text", text: value }];
  }

  return segments.filter((segment) =>
    segment.type === "text" ? segment.text.length > 0 : true,
  );
}

function parseSvgIcon(svg: string): IconifyIcon {
  const parsed = parseSVGContent(svg);
  if (!parsed) {
    throw new Error("Invalid icon");
  }
  const icon = convertParsedSVG(parsed);
  if (!icon) {
    throw new Error("Invalid icon");
  }
  return icon;
}

lucideIcons.aliases = {
  "right-triangle": { parent: "chevron-down" },
  install: { parent: "cloud-download" },
  ...(lucideIcons.aliases || {}),
};

lucideIcons.categories ||= {};

for (const [key, tags] of Object.entries(lucideTags)) {
  for (const tag of tags) {
    lucideIcons.categories[tag] ||= [];
    if (!lucideIcons.categories[tag].includes(key)) {
      lucideIcons.categories[tag].push(key);
    }
    if (lucideIcons.icons[key] && !lucideIcons.aliases[tag]) {
      lucideIcons.aliases[tag] = { parent: key };
    }
  }
}

registerIconPacks([
  { name: "lucide", icons: lucideIcons },
  { name: "custom", icons: customIcons },
]);

export function getIconPacks(): IconLoader[] {
  const iconLoaders: IconLoader[] = [];
  const names = new Set<string>();
  for (const [name, icons] of iconsStore.entries()) {
    iconLoaders.push({ name, icons });
    names.add(name);
  }

  for (const [name, loader] of loaderStore.entries()) {
    if (names.has(name)) {
      continue;
    }
    iconLoaders.push({ name, loader });
    names.add(name);
  }

  return iconLoaders;
}

export function getIconIds(): string[] {
  const ids = new Set<string>();
  for (const icons of iconsStore.values()) {
    Object.keys(icons.icons || {}).forEach((id) => ids.add(id));
    Object.keys(icons.aliases || {}).forEach((id) => ids.add(id));
  }
  return [...ids].sort();
}

/**
 * Adds an icon to the library.
 *
 * @param iconId - The icon ID
 * @param svgContent - The content of the SVG.
 * @public
 */
export function addIcon(iconId: string, svgContent: string) {
  const icon = parseSvgIcon(svgContent);
  if (icon) {
    customIcons.icons[iconId] = icon;
  }
}

export function removeIcon(iconId: string): void {
  delete customIcons.icons[iconId];
  delete (customIcons.aliases as IconifyAliases)[iconId];
}

export function getIcon(iconId: string): SVGSVGElement | null {
  for (const candidate of getIconCandidates(iconId)) {
    const icons = candidate.prefix ? iconsStore.get(candidate.prefix) : null;
    const iconData = icons ? getIconData(icons, candidate.name) : null;
    if (!iconData) continue;
    const renderData = iconToSVG(iconData);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = iconToHTML(
      replaceIDs(renderData.body),
      renderData.attributes,
    );
    return wrapper.firstElementChild as SVGSVGElement | null;
  }
  return null;
}

/**
 * Insert an SVG into the element from an iconId. Does nothing if no icon
 * associated with the iconId.
 *
 * @param parent - The HTML element to insert the icon
 * @param iconId - The icon ID
 * @public
 * @see The Obsidian icon library includes the {@link https://lucide.dev/ Lucide icon library}, any icon name from their site will work here.
 */
export function setIcon(parent: HTMLElement, iconId: string): void {
  getSvg(iconId, { width: "24px", height: "24px" }).then((svg) => {
    if (svg) {
      parent.innerHTML = svg;
    }
  });
}
