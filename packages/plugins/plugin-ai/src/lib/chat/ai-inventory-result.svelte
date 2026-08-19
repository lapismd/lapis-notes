<script lang="ts">
  import type { AgentResultViewProps, App } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import SquareArrowOutUpRightIcon from "@lucide/svelte/icons/square-arrow-out-up-right";
  import type { AiChatInventory, AiChatInventoryItem } from "./chat-items";
  import "./ai-inventory-result.css";

  let {
    app,
    output,
  }: Partial<AgentResultViewProps<App>> = $props();

  const inventory = $derived.by((): AiChatInventory | undefined => {
    if (!output || typeof output !== "object" || Array.isArray(output)) {
      return undefined;
    }
    const record = output as Partial<AiChatInventory>;
    if (record.kind !== "skills" && record.kind !== "tools") return undefined;
    if (!Array.isArray(record.items)) return undefined;
    return record as AiChatInventory;
  });

  async function openItem(item: AiChatInventoryItem): Promise<void> {
    if (!item.path || !app) return;
    await app.workspace.openLinkText(item.path, "");
  }
</script>

<div
  data-ui-component="ai-inventory-result"
  data-kind={inventory?.kind}
>
  {#if !inventory || inventory.items.length === 0}
    <p data-ui-part="empty">
      {inventory?.kind === "tools"
        ? "No application tools are available."
        : "No skills are available."}
    </p>
  {:else}
    {#each inventory.items as item (`${item.kind}:${item.name}:${item.path ?? ""}`)}
      <div data-ui-part="item">
        <div data-ui-part="body">
          <span data-ui-part="name">{item.name}</span>
          {#if item.description}
            <span data-ui-part="description">{item.description}</span>
          {/if}
        </div>
        {#if item.path && app}
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            data-ui-part="open"
            aria-label={`Open ${item.name}`}
            onclick={() => void openItem(item)}
          >
            <SquareArrowOutUpRightIcon aria-hidden="true" />
          </Button>
        {/if}
      </div>
    {/each}
  {/if}
</div>
