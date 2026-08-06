<script lang="ts">
  import {
    closeSearchPanel,
    setSearchQuery,
    selectMatches,
    SearchQuery,
    findNext,
    findPrevious,
    replaceNext,
    replaceAll,
  } from "@codemirror/search";
  import { EditorView, runScopeHandlers } from "@codemirror/view";
  import * as ToggleGroup from "@lapismd/design-core/shadcn/toggle-group";
  import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
  import Regex from "@lucide/svelte/icons/regex";
  import WholeWord from "@lucide/svelte/icons/whole-word";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";

  import TextSelect from "@lucide/svelte/icons/text-select";
  import Replace from "@lucide/svelte/icons/replace";
  import ReplaceAll from "@lucide/svelte/icons/replace-all";

  import X from "@lucide/svelte/icons/x";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";

  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { onMount, untrack } from "svelte";
  import { debounce } from "lodash-es";
  import "../../editor.css";

  let {
    view,
  }: {
    view: EditorView;
  } = $props();

  let noMatches: boolean = $state(false);
  let searchValue = $state(
    untrack(() =>
      view.state.sliceDoc(
        view.state.selection.main.from,
        view.state.selection.main.to,
      ),
    ),
  );
  let replaceValue = $state("");

  let searchField: HTMLInputElement | null = $state(null);
  let replaceField: HTMLInputElement | null = $state(null);

  let query: SearchQuery = $state(new SearchQuery({ search: "" }));
  let isReplace: boolean = $state(false);

  function exitSearch() {
    closeSearchPanel(view);
  }

  function missingMatches(query: SearchQuery) {
    if (!query.search) {
      return false;
    }
    const cursor = query.getCursor(view.state);
    return cursor.next().done === true;
  }

  const handleSearch = debounce((evt: any) => {
    const qs = new SearchQuery({
      search: searchValue,
      literal: query.literal,
      regexp: query.regexp,
      caseSensitive: query.caseSensitive,
      replace: replaceValue,
      wholeWord: query.wholeWord,
    });
    noMatches = missingMatches(qs);
    if (!qs.eq(query)) {
      view.dispatch({
        effects: setSearchQuery.of(qs),
      });
      query = qs;
    }
  }, 500);

  const keydown = (e: KeyboardEvent) => {
    if (runScopeHandlers(view, e, "search-panel")) {
      e.preventDefault();
    } else if (e.key == "Enter" && e.target == searchField) {
      e.preventDefault();
      (e.shiftKey ? findPrevious : findNext)(view);
    } else if (e.key == "Enter" && e.target == replaceField) {
      e.preventDefault();
      replaceNext(view);
    }
  };

  let values = $derived.by(() => {
    const props: Array<string> = [];
    if (query.caseSensitive) {
      props.push("case");
    }
    if (query.wholeWord) {
      props.push("word");
    }
    if (query.regexp) {
      props.push("regex");
    }
    return props;
  });

  let handlePropChange = $derived((values: string[] | undefined) => {
    const props = values || [];
    const qs = new SearchQuery({
      search: searchValue,
      literal: query.literal,
      regexp: props.includes("regex"),
      replace: replaceValue,
      caseSensitive: props.includes("case"),
      wholeWord: props.includes("word"),
    });
    query = qs;
    noMatches = missingMatches(qs);
    view.dispatch({
      effects: setSearchQuery.of(qs),
    });
  });

  const searchNext = () => findNext(view);
  const searchPrevious = () => findPrevious(view);
  const searchAll = () => selectMatches(view);
  const replaceMatch = () => replaceNext(view);
  const replaceAllMatches = () => replaceAll(view);

  onMount(() => {
    searchField?.setAttribute("main-field", "true");
  });
</script>

<div data-ui-component="editor" data-ui-part="search-root">
  <ToggleGroup.Root
    type="multiple"
    value={values}
    size="sm"
    onValueChange={handlePropChange}
  >
    <ToggleGroup.Item
      value="case"
      aria-label="Case Sensitive"
      data-ui-component="editor"
      data-ui-part="search-toggle"
    >
      <CaseSensitive class="editor-search-icon" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="word" aria-label="Match Whole Word">
      <WholeWord class="editor-search-icon" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="regex" aria-label="Use Regular Expression">
      <Regex class="editor-search-icon" />
    </ToggleGroup.Item>
  </ToggleGroup.Root>
  <div data-ui-component="editor" data-ui-part="search-row">
    <div data-ui-component="editor" data-ui-part="search-toggle-wrap">
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="outline"
                size="sm"
                onclick={() => (isReplace = !isReplace)}
              >
                {#if isReplace}
                  <ChevronDown />
                {:else}
                  <ChevronRight />
                {/if}
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>Toggle Replace</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
    <div data-ui-component="editor" data-ui-part="search-fields">
      <div data-ui-component="editor" data-ui-part="search-field-row">
        <Input
          bind:ref={searchField}
          type="text"
          onkeydown={keydown}
          onkeyup={handleSearch}
          bind:value={searchValue}
          placeholder="Find"
          class="search-input editor-search-input"
          data-ui-component="editor"
          data-ui-part="search-input"
        />
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  onclick={searchPrevious}
                >
                  <ArrowUp />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Previous ⇧ F3</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  onclick={searchNext}
                >
                  <ArrowDown />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Next F3</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  onclick={searchAll}
                >
                  <TextSelect />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Find all ⌥ Enter</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  onclick={exitSearch}
                >
                  <X />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Exit search</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      {#if isReplace}
        <div data-ui-component="editor" data-ui-part="search-field-row">
          <Input
            bind:ref={replaceField}
            type="text"
            onkeydown={keydown}
            onkeyup={handleSearch}
            bind:value={replaceValue}
            placeholder="Replace"
            class="editor-search-input"
            data-ui-component="editor"
            data-ui-part="search-input"
          />
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="sm"
                    onclick={replaceMatch}
                  >
                    <Replace />
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>Replace Enter</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="sm"
                    onclick={replaceAllMatches}
                  >
                    <ReplaceAll />
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>Replace all ⌘ ⌥ Enter</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      {/if}
    </div>
  </div>
</div>
