import type { TypstPreviewFormat } from '$lib/cv/web-artifacts';

export type CvPreviewMode = 'rendercv' | 'rendercv-typ' | 'rendercv-md' | 'rendercv-html';
export type CvPreviewModeInput = CvPreviewMode | 'html' | 'typst';
export type CvPreviewOption = {
	value: CvPreviewMode;
	label: string;
	previewFormat?: TypstPreviewFormat;
};

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;
export const PREVIEW_BASE_WIDTH = 820;

export const previewOptions: CvPreviewOption[] = [
	{ value: 'rendercv', label: 'Typst SVG', previewFormat: 'svg' },
	{ value: 'rendercv', label: 'Typst PNG', previewFormat: 'png' },
	{ value: 'rendercv-typ', label: 'Typst source' },
	{ value: 'rendercv-md', label: 'Markdown' },
	{ value: 'rendercv-html', label: 'HTML' }
];

export function normalizePreviewMode(mode: CvPreviewModeInput): CvPreviewMode {
	if (mode === 'html') return 'rendercv-html';
	if (mode === 'typst') return 'rendercv';
	return mode;
}

export function normalizePreviewFormat(
	mode: CvPreviewModeInput,
	format?: TypstPreviewFormat
): TypstPreviewFormat {
	if (format) return format;
	if (mode === 'html' || mode === 'rendercv-html') return 'svg';
	return 'svg';
}

export function previewModeLabel(
	mode: CvPreviewMode,
	format: TypstPreviewFormat
): string {
	return (
		previewOptions.find(
			(option) =>
				option.value === mode &&
				(option.previewFormat ? option.previewFormat === format : true)
		)?.label ?? 'Preview'
	);
}

export function clampZoom(next: number): number {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next.toFixed(2))));
}

export function previewWidthStyle(zoom: number): string {
	if (Math.abs(zoom - 1) < 0.01) {
		return `width: min(${PREVIEW_BASE_WIDTH}px, 100%);`;
	}
	return `width: ${Math.round(PREVIEW_BASE_WIDTH * zoom)}px; max-width: none;`;
}

export function previewPageStackWide(zoom: number): boolean {
	return zoom > 1;
}
