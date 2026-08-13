import type { CvSource } from '$lib/cv/types';
import type {
	TypstPreviewFormat,
	WebRenderRequest,
	WebRenderResponse,
	WorkerArtifact
} from '$lib/cv/web-artifacts';

let rendercvWorker: Worker | null = null;

function getWorker() {
	rendercvWorker ??= new Worker(new URL('./workers/rendercv.worker.js', import.meta.url), {
		type: 'module'
	});
	return rendercvWorker;
}

function resetWorker() {
	rendercvWorker?.terminate();
	rendercvWorker = null;
}

function callWorker(request: WebRenderRequest) {
	const worker = getWorker();
	return new Promise<WebRenderResponse>((resolve, reject) => {
		const onMessage = (event: MessageEvent<WebRenderResponse>) => {
			if (event.data.version !== request.version) return;
			cleanup();
			resolve(event.data);
		};
		const onError = (event: ErrorEvent) => {
			cleanup();
			resetWorker();
			reject(event.error instanceof Error ? event.error : new Error(event.message || 'Typst worker failed.'));
		};
		const onMessageError = () => {
			cleanup();
			resetWorker();
			reject(new Error('Typst worker could not clone the preview result.'));
		};
		const cleanup = () => {
			worker.removeEventListener('message', onMessage);
			worker.removeEventListener('error', onError);
			worker.removeEventListener('messageerror', onMessageError);
		};

		worker.addEventListener('message', onMessage);
		worker.addEventListener('error', onError);
		worker.addEventListener('messageerror', onMessageError);
		try {
			worker.postMessage({
				...request,
				source: JSON.parse(JSON.stringify(request.source))
			});
		} catch (error) {
			cleanup();
			reject(error instanceof Error ? error : new Error(String(error)));
		}
	});
}

export async function renderWebArtifacts(
	source: CvSource,
	version: number,
	previewPixelPerPt = 3,
	previewFormat: TypstPreviewFormat = 'svg'
) {
	const request = { source, version, previewPixelPerPt, previewFormat };
	const results = await Promise.allSettled([callWorker(request)]);
	const artifacts: WorkerArtifact[] = [];
	const errors: string[] = [];

	for (const result of results) {
		if (result.status === 'rejected') {
			errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
			continue;
		}
		artifacts.push(...result.value.artifacts);
		if (result.value.error) errors.push(result.value.error);
	}

	return { artifacts, error: errors.length ? errors.join('\n') : null };
}

export function disposeWebRenderWorkers() {
	resetWorker();
}
