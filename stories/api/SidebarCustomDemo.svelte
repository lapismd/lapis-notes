<script lang="ts">
  import * as Sidebar from "@lapis-notes/ui/sidebar-custom";

  let open = $state(true);
</script>

<div class="flex flex-col gap-4 p-4">
  <Sidebar.Provider id="left" bind:open class="min-h-[240px] rounded-md border">
    <Sidebar.Root collapsible="offcanvas">
      <Sidebar.Header class="px-3 py-2 text-sm font-medium">Workspace</Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton>Notes</Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton>Daily</Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Content>
    </Sidebar.Root>
    <Sidebar.Inset class="p-3">
      <Sidebar.Trigger />
      <p class="mt-3 text-sm">Main content</p>
    </Sidebar.Inset>
  </Sidebar.Provider>
  <p data-testid="api-ui-status">open: {open ? "true" : "false"}</p>
</div>
