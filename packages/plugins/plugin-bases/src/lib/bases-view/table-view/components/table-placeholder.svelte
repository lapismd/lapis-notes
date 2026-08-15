<script lang="ts" generics="TData">
  import { type Table as TanstackTable } from "@tanstack/table-core";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import TableHeader from "./table-header.svelte";
  import type { BasesView } from "../../bases.svelte";

  type DataTableProps<TData> = {
    view: BasesView;
    table: TanstackTable<TData>;
  };

  let { table, view = $bindable() }: DataTableProps<TData> = $props();

  let colSpan = $derived(
    table.getAllColumns().filter((it) => it.getIsVisible()).length,
  );
</script>

<div
  class="bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-flex-grow-95a3df bases-style-overflow-auto-73fc3f bases-style-pb-16-db15dd"
  style="scrollbar-gutter: stable; transform: translate3d(0,0,0)"
  data-layout="table"
>
  <div
    class="relative bases-style-pb-100px-03c580"
  >
    <Table.Root class="bases-style-overflow-visible-5b5e83 contain-layout">
      <Table.Header class="bases-style-bg-secondary-ba939e sticky bases-style-top-0-216740 bases-style-z-100-db5a36">
        <Table.Row class="bases-style-th-td-last-border-r-0-7a1990">
          {#each table.getFlatHeaders() as header (header.id)}
            <TableHeader {header} width={header.column.getSize()} />
          {/each}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row class="bases-style-border-b-65fdba">
          <Table.Cell colspan={colSpan} class="bases-style-h-24-9678c6 bases-style-border-b-65fdba bases-style-text-center-ca6bf6">
            <div class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-items-center-3960ff bases-style-justify-center-86843c">
              <div class="loader"></div>
            </div>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  </div>
</div>
