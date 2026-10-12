import type { Snippet } from "svelte";
import type {
  HTMLAnchorAttributes,
  HTMLButtonAttributes,
} from "svelte/elements";

import type {
  CommunityChipShape,
  CommunityChipSize,
  CommunityChipTone,
  CommunityChipVariant,
} from "./model.js";

export type CommunityChipProps = {
  children: Snippet;
  leading?: Snippet;
  variant?: CommunityChipVariant;
  tone?: CommunityChipTone;
  size?: CommunityChipSize;
  shape?: CommunityChipShape;
  href?: string;
  onclick?: (event: MouseEvent) => void;
  buttonProps?: HTMLButtonAttributes;
  linkProps?: HTMLAnchorAttributes;
  disabled?: boolean;
  pressed?: boolean;
  ariaLabel?: string;
  ariaHidden?: boolean;
  title?: string;
  class?: string;
};
