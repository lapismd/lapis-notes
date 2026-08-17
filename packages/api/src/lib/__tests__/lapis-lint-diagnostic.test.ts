import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
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
import { mountLintMessageDom } from "../components/editor/extensions/lint/mount-lint-tooltip";

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
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: "alpha\n",
        extensions: [lapisLintHoverTooltip(), linter(() => [])],
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
    const originalCoordsAtPos = view.coordsAtPos.bind(view);
    view.coordsAtPos = () => coords;
    view.posAtCoords = () => 0;
    view.posAndSideAtCoords = () => ({ pos: 0, assoc: 1 });

    view.contentDOM.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 24,
        clientY: 24,
        bubbles: true,
      }),
    );
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

  it("mounts duplicate action titles without throwing", () => {
    const first = vi.fn();
    const second = vi.fn();
    const root = mountTooltip(
      "Lists should be surrounded by blank lines",
      { code: "MD032", ruleId: "MD032", sourceLabel: "markdownlint" },
      true,
      {
        view: {} as never,
        from: 0,
        to: 1,
        actions: [
          { name: "Fix markdownlint MD032", apply: first },
          { name: "Fix markdownlint MD032", apply: second },
        ],
      },
    );

    const buttons = [
      ...root.querySelectorAll<HTMLButtonElement>(
        '[data-testid="lapis-lint-action"]',
      ),
    ];
    expect(buttons).toHaveLength(2);
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Fix markdownlint MD032",
      "Fix markdownlint MD032",
    ]);
    buttons[0]?.click();
    buttons[1]?.click();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});
