<script lang="ts">
  import type {
    BackgroundJobCommand,
    BackgroundJobCredentialStatus,
  } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Input from "@lapismd/design-core/shadcn/input";
  let {
    pluginId,
    jobId,
    status,
    busy,
    blocked,
    command,
  }: {
    pluginId: string;
    jobId: string;
    status: BackgroundJobCredentialStatus;
    busy: boolean;
    blocked: boolean;
    command: (command: BackgroundJobCommand) => Promise<void>;
  } = $props();
  let value = $state("");
  const key = $derived(`${pluginId}-${jobId}-${status.id}-credential`);
  async function replace() {
    const submitted = value;
    value = "";
    await command({
      kind: "storeCredential",
      pluginId,
      jobId,
      credentialId: status.id,
      value: submitted,
    });
  }
</script>

<div class="lapis-job__credential">
  <p>{status.id}: {status.configured ? "Configured" : "Not configured"}</p>
  {#if status.unavailableReason}<p role="status">
      {status.unavailableReason}
    </p>{/if}
  <p>
    Stored on this runner for this vault and job. Moving the job does not copy
    keys.
  </p>
  <label for={key}>New key for {status.id}</label>
  <Input.Root
    id={key}
    type="password"
    autocomplete="new-password"
    bind:value
    disabled={busy || blocked || Boolean(status.unavailableReason)}
  />
  <div class="lapis-job__actions">
    <Button.Root
      variant="outline"
      onclick={replace}
      disabled={busy || blocked || !value || Boolean(status.unavailableReason)}
      >Replace key</Button.Root
    >
    <Button.Root
      variant="outline"
      disabled={busy ||
        blocked ||
        !status.configured ||
        Boolean(status.unavailableReason)}
      onclick={() =>
        command({
          kind: "storeCredential",
          pluginId,
          jobId,
          credentialId: status.id,
          value: null,
        })}>Remove key</Button.Root
    >
  </div>
</div>
