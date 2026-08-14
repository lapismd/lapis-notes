export const RoleFileExample = `<script lang="ts">
  import { RoleWorkspace } from "@lapis-notes/roles";
  let source = $state(roleMarkdown);
</script>

<RoleWorkspace
  filePath="Roles/atlas-platform/role.md"
  content={source}
  onContentChange={(next) => (source = next)}
/>`;

export const ApplicationsExample = `<script lang="ts">
  import { ApplicationsBoard, type RoleRecord } from "@lapis-notes/roles";
  let roles = $state<RoleRecord[]>(initialRoles);
</script>

<ApplicationsBoard
  {roles}
  onMove={(role, status, sortOrder) => {
    roles = roles.map((item) => item.id === role.id ? { ...item, status, sortOrder } : item);
  }}
/>`;

export const ActivityExample = `<script lang="ts">
  import { RoleActivityTimeline } from "@lapis-notes/roles";
</script>

<RoleActivityTimeline roles={roles} onSelect={(role) => openRole(role.sourcePath)} />`;

export const ActionsExample = `<script lang="ts">
  import { RoleActionsBoard, moveRoleAction } from "@lapis-notes/roles";
</script>

<RoleActionsBoard
  roles={roles}
  onMove={(action, target) => updateRole(action.role.sourcePath, moveRoleAction(action, target))}
/>`;

