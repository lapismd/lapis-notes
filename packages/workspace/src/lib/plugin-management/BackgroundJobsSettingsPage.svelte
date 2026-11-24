<script lang="ts">
  import type {
    BackgroundJobCommand,
    BackgroundJobSnapshot,
    BackgroundJobTransfer,
  } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Textarea from "@lapismd/design-core/shadcn/textarea";
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import { onMount, untrack } from "svelte";
  import { getPluginManagementContext } from "./plugin-management-context.svelte";
  import BackgroundJobRow from "./BackgroundJobRow.svelte";
  import "./plugin-management.css";
  import "./background-jobs.css";

  let { controller }: WorkspaceSettingsPageProps = $props();
  const app = untrack(() => getPluginManagementContext(controller).app);
  const jobs = app.backgroundJobs;
  let snapshot = $state<BackgroundJobSnapshot | undefined>(jobs?.snapshot);
  let busy = $state(false);
  let refreshing = false;
  let error = $state("");
  let receipt = $state("");
  let exported = $state("");
  let disposed = false;

  async function refresh(): Promise<void> {
    if (!jobs || refreshing || busy || disposed) return;
    refreshing = true;
    try {
      const value = await jobs.call({ kind: "list" });
      if (!disposed) snapshot = value;
    } catch (cause) {
      if (!disposed)
        error =
          cause instanceof Error
            ? cause.message
            : "Unable to read background jobs.";
    } finally {
      refreshing = false;
    }
  }
  async function command(command: BackgroundJobCommand): Promise<void> {
    if (!jobs || busy) return;
    busy = true;
    error = "";
    try {
      const value = await jobs.call(command);
      if (disposed) return;
      snapshot = value;
      if (value.transfer) exported = JSON.stringify(value.transfer, null, 2);
    } catch (cause) {
      if (!disposed)
        error =
          cause instanceof Error
            ? cause.message
            : "Background job control failed.";
    } finally {
      busy = false;
    }
  }
  async function importReceipt(): Promise<void> {
    try {
      const value: unknown = JSON.parse(receipt);
      // The admitted native owner validates identities, grants and replay before import.
      await command({
        kind: "importTransfer",
        receipt: value as BackgroundJobTransfer,
      });
    } catch {
      error = "Enter a valid handoff receipt.";
    }
  }
  async function approveExecution(): Promise<void> {
    try {
      await app.workspaceTrust.grant();
      await command({ kind: "fence", trusted: true, safeMode: false });
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : "Unable to approve background execution.";
    }
  }
  onMount(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 2000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  });
</script>

<section
  class="lapis-plugin-management"
  data-ui-component="lapis-plugin-management"
  data-ui-part="background-jobs"
  aria-busy={busy}
>
  <header class="lapis-plugin-management__header">
    <div>
      <h1>Background jobs</h1>
      <p>Approve scheduled work for this vault and choose its runner.</p>
    </div>
  </header>
  {#if error}<p role="alert">{error}</p>
    <Button.Root variant="outline" disabled={busy} onclick={refresh}
      >Refresh status</Button.Root
    >{/if}
  {#if !jobs}<p>Background jobs are unavailable on this host.</p>
  {:else if !snapshot}<p role="status">Loading background jobs…</p>
  {:else}
    <p>Runner ID <code>{snapshot.runnerId}</code></p>
    <p>Vault ID <code>{snapshot.vaultId}</code></p>
    {#if !snapshot.trusted || snapshot.safeMode}
      <p>
        Background work is blocked by {snapshot.safeMode
          ? "Safe Mode"
          : "workspace trust"}.
      </p>
      {#if !app.safeMode.active}
        <Button.Root
          variant="outline"
          disabled={busy}
          onclick={approveExecution}>Approve background execution</Button.Root
        >
      {/if}
    {/if}
    {#if snapshot.jobs.length === 0}<p>
        No enabled installed plugin declares a background job.
      </p>{/if}
    {#each snapshot.jobs as job (`${job.pluginId}/${job.descriptor.id}/${job.fingerprint}`)}
      <BackgroundJobRow
        {job}
        {busy}
        nativeNotificationsAvailable={snapshot.nativeNotificationsAvailable}
        blocked={!snapshot.trusted || snapshot.safeMode}
        {command}
      />
    {/each}
    {#if exported}
      <label for="background-job-export">Handoff receipt</label><Textarea.Root
        id="background-job-export"
        readonly
        value={exported}
        rows={8}
      />
      <p>
        Import this receipt on the designated destination. The released job
        stays paused here.
      </p>
    {/if}
    <details>
      <summary>Import a job handoff</summary>
      <label for="background-job-import">Handoff receipt</label><Textarea.Root
        id="background-job-import"
        bind:value={receipt}
        rows={6}
        disabled={busy}
      />
      <Button.Root
        variant="outline"
        disabled={busy || !receipt.trim()}
        onclick={importReceipt}>Import paused job</Button.Root
      >
    </details>
  {/if}
</section>
