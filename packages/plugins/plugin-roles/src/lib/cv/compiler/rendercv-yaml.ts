import YAML from 'yaml';

import { sourceWithoutSourceReferenceMarkers } from '../source-references';
import type {
	CvEntry,
	CvSection,
	CvSource,
	EducationEntry,
	ExperienceEntry,
	NormalEntry,
	PublicationEntry,
	SocialNetwork
} from '../types';
import {
	DEFAULT_RENDERCV_DESIGN,
	compactEntry,
	entryDate,
	extraDetailLines,
	isRecord,
	markdownLink,
	roleHistoryLines
} from './shared';

const RENDERCV_SCHEMA_COMMENT =
	'# yaml-language-server: $schema=https://github.com/rendercv/rendercv/blob/main/schema.json?raw=true\n';

type RenderCvYamlEntry = string | Record<string, unknown>;

export function renderCvEntry(section: CvSection, entry: CvEntry): RenderCvYamlEntry {
	if (section.entry_type === 'TextEntry') return String(entry);
	if (!isRecord(entry)) return String(entry);
	const record = entry as Record<string, unknown>;
	if (section.entry_type === 'ExperienceEntry') {
		const experience = entry as ExperienceEntry;
		const summary = [experience.summary, ...extraDetailLines(experience)]
			.filter(Boolean)
			.join('\n\n');
		return compactEntry({
			company: experience.company ?? '',
			position: experience.position ?? '',
			location: experience.location,
			date: experience.date || experience.display_date,
			start_date: experience.start_date,
			end_date: experience.end_date,
			summary,
			highlights: [...roleHistoryLines(experience), ...(experience.highlights ?? [])]
		});
	}
	if (section.entry_type === 'EducationEntry') {
		const education = entry as EducationEntry;
		return compactEntry({
			institution: education.institution ?? '',
			area: education.area ?? '',
			degree: education.degree,
			location: education.location,
			date: education.date || education.display_date,
			start_date: education.start_date,
			end_date: education.end_date,
			summary: education.summary,
			highlights: education.highlights
		});
	}
	if (section.entry_type === 'NormalEntry') {
		const normal = entry as NormalEntry;
		return compactEntry({
			name: markdownLink(String(normal.name ?? ''), normal.url),
			date: normal.date || (normal as Partial<{ display_date: string }>).display_date,
			start_date: normal.start_date,
			end_date: normal.end_date,
			location: normal.location,
			summary: normal.summary,
			highlights: normal.highlights
		});
	}
	if (section.entry_type === 'PublicationEntry') {
		const publication = entry as PublicationEntry;
		return compactEntry({
			title: publication.title ?? '',
			authors: publication.authors ?? [],
			summary: publication.summary,
			doi: publication.doi,
			url: publication.url,
			journal: publication.journal,
			date: publication.date
		});
	}
	if (section.entry_type === 'OneLineEntry') {
		return { label: String(record.label ?? ''), details: String(record.details ?? '') };
	}
	if (section.entry_type === 'BulletEntry') return { bullet: String(record.bullet ?? '') };
	if (section.entry_type === 'NumberedEntry') return { number: String(record.number ?? '') };
	if (section.entry_type === 'ReversedNumberedEntry') {
		return { reversed_number: String(record.reversed_number ?? '') };
	}
	return entry as Record<string, unknown>;
}

function renderableSettings(settings: CvSource['settings'] | undefined) {
	if (!settings) return undefined;
	return Object.keys(settings).length ? settings : undefined;
}

export function buildRenderCvDocument(source: CvSource) {
	source = sourceWithoutSourceReferenceMarkers(source);
	const sections: Record<string, RenderCvYamlEntry[]> = {};
	for (const section of source.cv.sections) {
		sections[section.title] = section.entries.map((entry) => renderCvEntry(section, entry));
	}

	const socialNetworks = (source.cv.social_networks ?? []).map((social: SocialNetwork) =>
		compactEntry({
			network: social.network,
			username: social.username
		})
	);

	const cv = compactEntry({
		name: source.cv.name,
		headline: source.cv.headline,
		location: source.cv.location,
		email: source.cv.email,
		phone: source.cv.phone,
		website: source.cv.website,
		social_networks: socialNetworks,
		sections
	});

	const settings = renderableSettings(source.settings);
	return {
		cv,
		design: source.design ?? DEFAULT_RENDERCV_DESIGN,
		...(source.locale ? { locale: source.locale } : {}),
		...(settings ? { settings } : {})
	};
}

export function renderRenderCvYaml(source: CvSource) {
	const document = buildRenderCvDocument(source);

	return `${RENDERCV_SCHEMA_COMMENT}${YAML.stringify(document, {
		lineWidth: 120
	})}`;
}
