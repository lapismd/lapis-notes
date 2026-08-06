<script lang="ts">
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Table from "@lapismd/design-core/shadcn/table";

  let enabled = $state(true);
</script>

<div class="flex flex-col gap-4 p-4">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Name</Table.Head>
        <Table.Head>Enabled</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>Notes</Table.Cell>
        <Table.Cell>
          <Switch aria-label="Notes enabled" bind:checked={enabled} />
        </Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Daily</Table.Cell>
        <Table.Cell>off</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
  <p data-testid="api-ui-status">notes: {enabled ? "on" : "off"}</p>
</div>
