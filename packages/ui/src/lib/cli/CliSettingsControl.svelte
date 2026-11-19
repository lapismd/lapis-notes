<script lang="ts">
  import { onMount } from "svelte";
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import { CodeBlock } from "@lapismd/design-core/shadcn/code-block";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { CopyableValue } from "@lapismd/design-core/workspace/settings";
  import AppleIcon from "@lucide/svelte/icons/apple";
  import AppWindowIcon from "@lucide/svelte/icons/app-window";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import CircleMinusIcon from "@lucide/svelte/icons/circle-minus";
  import CircleXIcon from "@lucide/svelte/icons/circle-x";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import GlobeIcon from "@lucide/svelte/icons/globe";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
  import WrenchIcon from "@lucide/svelte/icons/wrench";
  import TerminalIcon from "@lucide/svelte/icons/terminal";
  import {
    cliDownloadOperatingSystem,
    cliDownloadPlatformLabel,
  } from "./cli-download";
  import type { CliSettingsState } from "./cli-settings-state.svelte";
  import CliAccessSettings from "./CliAccessSettings.svelte";

  type CliSettingsControlKind =
    | "status-badge"
    | "status-path"
    | "installation-action"
    | "installation-error"
    | "refresh"
    | "platform"
    | "checksum"
    | "commands"
    | "access";

  let {
    model,
    kind,
    controlId,
  }: {
    model: CliSettingsState;
    kind: CliSettingsControlKind;
    controlId: string;
  } = $props();
  const selectedDownloadLabel = $derived(
    model.selectedDownload
      ? cliDownloadPlatformLabel(model.selectedDownload)
      : "Choose your operating system and architecture",
  );
  const installCommands = `./lapis cli install

shell_name="bash" # Use "zsh" on macOS.
./lapis cli install --setup-path "$shell_name"

lapis cli uninstall --remove-path`;

  onMount(() => model.start());

  async function install() {
    const installed = await model.run(() =>
      model.host.installation!.install(
        model.shell === "bash" || model.shell === "zsh"
          ? model.shell
          : undefined,
      ),
    );
    if (installed) model.setupOpen = false;
  }

  async function uninstall() {
    const uninstalled = await model.run(() =>
      model.host.installation!.uninstall(model.removePath),
    );
    if (uninstalled) model.removeOpen = false;
  }

  function downloadSelectedArchive() {
    const download = model.selectedDownload;
    if (!download) return;
    const anchor = document.createElement("a");
    anchor.href = download.url;
    anchor.download = download.file ?? "";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  }
</script>

{#snippet platformIcon(download = model.selectedDownload)}
  {#if download && cliDownloadOperatingSystem(download) === "macos"}
    <AppleIcon aria-hidden="true" />
  {:else if download && cliDownloadOperatingSystem(download) === "linux"}
    <TerminalIcon aria-hidden="true" />
  {:else if download && cliDownloadOperatingSystem(download) === "windows"}
    <AppWindowIcon aria-hidden="true" />
  {:else}
    <GlobeIcon aria-hidden="true" />
  {/if}
{/snippet}

{#snippet errorAlert()}
  <Alert.Root variant="destructive">
    <CircleAlertIcon aria-hidden="true" />
    <Alert.Description class="cli-error-description">
      {model.error}
    </Alert.Description>
  </Alert.Root>
{/snippet}

{#if kind === "status-badge"}
  <Badge
    id={controlId}
    variant={model.status?.state === "conflict"
      ? "destructive"
      : model.status?.state === "broken"
        ? "default"
        : model.status?.state === "installed"
          ? "default"
          : "outline"}
    data-tone={model.status?.state === "installed"
      ? "success"
      : model.status?.state === "broken"
        ? "warning"
        : undefined}
    aria-live="polite"
  >
    {#if model.status?.state === "installed"}
      <CircleCheckIcon data-icon="inline-start" />
      Installed
    {:else if model.status?.state === "broken"}
      <TriangleAlertIcon data-icon="inline-start" />
      Needs repair
    {:else if model.status?.state === "conflict"}
      <CircleXIcon data-icon="inline-start" />
      Path conflict
    {:else if model.status}
      <CircleMinusIcon data-icon="inline-start" />
      Not installed
    {:else}
      <LoaderCircleIcon data-icon="inline-start" />
      Checking
    {/if}
    {#if model.status}<span>v{model.status.version}</span>{/if}
  </Badge>
{:else if kind === "status-path"}
  <div id={controlId} class="status-path">
    <TerminalIcon aria-hidden="true" />
    <span>{model.status?.destination ?? "Checking command path…"}</span>
  </div>
{:else if kind === "installation-action"}
  <span id={controlId}>
    {#if model.status?.state === "installed"}
      <Button.Root
        class="cli-action-button"
        variant="secondary"
        disabled={model.busy}
        onclick={() => (model.removeOpen = true)}
      >
        <Trash2Icon data-icon="inline-start" />
        Uninstall CLI
      </Button.Root>
    {:else}
      <Button.Root
        class="cli-action-button"
        variant="secondary"
        data-tone={model.status?.state === "broken" ? "warning" : undefined}
        disabled={model.busy || !model.status || model.status.state === "conflict"}
        onclick={() => (model.setupOpen = true)}
      >
        {#if model.status?.state === "broken"}
          <WrenchIcon data-icon="inline-start" />
        {:else}
          <DownloadIcon data-icon="inline-start" />
        {/if}
        {model.status?.state === "broken" ? "Repair CLI" : "Install CLI"}
      </Button.Root>
    {/if}
  </span>
{:else if kind === "installation-error"}
  {#if model.error && !model.setupOpen && !model.removeOpen}{@render errorAlert()}{/if}
{:else if kind === "refresh"}
  <Button.Root
    id={controlId}
    class="cli-action-button"
    variant="default"
    disabled={model.busy}
    onclick={() => model.run(() => model.refresh(), false)}
  >
    <RefreshCwIcon data-icon="inline-start" />
    Refresh status
  </Button.Root>
{:else if kind === "platform"}
  <div class="platform-control">
    <Select.Root type="single" bind:value={model.selectedDownloadUrl}>
      <Select.Trigger id={controlId} class="platform-trigger" aria-label="Platform">
        <span class="platform-option">
          {@render platformIcon()}
          <span>{selectedDownloadLabel}</span>
        </span>
      </Select.Trigger>
      <Select.Content aria-label="Platform options">
        <Select.Group>
          {#each model.downloads as download (download.url)}
            <Select.Item
              value={download.url}
              label={cliDownloadPlatformLabel(download)}
            >
              <span class="platform-option">
                {@render platformIcon(download)}
                <span>{cliDownloadPlatformLabel(download)}</span>
              </span>
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
    <Button.Root
      variant="outline"
      size="icon-sm"
      disabled={!model.selectedDownload}
      aria-label={`Download ${selectedDownloadLabel} archive`}
      title="Download selected archive"
      onclick={downloadSelectedArchive}
    >
      <DownloadIcon aria-hidden="true" />
    </Button.Root>
  </div>
{:else if kind === "checksum"}
  {#if model.selectedDownload}
    <span id={controlId}>
      <CopyableValue
        value={model.selectedDownload.sha256}
        label="SHA-256 checksum"
        leadingCharacters={12}
        trailingCharacters={8}
      />
    </span>
  {:else}
    <span id={controlId}>Unavailable until a platform is selected</span>
  {/if}
{:else if kind === "commands"}
  <CodeBlock
    id={controlId}
    code={installCommands}
    language="bash"
    highlightMode="spans"
    width="100%"
    isWrapped
    style="--ui-code-syntax-background: var(--ui-workspace-background)"
  />
{:else if kind === "access" && model.host.access}
  <div id={controlId}>
    <CliAccessSettings host={model.host.access} embedded />
  </div>
{/if}

{#if kind === "installation-action"}
  <Dialog.Root bind:open={model.setupOpen}>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Set up CLI to work in the terminal</Dialog.Title>
        <Dialog.Description>
          Register “lapis” at ~/.local/bin/lapis for your user. Administrator
          access is not required. An existing Lapis-owned CLI copy will be
          replaced.
        </Dialog.Description>
      </Dialog.Header>
      <label id="cli-shell-setup-label">Shell PATH setup
        <Select.Root
          type="single"
          bind:value={model.shell}
          disabled={model.busy}
        >
          <Select.Trigger aria-labelledby="cli-shell-setup-label">
            {model.shell === "zsh"
              ? "Add ~/.local/bin to Zsh PATH"
              : model.shell === "bash"
                ? "Add ~/.local/bin to Bash PATH"
                : "Leave shell configuration unchanged"}
          </Select.Trigger>
          <Select.Content aria-label="Shell PATH setup options">
            <Select.Group>
              <Select.Item
                value="none"
                label="Leave shell configuration unchanged"
              />
              <Select.Item value="zsh" label="Add ~/.local/bin to Zsh PATH" />
              <Select.Item value="bash" label="Add ~/.local/bin to Bash PATH" />
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </label>
      <p>
        PATH setup adds a marked entry to your shell configuration. Other shells
        require manual setup.
      </p>
      {#if model.error}{@render errorAlert()}{/if}
      <Dialog.Footer>
        <Button.Root
          variant="outline"
          disabled={model.busy}
          onclick={() => (model.setupOpen = false)}>Cancel</Button.Root
        >
        <Button.Root disabled={model.busy} onclick={install}>
          {#if model.status?.state === "broken"}
            <WrenchIcon data-icon="inline-start" />
            Repair CLI
          {:else}
            <DownloadIcon data-icon="inline-start" />
            Install CLI
          {/if}
        </Button.Root>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  <Dialog.Root bind:open={model.removeOpen}>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Uninstall the CLI command?</Dialog.Title>
        <Dialog.Description>
          Your vaults, credentials and application data will be retained.
        </Dialog.Description>
      </Dialog.Header>
      <label>
        <input
          type="checkbox"
          bind:checked={model.removePath}
          disabled={model.busy}
        />
        Remove unchanged Lapis PATH entries
      </label>
      {#if model.error}{@render errorAlert()}{/if}
      <Dialog.Footer>
        <Button.Root
          variant="outline"
          disabled={model.busy}
          onclick={() => (model.removeOpen = false)}>Cancel</Button.Root
        >
        <Button.Root
          variant="destructive"
          disabled={model.busy}
          onclick={uninstall}
        >
          <Trash2Icon data-icon="inline-start" />
          Uninstall
        </Button.Root>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}

<style>
  .status-path {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
  }
  .status-path span {
    min-width: 0;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-family: inherit;
    font-size: var(--ui-workspace-settings-description-size, 0.875rem);
    line-height: 1.3;
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .status-path :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: 0 0 auto;
  }
  :global(.cli-action-button) {
    width: 10rem;
    max-width: 100%;
  }
  :global(.cli-action-button[data-variant="secondary"]) {
    border-color: var(--ui-workspace-border);
    color: var(--ui-workspace-panel-action-hover-foreground);
    background-color: color-mix(
      in srgb,
      var(--ui-workspace-panel-action-hover-background) 70%,
      var(--ui-workspace-panel)
    );
  }
  @media (hover: hover) {
    :global(.cli-action-button[data-variant="secondary"]:hover:not(:disabled)) {
      color: var(--ui-workspace-panel-action-hover-foreground);
      background-color: var(--ui-workspace-panel-action-hover-background);
    }
  }
  :global(.cli-action-button[data-tone="warning"]) {
    border-color: var(--ui-workspace-warning);
    color: var(--primary-foreground);
    background-color: color-mix(
      in srgb,
      var(--ui-workspace-warning) 62%,
      #000000
    );
  }
  @media (hover: hover) {
    :global(.cli-action-button[data-tone="warning"]:hover:not(:disabled)) {
      color: var(--primary-foreground);
      background-color: color-mix(
        in srgb,
        var(--ui-workspace-warning) 70%,
        #000000
      );
    }
  }
  :global([data-ui-component="badge"][data-tone="success"]) {
    --ui-badge-background: var(--ui-workspace-success, #15803d);
    --ui-badge-foreground: var(--primary-foreground);
  }
  :global([data-ui-component="badge"][data-tone="warning"]) {
    --ui-badge-background: color-mix(
      in srgb,
      var(--ui-workspace-warning) 62%,
      #000000
    );
    --ui-badge-foreground: var(--primary-foreground);
  }
  :global(
    .ui-workspace-setting-item[data-setting-id="cli.installation"]:not(
        :has(> .ui-workspace-setting-item__control > *)
      )
  ) {
    row-gap: 0;
  }
  :global(
    .ui-workspace-setting-item[data-setting-id="cli.installation"]
      > .ui-workspace-setting-item__control:not(:has(> *))
  ) {
    display: none;
  }
  :global(.cli-error-description) {
    font-family: inherit;
    font-size: var(--ui-workspace-settings-description-size);
    line-height: 1.3;
  }
  .platform-control,
  .platform-option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
  }
  .platform-control {
    width: 100%;
  }
  .platform-control :global(.platform-trigger) {
    min-width: 0;
    flex: 1 1 auto;
  }
  .platform-option {
    flex: 1 1 auto;
  }
  .platform-option > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .platform-option :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: 0 0 auto;
  }
  label {
    display: grid;
    gap: 0.5rem;
  }
</style>
