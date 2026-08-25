<script lang="ts">
  import { onMount } from "svelte";

  import { GraphRenderer } from "./graph-renderer";
  import { DEFAULT_GRAPH_SETTINGS, mergeGraphSettings } from "./graph-settings";
  import type { GraphData, GraphNode, GraphSettings } from "./graph-types";

  type Props = {
    data: GraphData;
    settings?: Partial<GraphSettings> | GraphSettings | null;
    focusedNodeId?: string | null;
    class?: string;
    onNodeClick?: (node: GraphNode, event: MouseEvent) => void;
    onNodeContextMenu?: (node: GraphNode, event: MouseEvent) => void;
  };

  let {
    data,
    settings = DEFAULT_GRAPH_SETTINGS,
    focusedNodeId = null,
    class: className = "",
    onNodeClick = () => {},
    onNodeContextMenu = () => {},
  }: Props = $props();

  let surfaceEl: HTMLDivElement | null = null;
  let renderer: GraphRenderer | null = null;

  const resolvedSettings = $derived(mergeGraphSettings(settings));
  const preferredCenterNodeId = $derived(
    focusedNodeId ?? data.centerNodeId ?? null,
  );

  onMount(() => {
    if (!surfaceEl) {
      return;
    }

    renderer = new GraphRenderer(surfaceEl, {
      onNodeClick: (node, event) => {
        onNodeClick(node, event);
      },
      onNodeContextMenu: (node, event) => {
        onNodeContextMenu(node, event);
      },
    });

    renderer.setGraph(data, resolvedSettings);
    renderer.focusNode(preferredCenterNodeId);

    return () => {
      renderer?.destroy();
      renderer = null;
    };
  });

  $effect(() => {
    if (!renderer) {
      return;
    }

    renderer.setGraph(data, resolvedSettings);
  });

  $effect(() => {
    if (!renderer) {
      return;
    }

    renderer.focusNode(preferredCenterNodeId);
  });

  function mergeClassName(
    baseClassName: string,
    extraClassName: string,
  ): string {
    return `${baseClassName} ${extraClassName}`.trim();
  }
</script>

<div
  class={mergeClassName("graph-view", className)}
  data-graph-embed
  data-ui-component="graph"
  data-ui-part="embed"
>
  <div
    class="graph-view__surface"
    data-ui-part="surface"
    bind:this={surfaceEl}
  ></div>
</div>
