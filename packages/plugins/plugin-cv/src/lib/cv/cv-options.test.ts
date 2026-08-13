import { describe, expect, it } from "vitest";
import {
	clampZoom,
	ZOOM_STEP,
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

	it("clamps zoom and scales the document relative to the preview pane", () => {
		expect(clampZoom(0.1)).toBe(0.25);
		expect(clampZoom(3)).toBe(2.5);
		expect(clampZoom(0.85)).toBe(0.85);
		expect(ZOOM_STEP).toBe(0.15);
		expect(previewWidthStyle(1)).toBe("width: 100%; max-width: none;");
		expect(previewWidthStyle(0.85)).toBe("width: 85%; max-width: none;");
		expect(previewWidthStyle(1.15)).toBe("width: 115%; max-width: none;");
		expect(previewWidthStyle(1.27)).toBe("width: 127%; max-width: none;");
	});
});
