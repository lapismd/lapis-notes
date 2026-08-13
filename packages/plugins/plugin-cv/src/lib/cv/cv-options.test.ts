import { describe, expect, it } from "vitest";
import {
	clampZoom,
	normalizePreviewMode,
	previewModeLabel,
	previewWidthStyle,
} from "./cv-options";

describe("cv preview options", () => {
	it("maps legacy html and typst modes onto the dropdown values", () => {
		expect(normalizePreviewMode("html")).toBe("rendercv-html");
		expect(normalizePreviewMode("typst")).toBe("rendercv");
		expect(normalizePreviewMode("rendercv-md")).toBe("rendercv-md");
	});

	it("labels Typst SVG and PNG from the selected format", () => {
		expect(previewModeLabel("rendercv", "svg")).toBe("Typst SVG");
		expect(previewModeLabel("rendercv", "png")).toBe("Typst PNG");
		expect(previewModeLabel("rendercv-html", "svg")).toBe("HTML");
	});

	it("clamps zoom and sizes the 820px document by width", () => {
		expect(clampZoom(0.1)).toBe(0.5);
		expect(clampZoom(3)).toBe(2.5);
		expect(clampZoom(0.9)).toBe(0.9);
		expect(previewWidthStyle(1)).toBe("width: min(820px, 100%);");
		expect(previewWidthStyle(0.9)).toBe("width: 738px; max-width: none;");
	});
});
