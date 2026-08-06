// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type ParityStatus = "implemented" | "stubbed" | "unsupported";

type ParityClassification = {
  statuses: ParityStatus[];
  symbols: Record<string, { kind: string; status: ParityStatus }>;
  keyMembers: Record<
    string,
    { upstream: string[]; local: string[]; missing: string[] }
  >;
};

const fixturePath = fileURLToPath(
  new URL("../../../test/fixtures/obsidian.d.ts", import.meta.url),
);
const classificationPath = fileURLToPath(
  new URL("../../../test/parity/obsidian-parity.json", import.meta.url),
);
const sourceRoot = fileURLToPath(new URL("..", import.meta.url));

function upstreamExports(): string[] {
  const contents = readFileSync(fixturePath, "utf8");
  const names = new Set<string>();
  const exportPattern =
    /^export\s+(?:declare\s+)?(?:(?:abstract\s+)?class|interface|type|enum|function|let|const)\s+([A-Za-z_$][\w$]*)/gm;
  let match: RegExpExecArray | null;
  while ((match = exportPattern.exec(contents))) {
    names.add(match[1]);
  }
  return [...names].sort();
}

function classification(): ParityClassification {
  return JSON.parse(
    readFileSync(classificationPath, "utf8"),
  ) as ParityClassification;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.(svelte|ts)$/.test(entry.name) ? [path] : [];
  });
}

function localExports(): string[] {
  const names = new Set<string>();
  const declarationPattern =
    /^export\s+(?:declare\s+)?(?:async\s+)?(?:(?:abstract\s+)?class|interface|type|enum|function|let|const)\s+([A-Za-z_$][\w$]*)/gm;
  const exportListPattern = /^export\s*\{([^}]+)\}/gm;

  for (const file of sourceFiles(sourceRoot)) {
    const contents = readFileSync(file, "utf8");
    let match: RegExpExecArray | null;
    while ((match = declarationPattern.exec(contents))) {
      names.add(match[1]);
    }
    while ((match = exportListPattern.exec(contents))) {
      for (const item of match[1].split(",")) {
        const [name, alias] = item.trim().split(/\s+as\s+/);
        names.add((alias ?? name).trim());
      }
    }
  }
  return [...names].sort();
}

describe("Obsidian API parity classification", () => {
  it("classifies every pinned upstream top-level export", () => {
    const upstream = upstreamExports();
    const parity = classification();
    const classified = new Set(Object.keys(parity.symbols));
    const validStatuses = new Set(parity.statuses);

    expect(upstream.length).toBeGreaterThan(0);
    expect(upstream.filter((name) => !classified.has(name))).toEqual([]);
    expect(
      Object.values(parity.symbols).filter(
        (symbol) => !validStatuses.has(symbol.status),
      ),
    ).toEqual([]);
  });

  it("tracks key member gaps for runtime-critical classes", () => {
    const parity = classification();
    const keyClasses = [
      "App",
      "Vault",
      "DataAdapter",
      "TFile",
      "Workspace",
      "WorkspaceLeaf",
      "Editor",
      "Plugin",
      "Component",
      "Menu",
      "Setting",
      "MetadataCache",
    ];

    expect(Object.keys(parity.keyMembers)).toEqual(
      expect.arrayContaining(keyClasses),
    );
    for (const className of keyClasses) {
      expect(parity.keyMembers[className].upstream.length).toBeGreaterThan(0);
      expect(Array.isArray(parity.keyMembers[className].missing)).toBe(true);
    }
  });

  it("keeps implemented and stubbed top-level exports backed by local source", () => {
    const parity = classification();
    const local = new Set(localExports());
    const covered = Object.entries(parity.symbols)
      .filter(([, symbol]) => symbol.status !== "unsupported")
      .map(([name]) => name);

    expect(covered.filter((name) => !local.has(name))).toEqual([]);
  });

  it("derives key member missing lists from upstream and local sets", () => {
    const parity = classification();

    for (const [className, members] of Object.entries(parity.keyMembers)) {
      const local = new Set(members.local);
      expect(members.missing).toEqual(
        members.upstream.filter((member) => !local.has(member)),
      );
      expect(new Set(members.upstream).size).toBe(members.upstream.length);
      expect(new Set(members.local).size).toBe(members.local.length);
    }
  });
});
