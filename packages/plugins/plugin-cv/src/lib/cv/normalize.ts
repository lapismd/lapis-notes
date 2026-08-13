import type {
	BulletEntry,
	CvEntry,
	CvEntryType,
	CvSection,
	CvSource,
	EducationEntry,
	ExperienceExtraDetail,
	ExperienceEntry,
	ExperienceRoleHistoryEntry,
	NormalEntry,
	NumberedEntry,
	OneLineEntry,
	PublicationEntry,
	ReversedNumberedEntry,
	SocialNetwork
} from '$lib/cv/types';
import { normalizeSourceRefs } from '$lib/cv/source-references';

export const ENTRY_TYPE_OPTIONS: Array<{ value: CvEntryType; label: string; addLabel: string }> = [
	{ value: 'TextEntry', label: 'Text', addLabel: 'text' },
	{ value: 'ExperienceEntry', label: 'Experience Entry', addLabel: 'experience entry' },
	{ value: 'EducationEntry', label: 'Education Entry', addLabel: 'education entry' },
	{ value: 'PublicationEntry', label: 'Publication Entry', addLabel: 'publication entry' },
	{ value: 'OneLineEntry', label: 'One-Line Entry', addLabel: 'one-line entry' },
	{ value: 'BulletEntry', label: 'Bullet Entry', addLabel: 'bullet entry' },
	{ value: 'NumberedEntry', label: 'Numbered Entry', addLabel: 'numbered entry' },
	{
		value: 'ReversedNumberedEntry',
		label: 'Reversed Numbered Entry',
		addLabel: 'reversed numbered entry'
	},
	{ value: 'NormalEntry', label: 'Normal Entry', addLabel: 'normal entry' }
];

type LegacyCvSource = Partial<CvSource> & {
	_schema?: unknown;
	cv?: Partial<CvSource['cv']> & {
		linkedin_username?: string;
		github_username?: string;
	};
	meta?: Partial<CvSource['cv']> & {
		linkedin_username?: string;
		github_username?: string;
	};
	sections?: unknown;
	profile?: string[];
	skills?: Record<string, string[]>;
	experience?: ExperienceEntry[];
	education?: EducationEntry[];
	projects?: NormalEntry[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stableId(title: string) {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function cleanFoldedPrefix(value: string) {
	return value
		.replace(/\*\*Technologies:\*\*\s*/gi, '')
		.replace(/\*\*Role history:\*\*\s*/gi, '')
		.trim();
}

function normalizeStringList(value: unknown) {
	return Array.isArray(value)
		? value.map((item) => cleanFoldedPrefix(String(item))).filter(Boolean)
		: [];
}

const ROLE_HISTORY_ID = 'role-history';
const ROLE_HISTORY_TITLE = 'role history';
const RANGE_SEPARATOR = /\s+(?:-|\u2013|\u2014|to)\s+/i;
const MONTHS: Record<string, string> = {
	jan: '01',
	january: '01',
	feb: '02',
	february: '02',
	mar: '03',
	march: '03',
	apr: '04',
	april: '04',
	may: '05',
	jun: '06',
	june: '06',
	jul: '07',
	july: '07',
	aug: '08',
	august: '08',
	sep: '09',
	sept: '09',
	september: '09',
	oct: '10',
	october: '10',
	nov: '11',
	november: '11',
	dec: '12',
	december: '12'
};

function compactObject<T extends Record<string, unknown>>(value: T) {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => {
			if (item === undefined || item === null || item === '') return false;
			if (Array.isArray(item) && item.length === 0) return false;
			return true;
		})
	) as Partial<T>;
}

function parseRoleHistoryDateToken(value: string) {
	const token = value.trim().replace(/,$/, '');
	if (!token) return '';
	if (/^(present|current|now)$/i.test(token)) return 'present';
	if (/^\d{4}(-\d{2})?$/.test(token)) return token;

	const monthYear = /^([A-Za-z]+)\s+(\d{4})$/.exec(token);
	if (monthYear) {
		const month = MONTHS[monthYear[1].toLowerCase()];
		if (month) return `${monthYear[2]}-${month}`;
	}

	const yearMonth = /^(\d{4})\s+([A-Za-z]+)$/.exec(token);
	if (yearMonth) {
		const month = MONTHS[yearMonth[2].toLowerCase()];
		if (month) return `${yearMonth[1]}-${month}`;
	}

	return token;
}

function parseRoleHistoryDateRange(value: string) {
	const dateText = value.trim();
	if (!dateText) return {};
	const parts = dateText
		.split(RANGE_SEPARATOR)
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.length >= 2) {
		return {
			start_date: parseRoleHistoryDateToken(parts[0]),
			end_date: parseRoleHistoryDateToken(parts.slice(1).join(' - '))
		};
	}
	return { date: parseRoleHistoryDateToken(dateText) };
}

function normalizeRoleHistoryEntry(raw: unknown): ExperienceRoleHistoryEntry | null {
	if (isRecord(raw)) {
		const position = typeof raw.position === 'string' ? raw.position.trim() : '';
		if (!position) return null;
		return compactObject({
			position,
			start_date: typeof raw.start_date === 'string' ? raw.start_date.trim() : undefined,
			end_date: typeof raw.end_date === 'string' ? raw.end_date.trim() : undefined,
			date: typeof raw.date === 'string' ? raw.date.trim() : undefined,
			display_date: typeof raw.display_date === 'string' ? raw.display_date.trim() : undefined
		}) as ExperienceRoleHistoryEntry;
	}

	if (typeof raw !== 'string') return null;
	const text = cleanFoldedPrefix(raw);
	if (!text) return null;
	const [position, ...dateParts] = text.split('|');
	const trimmedPosition = position.trim();
	if (!trimmedPosition) return null;
	return compactObject({
		position: trimmedPosition,
		...parseRoleHistoryDateRange(dateParts.join('|'))
	}) as ExperienceRoleHistoryEntry;
}

function normalizeRoleHistoryList(value: unknown) {
	const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
	return values
		.map((item) => normalizeRoleHistoryEntry(item))
		.filter((item): item is ExperienceRoleHistoryEntry => Boolean(item));
}

function isRoleHistoryDetail(detail: ExperienceExtraDetail) {
	return (
		detail.id.trim().toLowerCase() === ROLE_HISTORY_ID ||
		detail.title.trim().toLowerCase() === ROLE_HISTORY_TITLE
	);
}

function roleHistoryFromDetail(detail: ExperienceExtraDetail) {
	if (detail.enabled === false) return [];
	const items =
		detail.content_type === 'text'
			? (detail.text ?? '')
					.split(/;|\n/)
					.map((item) => item.trim())
					.filter(Boolean)
			: (detail.items ?? []);
	return normalizeRoleHistoryList(items);
}

function normalizeEvidence(raw: unknown): NonNullable<CvSource['evidence']> | undefined {
	if (!isRecord(raw)) return undefined;
	const stories = Array.isArray(raw.stories) ? raw.stories : [];
	return {
		...(raw as CvSource['evidence']),
		stories: stories.map((story) => {
			if (!isRecord(story)) return story;
			return {
				...story,
				source_refs: normalizeSourceRefs(story.source_refs)
			};
		}) as NonNullable<CvSource['evidence']>['stories'],
		technologies: normalizeStringList(raw.technologies),
		skills: normalizeStringList(raw.skills),
		answer_method_defaults: isRecord(raw.answer_method_defaults) ? raw.answer_method_defaults : {}
	};
}

function normalizeSocialNetwork(raw: unknown): SocialNetwork | null {
	if (!isRecord(raw)) return null;
	const network = typeof raw.network === 'string' ? raw.network.trim() : '';
	const username = typeof raw.username === 'string' ? raw.username.trim() : '';
	if (!network && !username) return null;
	return {
		network: network || 'LinkedIn',
		username
	};
}

function normalizeCvFields(raw: unknown): CvSource['cv'] {
	const meta = (isRecord(raw) ? { ...raw } : {}) as Record<string, unknown>;
	const socialNetworks = Array.isArray(meta.social_networks)
		? meta.social_networks
				.map((network) => normalizeSocialNetwork(network))
				.filter((network): network is SocialNetwork => Boolean(network))
		: [];

	const addLegacyNetwork = (network: string, username: unknown) => {
		if (typeof username !== 'string' || !username.trim()) return;
		const exists = socialNetworks.some(
			(item) =>
				item.network.toLowerCase() === network.toLowerCase() && item.username === username.trim()
		);
		if (!exists) {
			socialNetworks.push({ network, username: username.trim() });
		}
	};

	addLegacyNetwork('LinkedIn', meta.linkedin_username);
	addLegacyNetwork('GitHub', meta.github_username);
	delete meta.linkedin_username;
	delete meta.github_username;

	return {
		...(meta as CvSource['cv']),
		social_networks: socialNetworks,
		sections: []
	};
}

function normalizeExtraDetail(raw: unknown, existingIds: Set<string>, index: number) {
	const detail = isRecord(raw) ? raw : {};
	const title =
		typeof detail.title === 'string' && detail.title.trim()
			? detail.title.trim()
			: `Extra detail ${index + 1}`;
	const id =
		typeof detail.id === 'string' && detail.id.trim()
			? detail.id
			: createSectionId(`detail-${title}-${index + 1}`, existingIds);
	existingIds.add(id);
	const contentType =
		detail.content_type === 'text' ||
		detail.content_type === 'comma_list' ||
		detail.content_type === 'semicolon_list'
			? detail.content_type
			: 'text';

	return {
		id,
		title,
		content_type: contentType,
		enabled: typeof detail.enabled === 'boolean' ? detail.enabled : true,
		text: typeof detail.text === 'string' ? cleanFoldedPrefix(detail.text) : undefined,
		items: normalizeStringList(detail.items)
	} satisfies ExperienceExtraDetail;
}

function legacyDetail(
	id: string,
	title: string,
	contentType: ExperienceExtraDetail['content_type'],
	value: unknown,
	enabled = true
) {
	const items = normalizeStringList(value);
	if (items.length === 0) return null;
	return {
		id,
		title,
		content_type: contentType,
		enabled,
		items
	} satisfies ExperienceExtraDetail;
}

function normalizeExperienceEntry(entry: unknown): ExperienceEntry {
	const record = isRecord(entry) ? entry : {};
	const detailIds = new Set<string>();
	const allExtraDetails = Array.isArray(record.extra_details)
		? record.extra_details.map((detail, index) => normalizeExtraDetail(detail, detailIds, index))
		: [];
	const roleHistoryDetails = allExtraDetails.filter((detail) => isRoleHistoryDetail(detail));
	const extraDetails = allExtraDetails.filter((detail) => !isRoleHistoryDetail(detail));
	const roleHistory = [
		...normalizeRoleHistoryList(record.role_history),
		...roleHistoryDetails.flatMap((detail) => roleHistoryFromDetail(detail))
	];
	const technologies = legacyDetail(
		'technologies',
		'Technologies',
		'comma_list',
		record.technologies,
		record.show_technologies !== false
	);
	const legacyDetails = [technologies].filter(Boolean) as ExperienceExtraDetail[];

	return {
		company: typeof record.company === 'string' ? record.company : '',
		position: typeof record.position === 'string' ? record.position : '',
		location: typeof record.location === 'string' ? record.location : '',
		start_date: typeof record.start_date === 'string' ? record.start_date : '',
		end_date: typeof record.end_date === 'string' ? record.end_date : '',
		date: typeof record.date === 'string' ? record.date : undefined,
		display_date: typeof record.display_date === 'string' ? record.display_date : '',
		summary: typeof record.summary === 'string' ? record.summary : undefined,
		...(roleHistory.length ? { role_history: roleHistory } : {}),
		extra_details: [...legacyDetails, ...extraDetails],
		highlights: normalizeStringList(record.highlights)
	};
}

export function createSectionId(title: string, existingIds: Iterable<string> = []) {
	const base = stableId(title) || 'section';
	const ids = new Set(existingIds);
	if (!ids.has(base)) return base;
	let index = 2;
	while (ids.has(`${base}-${index}`)) index += 1;
	return `${base}-${index}`;
}

function normalizeEntries(entryType: CvEntryType, entries: CvEntry[]) {
	if (entryType === 'ExperienceEntry') {
		return entries.map((entry) => normalizeExperienceEntry(entry));
	}
	return entries;
}

function normalizeSection(raw: unknown, existingIds: Set<string>, index: number): CvSection {
	const section = isRecord(raw) ? raw : {};
	const title =
		typeof section.title === 'string' && section.title.trim() ? section.title : 'New Section';
	const entryType = ENTRY_TYPE_OPTIONS.some((option) => option.value === section.entry_type)
		? (section.entry_type as CvEntryType)
		: 'TextEntry';
	const id =
		typeof section.id === 'string' && section.id.trim()
			? section.id
			: createSectionId(`${title}-${index + 1}`, existingIds);
	existingIds.add(id);

	return {
		id,
		title,
		entry_type: entryType,
		entries: normalizeEntries(
			entryType,
			Array.isArray(section.entries) ? (section.entries as CvEntry[]) : []
		)
	};
}

export function normalizeCvSource(input: unknown): CvSource {
	if (!isRecord(input)) {
		throw new Error('CV source must be an object.');
	}

	const legacy = { ...input } as LegacyCvSource;
	delete legacy._schema;
	const rawCv: Record<string, unknown> = isRecord(legacy.cv) ? legacy.cv : {};
	const rawMeta: Record<string, unknown> = isRecord(legacy.meta) ? legacy.meta : {};
	const cv = normalizeCvFields({ ...rawMeta, ...rawCv });
	if (rawCv.sections !== undefined && !Array.isArray(rawCv.sections)) {
		throw new Error('Editable CV source requires cv.sections to be a typed section array.');
	}

	const typedSections = Array.isArray(rawCv.sections)
		? rawCv.sections
		: Array.isArray(legacy.sections)
			? legacy.sections
			: null;
	const evidence = normalizeEvidence(legacy.evidence);

	if (typedSections) {
		const existingIds = new Set<string>();
		const sections = typedSections.map((section, index) =>
			normalizeSection(section, existingIds, index)
		);
		return {
			cv: { ...cv, sections },
			...(isRecord(legacy.design) ? { design: legacy.design as CvSource['design'] } : {}),
			...(isRecord(legacy.locale) ? { locale: legacy.locale as CvSource['locale'] } : {}),
			...(evidence ? { evidence } : {}),
			...(isRecord(legacy.settings) ? { settings: legacy.settings as CvSource['settings'] } : {})
		};
	}

	const sections: CvSection[] = [];
	const addSection = (title: string, entryType: CvEntryType, entries: CvEntry[]) => {
		sections.push({
			id: createSectionId(
				title,
				sections.map((section) => section.id)
			),
			title,
			entry_type: entryType,
			entries: normalizeEntries(entryType, entries)
		});
	};

	if (Array.isArray(legacy.profile)) {
		addSection('Profile', 'TextEntry', legacy.profile);
	}
	if (legacy.skills && isRecord(legacy.skills)) {
		addSection(
			'Technical Skills',
			'OneLineEntry',
			Object.entries(legacy.skills).map(([label, items]) => ({
				label,
				details: Array.isArray(items) ? items.join(', ') : ''
			}))
		);
	}
	if (Array.isArray(legacy.experience)) {
		addSection('Professional Experience', 'ExperienceEntry', legacy.experience);
	}
	if (Array.isArray(legacy.education)) {
		addSection('Education', 'EducationEntry', legacy.education);
	}
	if (Array.isArray(legacy.projects)) {
		addSection('Open Source & Community', 'NormalEntry', legacy.projects);
	}

	return {
		cv: { ...cv, sections },
		...(isRecord(legacy.design) ? { design: legacy.design as CvSource['design'] } : {}),
		...(isRecord(legacy.locale) ? { locale: legacy.locale as CvSource['locale'] } : {}),
		...(evidence ? { evidence } : {}),
		...(isRecord(legacy.settings) ? { settings: legacy.settings as CvSource['settings'] } : {})
	};
}

export function entryTypeLabel(entryType: CvEntryType) {
	return ENTRY_TYPE_OPTIONS.find((option) => option.value === entryType)?.label ?? entryType;
}

export function addEntryLabel(entryType: CvEntryType) {
	return ENTRY_TYPE_OPTIONS.find((option) => option.value === entryType)?.addLabel ?? 'entry';
}

export function defaultEntry(entryType: CvEntryType): CvEntry {
	if (entryType === 'TextEntry') return '';
	if (entryType === 'ExperienceEntry') {
		return {
			company: 'New company',
			position: 'Role',
			location: '',
			start_date: '',
			end_date: '',
			display_date: '',
			role_history: [],
			extra_details: [],
			highlights: ['']
		} satisfies ExperienceEntry;
	}
	if (entryType === 'EducationEntry') {
		return {
			institution: 'Institution',
			degree: '',
			area: '',
			location: '',
			start_date: '',
			end_date: '',
			display_date: '',
			highlights: []
		} satisfies EducationEntry;
	}
	if (entryType === 'PublicationEntry') {
		return {
			title: 'Publication title',
			authors: [''],
			journal: '',
			date: ''
		} satisfies PublicationEntry;
	}
	if (entryType === 'OneLineEntry') {
		return { label: 'Label', details: '' } satisfies OneLineEntry;
	}
	if (entryType === 'BulletEntry') {
		return { bullet: '' } satisfies BulletEntry;
	}
	if (entryType === 'NumberedEntry') {
		return { number: '' } satisfies NumberedEntry;
	}
	if (entryType === 'ReversedNumberedEntry') {
		return { reversed_number: '' } satisfies ReversedNumberedEntry;
	}
	return {
		name: 'New entry',
		date: '',
		location: '',
		summary: '',
		highlights: []
	} satisfies NormalEntry;
}

export function defaultSection(
	entryType: CvEntryType,
	existingIds: Iterable<string> = []
): CvSection {
	const title =
		entryType === 'TextEntry' ? 'New Section' : entryTypeLabel(entryType).replace(' Entry', '');
	return {
		id: createSectionId(title, existingIds),
		title,
		entry_type: entryType,
		entries: [defaultEntry(entryType)]
	};
}

export function entryTitle(entryType: CvEntryType, entry: CvEntry, index: number) {
	if (entryType === 'TextEntry') {
		return typeof entry === 'string' && entry.trim()
			? entry.trim().slice(0, 80)
			: `Text ${index + 1}`;
	}
	if (!isRecord(entry)) return `${entryTypeLabel(entryType)} ${index + 1}`;
	const record = entry as Record<string, unknown>;
	if (entryType === 'ExperienceEntry') {
		return (
			[record.company, record.position].filter(Boolean).join(' - ') || `Experience ${index + 1}`
		);
	}
	if (entryType === 'EducationEntry') {
		return (
			[record.institution, record.area].filter(Boolean).join(' - ') || `Education ${index + 1}`
		);
	}
	if (entryType === 'PublicationEntry') return String(record.title || `Publication ${index + 1}`);
	if (entryType === 'OneLineEntry') return String(record.label || `One-line ${index + 1}`);
	if (entryType === 'BulletEntry')
		return String(record.bullet || `Bullet ${index + 1}`).slice(0, 80);
	if (entryType === 'NumberedEntry')
		return String(record.number || `Numbered ${index + 1}`).slice(0, 80);
	if (entryType === 'ReversedNumberedEntry') {
		return String(record.reversed_number || `Reversed numbered ${index + 1}`).slice(0, 80);
	}
	return String(record.name || `Entry ${index + 1}`);
}
