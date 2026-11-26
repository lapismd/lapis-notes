<script lang="ts">
  import type {
    BackgroundJobCommand,
    BackgroundJobConfiguration,
    BackgroundJobStatus,
    BackgroundJobNetworkGrant,
  } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import { untrack } from "svelte";
  import BackgroundJobNetwork from "./BackgroundJobNetwork.svelte";

  let {
    job,
    busy,
    blocked,
    nativeNotificationsAvailable,
    command,
  }: {
    job: BackgroundJobStatus;
    busy: boolean;
    blocked: boolean;
    nativeNotificationsAvailable: boolean;
    command: (command: BackgroundJobCommand) => Promise<void>;
  } = $props();
  const initial = untrack(
    () => job.configuration?.schedule ?? job.descriptor.schedule,
  );
  const approvedConfiguration = untrack(() =>
    job.configuration?.fingerprint === job.fingerprint
      ? job.configuration
      : undefined,
  );
  const initialPermissions = untrack(
    () => approvedConfiguration?.permissions ?? job.descriptor.permissions,
  );
  let kind = $state(initial.kind);
  let seconds = $state(initial.kind === "interval" ? initial.seconds : 3600);
  let time = $state(
    initial.kind === "daily"
      ? `${String(initial.hour).padStart(2, "0")}:${String(initial.minute).padStart(2, "0")}`
      : "09:00",
  );
  let timezone = $state(
    initial.kind === "daily"
      ? untrack(() => job.configuration)
        ? initial.timezone
        : Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC",
  );
  let metadataRead = $state(initialPermissions.metadataRead);
  let frontmatterRead = $state(initialPermissions.frontmatterRead);
  let notifications = $state(initialPermissions.notifications);
  let fields = $state([...initialPermissions.frontmatterFields]);
  let nativeNotifications = $state(
    approvedConfiguration?.nativeNotifications ?? false,
  );
  let destination = $state("");
  let destinationVault = $state("");
  let validationError = $state("");
  let network = $state<BackgroundJobNetworkGrant[]>(
    untrack(() =>
      (approvedConfiguration?.permissions.network ?? []).map((grant) => ({
        ...grant,
        methods: [...grant.methods],
        credentials: [...grant.credentials],
      })),
    ),
  );
  const key = $derived(`${job.pluginId}-${job.descriptor.id}`);
  const lastRun = $derived(job.runs.at(-1));
  const changedCode = $derived(
    Boolean(
      job.configuration && job.configuration.fingerprint !== job.fingerprint,
    ),
  );
  const unavailable = $derived(Boolean(job.unavailableReason) && !changedCode);

  async function configure(enabled: boolean): Promise<void> {
    validationError = "";
    const [hour, minute] = time.split(":").map(Number);
    if (
      kind === "interval" &&
      (!Number.isInteger(seconds) || seconds < 60 || seconds > 2_678_400)
    ) {
      validationError = "Choose an interval between 60 seconds and 31 days.";
      return;
    }
    if (kind === "daily") {
      try {
        new Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        validationError = "Enter an IANA time zone such as Europe/London.";
        return;
      }
      if (!/^\d{2}:\d{2}$/.test(time) || hour > 23 || minute > 59) {
        validationError = "Choose a valid daily time.";
        return;
      }
    }
    const configuration: BackgroundJobConfiguration = {
      fingerprint: job.fingerprint,
      enabled,
      nativeNotifications,
      schedule:
        kind === "interval"
          ? { kind, seconds }
          : { kind, hour, minute, timezone },
      permissions: {
        metadataRead,
        frontmatterRead,
        notifications,
        frontmatterFields: fields,
        ...(network.length ? { network } : {}),
      },
    };
    await command({
      kind: "configure",
      pluginId: job.pluginId,
      jobId: job.descriptor.id,
      configuration,
    });
  }
  function toggleField(field: string, checked: boolean): void {
    fields = checked
      ? [...fields, field]
      : fields.filter((value) => value !== field);
  }
</script>

<article
  class="lapis-job"
  aria-labelledby={`${key}-title`}
  data-job-id={`${job.pluginId}/${job.descriptor.id}`}
>
  <header class="lapis-job__header">
    <div>
      <h2 id={`${key}-title`}>{job.descriptor.title}</h2>
      <p>{job.descriptor.description}</p>
      <p>{job.pluginId} · {job.phase}</p>
    </div>
    <div class="lapis-job__actions">
      {#if job.configuration?.enabled && !changedCode}
        <Button.Root
          variant="outline"
          disabled={busy}
          onclick={() =>
            command({
              kind: "pause",
              pluginId: job.pluginId,
              jobId: job.descriptor.id,
            })}>Pause</Button.Root
        >
      {:else}
        <Button.Root
          disabled={busy ||
            blocked ||
            job.phase === "running" ||
            job.phase === "transferred" ||
            unavailable}
          onclick={() => configure(true)}>Approve and enable</Button.Root
        >
      {/if}
      <Button.Root
        variant="outline"
        disabled={busy ||
          blocked ||
          !job.configuration?.enabled ||
          changedCode ||
          job.phase === "running" ||
          unavailable}
        onclick={() =>
          command({
            kind: "runNow",
            pluginId: job.pluginId,
            jobId: job.descriptor.id,
          })}>Run now</Button.Root
      >
    </div>
  </header>
  {#if job.unavailableReason}<p role="status">{job.unavailableReason}</p>{/if}
  <div class="lapis-job__fields">
    <label for={`${key}-schedule`}>Schedule</label>
    <select id={`${key}-schedule`} bind:value={kind} disabled={busy}
      ><option value="interval">Fixed interval</option><option value="daily"
        >Daily</option
      ></select
    >
    {#if kind === "interval"}
      <label for={`${key}-seconds`}>Interval in seconds</label><Input.Root
        id={`${key}-seconds`}
        type="number"
        min={60}
        max={2678400}
        bind:value={seconds}
        disabled={busy}
      />
    {:else}
      <label for={`${key}-time`}>Daily time</label><Input.Root
        id={`${key}-time`}
        type="time"
        bind:value={time}
        disabled={busy}
      />
      <label for={`${key}-zone`}>Time zone</label><Input.Root
        id={`${key}-zone`}
        bind:value={timezone}
        disabled={busy}
      />
    {/if}
  </div>
  <fieldset disabled={busy} class="lapis-job__permissions">
    <legend>Approved access</legend>
    {#if job.descriptor.permissions.metadataRead}<label
        ><input type="checkbox" bind:checked={metadataRead} /> Read saved metadata</label
      >{/if}
    {#if job.descriptor.permissions.frontmatterRead}<label
        ><input type="checkbox" bind:checked={frontmatterRead} /> Read note properties</label
      >{/if}
    {#if job.descriptor.permissions.notifications}<label
        ><input type="checkbox" bind:checked={notifications} /> Add Lapis notifications</label
      >{/if}
    {#each job.descriptor.permissions.frontmatterFields as field (field)}
      <label
        ><input
          type="checkbox"
          checked={fields.includes(field)}
          onchange={(event) => toggleField(field, event.currentTarget.checked)}
        />
        Update {field} properties</label
      >
    {/each}
    {#if nativeNotificationsAvailable && job.descriptor.permissions.notifications}
      <label
        ><input type="checkbox" bind:checked={nativeNotifications} /> Also show local
        system alerts</label
      >
    {/if}
  </fieldset>
  <BackgroundJobNetwork
    {job}
    bind:approved={network}
    {busy}
    {blocked}
    {command}
  />
  <Button.Root
    variant="outline"
    disabled={busy ||
      blocked ||
      job.phase === "running" ||
      job.phase === "transferred" ||
      changedCode ||
      unavailable}
    onclick={() => configure(job.configuration?.enabled ?? false)}
    >Save changes</Button.Root
  >
  {#if validationError}<p role="alert">{validationError}</p>{/if}
  {#if job.nextRunAt}<p>
      Next run {new Date(job.nextRunAt).toLocaleString()}
    </p>{/if}
  {#if lastRun}
    <p>
      Last run {new Date(lastRun.startedAt).toLocaleString()} · {lastRun.phase}
    </p>
    {#if lastRun.error}<p role="status">{lastRun.error}</p>{/if}
    {#if lastRun.phase === "interrupted"}
      <p>
        Inspect affected notes, external operations and saved state before
        acknowledging this run. Acknowledgment keeps the job paused.
      </p>
      <Button.Root
        variant="outline"
        disabled={busy}
        onclick={() =>
          command({
            kind: "resolve",
            pluginId: job.pluginId,
            jobId: job.descriptor.id,
            runId: lastRun.id,
          })}>Acknowledge interrupted run</Button.Root
      >
    {/if}
  {/if}
  <details>
    <summary>Move to another runner</summary>
    <p>
      Pause this job and finish any interrupted run first. Enter the destination
      runner and vault IDs from its Background jobs settings.
    </p>
    <label for={`${key}-destination`}>Destination runner ID</label><Input.Root
      id={`${key}-destination`}
      bind:value={destination}
      disabled={busy}
    />
    <label for={`${key}-destination-vault`}>Destination vault ID</label
    ><Input.Root
      id={`${key}-destination-vault`}
      bind:value={destinationVault}
      disabled={busy}
    />
    <Button.Root
      variant="outline"
      disabled={busy ||
        !destination.trim() ||
        !destinationVault.trim() ||
        job.phase === "running"}
      onclick={() =>
        command({
          kind: "transfer",
          pluginId: job.pluginId,
          jobId: job.descriptor.id,
          toRunner: destination.trim(),
          toVaultId: destinationVault.trim(),
        })}>Release to destination</Button.Root
    >
  </details>
</article>
