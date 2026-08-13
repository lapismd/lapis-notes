import type { CvEntry, CvSection, ExperienceEntry, ExperienceRoleHistoryEntry } from '../types';
import {
	compactEntry,
	extraDetailEntries,
	roleHistoryEntries,
	type ExtraDetailEntry
} from './shared';
import { renderCvEntry } from './rendercv-yaml';
import type { RenderCvLocale, RenderCvSettings } from './typst-processing';

type ProcessEntryForTypst = (
	entryType: string,
	entry: string | Record<string, unknown>,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	showTimeSpan: boolean
) => string | Record<string, unknown>;

export type ExperienceTypstProcessors = {
	processDateField: (
		entry: Record<string, unknown>,
		locale: RenderCvLocale,
		settings: RenderCvSettings,
		design: Record<string, unknown>,
		showTimeSpan: boolean
	) => string;
	processEntryForTypst: ProcessEntryForTypst;
	processHighlights: (highlights: string[]) => string;
	processString: (value: string | undefined, settings: RenderCvSettings) => string | undefined;
	processSummary: (summary: string) => string;
};

function roleHistoryDateColumn(
	role: ExperienceRoleHistoryEntry,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	processors: ExperienceTypstProcessors
) {
	const dateFields = compactEntry({
		date: role.date || role.display_date,
		start_date: role.start_date,
		end_date: role.end_date
	});
	if (!Object.keys(dateFields).length) return '';
	return (
		processors.processString(
			processors.processDateField(dateFields, locale, settings, design, false),
			settings
		) ?? ''
	);
}

function processRoleHistoryEntry(
	role: ExperienceRoleHistoryEntry,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	processors: ExperienceTypstProcessors
) {
	return {
		main_column: processors.processString(role.position, settings) ?? '',
		date_and_location_column: roleHistoryDateColumn(role, design, locale, settings, processors)
	};
}

function processExperienceContinuationEntry(
	entry: ExperienceEntry,
	settings: RenderCvSettings,
	processors: ExperienceTypstProcessors,
	options: { includeSummary?: boolean; includeHighlights?: boolean } = {}
): Record<string, unknown> | null {
	const includeSummary = options.includeSummary ?? true;
	const includeHighlights = options.includeHighlights ?? true;
	const blocks: string[] = [];
	if (includeSummary && entry.summary) blocks.push(processors.processSummary(entry.summary));
	const highlights = includeHighlights ? (entry.highlights ?? []) : [];
	if (highlights.length) blocks.push(processors.processHighlights(highlights));
	const mainColumn = blocks.join('\n');
	if (!mainColumn.trim()) return null;
	return {
		main_column: processors.processString(mainColumn, settings) ?? '',
		date_and_location_column: ''
	};
}

function processExtraDetailEntryForTypst(
	detail: ExtraDetailEntry,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	showTimeSpan: boolean,
	processors: ExperienceTypstProcessors
) {
	const processed = processors.processEntryForTypst(
		'OneLineEntry',
		{ label: detail.label, details: detail.details },
		design,
		locale,
		settings,
		showTimeSpan
	);
	if (typeof processed === 'string') return processed;
	if (typeof processed.main_column === 'string' && processed.main_column.trim()) {
		return processed.main_column;
	}
	return processors.processString(`**${detail.label}:** ${detail.details}`, settings) ?? '';
}

function processExtraDetailsContinuationEntry(
	details: ExtraDetailEntry[],
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	showTimeSpan: boolean,
	processors: ExperienceTypstProcessors
): Record<string, unknown> | null {
	const mainColumn = details
		.map((detail) =>
			processExtraDetailEntryForTypst(
				detail,
				design,
				locale,
				settings,
				showTimeSpan,
				processors
			)
		)
		.filter(Boolean)
		.join('\n');
	if (!mainColumn.trim()) return null;
	return {
		main_column: mainColumn,
		date_and_location_column: ''
	};
}

export function processExperienceEntryForTypst(
	section: CvSection,
	entry: CvEntry,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	showTimeSpan: boolean,
	processors: ExperienceTypstProcessors
) {
	const processBase = (value: CvEntry) =>
		processors.processEntryForTypst(
			section.entry_type,
			renderCvEntry(section, value) as string | Record<string, unknown>,
			design,
			locale,
			settings,
			showTimeSpan
		);

	if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
		return [processBase(entry)];

	const experience = entry as ExperienceEntry;
	const roles = roleHistoryEntries(experience);
	const extraDetails = extraDetailEntries(experience);
	if (!roles.length && !extraDetails.length) return [processBase(entry)];

	const mainEntry = {
		...experience,
		summary: roles.length ? undefined : experience.summary,
		role_history: [],
		extra_details: [],
		highlights: []
	};
	const entries: Array<string | Record<string, unknown>> = [
		processBase(mainEntry),
		...roles.map((role) => processRoleHistoryEntry(role, design, locale, settings, processors))
	];
	if (!extraDetails.length) {
		const continuation = processExperienceContinuationEntry(experience, settings, processors);
		if (continuation) entries.push(continuation);
		return entries;
	}
	if (roles.length) {
		const summary = processExperienceContinuationEntry(experience, settings, processors, {
			includeHighlights: false
		});
		if (summary) entries.push(summary);
	}
	const extraDetailBlock = processExtraDetailsContinuationEntry(
		extraDetails,
		design,
		locale,
		settings,
		showTimeSpan,
		processors
	);
	if (extraDetailBlock) entries.push(extraDetailBlock);
	const highlights = processExperienceContinuationEntry(experience, settings, processors, {
		includeSummary: false
	});
	if (highlights) entries.push(highlights);
	return entries;
}
