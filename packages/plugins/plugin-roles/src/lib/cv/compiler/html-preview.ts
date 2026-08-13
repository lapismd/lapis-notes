import { sourceWithoutSourceReferenceMarkers } from "../source-references";
import type { CvSource } from "../types";

function htmlEscape(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function safePreviewHref(value: string) {
	const href = value.trim();
	if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
	return '';
}

function renderInlineMarkdown(value: string) {
	let html = htmlEscape(value.trim());
	html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
		const safeHref = safePreviewHref(href);
		if (!safeHref) return label;
		return `<a href="${safeHref}" target="_blank" rel="noreferrer">${label}</a>`;
	});
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
	return html;
}

function previewMarkdownLines(markdown: string) {
	const lines = markdown.split(/\r?\n/);
	if (lines[0]?.trim() === '---') {
		const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
		if (endIndex > 0) lines.splice(0, endIndex + 1);
	}
	return lines.filter((line) => !line.trim().startsWith('<!--'));
}

function renderMarkdownHtml(markdown: string) {
	const body: string[] = [];
	const paragraph: string[] = [];
	let listType: 'ul' | 'ol' | undefined;

	function flushParagraph() {
		if (!paragraph.length) return;
		body.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br />')}</p>`);
		paragraph.length = 0;
	}

	function closeList() {
		if (!listType) return;
		body.push(`</${listType}>`);
		listType = undefined;
	}

	function openList(type: 'ul' | 'ol') {
		flushParagraph();
		if (listType === type) return;
		closeList();
		listType = type;
		body.push(`<${type}>`);
	}

	for (const line of previewMarkdownLines(markdown)) {
		const trimmed = line.trim();
		if (!trimmed) {
			flushParagraph();
			closeList();
			continue;
		}

		const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
		if (headingMatch) {
			flushParagraph();
			closeList();
			const level = headingMatch[1].length + 1;
			body.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
			continue;
		}

		const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed);
		if (bulletMatch) {
			openList('ul');
			body.push(`<li>${renderInlineMarkdown(bulletMatch[1])}</li>`);
			continue;
		}

		const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
		if (orderedMatch) {
			openList('ol');
			body.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`);
			continue;
		}

		closeList();
		paragraph.push(trimmed);
	}

	flushParagraph();
	closeList();
	return body.join('\n');
}

export function withHtmlPreviewFonts(
	html: string,
	fonts: { normal: string; italic: string },
) {
	if (!html) return html;
	const fontFace = `<style>
@font-face{font-family:"DM Sans Variable";font-style:normal;font-display:swap;font-weight:100 1000;src:url("${fonts.normal}") format("woff2-variations")}
@font-face{font-family:"DM Sans Variable";font-style:italic;font-display:swap;font-weight:100 1000;src:url("${fonts.italic}") format("woff2-variations")}
</style>`;
	if (html.includes('</head>')) return html.replace('</head>', `${fontFace}</head>`);
	return `${fontFace}${html}`;
}

export function renderHtmlPreview(source: CvSource, markdown: string) {
	source = sourceWithoutSourceReferenceMarkers(source);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${htmlEscape(source.cv.name)} CV</title>
<style>
body{font-family:"DM Sans Variable",ui-sans-serif,system-ui,sans-serif;margin:0;background:#fff;color:#111827;line-height:1.48}
article{box-sizing:border-box;margin:0;max-width:none;min-height:100vh;background:#fff;padding:0;box-shadow:none}
h1{margin:0 0 .2rem;color:#2563eb;font-size:2rem;line-height:1.1}
h2{margin:1.8rem 0 .65rem;color:#2563eb;font-size:1.15rem;line-height:1.2}
h3{margin:1.15rem 0 .35rem;font-size:1rem;line-height:1.25}
h4{margin:1rem 0 .25rem;font-size:.95rem;line-height:1.25}
p{margin:.45rem 0}
ul,ol{margin:.35rem 0 .85rem;padding-left:1.25rem}
li{margin:.25rem 0}
a{color:#1d4ed8;text-decoration:none}
a:hover{text-decoration:underline}
</style>
</head>
<body>
<article>
<header>
<h1>${htmlEscape(source.cv.name)}</h1>
</header>
${renderMarkdownHtml(markdown)}
</article>
</body>
</html>`;
}
