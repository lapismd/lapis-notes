import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  lintGutter,
  linter,
  setDiagnostics,
  workspaceLintMarkerMask,
} from "../components/editor/extensions/lint/lapis-code-mirror-lint";
import { mapToLapisLintDiagnostic } from "../components/editor/extensions/lint/lapis-lint-diagnostic";
import { markdownlintRuleUrl } from "../components/editor/extensions/lint/lapis-lint-diagnostic-helpers";
import {
  lapisLintHoverTooltip,
  pointerWithinLintTooltipHandoff,
} from "../components/editor/extensions/lint/lapis-lint-hover-tooltip";
import {
  createLintQuickFixMenu,
  splitLintTooltipActions,
} from "../components/editor/extensions/lint/lint-tooltip-actions";
import { mountLintMessageDom } from "../components/editor/extensions/lint/mount-lint-tooltip";

function mountLintHoverView() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: "alpha extra\n",
      extensions: [lapisLintHoverTooltip(), linter(() => []), lintGutter()],
    }),
  });
  const diagnostic = mapToLapisLintDiagnostic(
    {
      from: 0,
      to: 5,
      severity: "warning",
      message: "First line in file should be a top-level heading",
    },
    { code: "MD041", ruleId: "MD041", sourceLabel: "markdownlint" },
  );
  view.dispatch(setDiagnostics(view.state, [diagnostic]));
  const coords = { left: 20, right: 48, top: 16, bottom: 32 };
  view.coordsAtPos = () => coords;
  view.posAtCoords = () => 0;
  view.posAtDOM = () => 0;
  return { host, view };
}

function dispatchHover(view: EditorView, selector: string): void {
  let target = view.dom.querySelector(selector);
  if (!target) {
    target = document.createElement("span");
    target.className = selector.slice(1);
    const parent = selector === ".cm-lint-marker" ? view.dom : view.contentDOM;
    parent.appendChild(target);
  }
  target.dispatchEvent(
    new MouseEvent("mousemove", {
      clientX: 24,
      clientY: 24,
      bubbles: true,
    }),
  );
}

describe("lint gutter markers", () => {
  it("uses the Problems panel severity glyphs", () => {
    expect(workspaceLintMarkerMask("error")).toContain("lucide-circle-x");
    expect(workspaceLintMarkerMask("warning")).toContain(
      "lucide-triangle-alert",
    );
    expect(workspaceLintMarkerMask("info")).toContain("lucide-info");
    expect(workspaceLintMarkerMask("hint")).toContain("lucide-lightbulb");
  });
});

describe("lint tooltip pointer handoff", () => {
  const trigger = { left: 100, right: 180, top: 100, bottom: 120 };
  const tooltipAbove = { left: 80, right: 300, top: 20, bottom: 90 };
  const tooltipBelow = { left: 80, right: 300, top: 130, bottom: 210 };

  it("covers the gap between a diagnostic and a tooltip on either side", () => {
    expect(
      pointerWithinLintTooltipHandoff({ x: 140, y: 95 }, trigger, tooltipAbove),
    ).toBe(true);
    expect(
      pointerWithinLintTooltipHandoff(
        { x: 140, y: 125 },
        trigger,
        tooltipBelow,
      ),
    ).toBe(true);
  });

  it("does not keep the tooltip open outside the handoff corridor", () => {
    expect(
      pointerWithinLintTooltipHandoff({ x: 20, y: 95 }, trigger, tooltipAbove),
    ).toBe(false);
  });

  it("does not read editor layout during a document update while a card is open", () => {
    const { host, view } = mountLintHoverView();
    const originalCoordsAtPos = view.coordsAtPos.bind(view);
    dispatchHover(view, ".cm-lintRange");
    expect(document.querySelector(".cm-lapis-tooltip")).not.toBeNull();

    let readLayoutDuringUpdate = false;
    view.coordsAtPos = (pos, side) => {
      try {
        return originalCoordsAtPos(pos, side);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes(
            "Reading the editor layout isn't allowed during an update",
          )
        ) {
          readLayoutDuringUpdate = true;
        }
        throw error;
      }
    };

    expect(() => {
      view.dispatch({ changes: { from: 0, insert: "x" } });
    }).not.toThrow();
    expect(readLayoutDuringUpdate).toBe(false);

    view.destroy();
    host.remove();
  });

  it("does not open a card from unmarked text on the same line", () => {
    const { host, view } = mountLintHoverView();
    view.contentDOM.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 80,
        clientY: 24,
        bubbles: true,
      }),
    );
    expect(document.querySelector(".cm-lapis-tooltip")).toBeNull();
    view.destroy();
    host.remove();
  });

  it("opens a card from the underlined lint range", () => {
    const { host, view } = mountLintHoverView();
    dispatchHover(view, ".cm-lintRange");
    expect(document.querySelector(".cm-lapis-tooltip")).not.toBeNull();
    view.destroy();
    host.remove();
  });

  it("opens a card from the matching gutter marker", () => {
    const { host, view } = mountLintHoverView();
    dispatchHover(view, ".cm-lint-marker");
    expect(document.querySelector(".cm-lapis-tooltip")).not.toBeNull();
    view.destroy();
    host.remove();
  });
});

describe("markdownlintRuleUrl", () => {
  it("maps MD-prefixed rule codes to markdownlint doc paths", () => {
    expect(markdownlintRuleUrl("MD041")).toBe(
      "https://github.com/DavidAnson/markdownlint/blob/main/doc/md041.md",
    );
    expect(markdownlintRuleUrl("md013")).toBe(
      "https://github.com/DavidAnson/markdownlint/blob/main/doc/md013.md",
    );
  });

  it("supports custom templates", () => {
    expect(markdownlintRuleUrl("MD041", "https://example.test/{rule}")).toBe(
      "https://example.test/md041",
    );
  });
});

describe("mountLintMessageDom", () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts.splice(0)) {
      host.remove();
    }
  });

  function mountTooltip(
    ...args: Parameters<typeof mountLintMessageDom>
  ): HTMLElement {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = mountLintMessageDom(...args);
    host.appendChild(root);
    hosts.push(host);
    return root;
  }

  it("builds tooltip DOM with message band, rule link, copy control, and footer actions", () => {
    const apply = vi.fn();
    const onAction = vi.fn();
    const root = mountTooltip(
      "First line in file should be a top-level heading",
      {
        code: "MD041",
        ruleId: "MD041",
        ruleUrl: markdownlintRuleUrl("MD041"),
        sourceLabel: "markdownlint",
      },
      true,
      {
        view: {} as never,
        from: 0,
        to: 1,
        actions: [{ name: "View Problem", apply }],
        onAction,
      },
    );

    expect(
      root.querySelector('[data-testid="lapis-lint-tooltip"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="lapis-lint-message-band"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="lapis-lint-message-text"]')
        ?.textContent,
    ).toBe("First line in file should be a top-level heading");

    const rule = root.querySelector(
      '[data-testid="lapis-lint-rule"]',
    ) as HTMLAnchorElement;
    expect(rule.textContent).toBe("MD041");
    expect(rule.href).toContain("/doc/md041.md");

    const copy = root.querySelector('[data-testid="lapis-lint-copy"]');
    expect(copy).not.toBeNull();
    const messageRow = root.querySelector('[data-ui-part="lint-message-row"]');
    expect(copy?.parentElement).toBe(messageRow);
    expect(
      root.querySelector('[data-testid="lapis-lint-message-text"]')
        ?.parentElement,
    ).toBe(messageRow);

    expect(
      root.querySelector('[data-testid="lapis-lint-source"]')?.textContent,
    ).toBe("markdownlint(MD041)");

    const footer = root.querySelector('[data-testid="lapis-lint-footer"]');
    expect(footer).not.toBeNull();
    expect(
      footer?.querySelector('[data-testid="lapis-lint-quick-fix"]'),
    ).toBeNull();
    expect(
      footer?.querySelector('[data-testid="lapis-lint-action"]')?.textContent,
    ).toBe("View Problem");
    footer
      ?.querySelector<HTMLButtonElement>('[data-testid="lapis-lint-action"]')
      ?.click();
    expect(apply).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("can omit the copy control", () => {
    const root = mountTooltip("Hint", {}, false);
    expect(root.querySelector('[data-testid="lapis-lint-copy"]')).toBeNull();
  });

  it("omits the footer when there are no actions", () => {
    const root = mountTooltip("Hint", {}, true);
    expect(root.querySelector('[data-testid="lapis-lint-footer"]')).toBeNull();
  });

  it("exposes cached actions from one Quick Fix menu", () => {
    const first = vi.fn();
    const second = vi.fn();
    const viewProblem = vi.fn();
    const root = mountTooltip(
      "Lists should be surrounded by blank lines",
      { code: "MD032", ruleId: "MD032", sourceLabel: "markdownlint" },
      true,
      {
        view: {} as never,
        from: 0,
        to: 1,
        actions: [
          { name: "View Problem", apply: viewProblem },
          { name: "Fix this violation of `MD032`", apply: first },
          { name: "Fix this violation of `MD032`", apply: second },
        ],
      },
    );

    expect(
      [...root.querySelectorAll('[data-testid="lapis-lint-action"]')].map(
        (button) => button.textContent,
      ),
    ).toEqual(["View Problem"]);
    expect(
      root.querySelector('[data-testid="lapis-lint-quick-fix"]')?.textContent,
    ).toBe("Quick Fix");

    const split = splitLintTooltipActions([
      {
        name: "View Problem",
        onClick: () => viewProblem(),
      },
      {
        name: "Fix this violation of `MD032`",
        onClick: () => first(),
      },
      {
        name: "Fix this violation of `MD032`",
        onClick: () => second(),
      },
    ]);
    expect(split.viewProblem?.name).toBe("View Problem");
    expect(split.quickFixActions.map((action) => action.name)).toEqual([
      "Fix this violation of `MD032`",
      "Fix this violation of `MD032`",
    ]);
    const menu = createLintQuickFixMenu(split.quickFixActions);
    expect(
      menu.entries.map((entry) =>
        entry.kind === "item" ? entry.title : entry.kind,
      ),
    ).toEqual([
      "Fix this violation of `MD032`",
      "Fix this violation of `MD032`",
    ]);
    const firstItem = menu.entries[0];
    const secondItem = menu.entries[1];
    if (firstItem?.kind === "item") void firstItem.callback?.();
    if (secondItem?.kind === "item") void secondItem.callback?.();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(viewProblem).not.toHaveBeenCalled();
  });
});
