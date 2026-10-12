export const COMMUNITY_CHIP_VARIANTS = [
  "outline",
  "muted",
  "solid",
  "subtle",
] as const;
export type CommunityChipVariant = (typeof COMMUNITY_CHIP_VARIANTS)[number];

export const COMMUNITY_CHIP_TONES = [
  "neutral",
  "accent",
  "success",
  "warning",
  "danger",
] as const;
export type CommunityChipTone = (typeof COMMUNITY_CHIP_TONES)[number];

export const COMMUNITY_CHIP_SIZES = [
  "indicator",
  "inline",
  "compact",
  "default",
] as const;
export type CommunityChipSize = (typeof COMMUNITY_CHIP_SIZES)[number];

export const COMMUNITY_CHIP_SHAPES = ["pill", "square"] as const;
export type CommunityChipShape = (typeof COMMUNITY_CHIP_SHAPES)[number];

const successfulStates = new Set(["active", "approved", "available", "signed"]);
const warningStates = new Set(["inspecting", "partial", "pending"]);
const dangerousStates = new Set([
  "disabled",
  "invalid",
  "rejected",
  "revoked",
  "unavailable",
  "untrusted",
  "withdrawn",
]);

export function communityChipToneForState(state: string): CommunityChipTone {
  if (successfulStates.has(state)) return "success";
  if (warningStates.has(state)) return "warning";
  if (dangerousStates.has(state)) return "danger";
  return "neutral";
}
