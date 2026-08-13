import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileCvSource } from "./compile";
import { withHtmlPreviewFonts } from "./compiler/html-preview";
import { parseCvYaml } from "./parse";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../form/sample-cv.fixture.yml",
);
const sampleYaml = readFileSync(fixturePath, "utf8");

describe("parseCvYaml", () => {
  it("parses and normalizes the sample CV", () => {
    const parsed = parseCvYaml(sampleYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.source.cv.name).toBe("John Doe");
    expect(parsed.source.cv.sections.length).toBeGreaterThan(0);
  });

  it("keeps invalid YAML visible as an error", () => {
    const parsed = parseCvYaml("cv: [unterminated");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.length).toBeGreaterThan(0);
  });

  it("normalizes legacy root sections and preserves evidence", () => {
    const parsed = parseCvYaml(`
meta:
  name: Legacy Person
  email: legacy@example.com
profile:
  - Builds portable tools.
experience:
  - company: Example Ltd
    position: Engineer
    technologies: [Svelte, TypeScript]
evidence:
  stories:
    - id: launch
      title: Product launch
      source_refs: ["note:launch"]
      tags: []
      useful_for: []
      evidence: {}
      answer_versions: {}
      status: ready
      visibility: internal
      notes: retained
  technologies: [Svelte]
  skills: [Delivery]
  answer_method_defaults: {}
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.source.cv.name).toBe("Legacy Person");
    expect(parsed.source.cv.sections.map((section) => section.title)).toEqual([
      "Profile",
      "Professional Experience",
    ]);
    expect(parsed.source.evidence?.stories[0]?.title).toBe("Product launch");
  });

  it("normalizes every supported experience extra-detail content type", () => {
    const parsed = parseCvYaml(`
cv:
  name: Details
  headline: Engineer
  location: London
  email: details@example.com
  phone: ""
  sections:
    - id: experience
      title: Experience
      entry_type: ExperienceEntry
      entries:
        - company: Example
          position: Engineer
          location: London
          start_date: "2024"
          end_date: present
          highlights: []
          extra_details:
            - { id: text, title: Text, content_type: text, text: Detail }
            - { id: commas, title: Commas, content_type: comma_list, items: [A, B] }
            - { id: semicolons, title: Semicolons, content_type: semicolon_list, items: [C, D] }
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const section = parsed.source.cv.sections[0];
    const entry = section?.entries[0];
    expect(typeof entry).toBe("object");
    if (!entry || typeof entry === "string" || !("extra_details" in entry)) return;
    expect(entry.extra_details?.map((detail) => detail.content_type)).toEqual([
      "text",
      "comma_list",
      "semicolon_list",
    ]);
  });
});

describe("compileCvSource", () => {
  it("emits markdown, html, typst, and RenderCV YAML", () => {
    const parsed = parseCvYaml(sampleYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const compiled = compileCvSource(parsed.source);
    expect(compiled.markdown).toContain("John Doe");
    expect(compiled.html).toContain("John Doe");
    expect(compiled.html).toContain("DM Sans Variable");
    expect(compiled.html).not.toContain("Georgia");
    expect(compiled.html).not.toContain("box-shadow:0 20px 60px");
    expect(compiled.html).toContain("article{box-sizing:border-box;margin:0;max-width:none");
    expect(compiled.typst).toContain("#import \"@preview/rendercv:0.3.0\"");
    expect(compiled.rendercvYaml).toContain("John Doe");
  });
});

describe("withHtmlPreviewFonts", () => {
  it("injects DM Sans @font-face URLs into the preview document", () => {
    const injected = withHtmlPreviewFonts(
      "<html><head></head><body></body></html>",
      { normal: "/dm-sans-normal.woff2", italic: "/dm-sans-italic.woff2" },
    );
    expect(injected).toContain('src:url("/dm-sans-normal.woff2")');
    expect(injected).toContain('src:url("/dm-sans-italic.woff2")');
  });
});
