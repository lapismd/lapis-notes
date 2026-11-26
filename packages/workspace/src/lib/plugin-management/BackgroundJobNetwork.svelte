<script lang="ts">
  import type {
    BackgroundJobCommand,
    BackgroundJobNetworkGrant,
    BackgroundJobStatus,
  } from "@lapis-notes/api";
  import BackgroundJobCredential from "./BackgroundJobCredential.svelte";
  let {
    job,
    approved = $bindable([]),
    busy,
    blocked,
    command,
  }: {
    job: BackgroundJobStatus;
    approved: BackgroundJobNetworkGrant[];
    busy: boolean;
    blocked: boolean;
    command: (command: BackgroundJobCommand) => Promise<void>;
  } = $props();
  function toggleOrigin(grant: BackgroundJobNetworkGrant, checked: boolean) {
    approved = checked
      ? [...approved, { ...grant, allowPrivateNetwork: false, credentials: [] }]
      : approved.filter((g) => g.origin !== grant.origin);
  }
  function update(
    origin: string,
    change: (grant: BackgroundJobNetworkGrant) => BackgroundJobNetworkGrant,
  ) {
    approved = approved.map((grant) =>
      grant.origin === origin ? change(grant) : grant,
    );
  }
</script>

{#if job.descriptor.permissions.network?.length}
  <fieldset class="lapis-job__permissions" disabled={busy || blocked}>
    <legend>Network access</legend>
    {#each job.descriptor.permissions.network as grant (grant.origin)}
      {@const selected = approved.find((g) => g.origin === grant.origin)}
      <label
        ><input
          type="checkbox"
          checked={Boolean(selected)}
          onchange={(event) => toggleOrigin(grant, event.currentTarget.checked)}
        />
        Connect to {grant.origin} ({grant.methods.join(", ")})</label
      >
      {#if grant.allowPrivateNetwork}
        <label
          ><input
            type="checkbox"
            disabled={!selected}
            checked={selected?.allowPrivateNetwork ?? false}
            onchange={(event) =>
              update(grant.origin, (g) => ({
                ...g,
                allowPrivateNetwork: event.currentTarget.checked,
              }))}
          />
          Allow local/private addresses for {grant.origin}</label
        >
        {#if grant.origin.startsWith("http:")}<p>
            This origin uses unencrypted HTTP.
          </p>{/if}
      {/if}
      {#each grant.credentials as binding (binding.id)}
        <label
          ><input
            type="checkbox"
            disabled={!selected}
            checked={selected?.credentials.some((c) => c.id === binding.id) ??
              false}
            onchange={(event) =>
              update(grant.origin, (g) => ({
                ...g,
                credentials: event.currentTarget.checked
                  ? [...g.credentials, binding]
                  : g.credentials.filter((c) => c.id !== binding.id),
              }))}
          />
          Send stored {binding.id} key to {grant.origin} in {binding.header}</label
        >
      {/each}
    {/each}
  </fieldset>
  {#each job.credentials ?? [] as status (status.id)}
    <BackgroundJobCredential
      pluginId={job.pluginId}
      jobId={job.descriptor.id}
      {status}
      {busy}
      {blocked}
      {command}
    />
  {/each}
{/if}
