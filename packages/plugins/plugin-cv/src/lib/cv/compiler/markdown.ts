import { sourceWithoutSourceReferenceMarkers } from '../source-references';
import type {
	CvEntry,
	CvSection,
	CvSource,
	EducationEntry,
	ExperienceEntry,
	NormalEntry,
	PublicationEntry
} from '../types';
import {
	compactContact,
	entryDate,
	extraDetailLines,
	isRecord,
	markdownLink,
	roleHistoryEntries,
	roleHistoryText
} from './shared';

function yamlQuote(value: string) {
	return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function yamlFrontMatter(source: CvSource) {
	const date = new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(new Date());
	return [
		'---',
		`title: ${yamlQuote(source.cv.name)}`,
		`subtitle: ${yamlQuote(source.cv.headline)}`,
		`date: ${yamlQuote(date)}`,
		'lang: en-GB',
		'geometry: "margin=0.65in"',
		'---',
		''
	].join('\n');
}

function bullet(text: string) {
	return `- ${text}`;
}

function renderMarkdownEntry(section: CvSection, entry: CvEntry): string[] {
	if (section.entry_type === 'TextEntry') return [String(entry), ''];
	if (!isRecord(entry)) return [String(entry), ''];
	const record = entry as Record<string, unknown>;

	if (section.entry_type === 'OneLineEntry') {
		return [`**${String(record.label ?? '')}:** ${String(record.details ?? '')}`, ''];
	}
	if (section.entry_type === 'BulletEntry') return [bullet(String(record.bullet ?? ''))];
	if (section.entry_type === 'NumberedEntry') return [`1. ${String(record.number ?? '')}`];
	if (section.entry_type === 'ReversedNumberedEntry') {
		return [`1. ${String(record.reversed_number ?? '')}`];
	}
	if (section.entry_type === 'ExperienceEntry') {
		const experience = entry as ExperienceEntry;
		const lines = [`## ${experience.company ?? ''} - ${experience.position ?? ''}`, ''];
		const details = [experience.location, entryDate(experience)].filter(Boolean).join(' | ');
		if (details) lines.push(`**${details}**`, '');
		if (experience.summary) lines.push(experience.summary, '');
		const roleHistory = roleHistoryEntries(experience);
		if (roleHistory.length) {
			lines.push(...roleHistory.map((item) => bullet(roleHistoryText(item))), '');
		}
		for (const detail of extraDetailLines(experience)) lines.push(detail, '');
		lines.push(...(experience.highlights ?? []).map((item) => bullet(item)), '');
		return lines;
	}
	if (section.entry_type === 'EducationEntry') {
		const education = entry as EducationEntry;
		const lines = [`## ${education.institution ?? ''}`, ''];
		const degreeLine = [education.degree, education.area].filter(Boolean).join(' in ');
		const details = [degreeLine, entryDate(education), education.location]
			.filter(Boolean)
			.join(' | ');
		if (details) lines.push(`**${details}**`, '');
		if (education.summary) lines.push(education.summary, '');
		lines.push(...(education.highlights ?? []).map((item) => bullet(item)), '');
		return lines;
	}
	if (section.entry_type === 'PublicationEntry') {
		const publication = entry as PublicationEntry;
		const lines = [`## ${publication.title ?? ''}`, ''];
		if (publication.authors?.length) lines.push(publication.authors.join(', '), '');
		const details = [publication.journal, entryDate(publication)].filter(Boolean).join(' | ');
		if (details) lines.push(`**${details}**`, '');
		if (publication.doi) lines.push(`DOI: ${publication.doi}`, '');
		if (publication.url) lines.push(publication.url, '');
		if (publication.summary) lines.push(publication.summary, '');
		return lines;
	}

	const normal = entry as NormalEntry;
	const name = markdownLink(String(normal.name ?? ''), normal.url);
	const lines = [`## ${name}`, ''];
	const details = [entryDate(normal), normal.location].filter(Boolean).join(' | ');
	if (details) lines.push(`**${details}**`, '');
	if (normal.summary) lines.push(normal.summary, '');
	lines.push(...(normal.highlights ?? []).map((item) => bullet(item)), '');
	return lines;
}

export function renderMarkdown(source: CvSource) {
	source = sourceWithoutSourceReferenceMarkers(source);
	const lines: string[] = [
		yamlFrontMatter(source),
		'<!-- Generated from data/cv.yml. Edit data/cv.yml, then run `make sync`. -->',
		'',
		`**${source.cv.headline}**  `,
		compactContact(source, true),
		''
	];

	for (const section of source.cv.sections) {
		lines.push(`# ${section.title}`, '');
		for (const entry of section.entries ?? []) lines.push(...renderMarkdownEntry(section, entry));
		if (lines.at(-1) !== '') lines.push('');
	}

	return `${lines.join('\n').trimEnd()}\n`;
}
