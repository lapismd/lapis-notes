type CommunityMemberModel = { kind?: string };

export type CommunityMemberAvatarShape = "circle" | "rounded";

export function communityMemberAvatarShape(
  member: Pick<CommunityMemberModel, "kind">,
): CommunityMemberAvatarShape {
  return member.kind === "agent" ? "rounded" : "circle";
}

export const communityMemberAvatarFallbackTones = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
  "violet",
  "orange",
] as const;

export type CommunityMemberAvatarFallbackTone =
  (typeof communityMemberAvatarFallbackTones)[number];

/**
 * Select the same deterministic fallback tone as Buzz's shared UserAvatar.
 * Keep the display name as the seed so renamed profiles receive the same
 * presentation in both clients.
 */
export function communityMemberAvatarFallbackTone(
  displayName: string,
): CommunityMemberAvatarFallbackTone {
  const hash = Array.from(displayName.trim().toLowerCase()).reduce(
    (value, character) => (value * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  return communityMemberAvatarFallbackTones[
    hash % communityMemberAvatarFallbackTones.length
  ]!;
}
