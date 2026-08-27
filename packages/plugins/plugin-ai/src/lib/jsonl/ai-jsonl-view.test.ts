import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  mountComponent: vi.fn(),
}));

vi.mock("@lapis-notes/api", () => ({
  mountComponent: mocks.mountComponent,
  TextFileView: class TextFileView {
    actions: unknown[] = [];
    app: unknown;
    containerEl: HTMLElement;
    data = "";
    file: { name: string; path: string } | null = null;
    leaf: unknown;

    constructor(leaf: { app?: unknown; containerEl: HTMLElement }) {
      this.leaf = leaf;
      this.app = leaf.app ?? { id: "test-app" };
      this.containerEl = leaf.containerEl;
    }
  },
}));

vi.mock("./ai-jsonl-view.svelte", () => ({
  default: { name: "AiJsonlViewSurface" },
}));

import AiJsonlViewSurface from "./ai-jsonl-view.svelte";
import { AiJsonlView, AiJsonlViewType } from "./ai-jsonl-view";

function createContainer(): HTMLElement {
  return {
    classList: { add: vi.fn() },
    replaceChildren: vi.fn(),
  } as unknown as HTMLElement;
}

describe("AiJsonlView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mounts a read-only JSONL surface and updates it when file data changes", () => {
    const props = { app: {}, data: "", filePath: "" };
    mocks.mountComponent.mockReturnValue({ props, destroy: mocks.destroy });
    const containerEl = createContainer();
    const view = new AiJsonlView({ containerEl, app: props.app } as never);
    (view as unknown as { file: { name: string; path: string } }).file = {
      name: "transcript.jsonl",
      path: "Notes/transcript.jsonl",
    };
    view.setViewData('{"event":"ready"}\n');

    view.load();

    expect(view.getViewType()).toBe(AiJsonlViewType);
    expect(view.getDisplayText()).toBe("transcript.jsonl");
    expect(view.getIcon()).toBe("messages-square");
    expect(view.getViewData()).toBe('{"event":"ready"}\n');
    expect(mocks.mountComponent).toHaveBeenCalledWith(AiJsonlViewSurface, {
      target: containerEl,
      props: {
        app: props.app,
        data: '{"event":"ready"}\n',
        filePath: "Notes/transcript.jsonl",
      },
    });

    view.setViewData('{"event":"updated"}\n');
    expect(props.data).toBe('{"event":"updated"}\n');

    view.unload();
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it("accepts JSONL case-insensitively and rejects other file types", () => {
    const view = new AiJsonlView({ containerEl: createContainer() } as never);
    expect(view.canAcceptExtension("jsonl")).toBe(true);
    expect(view.canAcceptExtension(".JSONL")).toBe(true);
    expect(view.canAcceptExtension("json")).toBe(false);
  });
});
