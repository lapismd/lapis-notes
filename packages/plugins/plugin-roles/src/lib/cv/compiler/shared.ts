import renderCvDefaults from '../generated/rendercv-defaults.json';
import type { CvSource, ExperienceEntry, ExperienceRoleHistoryEntry } from '../types';

export const DEFAULT_RENDERCV_DESIGN = {
	theme: 'engineeringresumes',
	page: {
		size: 'a4',
		top_margin: '0.55in',
		bottom_margin: '0.55in',
		left_margin: '0.60in',
		right_margin: '0.60in'
	}
};

export const THEME_PRESETS = renderCvDefaults.themes as Record<string, Record<string, unknown>>;

export type CompiledCvSource = {
	markdown: string;
	rendercvYaml: string;
	typst: string;
	html: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function mergeDesign(...records: Array<Record<string, unknown> | undefined>) {
	const merged: Record<string, unknown> = {};
	for (const record of records) {
		if (!record) continue;
		for (const [key, value] of Object.entries(record)) {
			if (isRecord(value) && isRecord(merged[key])) {
				merged[key] = mergeDesign(merged[key] as Record<string, unknown>, value);
			} else if (Array.isArray(value)) {
				merged[key] = [...value];
			} else if (isRecord(value)) {
				merged[key] = mergeDesign(value);
			} else {
				merged[key] = value;
			}
		}
	}
	return merged;
}

export function resolvedDesign(source: CvSource) {
	const designInput = source.design ?? DEFAULT_RENDERCV_DESIGN;
	const requestedTheme =
		typeof designInput.theme === 'string' ? designInput.theme : DEFAULT_RENDERCV_DESIGN.theme;
	const themePreset = THEME_PRESETS[requestedTheme] ?? THEME_PRESETS[DEFAULT_RENDERCV_DESIGN.theme];
	const design = mergeDesign(themePreset, designInput);
	const typography = childRecord(design, 'typography');
	if (typeof typography.font_family === 'string') {
		typography.font_family = {
			body: typography.font_family,
			name: typography.font_family,
			headline: typography.font_family,
			connections: typography.font_family,
			section_titles: typography.font_family
		};
	}
	return design;
}

function monthLabel(value: string | undefined) {
	if (!value) return '';
	if (value === 'present') return 'Present';
	const match = /^(\d{4})-(\d{2})$/.exec(value);
	if (!match) return value;
	const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
	return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(date);
}

export function compactEntry<T extends Record<string, unknown>>(entry: T) {
	return Object.fromEntries(
		Object.entries(entry).filter(([, value]) => {
			if (value === null || value === undefined || value === '') return false;
			if (Array.isArray(value) && value.length === 0) return false;
			return true;
		})
	);
}

export function entryDate(
	entry: Partial<{ date: string; display_date: string; start_date: string; end_date: string }>
) {
	if (entry.date) return entry.date;
	if (entry.display_date) return entry.display_date;
	const start = monthLabel(entry.start_date);
	const end = monthLabel(entry.end_date);
	if (start && end) return `${start} - ${end}`;
	return start || end;
}

function socialNetworkUrl(network: string, username: string) {
	const key = network.trim().toLowerCase();
	const value = username.trim();
	if (!value) return undefined;
	if (key === 'linkedin') return `https://www.linkedin.com/in/${value}`;
	if (key === 'github') return `https://github.com/${value}`;
	if (key === 'gitlab') return `https://gitlab.com/${value}`;
	if (key === 'x' || key === 'twitter') return `https://x.com/${value}`;
	if (key === 'instagram') return `https://www.instagram.com/${value}`;
	if (key === 'orcid') return `https://orcid.org/${value}`;
	if (key === 'researchgate') return `https://www.researchgate.net/profile/${value}`;
	return undefined;
}

export function markdownLink(label: string, url: string | undefined) {
	return url ? `[${label}](${url})` : label;
}

export function compactContact(source: CvSource, markdown = true, separator = ' | ') {
	const parts: string[] = [];
	const meta = source.cv;
	if (meta.location) parts.push(meta.location);
	if (meta.email) parts.push(meta.email);
	if (meta.phone) parts.push(meta.phone);
	for (const social of meta.social_networks ?? []) {
		if (!social.network || !social.username) continue;
		const url = socialNetworkUrl(social.network, social.username);
		parts.push(
			markdown && url ? `[${social.network}](${url})` : `${social.network}: ${social.username}`
		);
	}
	if (meta.website) parts.push(markdown ? `[Website](${meta.website})` : meta.website);
	return parts.join(separator);
}

export function childRecord(record: Record<string, unknown>, key: string) {
	const value = record[key];
	return isRecord(value) ? value : {};
}

export type ExtraDetailEntry = {
	label: string;
	details: string;
};

function extraDetailEntry(detail: unknown): ExtraDetailEntry | null {
	if (!isRecord(detail) || detail.enabled === false) return null;
	const title = typeof detail.title === 'string' ? detail.title.trim() : '';
	if (!title) return null;
	const contentType = detail.content_type;
	const value =
		contentType === 'text'
			? typeof detail.text === 'string'
				? detail.text.trim()
				: ''
			: Array.isArray(detail.items)
				? detail.items
						.map((item) => String(item).trim())
						.filter(Boolean)
						.join(contentType === 'semicolon_list' ? '; ' : ', ')
				: '';
	return value ? { label: title, details: value } : null;
}

function extraDetailText(detail: unknown) {
	const entry = extraDetailEntry(detail);
	return entry ? `**${entry.label}:** ${entry.details}` : '';
}

function isRoleHistoryDetail(detail: unknown) {
	if (!isRecord(detail)) return false;
	const id = typeof detail.id === 'string' ? detail.id.trim().toLowerCase() : '';
	const title = typeof detail.title === 'string' ? detail.title.trim().toLowerCase() : '';
	return id === 'role-history' || title === 'role history';
}

export function roleHistoryEntries(entry: ExperienceEntry): ExperienceRoleHistoryEntry[] {
	return (entry.role_history ?? []).filter((item) => item.position?.trim());
}

export function roleHistoryText(item: ExperienceRoleHistoryEntry) {
	return [item.position, entryDate(item)].filter(Boolean).join(' | ');
}

export function roleHistoryLines(entry: ExperienceEntry) {
	const items = roleHistoryEntries(entry)
		.map((item) => roleHistoryText(item))
		.filter(Boolean);
	return items;
}

export function extraDetailEntries(entry: ExperienceEntry) {
	return (entry.extra_details ?? [])
		.filter((detail) => !isRoleHistoryDetail(detail))
		.map((detail) => extraDetailEntry(detail))
		.filter((detail): detail is ExtraDetailEntry => Boolean(detail));
}

export function extraDetailLines(entry: ExperienceEntry) {
	return extraDetailEntries(entry).map(({ label, details }) => `**${label}:** ${details}`);
}
