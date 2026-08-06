<script lang="ts" module>
    import * as SelectPrimitive from "@lapismd/design-core/shadcn/select";
    import { type SelectRootProps } from "bits-ui";
    const SelectRoot: any = SelectPrimitive.Root;

    export type SelectItem = {
      value: string;
      label: string;
      disabled?: boolean;
    };

    type SharedSelectProps = {
      items?: SelectItem[];
      placeholder?: string;
      ref?: HTMLElement | null;
    } & Omit<SelectRootProps, "items" | "type" | "value" | "onValueChange">;

    export type SingleSelectProps = SharedSelectProps & {
      type?: "single";
      value?: string;
      onValueChange?: (value: string) => void;
    };

    export type MultipleSelectProps = SharedSelectProps & {
      type: "multiple";
      value?: string[];
      onValueChange?: (value: string[]) => void;
    };

    export type SelectProps = SingleSelectProps | MultipleSelectProps;
  </script>
  
  <script lang="ts">
    let {
      items = [],
      type = "single",
      value = $bindable(),
      ref = $bindable(null),
      placeholder = "Select...",
      ...rest
    }: SelectProps = $props();

    const triggerContent = $derived.by(() => {
      if (Array.isArray(value)) {
        const selectedValues = value;
        const selected = items
          .filter((item) => selectedValues.includes(item.value))
          .map((item) => item.label);
        return selected.length ? selected.join(", ") : placeholder;
      }
      return items.find((item) => item.value === value)?.label ?? placeholder;
    });
  </script>
  
  <div bind:this={ref}>
    <SelectRoot {...rest} {type} bind:value>
      <SelectPrimitive.Trigger>
        {triggerContent}
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Content>
        <SelectPrimitive.Group>
          {#each items as item (item.value)}
            <SelectPrimitive.Item
              value={item.value}
              label={item.label}
              disabled={item.disabled}
            />
          {/each}
        </SelectPrimitive.Group>
      </SelectPrimitive.Content>
    </SelectRoot>
  </div>  
