import type { CvSource } from './types';

export type WebArtifactPipeline = 'typst';
export type TypstPreviewFormat = 'png' | 'svg';

export type WorkerArtifact = {
	id: string;
	pipeline: WebArtifactPipeline;
	filename: string;
	extension: string;
	label: string;
	mimeType: string;
	content: string | ArrayBuffer;
	text?: string;
	preview?: boolean;
	metadata?: {
		width?: number;
		height?: number;
		mimeType?: string;
		source?: string;
		previewFormat?: TypstPreviewFormat;
		pixelPerPt?: number;
		size?: number;
	};
};

export type WebArtifact = Omit<WorkerArtifact, 'content'> & {
	blob: Blob;
	objectUrl: string;
	size: number;
	version: number;
};

export type WebRenderRequest = {
	version: number;
	source: CvSource;
	previewPixelPerPt?: number;
	previewFormat?: TypstPreviewFormat;
};

export type WebRenderResponse = {
	version: number;
	artifacts: WorkerArtifact[];
	error?: string;
};

export function artifactBlob(artifact: WorkerArtifact) {
	return new Blob([artifact.content], { type: artifact.mimeType });
}

export function artifactObjectUrl(artifact: WorkerArtifact) {
	return URL.createObjectURL(artifactBlob(artifact));
}

export function downloadFilename(name: string, suffix: string, extension: string) {
	const safeName = name
		.trim()
		.replace(/[^a-z0-9]+/gi, '_')
		.replace(/^_+|_+$/g, '');
	return `${safeName || 'CV'}_${suffix}.${extension}`;
}
