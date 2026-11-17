<script lang="ts">
  import { onMount } from "svelte";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import type { CliAccessHost, CliAccessStatus } from "./cli-settings";
  let {
    host,
    embedded = false,
  }: { host: CliAccessHost; embedded?: boolean } = $props();
  let status = $state<CliAccessStatus>();
  let busy = $state(false);
  let error = $state("");
  let label = $state("CLI client");
  let hours = $state(1);
  let selected = $state<string[]>([]);
  let permissions = $state<string[]>([]);
  let command = $state("");
  let alive = true;
  async function refresh() {
    const next = await host.status();
    if (alive) status = next;
  }
  async function run(action: () => Promise<void>, refreshAfter = true) {
    if (busy) return;
    busy = true;
    error = "";
    command = "";
    try {
      await action();
      if (refreshAfter) await refresh();
    } catch (failure) {
      if (alive)
        error = failure instanceof Error ? failure.message : String(failure);
    } finally {
      if (alive) busy = false;
    }
  }
  onMount(() => {
    void run(refresh, false);
    return () => {
      alive = false;
      command = "";
    };
  });
</script>

<section aria-label="Desktop CLI access">
  {#if !embedded}
    <h3>Connect to desktop vaults</h3>
    <p>
      Allow explicitly scoped commands while this desktop app is running.
      Installing the command does not enable access.
    </p>
  {/if}
  {#if status}
    <Button.Root
      disabled={busy}
      variant="outline"
      onclick={() => run(() => host.enable(!status!.enabled))}
      >{status.enabled
        ? "Disable desktop access"
        : "Enable desktop access"}</Button.Root
    >
    {#if status.enabled}
      <p>Target: <code>{status.target}</code></p>
      <label
        >Credential name <input
          bind:value={label}
          maxlength="128"
          disabled={busy}
        /></label
      >
      <fieldset disabled={busy}>
        <legend>Vault access</legend>
        {#each status.vaults as vault (vault.id)}
          <label
            ><input type="checkbox" bind:group={selected} value={vault.id} />
            {vault.name}</label
          >
        {/each}
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Optional plugin permissions (read-only by default)</legend>
        {#each status.permissions as permission (permission)}
          <label
            ><input
              type="checkbox"
              bind:group={permissions}
              value={permission}
            />
            {permission}</label
          >
        {/each}
      </fieldset>
      <label
        >Expires after (hours) <input
          type="number"
          min="1"
          max="24"
          bind:value={hours}
          disabled={busy}
        /></label
      >
      <Button.Root
        disabled={busy ||
          selected.length === 0 ||
          !label.trim() ||
          !Number.isInteger(hours) ||
          hours < 1 ||
          hours > 24}
        onclick={() =>
          run(async () => {
            const result = await host.create({
              label,
              vaultIds: selected,
              hours,
              permissions,
            });
            if (alive) command = result.command;
          })}>Create credential and save token file</Button.Root
      >
      {#if command}<p>Credential saved privately. Run:</p>
        <pre>{command}</pre>{/if}
      {#each status.grants as grant (grant.id)}
        <div class="grant">
          <span>{grant.label}</span><Button.Root
            disabled={busy}
            variant="outline"
            onclick={() => run(() => host.revoke(grant.id))}
            >Revoke {grant.label}</Button.Root
          >
        </div>
      {/each}
    {/if}
  {/if}
  {#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
  section {
    display: grid;
    gap: 0.75rem;
  }
  h3,
  p {
    margin: 0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  input:not([type="checkbox"]) {
    color: inherit;
    background: transparent;
    padding: 0.4rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  fieldset {
    display: grid;
    gap: 0.5rem;
    border: 1px solid var(--border);
  }
  .grant {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  code,
  pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
