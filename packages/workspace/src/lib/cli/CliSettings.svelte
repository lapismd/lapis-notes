<script lang="ts">
  import { onMount } from "svelte";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import type {
    CliSettingsHost,
    CliDownload,
    CliInstallationStatus,
  } from "./cli-settings";
  import CliAccessSettings from "./CliAccessSettings.svelte";
  let { host }: { host: CliSettingsHost } = $props();
  let status = $state<CliInstallationStatus>();
  let downloads = $state<CliDownload[]>([]);
  let selectedDownload = $state("");
  const download = $derived(downloads.find(file => file.url === selectedDownload));
  let busy = $state(false);
  let error = $state("");
  let setup = $state(false);
  let remove = $state(false);
  let shell = $state("none");
  let removePath = $state(false);
  let alive = true;
  async function refresh() {
    const [next, files] = await Promise.all([
      host.installation?.status(),
      host.downloads?.(),
    ]);
    if (alive) {
      status = next;
      downloads = files ?? [];
    }
  }
  async function run(action: () => Promise<void>, refreshAfter = true) {
    if (busy) return;
    busy = true;
    error = "";
    try {
      await action();
      if (refreshAfter) await refresh();
      setup = false;
      remove = false;
    } catch (failure) {
      if (alive) {
        error = failure instanceof Error ? failure.message : String(failure);
        if (refreshAfter) await refresh().catch(() => {});
      }
    } finally {
      if (alive) busy = false;
    }
  }
  onMount(() => {
    void run(refresh, false);
    return () => {
      alive = false;
    };
  });
</script>

<section
  data-ui-component="lapis-cli-settings"
  aria-label="Command line interface"
>
  <div class="row">
    <div>
      <h3>Command line interface</h3>
      <p>Use the <code>lapis</code> command from your terminal.</p>
      {#if status}
        <p>
          {status.state === "installed"
            ? "Installed"
            : status.state === "broken"
              ? "Needs repair"
              : status.state === "conflict"
                ? "Another command occupies this path"
                : "Not installed"} · bundled CLI {status.version}
        </p>
        <code>{status.destination}</code>
      {/if}
    </div>
    {#if host.installation}
      {#if status?.state === "installed"}
        <Button.Root
          variant="outline"
          disabled={busy}
          onclick={() => (remove = true)}>Uninstall CLI</Button.Root
        >
      {:else}
        <Button.Root
          disabled={busy || !status || status.state === "conflict"}
          onclick={() => (setup = true)}
          >{status?.state === "broken"
            ? "Repair CLI"
            : "Install CLI"}</Button.Root
        >
      {/if}
    {/if}
  </div>
  {#if status?.state === "installed"}
    <p>
      Open a new terminal and run <code>command -v lapis</code> and
      <code>lapis --version</code>.
    </p>
  {/if}
  {#if host.downloads}
    <p>
      Install on this computer. Your browser cannot inspect or change your local
      PATH.
    </p>
    {#if downloads.length}
      <label>Platform
        <select bind:value={selectedDownload}>
          <option value="">Choose your operating system and architecture</option>
          {#each downloads as file (file.url)}<option value={file.url}>{file.label}</option>{/each}
        </select>
      </label>
    {/if}
    {#if download}
      <div class="download">
        <a href={download.url} download>Download {download.label}</a>
        <p>SHA-256: <code>{download.sha256}</code></p>
      </div>
    {/if}
    {#if downloads.length}
      <p>Choose the matching archive, verify its checksum, and extract it. To connect, enable Content API and MCP under Core plugins and create a scoped credential.</p>
      <p>Install or remove the command on this computer:</p>
      <pre>./lapis cli install
# Optional PATH setup (choose your shell):
./lapis cli install --setup-path zsh
# Remove the command later:
lapis cli uninstall --remove-path</pre>
      <p>
        Use <code>--setup-path bash</code> for Bash. For another shell, add
        <code>~/.local/bin</code> to PATH manually.
      </p>
    {/if}
  {/if}
  {#if error && !setup && !remove}<p role="alert">{error}</p>{/if}
  <Button.Root variant="ghost" disabled={busy} onclick={() => run(refresh, false)}
    >Refresh status</Button.Root
  >
  {#if host.access}<CliAccessSettings host={host.access} />{/if}
</section>

<Dialog.Root bind:open={setup}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Set up CLI to work in the terminal</Dialog.Title>
      <Dialog.Description
        >Register “lapis” at ~/.local/bin/lapis for your user. Administrator
        access is not required. An existing Lapis-owned CLI copy will be
        replaced.</Dialog.Description
      >
    </Dialog.Header>
    <label
      >Shell PATH setup
      <select bind:value={shell} disabled={busy}>
        <option value="none">Leave shell configuration unchanged</option>
        <option value="zsh">Add ~/.local/bin to Zsh PATH</option>
        <option value="bash">Add ~/.local/bin to Bash PATH</option>
      </select>
    </label>
    <p>
      PATH setup adds a marked entry to your shell configuration. Other shells
      require manual setup.
    </p>
    {#if error}<p role="alert">{error}</p>{/if}
    <Dialog.Footer>
      <Button.Root
        variant="outline"
        disabled={busy}
        onclick={() => (setup = false)}>Cancel</Button.Root
      >
      <Button.Root
        disabled={busy}
        onclick={() =>
          run(() =>
            host.installation!.install(
              shell === "bash" || shell === "zsh" ? shell : undefined,
            ),
          )}>Register</Button.Root
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={remove}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Uninstall the CLI command?</Dialog.Title>
      <Dialog.Description
        >Your vaults, credentials and application data will be retained.</Dialog.Description
      >
    </Dialog.Header>
    <label
      ><input type="checkbox" bind:checked={removePath} disabled={busy} /> Remove
      unchanged Lapis PATH entries</label
    >
    {#if error}<p role="alert">{error}</p>{/if}
    <Dialog.Footer>
      <Button.Root
        variant="outline"
        disabled={busy}
        onclick={() => (remove = false)}>Cancel</Button.Root
      >
      <Button.Root
        disabled={busy}
        onclick={() => run(() => host.installation!.uninstall(removePath))}
        >Uninstall</Button.Root
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  section {
    display: grid;
    gap: 1rem;
    color: var(--ui-workspace-view-foreground, inherit);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h3,
  p {
    margin: 0.3rem 0;
  }
  code,
  pre {
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .download {
    padding-block: 0.5rem;
  }
  label {
    display: grid;
    gap: 0.5rem;
  }
  select {
    color: inherit;
    background: transparent;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
</style>
