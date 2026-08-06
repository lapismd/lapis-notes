<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import * as Table from "@lapismd/design-core/shadcn/table";
  import {
    TableDragGrip,
    tableRowDragType,
    tableReorderSensors,
  } from "@lapis-notes/ui/table-dnd";

  const rowType = tableRowDragType("settings");
  const rows = ["Notes", "Daily", "Archive"];
</script>

<div class="flex flex-col gap-4 p-4">
  <DragDropProvider sensors={tableReorderSensors}>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-10"><span class="sr-only">Reorder</span></Table.Head>
          <Table.Head>Name</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each rows as row, index (row)}
          <Table.Row>
            <Table.Cell>
              <TableDragGrip
                dragId={`settings-row:${index}`}
                dragType={rowType}
                dragIndex={index}
                axis="row"
                ariaLabel={`Reorder ${row}`}
              >
                <GripVertical class="size-3.5" />
              </TableDragGrip>
            </Table.Cell>
            <Table.Cell>{row}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </DragDropProvider>
  <p data-testid="api-ui-status">dragType: {rowType}</p>
</div>
