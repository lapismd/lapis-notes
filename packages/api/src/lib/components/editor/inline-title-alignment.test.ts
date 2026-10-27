import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { syncInlineTitleAlignment } from "./inline-title-alignment";

const cleanups: Array<() => void> = [];
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup());
  vi.restoreAllMocks();
});

function fixture() {
  const sizer = document.createElement("div");
  const host = document.createElement("div");
  sizer.append(host);
  document.body.append(sizer);
  const view = new EditorView({
    parent: host,
    state: EditorState.create({ doc: "Text" }),
  });
  let contentLeft = 181;
  let width = 700;
  vi.spyOn(host, "getBoundingClientRect").mockImplementation(
    () => new DOMRect(100, 0, width, 100),
  );
  vi.spyOn(view.contentDOM, "getBoundingClientRect").mockImplementation(
    () => new DOMRect(contentLeft, 0, width - (contentLeft - 100), 100),
  );
  let measurement: Parameters<EditorView["requestMeasure"]>[0];
  vi.spyOn(view, "requestMeasure").mockImplementation((request) => {
    measurement = request;
  });
  let resize!: ResizeObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const stop = syncInlineTitleAlignment(view, host);
  cleanups.push(() => {
    stop();
    view.destroy();
    sizer.remove();
  });
  function measure() {
    const value = measurement!.read(view);
    measurement!.write!(value, view);
  }
  return {
    view,
    sizer,
    stop,
    disconnect,
    measure,
    move(left: number) {
      contentLeft = left;
      resize([], {} as ResizeObserver);
    },
    hide() {
      width = 0;
    },
  };
}

describe("inline title alignment", () => {
  it("measures the complete content inset, including gutter spacing", () => {
    const f = fixture();
    f.measure();
    expect(
      f.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("81px");
  });

  it("remeasures gutter growth and removal without retaining stale padding", () => {
    const f = fixture();
    f.move(196.5);
    f.measure();
    expect(
      f.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("96.5px");
    f.move(100);
    f.measure();
    expect(
      f.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("0px");
  });

  it("keeps simultaneous editor measurements independent", () => {
    const first = fixture();
    const second = fixture();
    first.move(150);
    first.measure();
    second.move(205);
    second.measure();
    expect(
      first.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("50px");
    expect(
      second.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("105px");
  });

  it("includes content padding without measuring the first line's Markdown indentation", () => {
    const f = fixture();
    f.view.contentDOM.style.paddingLeft = "6px";
    f.measure();
    expect(
      f.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("87px");
  });

  it("retains the previous measurement while its pane is hidden", () => {
    const f = fixture();
    f.measure();
    f.hide();
    f.move(0);
    f.measure();
    expect(
      f.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("81px");
  });

  it("disconnects and ignores measurements queued before teardown", () => {
    const f = fixture();
    f.measure();
    f.move(250);
    f.stop();
    f.measure();
    expect(f.disconnect).toHaveBeenCalled();
    expect(
      f.sizer.style.getPropertyValue("--ui-editor-inline-title-inset"),
    ).toBe("");
  });
});
