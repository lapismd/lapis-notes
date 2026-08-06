import { afterEach, describe, expect, it, vi } from "vitest";
import { markdownlintRuleUrl } from "../components/editor/extensions/lint/lapis-lint-diagnostic-helpers";
import { mountLintMessageDom } from "../components/editor/extensions/lint/mount-lint-tooltip";

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
    expect(
      copy?.closest('[data-testid="lapis-lint-message-band"]'),
    ).not.toBeNull();

    expect(
      root.querySelector('[data-testid="lapis-lint-source"]')?.textContent,
    ).toBe("markdownlint");

    const footer = root.querySelector('[data-testid="lapis-lint-footer"]');
    expect(footer).not.toBeNull();
    expect(
      footer?.querySelector('[data-testid="lapis-lint-action"]')?.textContent,
    ).toBe("View Problem");
  });

  it("can omit the copy control", () => {
    const root = mountTooltip("Hint", {}, false);
    expect(root.querySelector('[data-testid="lapis-lint-copy"]')).toBeNull();
  });

  it("omits the footer when there are no actions", () => {
    const root = mountTooltip("Hint", {}, true);
    expect(root.querySelector('[data-testid="lapis-lint-footer"]')).toBeNull();
  });
});
