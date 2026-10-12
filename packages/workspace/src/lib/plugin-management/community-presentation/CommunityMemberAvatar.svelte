<script lang="ts">
  import { communityMemberAvatarFallbackTone } from "./avatar-model";
  import "./community-member-avatar.css";
  let {
    member,
    size = "small",
    decorative = false,
  }: {
    member: { name: string; initials: string; avatarUrl?: string };
    size?: "small" | "xsmall";
    decorative?: boolean;
  } = $props();
  const fallbackTone = $derived(communityMemberAvatarFallbackTone(member.name));
  let failed = $state(false);
  $effect(() => {
    member.avatarUrl;
    failed = false;
  });
</script>

<span
  class="community-member-avatar"
  data-ui-component="community-member-avatar"
  data-size={size}
  data-shape="circle"
  aria-hidden={decorative ? "true" : undefined}
  aria-label={decorative ? undefined : `${member.name} avatar`}
  role={decorative ? undefined : "img"}
>
  <span
    class="community-member-avatar__image"
    data-ui-part="image"
    data-content={member.avatarUrl && !failed ? "image" : "initials"}
    data-fallback-tone={member.avatarUrl && !failed ? undefined : fallbackTone}
  >
    {#if member.avatarUrl && !failed}<img
        src={member.avatarUrl}
        alt=""
        onerror={() => (failed = true)}
      />{:else}<span aria-hidden="true">{member.initials}</span>{/if}
  </span>
</span>
