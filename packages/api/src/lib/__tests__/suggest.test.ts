import { beforeEach, describe, expect, it, vi } from "vitest";

function createElement(tagName = "div") {
  const listeners = new Map<string, Array<(event: any) => void>>();
  const classes = new Set<string>();
  const element = {
    tagName,
    className: "",
    textContent: "",
    value: "",
    placeholder: "",
    parentElement: null as any,
    children: [] as any[],
    attributes: {} as Record<string, string>,
    classList: {
      add(name: string) {
        classes.add(name);
      },
      remove(name: string) {
        classes.delete(name);
      },
      toggle(name: string, active?: boolean) {
        if (active === false) {
          classes.delete(name);
        } else if (active === true || !classes.has(name)) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
        element.className = [...classes].join(" ");
      },
      contains(name: string) {
        return classes.has(name);
      },
    },
    append(...nodes: any[]) {
      for (const node of nodes) {
        if (node && typeof node === "object") {
          node.parentElement = element;
        }
        element.children.push(node);
      }
    },
    appendChild(node: any) {
      element.append(node);
      return node;
    },
    removeChild(node: any) {
      element.children = element.children.filter((child) => child !== node);
      if (node && typeof node === "object") {
        node.parentElement = null;
      }
      return node;
    },
    replaceChildren(...nodes: any[]) {
      element.children = [];
      element.textContent = "";
      element.append(...nodes);
    },
    addEventListener(type: string, listener: (event: any) => void) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener(type: string, listener: (event: any) => void) {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((value) => value !== listener),
      );
    },
    dispatchEvent(event: any) {
      event.target = element;
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event);
      }
      return true;
    },
    setAttribute(name: string, value: string) {
      element.attributes[name] = value;
    },
    removeAttribute(name: string) {
      delete element.attributes[name];
    },
    focus() {},
    remove() {
      element.parentElement?.removeChild(element);
    },
  };
  return element;
}

vi.mock("../settings.svelte", () => {
  class Modal {
    containerEl: HTMLElement;

    constructor(readonly app: unknown) {
      this.containerEl = globalThis.document.createElement("div");
    }

    onOpen(): void {}

    onClose(): void {}

    open(): void {
      this.onOpen();
    }

    close(): void {
      this.onClose();
    }
  }

  return { Modal };
});

import {
  AbstractInputSuggest,
  FuzzySuggestModal,
  type Instruction,
} from "../suggest";

function installDocument() {
  const body = createElement("body");
  const documentElement = createElement("html");
  globalThis.document = {
    body,
    documentElement,
    createElement: (tag: string) => createElement(tag),
    createTextNode: (text: string) => ({ textContent: text }),
  } as unknown as Document;
}

function keyEvent(key: string) {
  return {
    type: "keydown",
    key,
    preventDefault() {},
    stopPropagation() {},
  } as KeyboardEvent;
}

function flush(): Promise<void> {
  return Promise.resolve();
}

class FruitSuggest extends AbstractInputSuggest<string> {
  protected getSuggestions(query: string): string[] {
    return ["apple", "apricot", "banana"].filter((item) =>
      item.startsWith(query.toLowerCase()),
    );
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.textContent = value;
  }
}

class FruitFuzzyModal extends FuzzySuggestModal<string> {
  readonly chosen: string[] = [];

  getItems(): string[] {
    return ["Daily Note", "Desk Note", "Project"];
  }

  getItemText(item: string): string {
    return item;
  }

  onChooseItem(item: string): void {
    this.chosen.push(item);
  }
}

beforeEach(() => {
  installDocument();
});

describe("suggest compatibility", () => {
  it("opens input suggestions, supports keyboard selection, and cleans up", async () => {
    const parent = createElement("div");
    const input = createElement("input");
    input.value = "a";
    parent.append(input);

    const chosen: string[] = [];
    const suggest = new FruitSuggest({} as never, input as never)
      .setInstructions([{ command: "Enter", purpose: "Select" }])
      .onSelect((value) => {
        chosen.push(value);
      });

    suggest.open();
    await flush();

    expect(suggest.instructionContainerEl.children).toHaveLength(1);
    expect(suggest.suggestEl.parentElement).toBe(parent);

    input.dispatchEvent(keyEvent("ArrowDown"));
    input.dispatchEvent(keyEvent("Enter"));

    expect(chosen).toEqual(["apricot"]);
    expect(suggest.suggestEl.parentElement).toBeNull();
  });

  it("renders fuzzy modal instructions and selects the active suggestion", async () => {
    const modal = new FruitFuzzyModal({} as never);
    modal.setInstructions([
      { command: "Arrow", purpose: "Move" },
      { command: "Enter", purpose: "Choose" },
    ] satisfies Instruction[]);
    modal.inputEl.value = "dn";

    modal.open();
    await flush();

    expect(modal.instructionContainerEl.children).toHaveLength(2);
    expect(modal.resultContainerEl.children).toHaveLength(2);

    modal.inputEl.dispatchEvent(keyEvent("ArrowDown"));
    modal.inputEl.dispatchEvent(keyEvent("Enter"));

    expect(modal.chosen).toEqual(["Desk Note"]);
    expect(
      modal.resultContainerEl.children[1].classList.contains("is-selected"),
    ).toBe(true);
  });
});
