import { createTypstCompiler, createTypstRenderer } from '@myriaddreamin/typst.ts';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/index';
import { FetchPackageRegistry } from '@myriaddreamin/typst.ts/fs/package';
import {
	loadFonts,
	withAccessModel,
	withPackageRegistry
} from '@myriaddreamin/typst.ts/options.init';
import dmSansItalicFontUrl from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-italic.woff2?url';
import dmSansNormalFontUrl from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/wasm?url';

import { renderTypstArtifacts } from '../typst-artifacts';
import type { WebRenderRequest, WebRenderResponse } from '../web-artifacts';
import rendercvPackageUrl from '#cv-assets/vendor/typst-packages/rendercv-0.3.0.typstpkg?url';
import fontawesomePackageUrl from '#cv-assets/vendor/typst-packages/fontawesome-0.6.0.typstpkg?url';
import fontAwesomeRegularUrl from '#cv-assets/vendor/fontawesome/fontawesome-7-free-regular-400.otf?url';
import fontAwesomeSolidUrl from '#cv-assets/vendor/fontawesome/fontawesome-7-free-solid-900.otf?url';
import fontAwesomeBrandsUrl from '#cv-assets/vendor/fontawesome/fontawesome-7-brands-regular-400.otf?url';

let compilerPromise: ReturnType<typeof createCompiler> | null = null;
let rendererPromise: ReturnType<typeof createRenderer> | null = null;
const VENDORED_TYPST_PACKAGES: Record<string, string> = {
	'rendercv@0.3.0': rendercvPackageUrl,
	'fontawesome@0.6.0': fontawesomePackageUrl
};
const FONT_AWESOME_FONT_PATHS = [
	fontAwesomeRegularUrl,
	fontAwesomeSolidUrl,
	fontAwesomeBrandsUrl
];

function wasmModuleRef(url: string) {
	return { module_or_path: url } as unknown as string;
}

class VendoredPackageRegistry extends FetchPackageRegistry {
	private packageUrl(spec: { namespace: string; name: string; version: string }) {
		if (spec.namespace !== 'preview') return undefined;
		const path = VENDORED_TYPST_PACKAGES[`${spec.name}@${spec.version}`];
		if (!path) return undefined;
		return path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")
			? path
			: new URL(path, self.location.origin).href;
	}

	override resolvePath(spec: { namespace: string; name: string; version: string }) {
		return (
			this.packageUrl(spec) ??
			`about:blank#unsupported-${spec.namespace}-${spec.name}-${spec.version}`
		);
	}

	override pullPackageData(spec: { namespace: string; name: string; version: string }) {
		if (!this.packageUrl(spec)) return undefined;
		return super.pullPackageData(spec);
	}
}

async function createCompiler() {
	const compiler = createTypstCompiler();
	const accessModel = new MemoryAccessModel();
	const fontAwesomeFontUrls = FONT_AWESOME_FONT_PATHS.map((path) =>
		path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")
			? path
			: new URL(path, self.location.origin).href,
	);
	await compiler.init({
		getModule: () => wasmModuleRef(compilerWasmUrl),
		beforeBuild: [
			withAccessModel(accessModel),
			withPackageRegistry(new VendoredPackageRegistry(accessModel)),
			loadFonts([dmSansNormalFontUrl, dmSansItalicFontUrl, ...fontAwesomeFontUrls])
		]
	});
	return compiler;
}

async function createRenderer() {
	const renderer = createTypstRenderer();
	await renderer.init({ getModule: () => wasmModuleRef(rendererWasmUrl) });
	return renderer;
}

self.onmessage = async (event: MessageEvent<WebRenderRequest>) => {
	const { source, version } = event.data;
	try {
		compilerPromise ??= createCompiler();
		rendererPromise ??= createRenderer();
		const [compiler, renderer] = await Promise.all([compilerPromise, rendererPromise]);
		const artifacts = await renderTypstArtifacts({
			source,
			version,
			compiler,
			renderer,
			previewPixelPerPt: event.data.previewPixelPerPt,
			previewFormat: event.data.previewFormat ?? 'svg',
			previewRuntime: 'wasm'
		});

		self.postMessage({ version, artifacts } satisfies WebRenderResponse);
	} catch (error) {
		self.postMessage({
			version,
			artifacts: [],
			error: error instanceof Error ? error.message : String(error)
		} satisfies WebRenderResponse);
	}
};
