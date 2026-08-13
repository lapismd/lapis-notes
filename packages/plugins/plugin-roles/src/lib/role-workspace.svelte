<script lang="ts">
  import { Mira } from "@lapismd/mira";
  import "@lapismd/mira/styles.css";
  import "@lapismd/mira/themes/obsidian.css";
  import { FormField } from "@lapismd/design-core/forms";
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import { untrack } from "svelte";
  import { ROLE_STATUSES, type RolePatch, type RolePrepStage } from "./roles/types";
  import { parseRoleDocument, patchRoleDocument } from "./roles/role-document";

  let {
    filePath,
    content,
    onContentChange,
    onOpenCv,
    onTailorCv,
    onDelete,
  }: {
    filePath: string;
    content: string;
    onContentChange?: (content: string) => void | Promise<void>;
    onOpenCv?: (path: string) => void | Promise<void>;
    onTailorCv?: (sourcePath: string) => void | Promise<void>;
    onDelete?: () => void | Promise<void>;
  } = $props();

  let source = $state(untrack(() => content));
  let activeTab = $state("role");
  let descriptionMode = $state<"source" | "preview">("source");
  let stageName = $state("");
  let commentAuthor = $state("");
  let commentBody = $state("");
  let saveError = $state<string | null>(null);
  const document = $derived(parseRoleDocument(filePath, source));

  function id() {
    return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  }

  function setSource(next: string) {
    source = next;
    saveError = null;
    void Promise.resolve(onContentChange?.(next)).catch((error) => {
      saveError = error instanceof Error ? error.message : String(error);
    });
  }

  function commit(patch: RolePatch, body?: string) {
    try {
      setSource(patchRoleDocument(filePath, source, patch, body));
    } catch (error) {
      saveError = error instanceof Error ? error.message : String(error);
    }
  }

  function addStage() {
    const role = document.role;
    const name = stageName.trim();
    if (!role || !name) return;
    const stage: RolePrepStage = {
      id: id(),
      type: "interview",
      name,
      status: "planned",
    };
    commit({
      prep: {
        ...role.prep,
        stages: [...role.prep.stages, stage],
        updatedAt: new Date().toISOString(),
      },
    });
    stageName = "";
  }

  function addComment() {
    const role = document.role;
    const body = commentBody.trim();
    if (!role || !body) return;
    commit({
      prep: {
        ...role.prep,
        comments: {
          ...role.prep.comments,
          items: [
            ...role.prep.comments.items,
            {
              id: id(),
              author: commentAuthor.trim() || "You",
              body,
              createdAt: new Date().toISOString(),
              reactions: [],
            },
          ],
        },
        updatedAt: new Date().toISOString(),
      },
    });
    commentBody = "";
  }

  function addReaction(emoji: string) {
    const role = document.role;
    if (!role) return;
    commit({
      reactions: [
        ...role.reactions,
        { id: id(), emoji, author: "You", createdAt: new Date().toISOString() },
      ],
    });
  }

  async function confirmDelete() {
    if (!globalThis.confirm?.(`Delete ${document.role?.title ?? "this role"}?`)) return;
    await onDelete?.();
  }
</script>

<section class="role-workspace" data-ui-component="role-workspace" data-ui-part="root">
  <header class="role-workspace__header">
    <div>
      <p>{document.role?.company ?? "Role document"}</p>
      <h1>{document.role?.title ?? filePath}</h1>
    </div>
    {#if document.role}
      <Badge variant="outline">{document.role.status}</Badge>
      <Button variant="destructive" size="sm" onclick={confirmDelete}>Delete</Button>
    {/if}
  </header>

  {#if document.diagnostics.length > 0}
    <Alert.Root variant="destructive" role="alert" class="role-workspace__alert">
      <Alert.Title>Role source needs attention</Alert.Title>
      <Alert.Description>{document.diagnostics.map((item) => item.message).join(" ")}</Alert.Description>
    </Alert.Root>
  {/if}
  {#if saveError}
    <Alert.Root variant="destructive" role="alert" class="role-workspace__alert">
      <Alert.Title>Role not saved</Alert.Title>
      <Alert.Description>{saveError}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if !document.role}
    <div class="role-workspace__raw" aria-label="Raw role source">
      <Mira
        value={source}
        mode="source"
        toolbar={false}
        theme="obsidian"
        colorMode="inherit"
        blockControls={false}
        onChange={setSource}
      />
    </div>
  {:else}
    <Tabs.Root bind:value={activeTab} class="role-workspace__tabs">
      <Tabs.List variant="line" aria-label="Role details">
        <Tabs.Trigger value="role">Role</Tabs.Trigger>
        <Tabs.Trigger value="description">Description</Tabs.Trigger>
        <Tabs.Trigger value="prep">Prep</Tabs.Trigger>
        <Tabs.Trigger value="comments">Comments</Tabs.Trigger>
        <Tabs.Trigger value="cv">CV</Tabs.Trigger>
        <Tabs.Trigger value="source">Source</Tabs.Trigger>
      </Tabs.List>

      <ScrollArea.Root class="role-workspace__content" orientation="vertical" type="always">
        {#if activeTab === "role"}
          <div class="role-workspace__form cv-structured-form">
            <FormField label="Company">
              <Input value={document.role.company} onchange={(event) => commit({ company: event.currentTarget.value })} />
            </FormField>
            <FormField label="Title">
              <Input value={document.role.title} onchange={(event) => commit({ title: event.currentTarget.value })} />
            </FormField>
            <FormField label="Status">
              <select value={document.role.status} onchange={(event) => commit({ status: event.currentTarget.value as typeof document.role.status })}>
                {#each ROLE_STATUSES as status}<option value={status}>{status}</option>{/each}
              </select>
            </FormField>
            <FormField label="Location">
              <Input value={document.role.location ?? ""} onchange={(event) => commit({ location: event.currentTarget.value || undefined })} />
            </FormField>
            <FormField label="URL">
              <Input type="url" value={document.role.url ?? ""} onchange={(event) => commit({ url: event.currentTarget.value || undefined })} />
            </FormField>
            <FormField label="Salary">
              <Input value={document.role.salary ?? ""} onchange={(event) => commit({ salary: event.currentTarget.value || undefined })} />
            </FormField>
            <FormField label="Tags">
              <Input value={document.role.tags.join(", ")} onchange={(event) => commit({ tags: event.currentTarget.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
            </FormField>
            <FormField label="Contacts">
              <Input value={document.role.contacts.join(", ")} onchange={(event) => commit({ contacts: event.currentTarget.value.split(",").map((contact) => contact.trim()).filter(Boolean) })} />
            </FormField>
            <FormField label="Follow up">
              <Input type="date" value={document.role.followUpAt?.slice(0, 10) ?? ""} onchange={(event) => commit({ followUpAt: event.currentTarget.value || undefined })} />
            </FormField>
            <div class="role-workspace__reactions">
              <span>Reactions</span>
              {#each document.role.reactions as reaction (reaction.id)}<Badge variant="outline">{reaction.emoji} {reaction.author}</Badge>{/each}
              <Button size="xs" variant="outline" onclick={() => addReaction("👍")}>Add 👍</Button>
            </div>
          </div>
        {:else if activeTab === "description"}
          <div class="role-workspace__markdown">
            <div class="role-workspace__markdown-modes" aria-label="Description mode">
              <Button size="sm" variant={descriptionMode === "source" ? "default" : "ghost"} aria-pressed={descriptionMode === "source"} onclick={() => (descriptionMode = "source")}>Edit</Button>
              <Button size="sm" variant={descriptionMode === "preview" ? "default" : "ghost"} aria-pressed={descriptionMode === "preview"} onclick={() => (descriptionMode = "preview")}>Preview</Button>
            </div>
            <Mira
              value={document.body}
              mode={descriptionMode}
              sourcePath={filePath}
              toolbar
              theme="obsidian"
              colorMode="inherit"
              blockControls
              onChange={(body) => commit({}, body)}
            />
          </div>
        {:else if activeTab === "prep"}
          <div class="role-workspace__stack">
            {#each document.role.prep.stages as stage (stage.id)}
              <article class="role-workspace__item">
                <strong>{stage.name}</strong>
                <span>{stage.type} · {stage.status ?? "planned"}</span>
                {#if stage.quickBrief}<p>{stage.quickBrief}</p>{/if}
              </article>
            {/each}
            <div class="role-workspace__composer">
              <Input aria-label="Interview or preparation stage" placeholder="Interview or preparation stage" bind:value={stageName} onkeydown={(event) => event.key === "Enter" && addStage()} />
              <Button onclick={addStage}>Add stage</Button>
            </div>
          </div>
        {:else if activeTab === "comments"}
          <div class="role-workspace__stack">
            {#each document.role.prep.comments.items as comment (comment.id)}
              <article class="role-workspace__item">
                <strong>{comment.author}</strong>
                <time datetime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
                <p>{comment.body}</p>
              </article>
            {/each}
            <div class="role-workspace__comment-composer">
              <Input aria-label="Comment author" placeholder="Author" bind:value={commentAuthor} />
              <Textarea aria-label="Comment" placeholder="Add a comment" bind:value={commentBody} />
              <Button onclick={addComment}>Add comment</Button>
            </div>
          </div>
        {:else if activeTab === "cv"}
          <div class="role-workspace__stack">
            <FormField label="Linked CV path">
              <Input value={document.role.cvFile ?? ""} onchange={(event) => commit({ cvFile: event.currentTarget.value || undefined })} />
            </FormField>
            <FormField label="Tailored CV path">
              <Input value={document.role.tailoredCvFile ?? ""} onchange={(event) => commit({ tailoredCvFile: event.currentTarget.value || undefined })} />
            </FormField>
            <div class="role-workspace__actions">
              {#if document.role.cvFile}
                <Button variant="outline" onclick={() => onOpenCv?.(document.role!.cvFile!)}>Open linked CV</Button>
                <Button onclick={() => onTailorCv?.(document.role!.cvFile!)}>Create tailored CV</Button>
              {/if}
              {#if document.role.tailoredCvFile}
                <Button variant="outline" onclick={() => onOpenCv?.(document.role!.tailoredCvFile!)}>Open tailored CV</Button>
              {/if}
            </div>
          </div>
        {:else}
          <div class="role-workspace__raw" aria-label="Raw role source">
            <Mira
              value={source}
              mode="source"
              sourcePath={filePath}
              toolbar={false}
              theme="obsidian"
              colorMode="inherit"
              blockControls={false}
              onChange={setSource}
            />
          </div>
        {/if}
      </ScrollArea.Root>
    </Tabs.Root>
  {/if}
</section>

<style>
  .role-workspace {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
  }

  .role-workspace__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 1rem;
  }

  .role-workspace__header > div:first-child {
    min-width: 0;
    flex: 1 1 auto;
  }

  .role-workspace__header p,
  .role-workspace__header h1 {
    overflow: hidden;
    margin: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role-workspace__markdown-modes {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid var(--border);
    padding: 0.5rem 0.75rem;
  }

  :global(.role-workspace__tabs [data-ui-part="tabs-trigger"][data-state="inactive"]) {
    color: var(--foreground);
  }

  .role-workspace__header p {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .role-workspace__header h1 {
    font-size: 1rem;
  }

  :global(.role-workspace__alert) {
    margin: 0.75rem 1rem 0;
  }

  :global(.role-workspace__tabs),
  :global(.role-workspace__content),
  .role-workspace__raw,
  .role-workspace__markdown {
    min-height: 0;
    flex: 1 1 auto;
  }

  :global(.role-workspace__tabs) {
    display: flex;
    flex-direction: column;
  }

  :global(.role-workspace__tabs [data-slot="tabs-list"]) {
    flex: 0 0 auto;
    overflow-x: auto;
  }

  :global(.role-workspace__content) {
    height: 100%;
  }

  .role-workspace__form,
  .role-workspace__stack {
    display: grid;
    gap: 0.875rem;
    padding: 1rem;
  }

  .role-workspace__form {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .role-workspace__form select {
    width: 100%;
    min-height: 2.25rem;
    border: 1px solid var(--input);
    border-radius: var(--radius);
    background: var(--background);
    color: var(--foreground);
    padding: 0.35rem 0.625rem;
  }

  .role-workspace__reactions,
  .role-workspace__actions,
  .role-workspace__composer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .role-workspace__item {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    padding: 0.75rem;
  }

  .role-workspace__item > * {
    display: block;
    margin: 0.25rem 0;
  }

  .role-workspace__item span,
  .role-workspace__item time {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .role-workspace__comment-composer {
    display: grid;
    gap: 0.5rem;
  }

  .role-workspace__raw,
  .role-workspace__markdown {
    display: flex;
    overflow: hidden;
  }

  .role-workspace__raw :global(.mira),
  .role-workspace__markdown :global(.mira) {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0;
  }

  @media (max-width: 700px) {
    .role-workspace__form {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
