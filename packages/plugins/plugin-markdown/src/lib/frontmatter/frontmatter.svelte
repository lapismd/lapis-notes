<script lang="ts">
  import {
    Menu,
    Notice,
    type App,
    type FrontMatterCache,
    type MetadataTypeDef,
    type TypeWidget,
  } from "@lapis-notes/api";
  import { Icon } from "@lapis-notes/api/icon";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    resolveNestedFrontmatterPropertyType,
    resolveTopLevelFrontmatterProperty,
  } from "./frontmatter-property";

  let {
    app,
    frontmatter,
    onChange,
  }: {
    app: App;
    frontmatter?: FrontMatterCache | null;
    onChange: (type: MetadataTypeDef, value: any, event?: Event) => void;
  } = $props();

  type PropertySpec = {
    id: string;
    path: string;
    type: MetadataTypeDef;
    value: any;
    parent: string;
    widget: TypeWidget;
    valid: boolean;
    error?: string | null;
    isNew?: boolean;
    children: PropertySpec[];
  };

  let newProperty: PropertySpec | null = $state(null);
  let nextNewPropertyId = $state(0);
  let opened = $state<Record<string, boolean>>({});
  let newPropertyNameInput: HTMLInputElement | null = $state(null);

  $effect(() => {
    if (newProperty) {
      newPropertyNameInput?.focus();
    }
  });

  const properties = $derived.by(() => {
    if (!frontmatter) return [] as PropertySpec[];
    const keys: PropertySpec[] = [];
    for (const [key, value] of Object.entries(frontmatter)) {
      const policy = resolveTopLevelFrontmatterProperty(
        app.metadataTypeManager,
        key,
        value,
      );
      const { type } = policy;
      const children = policy.deriveChildren ? deriveChildren(key, value) : [];
      const widget =
        app.metadataTypeManager.registeredTypeWidgets[type.type] ||
        app.metadataTypeManager.registeredTypeWidgets.unknown;
      if (!widget) continue;
      keys.push({
        id: key,
        path: key,
        type,
        parent: "",
        value,
        widget,
        valid: widget.validate(value),
        children,
      });
    }
    return keys;
  });

  function deriveChildren(parent: string, prop: unknown): PropertySpec[] {
    const keys: PropertySpec[] = [];

    if (Array.isArray(prop)) {
      prop.forEach((value, index) => {
        const key = String(index);
        const path = `${parent}[${index}]`;
        const type = resolveNestedFrontmatterPropertyType(
          app.metadataTypeManager,
          path,
          key,
          value,
        );
        const children =
          Array.isArray(value) || (value && typeof value === "object")
            ? deriveChildren(path, value)
            : [];
        const widget =
          app.metadataTypeManager.registeredTypeWidgets[type.type] ||
          app.metadataTypeManager.registeredTypeWidgets.unknown;
        if (!widget) return;
        keys.push({
          id: path,
          path,
          type,
          parent,
          value,
          widget,
          valid: widget.validate(value),
          children,
        });
      });
      return keys;
    }

    if (typeof prop !== "object" || !prop) return keys;

    for (const [key, value] of Object.entries(prop as Record<string, unknown>)) {
      const path = `${parent}.${key}`;
      const type = resolveNestedFrontmatterPropertyType(
        app.metadataTypeManager,
        path,
        key,
        value,
      );
      const children =
        Array.isArray(value) || (value && typeof value === "object")
          ? deriveChildren(path, value)
          : [];
      const widget =
        app.metadataTypeManager.registeredTypeWidgets[type.type] ||
        app.metadataTypeManager.registeredTypeWidgets.unknown;
      if (!widget) continue;
      keys.push({
        id: path,
        path,
        type,
        parent,
        value,
        widget,
        valid: widget.validate(value),
        children,
      });
    }

    return keys;
  }

  function normalizePropertyType(props: PropertySpec) {
    return { ...props.type, name: props.path };
  }

  function getWidget(prop: PropertySpec): TypeWidget {
    if (prop.valid && prop.widget && prop.widget.type !== "unknown") {
      return prop.widget;
    }
    const type = app.metadataTypeManager.determineType(prop.value);
    return (
      app.metadataTypeManager.registeredTypeWidgets[type] ||
      app.metadataTypeManager.registeredTypeWidgets.unknown ||
      prop.widget
    );
  }

  function renderProperty(el: HTMLElement, props: PropertySpec) {
    const type = normalizePropertyType(props);
    const widget = getWidget(props);
    const changeHandler = (
      nextType: MetadataTypeDef,
      value: any,
      event?: Event,
    ) => {
      if (newProperty) newProperty = null;
      onChange(nextType, value, event);
    };

    el.replaceChildren();
    widget?.render(el, { ...props, type, onChange: changeHandler });

    return {
      update(nextProps: PropertySpec) {
        const nextType = normalizePropertyType(nextProps);
        const nextWidget = nextProps.valid
          ? nextProps.widget
          : app.metadataTypeManager.registeredTypeWidgets[
              app.metadataTypeManager.determineType(nextProps.value)
            ];
        el.replaceChildren();
        nextWidget?.render(el, {
          ...nextProps,
          type: nextType,
          onChange: changeHandler,
        });
      },
      destroy() {
        el.replaceChildren();
      },
    };
  }

  async function commitPropertyName(property: PropertySpec, nextName: string) {
    const name = nextName.trim();
    if (!name) {
      property.error = "Property name is required";
      return;
    }

    const prevId = property.path;
    const newId = property.parent ? `${property.parent}.${name}` : name;

    if (
      prevId !== newId &&
      frontmatter &&
      Object.prototype.hasOwnProperty.call(frontmatter, newId)
    ) {
      property.error = "Property already exists";
      return;
    }

    property.error = null;

    if (property.isNew) {
      onChange(
        { ...property.type, name: newId },
        getWidget(property).default(property.value),
      );
      newProperty = null;
      return;
    }

    if (prevId === newId) return;

    try {
      const result = await app.metadataTypeManager.rename(prevId, newId);
      if (result.failedFiles.length) {
        property.error = result.failedFiles[0]!.message;
        new Notice(
          `Renamed ${result.updatedFiles.length} files; ${result.failedFiles.length} failed`,
        );
        return;
      }
      new Notice(`Successfully renamed property ${prevId} -> ${newId}`);
    } catch (error) {
      property.error =
        error instanceof Error ? error.message : "Failed to rename property";
      new Notice(property.error);
    }
  }

  function openPropertyMenu(event: MouseEvent, property: PropertySpec) {
    event.preventDefault();
    event.stopPropagation();
    const type = normalizePropertyType(property);
    new Menu()
      .addMenu((menu) => {
        menu.setTitle("Property type");
        for (const [key, value] of Object.entries(
          app.metadataTypeManager.registeredTypeWidgets,
        )) {
          if (key === "unknown") continue;
          menu.addItem((item) =>
            item
              .setTitle(value.name)
              .setIcon(value.icon)
              .setChecked(value.type === type.type)
              .onClick(() => {
                app.metadataTypeManager.setType(property.path, value.type);
              }),
          );
        }
      })
      .addSeparator()
      .addItem((item) =>
        item.setTitle("Remove").onClick(() => {
          onChange(type, undefined);
        }),
      )
      .showAtMouseEvent(event);
  }

  function updateType(spec: PropertySpec, event: Event) {
    onChange(
      normalizePropertyType(spec),
      spec.widget.default(spec.value),
      event,
    );
  }

  function addProperty() {
    const widget =
      app.metadataTypeManager.registeredTypeWidgets.text ??
      app.metadataTypeManager.registeredTypeWidgets.unknown;
    if (!widget) return;
    newProperty = {
      id: `__new__:${nextNewPropertyId++}`,
      path: "",
      type: { name: "", type: "text" },
      widget,
      value: "",
      isNew: true,
      parent: "",
      valid: true,
      children: [],
    };
  }

  function toggleOpen(path: string) {
    opened[path] = !opened[path];
  }
</script>

<div class="frontmatter-form" data-ui-component="frontmatter-form">
  {#each properties as property (property.id)}
    {@render Tree({ property })}
  {/each}
  {#if newProperty}
    {@render Tree({ property: newProperty })}
  {/if}
  <Button variant="ghost" size="sm" onclick={() => addProperty()}>
    <Icon name="lucide-plus" />
    Add property
  </Button>
</div>

{#snippet Tree({ property }: { property: PropertySpec })}
  {#if property.children.length}
    <div class="frontmatter-form__group" data-ui-part="group">
      <div class="frontmatter-form__row" data-ui-part="row">
        <button
          type="button"
          class="frontmatter-form__expand"
          aria-expanded={Boolean(opened[property.path])}
          aria-label={opened[property.path]
            ? "Collapse property"
            : "Expand property"}
          onclick={() => toggleOpen(property.path)}
        >
          {opened[property.path] ? "▾" : "▸"}
        </button>
        <button
          type="button"
          class="frontmatter-form__type-btn"
          aria-label={`Property options for ${property.type.name || "property"}`}
          onclick={(event) => openPropertyMenu(event, property)}
        >
          <Icon name={property.widget?.icon || "lucide-list"} />
        </button>
        <input
          class="frontmatter-form__name"
          value={property.type.name}
          aria-label="Property name"
          onblur={(event) =>
            void commitPropertyName(property, event.currentTarget.value)}
          onkeydown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commitPropertyName(property, event.currentTarget.value);
            }
          }}
        />
      </div>
      {#if opened[property.path]}
        <div class="frontmatter-form__children" data-ui-part="children">
          {#each property.children as child (child.id)}
            {@render Tree({ property: child })}
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="frontmatter-form__row"
      data-ui-part="row"
      data-property={property.path}
      data-valid={property.valid ? "true" : "false"}
    >
      <button
        type="button"
        class="frontmatter-form__type-btn"
        aria-label={`Property options for ${property.type.name || "new property"}`}
        onclick={(event) => openPropertyMenu(event, property)}
      >
        <Icon name={property.widget?.icon || "lucide-text"} />
      </button>
      {#if property.isNew}
        <input
          bind:this={newPropertyNameInput}
          class="frontmatter-form__name"
          value={property.type.name}
          aria-label="New property name"
          onblur={(event) => {
            const value = event.currentTarget.value;
            if (!value.trim()) {
              newProperty = null;
              return;
            }
            void commitPropertyName(property, value);
          }}
          onkeydown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commitPropertyName(property, event.currentTarget.value);
            } else if (event.key === "Escape") {
              event.preventDefault();
              newProperty = null;
            }
          }}
        />
      {:else}
        <input
          class="frontmatter-form__name"
          value={property.type.name}
          aria-label="Property name"
          onblur={(event) =>
            void commitPropertyName(property, event.currentTarget.value)}
          onkeydown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commitPropertyName(property, event.currentTarget.value);
            }
          }}
        />
      {/if}
      <div
        class="frontmatter-form__value"
        data-ui-part="value"
        use:renderProperty={property}
      ></div>
      {#if !property.valid}
        <Button
          variant="ghost"
          size="sm"
          class="frontmatter-form__warning"
          aria-label={`Type mismatch, expected ${property.widget.name}`}
          title={`Type mismatch, expected ${property.widget.name}`}
          onclick={(event) => updateType(property, event)}
        >
          <Icon name="lucide-alert-triangle" />
        </Button>
      {/if}
    </div>
    {#if property.error}
      <p class="frontmatter-form__error">{property.error}</p>
    {/if}
  {/if}
{/snippet}

<style>
  .frontmatter-form {
    display: flex;
    width: 100%;
    min-width: 0;
    flex-direction: column;
    gap: 0.125rem;
  }

  .frontmatter-form__group {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .frontmatter-form__children {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin-inline-start: 0.75rem;
    padding-inline-start: 0.5rem;
    border-inline-start: 1px solid
      var(--ui-workspace-border-strong, var(--sidebar-border));
  }

  .frontmatter-form__row {
    display: flex;
    width: 100%;
    min-width: 0;
    min-height: var(--ui-workspace-explorer-row-height, 1.75rem);
    align-items: center;
    gap: 0.25rem;
    border-bottom: 1px solid
      color-mix(
        in srgb,
        var(--ui-workspace-border-strong, var(--sidebar-border)) 55%,
        transparent
      );
    padding-block: 0.125rem;
  }

  .frontmatter-form__expand,
  .frontmatter-form__type-btn {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .frontmatter-form__expand:hover,
  .frontmatter-form__type-btn:hover,
  .frontmatter-form__expand:focus-visible,
  .frontmatter-form__type-btn:focus-visible {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
    outline: none;
  }

  .frontmatter-form__type-btn :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
  }

  .frontmatter-form__name {
    flex: 0 0 7.5rem;
    width: 7.5rem;
    min-width: 5rem;
    margin: 0;
    padding: 0.2rem 0.35rem;
    border: none;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    color: inherit;
    background: transparent;
    font: inherit;
    font-weight: 600;
  }

  .frontmatter-form__name:focus-visible {
    outline: 1px solid var(--interactive-accent, var(--primary));
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
  }

  .frontmatter-form__value {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 1.5rem;
    align-items: center;
  }

  .frontmatter-form__value :global(input),
  .frontmatter-form__value :global(textarea) {
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0.2rem 0.35rem;
    border: none;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    color: inherit;
    background: transparent;
    font: inherit;
    resize: vertical;
  }

  .frontmatter-form__value :global(input:focus-visible),
  .frontmatter-form__value :global(textarea:focus-visible) {
    outline: 1px solid var(--interactive-accent, var(--primary));
  }

  .frontmatter-form__value :global(pre) {
    margin: 0;
    max-height: 8rem;
    overflow: auto;
    font-size: 0.75rem;
    white-space: pre-wrap;
  }

  .frontmatter-form__error {
    margin: 0;
    padding: 0 0.35rem 0.25rem 2rem;
    color: var(--text-warning, var(--destructive));
    font-size: 0.75rem;
  }

  .frontmatter-form :global(.frontmatter-form__warning) {
    color: var(--text-warning, var(--destructive));
  }
</style>
