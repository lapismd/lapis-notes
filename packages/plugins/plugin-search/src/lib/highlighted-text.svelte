<script lang="ts">
  type Range = { start: number; end: number };

  let {
    text,
    ranges = [],
  }: {
    text: string;
    ranges?: Range[];
  } = $props();

  const segments = $derived.by(() => {
    const normalized = ranges
      .map((range) => ({
        start: Math.max(0, Math.min(text.length, range.start)),
        end: Math.max(0, Math.min(text.length, range.end)),
      }))
      .filter((range) => range.end > range.start)
      .sort((left, right) => left.start - right.start);
    const output: Array<{ text: string; highlighted: boolean }> = [];
    let offset = 0;
    for (const range of normalized) {
      const start = Math.max(offset, range.start);
      if (start > offset) {
        output.push({ text: text.slice(offset, start), highlighted: false });
      }
      if (range.end > start) {
        output.push({ text: text.slice(start, range.end), highlighted: true });
      }
      offset = Math.max(offset, range.end);
    }
    if (offset < text.length) {
      output.push({ text: text.slice(offset), highlighted: false });
    }
    return output;
  });
</script>

{#each segments as segment, index (`${index}:${segment.text}`)}
  {#if segment.highlighted}<mark>{segment.text}</mark>{:else}{segment.text}{/if}
{/each}
