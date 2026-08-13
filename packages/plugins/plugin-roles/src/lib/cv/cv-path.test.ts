import { describe, expect, it } from "vitest";
import { isCvPath } from "./cv-path";

describe("isCvPath", () => {
  it("matches exclusive compound CV extensions", () => {
    expect(isCvPath("resume.cv.yml")).toBe(true);
    expect(isCvPath("Notes/resume.cv.yaml")).toBe(true);
    expect(isCvPath("CVs/John Doe.cv.yml")).toBe(true);
  });

  it("rejects generic YAML files", () => {
    expect(isCvPath("notes.yml")).toBe(false);
    expect(isCvPath("data.yaml")).toBe(false);
    expect(isCvPath("cv.yml")).toBe(false);
    expect(isCvPath("resume.md")).toBe(false);
  });
});
