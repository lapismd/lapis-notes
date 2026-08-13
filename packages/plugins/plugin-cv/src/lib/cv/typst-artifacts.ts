import { CompileFormatEnum } from '@myriaddreamin/typst.ts/compiler';

import { compileCvSource } from './compile';
import type { CvSource } from './types';
import type { TypstPreviewFormat, WorkerArtifact } from './web-artifacts';
import { downloadFilename } from './web-artifacts';

type TypstCompilerLike = {
	addSource(path: string, source: string): void;
	compile(options: {
		mainFilePath: string;
		format: CompileFormatEnum;
		diagnostics: 'unix';
	}): Promise<{ result?: Uint8Array; diagnostics?: unknown }>;
};

type TypstRendererLike = {
	renderSvg(options: any): Promise<string>;
	renderSvgDiff(options: any): string;
	runWithSession<T>(
		options: any,
		callback: (session: TypstRenderSessionLike) => Promise<T> | T
	): Promise<T>;
};

type TypstRenderSessionLike = {
	retrievePagesInfo(): Array<{ pageOffset: number; width: number; height: number }>;
};

type PagePreviewArtifact = Pick<
	WorkerArtifact,
	'extension' | 'mimeType' | 'content' | 'text' | 'metadata'
> & {
	index: number;
};

export type RenderTypstArtifactOptions = {
	source: CvSource;
	version: number;
	compiler: TypstCompilerLike;
	renderer: TypstRendererLike;
	filenameBase?: string;
	previewPixelPerPt?: number;
	previewFormat?: TypstPreviewFormat;
	previewRuntime?: 'wasm' | 'backend';
};

const DEFAULT_PREVIEW_PIXEL_PER_PT = 3;
const MIN_PREVIEW_PIXEL_PER_PT = 3;
const MAX_PREVIEW_PIXEL_PER_PT = 4;

function bytesBuffer(bytes: Uint8Array) {
	const copy = new Uint8Array(bytes);
	return copy.buffer;
}

export function diagnosticsText(diagnostics: unknown) {
	if (!diagnostics) return '';
	if (Array.isArray(diagnostics)) return diagnostics.map((item) => String(item)).join('\n');
	return String(diagnostics);
}

export function normalizePageSvg(
	svg: string,
	page: { width: number; height: number },
	options: { pageTop: number; clipId: string }
) {
	const trimmed = svgContent(svg);
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:h5="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}" style="overflow: hidden;"><defs><clipPath id="${options.clipId}"><rect x="0" y="0" width="${page.width}" height="${page.height}"/></clipPath></defs><g clip-path="url(#${options.clipId})"><g transform="translate(0 ${-options.pageTop})">${trimmed}</g></g></svg>`;
}

export function svgContent(svg: string) {
	const trimmed = svg.trim();
	const openEnd = trimmed.indexOf('>');
	const closeStart = trimmed.lastIndexOf('</svg>');
	if (!trimmed.startsWith('<svg') || openEnd < 0 || closeStart < openEnd) return trimmed;
	return trimmed.slice(openEnd + 1, closeStart).trim();
}

function findTagEnd(content: string, start: number) {
	const end = content.indexOf('>', start);
	return end < 0 ? content.length : end + 1;
}

function findPageGroupEnd(content: string, start: number) {
	const tagPattern = /<\/?g\b[^>]*>/g;
	tagPattern.lastIndex = start;
	let depth = 0;
	let match: RegExpExecArray | null;
	while ((match = tagPattern.exec(content))) {
		const tag = match[0];
		if (tag.startsWith('</')) {
			depth -= 1;
			if (depth === 0) return tagPattern.lastIndex;
			continue;
		}
		if (!tag.endsWith('/>')) depth += 1;
	}
	return content.length;
}

function splitTypstSvgPages(svg: string, expectedPages: number) {
	const content = svgContent(svg);
	const pageStarts = [...content.matchAll(/<g\b[^>]*class="typst-page"[^>]*>/g)].map(
		(match) => match.index ?? -1
	);
	if (pageStarts.length !== expectedPages || pageStarts.some((index) => index < 0)) return [];

	const sharedContent = content.slice(0, pageStarts[0]).trim();
	return pageStarts.map((start) => {
		const pageGroup = content.slice(start, findPageGroupEnd(content, start));
		return `${sharedContent}${pageGroup}`;
	});
}

async function blobBuffer(blob: Blob) {
	return await blob.arrayBuffer();
}

function previewScale(value: number | undefined) {
	return Math.min(
		MAX_PREVIEW_PIXEL_PER_PT,
		Math.max(MIN_PREVIEW_PIXEL_PER_PT, Math.round(value ?? DEFAULT_PREVIEW_PIXEL_PER_PT))
	);
}

function svgPageTop(pages: Array<{ height: number }>, index: number) {
	return pages.slice(0, index).reduce((total, page) => total + page.height, 0);
}

export async function renderTypstArtifacts({
	source,
	version,
	compiler,
	renderer,
	filenameBase = source.cv.name || 'CV',
	previewPixelPerPt,
	previewFormat = 'svg',
	previewRuntime = 'wasm'
}: RenderTypstArtifactOptions): Promise<WorkerArtifact[]> {
	const compiled = compileCvSource(source);
	const mainFilePath = `/cv-studio-${version}.typ`;
	const artifacts: WorkerArtifact[] = [
		{
			id: 'typst-source',
			pipeline: 'typst',
			filename: downloadFilename(filenameBase, 'typst', 'typ'),
			extension: 'typ',
			label: 'Typst source',
			mimeType: 'text/plain;charset=utf-8',
			content: compiled.typst,
			text: compiled.typst
		},
		{
			id: 'rendercv-yaml',
			pipeline: 'typst',
			filename: downloadFilename(filenameBase, 'rendercv', 'yaml'),
			extension: 'yaml',
			label: 'RenderCV YAML',
			mimeType: 'application/yaml;charset=utf-8',
			content: compiled.rendercvYaml,
			text: compiled.rendercvYaml
		},
		{
			id: 'typst-md',
			pipeline: 'typst',
			filename: downloadFilename(filenameBase, 'typst', 'md'),
			extension: 'md',
			label: 'Markdown',
			mimeType: 'text/markdown;charset=utf-8',
			content: compiled.markdown,
			text: compiled.markdown
		},
		{
			id: 'typst-html',
			pipeline: 'typst',
			filename: downloadFilename(filenameBase, 'typst', 'html'),
			extension: 'html',
			label: 'HTML',
			mimeType: 'text/html;charset=utf-8',
			content: compiled.html,
			text: compiled.html
		}
	];

	compiler.addSource(mainFilePath, compiled.typst);

	const pdfResult = await compiler.compile({
		mainFilePath,
		format: CompileFormatEnum.pdf,
		diagnostics: 'unix'
	});
	if (!pdfResult.result) {
		throw new Error(diagnosticsText(pdfResult.diagnostics) || 'Typst did not return a PDF.');
	}

	const vectorResult = await compiler.compile({
		mainFilePath,
		format: CompileFormatEnum.vector,
		diagnostics: 'unix'
	});
	if (!vectorResult.result) {
		throw new Error(
			diagnosticsText(vectorResult.diagnostics) || 'Typst did not return preview data.'
		);
	}

	const scale = previewScale(previewPixelPerPt);
	const shouldRenderPng = previewFormat === 'png' && typeof OffscreenCanvas !== 'undefined';
	const pagePreviews = await renderer.runWithSession(
		{ format: 'vector', artifactContent: vectorResult.result },
		async (session) => {
			const pages = session.retrievePagesInfo();
			if (!shouldRenderPng) {
				const renderedSvg = await renderer.renderSvg({
					renderSession: session,
					data_selection: { body: true, defs: true, css: true, js: false }
				});
				const pageSvgs = splitTypstSvgPages(renderedSvg, pages.length);
				return pages.map((page, index) => {
					const pageTop = svgPageTop(pages, index);
					const normalizedSvg = normalizePageSvg(pageSvgs[index] ?? renderedSvg, page, {
						pageTop,
						clipId: `cvstudio-page-${version}-${index + 1}`
					});
					return {
						index,
						extension: 'svg',
						mimeType: 'image/svg+xml;charset=utf-8',
						content: normalizedSvg,
						text: normalizedSvg,
						metadata: {
							width: page.width,
							height: page.height,
							mimeType: 'image/svg+xml;charset=utf-8',
							source: `${previewRuntime}-typst-svg`,
							previewFormat: 'svg' as const
						}
					};
				});
			}

			const previews: PagePreviewArtifact[] = [];
			for (const [index, page] of pages.entries()) {
				const canvas = new OffscreenCanvas(
					Math.ceil(page.width * scale),
					Math.ceil(page.height * scale)
				);
				const context = canvas.getContext('2d');
				if (!context) throw new Error('Could not create preview canvas context.');
				await (
					renderer as TypstRendererLike & {
						renderCanvas(options: any): Promise<unknown>;
					}
				).renderCanvas({
					renderSession: session,
					canvas: context as unknown as CanvasRenderingContext2D,
					pageOffset: index,
					backgroundColor: '#ffffff',
					pixelPerPt: scale,
					dataSelection: { body: true }
				});
				const blob = await canvas.convertToBlob({ type: 'image/png' });
				previews.push({
					index,
					extension: 'png',
					mimeType: 'image/png',
					content: await blobBuffer(blob),
					metadata: {
						width: canvas.width,
						height: canvas.height,
						mimeType: 'image/png',
						source: `${previewRuntime}-typst`,
						previewFormat: 'png',
						pixelPerPt: scale,
						size: blob.size
					}
				});
			}
			return previews;
		}
	);

	artifacts.unshift({
		id: 'typst-pdf',
		pipeline: 'typst',
		filename: downloadFilename(filenameBase, 'typst', 'pdf'),
		extension: 'pdf',
		label: 'Typst PDF',
		mimeType: 'application/pdf',
		content: bytesBuffer(pdfResult.result)
	});
	artifacts.unshift(
		...pagePreviews.map((preview) => ({
			id: `typst-page-${preview.index + 1}`,
			pipeline: 'typst' as const,
			filename: downloadFilename(
				filenameBase,
				`typst_page_${preview.index + 1}`,
				preview.extension
			),
			extension: preview.extension,
			label: `Typst preview page ${preview.index + 1}`,
			mimeType: preview.mimeType,
			content: preview.content,
			text: preview.text,
			metadata: preview.metadata,
			preview: true
		}))
	);

	return artifacts;
}
