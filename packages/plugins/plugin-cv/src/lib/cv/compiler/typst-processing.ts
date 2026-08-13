import renderCvDefaults from '../generated/rendercv-defaults.json';
import type { CvSource } from '../types';
import { childRecord, mergeDesign } from './shared';
import { processExperienceEntryForTypst } from './typst-experience-processing';
import { renderCvEntry } from './rendercv-yaml';

export type RenderCvLocale = Record<string, unknown> & {
	language: string;
	last_updated: string;
	month: string;
	months: string;
	year: string;
	years: string;
	present: string;
	phrases: Record<string, string>;
	month_abbreviations: string[];
	month_names: string[];
};

export type RenderCvSettings = {
	current_date: string;
	bold_keywords: string[];
	pdf_title: string;
};

export type RenderCvSectionModel = {
	title: string;
	snakeCaseTitle: string;
	entryType: string;
	entries: Array<string | Record<string, unknown>>;
};

const DEFAULT_SETTINGS: RenderCvSettings = {
	current_date: 'today',
	bold_keywords: [],
	pdf_title: 'NAME - CV'
};

export const LOCALE_LANGUAGE_CODES: Record<string, string> = {
	arabic: 'ar',
	danish: 'da',
	dutch: 'nl',
	english: 'en',
	french: 'fr',
	german: 'de',
	hebrew: 'he',
	hindi: 'hi',
	hungarian: 'hu',
	indonesian: 'id',
	italian: 'it',
	japanese: 'ja',
	korean: 'ko',
	mandarin_chinese: 'zh',
	norwegian_bokmål: 'nb',
	norwegian_nynorsk: 'nn',
	persian: 'fa',
	portuguese: 'pt',
	russian: 'ru',
	spanish: 'es',
	turkish: 'tr',
	vietnamese: 'vi'
};

export const RTL_LANGUAGES = new Set(['arabic', 'hebrew', 'persian']);

export const FONT_AWESOME_ICONS: Record<string, string> = {
	LinkedIn: 'linkedin',
	GitHub: 'github',
	GitLab: 'gitlab',
	IMDB: 'imdb',
	Instagram: 'instagram',
	Mastodon: 'mastodon',
	ORCID: 'orcid',
	StackOverflow: 'stack-overflow',
	ResearchGate: 'researchgate',
	YouTube: 'youtube',
	'Google Scholar': 'graduation-cap',
	Telegram: 'telegram',
	WhatsApp: 'whatsapp',
	Leetcode: 'code',
	X: 'x-twitter',
	Bluesky: 'bluesky',
	Reddit: 'reddit',
	location: 'location-dot',
	email: 'envelope',
	phone: 'phone',
	website: 'link'
};

export const SOCIAL_URL_PREFIXES: Record<string, string> = {
	LinkedIn: 'https://linkedin.com/in/',
	GitHub: 'https://github.com/',
	GitLab: 'https://gitlab.com/',
	IMDB: 'https://imdb.com/name/',
	Instagram: 'https://instagram.com/',
	ORCID: 'https://orcid.org/',
	StackOverflow: 'https://stackoverflow.com/users/',
	ResearchGate: 'https://researchgate.net/profile/',
	YouTube: 'https://youtube.com/@',
	'Google Scholar': 'https://scholar.google.com/citations?user=',
	Telegram: 'https://t.me/',
	WhatsApp: 'https://wa.me/',
	Leetcode: 'https://leetcode.com/u/',
	X: 'https://x.com/',
	Bluesky: 'https://bsky.app/profile/',
	Reddit: 'https://reddit.com/user/'
};

const TYPOST_COMMAND_OR_MATH = /(\$\$.*?\$\$)|#([A-Za-z][^\s()[\]]*)(\([^)]*\))?(\[[^\]]*\])?/g;
const UPPERCASE_WORD = /\b[A-Z_]+\b/g;

export function stringValue(value: unknown, fallback = '') {
	return typeof value === 'string' ? value : fallback;
}

export function booleanValue(value: unknown, fallback = false) {
	return typeof value === 'boolean' ? value : fallback;
}

export function arrayValue<T = unknown>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

export function resolveLocale(source: CvSource): RenderCvLocale {
	const language = stringValue(source.locale?.language, 'english');
	const locales = renderCvDefaults.locales as Record<string, RenderCvLocale>;
	const defaults = locales[language] ?? locales.english;
	return mergeDesign(defaults, source.locale ?? {}) as RenderCvLocale;
}

export function resolveSettings(source: CvSource): RenderCvSettings {
	return mergeDesign(DEFAULT_SETTINGS, source.settings ?? {}) as RenderCvSettings;
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function substitutePlaceholders(value: string, placeholders: Record<string, string>) {
	const keys = Object.keys(placeholders).sort((a, b) => b.length - a.length);
	if (!keys.length) return value.trim();
	return value
		.replace(
			new RegExp(`(${keys.map(escapeRegExp).join('|')})`, 'g'),
			(match) => placeholders[match] ?? match
		)
		.trim();
}

export function makeKeywordsBold(value: string, keywords: string[]) {
	const cleaned = keywords.map((keyword) => keyword.trim()).filter(Boolean);
	if (!cleaned.length) return value;
	const pattern = new RegExp(
		`\\b(${cleaned
			.sort((a, b) => b.length - a.length)
			.map(escapeRegExp)
			.join('|')})\\b`,
		'g'
	);
	return value.replace(pattern, '**$1**');
}

export function typstStringContent(value: string) {
	return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function escapeTypstCharacters(value: string) {
	if (value === '\n') return value;
	const preserved = new Map<string, string>();
	let index = 0;
	const withPlaceholders = value.replace(TYPOST_COMMAND_OR_MATH, (match) => {
		const key = `RENDERCVTYPSTCOMMANDORMATH${index++}`;
		preserved.set(key, match.replaceAll('$$', '$'));
		return key;
	});
	let escaped = withPlaceholders
		.replaceAll('\\', '\\\\')
		.replaceAll('[', '\\[')
		.replaceAll(']', '\\]')
		.replaceAll('"', '\\"')
		.replaceAll('#', '\\#')
		.replaceAll('$', '\\$')
		.replaceAll('@', '\\@')
		.replaceAll('%', '\\%')
		.replaceAll('~', '\\~')
		.replaceAll('_', '\\_')
		.replaceAll('/', '\\/')
		.replaceAll('>', '\\>')
		.replaceAll('<', '\\<')
		.replaceAll('* ', '#sym.ast.basic ')
		.replaceAll('*', '#sym.ast.basic#h(0pt, weak: true) ');
	for (const [key, preservedValue] of preserved) {
		escaped = escaped.replaceAll(key, preservedValue);
	}
	return escaped;
}

function findClosing(value: string, start: number, marker: string) {
	const index = value.indexOf(marker, start);
	return index === -1 ? null : index;
}

function parseMarkdownInline(value: string): string {
	let output = '';
	let index = 0;
	while (index < value.length) {
		if (value.startsWith('**', index)) {
			const end = findClosing(value, index + 2, '**');
			if (end !== null) {
				output += `#strong[${parseMarkdownInline(value.slice(index + 2, end))}]`;
				index = end + 2;
				continue;
			}
		}
		if (value[index] === '*') {
			const end = findClosing(value, index + 1, '*');
			if (end !== null) {
				output += `#emph[${parseMarkdownInline(value.slice(index + 1, end))}]`;
				index = end + 1;
				continue;
			}
		}
		if (value[index] === '[') {
			const labelEnd = findClosing(value, index + 1, ']');
			if (labelEnd !== null && value[labelEnd + 1] === '(') {
				const urlEnd = findClosing(value, labelEnd + 2, ')');
				if (urlEnd !== null) {
					const label = parseMarkdownInline(value.slice(index + 1, labelEnd));
					const url = value.slice(labelEnd + 2, urlEnd);
					output += `#link("${typstStringContent(url)}")[${label}]`;
					index = urlEnd + 1;
					continue;
				}
			}
		}
		if (value[index] === '`') {
			const end = findClosing(value, index + 1, '`');
			if (end !== null) {
				output += `\`${value.slice(index + 1, end)}\``;
				index = end + 1;
				continue;
			}
		}
		const nextSpecials = ['**', '*', '[', '`']
			.map((marker) => value.indexOf(marker, index + 1))
			.filter((position) => position !== -1);
		const next = nextSpecials.length ? Math.min(...nextSpecials) : value.length;
		output += escapeTypstCharacters(value.slice(index, next));
		index = next;
	}
	return output;
}

export function markdownToTypst(value: string) {
	const lines = value.split('\n');
	const result: string[] = [];
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.startsWith('!!!')) {
			const summaryLines: string[] = [];
			while (index + 1 < lines.length && lines[index + 1].startsWith('    ')) {
				index += 1;
				summaryLines.push(lines[index].slice(4));
			}
			result.push(`#summary[${summaryLines.map(parseMarkdownInline).join(' \\ ')}]`);
		} else {
			result.push(parseMarkdownInline(line.trimStart()));
		}
	}
	return result.join('\n');
}

export function processString(value: string | undefined, settings: RenderCvSettings) {
	if (value === undefined) return undefined;
	return markdownToTypst(makeKeywordsBold(value, settings.bold_keywords));
}

function dateParts(date: Date) {
	return {
		MONTH_NAME: '',
		MONTH_ABBREVIATION: '',
		MONTH: String(date.getMonth() + 1),
		MONTH_IN_TWO_DIGITS: String(date.getMonth() + 1).padStart(2, '0'),
		DAY: String(date.getDate()),
		DAY_IN_TWO_DIGITS: String(date.getDate()).padStart(2, '0'),
		YEAR: String(date.getFullYear()),
		YEAR_IN_TWO_DIGITS: String(date.getFullYear()).slice(-2)
	};
}

export function buildDatePlaceholders(date: Date, locale: RenderCvLocale) {
	const parts = dateParts(date);
	return {
		...parts,
		MONTH_NAME: locale.month_names[date.getMonth()] ?? parts.MONTH_NAME,
		MONTH_ABBREVIATION: locale.month_abbreviations[date.getMonth()] ?? parts.MONTH_ABBREVIATION
	};
}

function parseDate(value: unknown, currentDate?: Date): Date | null {
	if (typeof value === 'number') return new Date(value, 0, 1);
	if (typeof value !== 'string') return null;
	if (/^\d{4}$/.test(value)) return new Date(Number(value), 0, 1);
	const yearMonth = /^(\d{4})-(\d{2})$/.exec(value);
	if (yearMonth) return new Date(Number(yearMonth[1]), Number(yearMonth[2]) - 1, 1);
	const yearMonthDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (yearMonthDay) {
		return new Date(Number(yearMonthDay[1]), Number(yearMonthDay[2]) - 1, Number(yearMonthDay[3]));
	}
	if (value === 'present') return currentDate ?? new Date();
	return null;
}

export function resolvedCurrentDate(settings: RenderCvSettings) {
	const parsed = parseDate(settings.current_date);
	return parsed ?? new Date();
}

export function dateObjectToString(date: Date, locale: RenderCvLocale, template: string) {
	return substitutePlaceholders(template, buildDatePlaceholders(date, locale));
}

function formatSingleDate(value: unknown, locale: RenderCvLocale, template: string) {
	if (value === 'present') return locale.present;
	const parsed = parseDate(value);
	return parsed ? dateObjectToString(parsed, locale, template) : String(value ?? '');
}

function formatDateRange(
	startDate: unknown,
	endDate: unknown,
	locale: RenderCvLocale,
	singleDateTemplate: string,
	dateRangeTemplate: string
) {
	const start = formatSingleDate(startDate, locale, singleDateTemplate);
	const end =
		endDate === 'present' ? locale.present : formatSingleDate(endDate, locale, singleDateTemplate);
	return substitutePlaceholders(dateRangeTemplate, { START_DATE: start, END_DATE: end });
}

function computeTimeSpanString(
	startDate: unknown,
	endDate: unknown,
	locale: RenderCvLocale,
	currentDate: Date,
	timeSpanTemplate: string
) {
	const start = parseDate(startDate, currentDate);
	const end = parseDate(endDate, currentDate);
	if (!start || !end) return '';
	const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000);
	let years: string | number = Math.floor(days / 365);
	let months: string | number = Math.floor((days % 365) / 30) + 1;
	years = Number(years) + Math.floor(Number(months) / 12);
	months = Number(months) % 12;
	const yearLabel = years === 0 ? '' : years === 1 ? locale.year : locale.years;
	const monthLabel = months === 0 ? '' : months === 1 ? locale.month : locale.months;
	return substitutePlaceholders(timeSpanTemplate, {
		HOW_MANY_YEARS: years === 0 ? '' : String(years),
		YEARS: yearLabel,
		HOW_MANY_MONTHS: months === 0 ? '' : String(months),
		MONTHS: monthLabel
	});
}

function processDateField(
	entry: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	design: Record<string, unknown>,
	showTimeSpan: boolean
) {
	const templates = childRecord(design, 'templates');
	const singleDateTemplate = stringValue(templates.single_date, 'MONTH_ABBREVIATION YEAR');
	if (entry.date !== undefined && entry.date !== '') {
		return formatSingleDate(entry.date, locale, singleDateTemplate);
	}
	if (entry.start_date !== undefined && entry.end_date !== undefined) {
		const range = formatDateRange(
			entry.start_date,
			entry.end_date,
			locale,
			singleDateTemplate,
			stringValue(templates.date_range, 'START_DATE – END_DATE')
		);
		if (!showTimeSpan) return range;
		const span = computeTimeSpanString(
			entry.start_date,
			entry.end_date,
			locale,
			resolvedCurrentDate(settings),
			stringValue(templates.time_span, 'HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS')
		);
		return span ? `${range}\n\n${span}` : range;
	}
	return '';
}

function normalizeEntryDates(entry: Record<string, unknown>) {
	const normalized = { ...entry };
	if (normalized.date !== undefined && normalized.date !== '') {
		delete normalized.start_date;
		delete normalized.end_date;
	} else if (normalized.start_date === undefined && normalized.end_date !== undefined) {
		normalized.date = normalized.end_date;
		delete normalized.end_date;
	} else if (normalized.start_date !== undefined && normalized.end_date === undefined) {
		normalized.end_date = 'present';
	}
	return normalized;
}

function processHighlights(highlights: string[]) {
	return highlights.map((highlight) => `- ${highlight.replaceAll(' - ', '\n  - ')}`).join('\n');
}

function processSummary(summary: string) {
	return `!!! summary\n${summary
		.split('\n')
		.map((line) => `    ${line}`)
		.join('\n')}`;
}

export function cleanUrl(value: unknown) {
	const url = String(value ?? '').replace(/^https?:\/\//, '');
	return url.endsWith('/') ? url.slice(0, -1) : url;
}

function processUrl(entry: Record<string, unknown>) {
	if (typeof entry.doi === 'string' && entry.doi)
		return `[${entry.doi}](https://doi.org/${entry.doi})`;
	if (typeof entry.url === 'string' && entry.url) return `[${cleanUrl(entry.url)}](${entry.url})`;
	return '';
}

function removeConnectorsOfMissingPlaceholders(template: string, missing: Set<string>) {
	const tokens = template.split(/(\b[A-Z_]+\b)/);
	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (/^\b[A-Z_]+\b$/.test(token)) continue;
		const previous = [...tokens.slice(0, index)]
			.reverse()
			.find((part) => /^\b[A-Z_]+\b$/.test(part));
		const next = tokens.slice(index + 1).find((part) => /^\b[A-Z_]+\b$/.test(part));
		if (previous && next && (missing.has(previous) || missing.has(next))) {
			tokens[index] = token.replace(/(?<=\s)(?![A-Z])[^\W\d_]\S*(?=\s)/gu, '');
		}
	}
	return tokens.join('');
}

function cleanTrailingParts(value: string) {
	return value
		.split('\n')
		.map((line) => line.trimEnd())
		.filter(Boolean)
		.map((line) => line.replace(/[^A-Za-z0-9.!?[\]()*_%]+$/, '').trimEnd())
		.join('\n');
}

function removeNotProvidedPlaceholders(
	templates: Record<string, string>,
	fields: Record<string, unknown>
) {
	const placeholders = new Set(Object.values(templates).join(' ').match(UPPERCASE_WORD) ?? []);
	const missing = new Set([...placeholders].filter((placeholder) => !(placeholder in fields)));
	if (!missing.size) return templates;
	const missingPattern = new RegExp(`\\S*(?:${[...missing].map(escapeRegExp).join('|')})\\S*`, 'g');
	return Object.fromEntries(
		Object.entries(templates).map(([key, value]) => [
			key,
			cleanTrailingParts(
				removeConnectorsOfMissingPlaceholders(value, missing)
					.replace(/ {2,}/g, ' ')
					.replace(missingPattern, '')
					.replace(/ {2,}/g, ' ')
			)
		])
	);
}

function entryTemplateName(entryType: string) {
	return entryType.replace(/(?<!^)(?=[A-Z])/g, '_').toLowerCase();
}

function processEntryForTypst(
	entryType: string,
	entry: string | Record<string, unknown>,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	showTimeSpan: boolean
) {
	if (typeof entry === 'string') return processString(entry, settings) ?? '';
	const templatesRoot = childRecord(design, 'templates');
	const templateName = entryTemplateName(entryType);
	const entryTemplates = childRecord(templatesRoot, templateName);
	const normalized = normalizeEntryDates(entry);
	const fields: Record<string, unknown> = Object.fromEntries(
		Object.entries(normalized)
			.filter(([, value]) => value !== null && value !== undefined && value !== '')
			.map(([key, value]) => [key.toUpperCase(), value])
	);

	if (!Object.keys(entryTemplates).length) {
		return Object.fromEntries(
			Object.entries(normalized).map(([key, value]) => [
				key,
				typeof value === 'string' ? processString(value, settings) : value
			])
		);
	}

	let templates = Object.fromEntries(
		Object.entries(entryTemplates)
			.filter(([, value]) => value !== null && value !== undefined)
			.map(([key, value]) => [key, String(value)])
	);
	for (const [phraseName, phraseTemplate] of Object.entries(locale.phrases ?? {})) {
		const placeholder = phraseName.toUpperCase();
		templates = Object.fromEntries(
			Object.entries(templates).map(([key, value]) => [
				key,
				value.replaceAll(placeholder, phraseTemplate)
			])
		);
	}
	if ('HIGHLIGHTS' in fields)
		fields.HIGHLIGHTS = processHighlights(arrayValue<string>(fields.HIGHLIGHTS));
	if ('AUTHORS' in fields) fields.AUTHORS = arrayValue<string>(fields.AUTHORS).join(', ');
	if ('DATE' in fields || 'START_DATE' in fields || 'END_DATE' in fields) {
		fields.DATE = processDateField(normalized, locale, settings, design, showTimeSpan);
	}
	if ('START_DATE' in fields) {
		fields.START_DATE = formatSingleDate(
			normalized.start_date,
			locale,
			stringValue(templatesRoot.single_date, 'MONTH_ABBREVIATION YEAR')
		);
	}
	if ('END_DATE' in fields) {
		fields.END_DATE = formatSingleDate(
			normalized.end_date,
			locale,
			stringValue(templatesRoot.single_date, 'MONTH_ABBREVIATION YEAR')
		);
	}
	if ('URL' in fields) fields.URL = processUrl(normalized);
	if ('DOI' in fields) {
		fields.URL = processUrl(normalized);
		fields.DOI = processUrl(normalized);
	}
	if ('SUMMARY' in fields) {
		const summaryIsStandalone = Object.values(templates).some((template) =>
			template.split('\n').some((line) => line.trim() === 'SUMMARY')
		);
		if (summaryIsStandalone) fields.SUMMARY = processSummary(String(fields.SUMMARY));
	}

	templates = removeNotProvidedPlaceholders(templates, fields);
	const substitutedTemplates = Object.fromEntries(
		Object.entries(templates).map(([key, value]) => [
			key,
			substitutePlaceholders(
				value,
				Object.fromEntries(
					Object.entries(fields).map(([field, fieldValue]) => [field, String(fieldValue)])
				)
			)
		])
	);
	const merged = { ...normalized, ...substitutedTemplates };
	return Object.fromEntries(
		Object.entries(merged).map(([key, value]) => [
			key,
			typeof value === 'string' &&
			key !== 'start_date' &&
			key !== 'end_date' &&
			key !== 'doi' &&
			key !== 'url'
				? processString(value, settings)
				: value
		])
	);
}

function snakeCaseSectionTitle(value: string) {
	return value.toLowerCase().replaceAll(' ', '_');
}

export function processedSections(
	source: CvSource,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings
): RenderCvSectionModel[] {
	const sectionsConfig = childRecord(design, 'sections');
	const showTimeSpansIn = new Set(arrayValue<string>(sectionsConfig.show_time_spans_in));
	return source.cv.sections.map((section) => {
		const title = processString(section.title, settings) ?? section.title;
		const snakeCaseTitle = snakeCaseSectionTitle(section.title);
		const showTimeSpan = showTimeSpansIn.has(snakeCaseTitle);
		return {
			title,
			snakeCaseTitle,
			entryType: section.entry_type,
			entries:
				section.entry_type === 'ExperienceEntry'
					? section.entries.flatMap((entry) =>
							processExperienceEntryForTypst(
								section,
								entry,
								design,
								locale,
								settings,
								showTimeSpan,
								{
									processDateField,
									processEntryForTypst,
									processHighlights,
									processString,
									processSummary
								}
							)
						)
					: section.entries.map((entry) =>
							processEntryForTypst(
								section.entry_type,
								renderCvEntry(section, entry) as string | Record<string, unknown>,
								design,
								locale,
								settings,
								showTimeSpan
							)
						)
		};
	});
}
