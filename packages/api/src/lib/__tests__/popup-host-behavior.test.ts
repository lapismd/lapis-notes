// @vitest-environment jsdom

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import {
  createSearchPanelHost,
  focusSearchPanelInput,
} from "../components/editor/extensions/search/dom";
import { createLanguageServiceHoverDom } from "../components/editor/language-service/dom";
import { dialogPortalPropsForDocument } from "../dialog-portal";
import {
  inlineProblemExtension,
  toggleInlineProblem,
} from "../components/editor/extensions/lint/lapis-lint-inline-widget";
import { findOpenFileLeaf, leafFilePath } from "../open-file";
import { TFile } from "../storage";

function createPopupFrame() {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const popupWindow = iframe.contentWindow;
  const popupDocument = iframe.contentDocument;

  if (!popupWindow || !popupDocument) {
    throw new Error("Expected iframe-backed popup document");
  }

  popupDocument.body.innerHTML = "";
  return { iframe, popupWindow, popupDocument };
}

describe("popup host behavior", () => {
  it("prefers an existing file leaf in the focused popup host", () => {
    const file = new TFile(
      "Notes/Popup.md",
      { ctime: 0, mtime: 0, size: 0 },
      null,
    );

    const rootLeaf = {
      view: {
        file: new TFile(
          "Notes/Popup.md",
          { ctime: 0, mtime: 0, size: 0 },
          null,
        ),
      },
    };
    const popupLeaf = {
      view: {
        file,
      },
    };
    const workspace = {
      getFocusedCommandHostId: () => "popup-1",
      getCommandHostIdForLeaf: (
        leaf: typeof rootLeaf | typeof popupLeaf | null,
      ) => (leaf === popupLeaf ? "popup-1" : "root"),
      iterateAllLeaves<T>(
        callback: (leaf: typeof rootLeaf | typeof popupLeaf) => T,
      ): T | void {
        for (const leaf of [rootLeaf, popupLeaf]) {
          const response = callback(leaf);
          if (response !== undefined && response !== null) {
            return response;
          }
        }
        return undefined;
      },
    };

    expect(findOpenFileLeaf(workspace, file)).toBe(popupLeaf);
  });

  it("reads the file path from file-backed leaf views", () => {
    expect(
      leafFilePath({
        view: {
          file: {
            path: "Notes/Popup.md",
          },
        },
      }),
    ).toBe("Notes/Popup.md");
    expect(leafFilePath({ view: null })).toBeNull();
  });

  it("creates and focuses the search panel host inside the editor document", () => {
    const { iframe, popupDocument } = createPopupFrame();
    const host = createSearchPanelHost(popupDocument);
    const searchInput = popupDocument.createElement("input");
    searchInput.className = "search-input";
    host.appendChild(searchInput);
    popupDocument.body.appendChild(host);

    expect(host.ownerDocument).toBe(popupDocument);

    focusSearchPanelInput(host);

    expect(popupDocument.activeElement).toBe(searchInput);
    expect(searchInput?.ownerDocument).toBe(popupDocument);

    iframe.remove();
  });

  it("renders inline problem widgets in the editor document", () => {
    const { iframe, popupDocument } = createPopupFrame();
    const host = popupDocument.createElement("div");
    popupDocument.body.appendChild(host);
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: "alpha beta gamma",
        extensions: [inlineProblemExtension],
      }),
    });

    view.coordsAtPos = () => null;
    view.contentDOM.getBoundingClientRect = () =>
      ({ left: 0, right: 320 }) as DOMRect;

    toggleInlineProblem(view, 1, {
      message: "Problem in popup",
      sourceLabel: "markdownlint",
      ruleId: "MD001",
    });

    const widget = popupDocument.querySelector<HTMLElement>(
      ".lapis-inline-problem",
    );
    expect(widget).not.toBeNull();
    expect(widget?.ownerDocument).toBe(popupDocument);

    view.destroy();
    iframe.remove();
  });

  it("creates language-service hover DOM in the editor document", () => {
    const { iframe, popupDocument } = createPopupFrame();
    const dom = createLanguageServiceHoverDom(popupDocument, "Hover details");

    expect(dom.ownerDocument).toBe(popupDocument);
    expect(dom.className).toBe("cm-language-service-hover");
    expect(dom.textContent).toBe("Hover details");

    iframe.remove();
  });

  it("returns dialog portal props for the target document body", () => {
    const { iframe, popupDocument } = createPopupFrame();

    expect(dialogPortalPropsForDocument(popupDocument)).toEqual({
      to: popupDocument.body,
    });

    iframe.remove();
  });
});
