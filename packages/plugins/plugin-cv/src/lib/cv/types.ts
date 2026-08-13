export type SocialNetwork = {
	network: string;
	username: string;
};

export type CvMeta = {
	name: string;
	headline: string;
	location: string;
	email: string;
	phone: string;
	social_networks?: SocialNetwork[];
	website?: string;
	last_updated?: string;
	target_roles?: string[];
};

export type DatedEntry = {
	location: string;
	date?: string;
	start_date: string;
	end_date: string;
	display_date?: string;
	summary?: string;
	highlights?: string[];
};

export type ExperienceExtraDetail = {
	id: string;
	title: string;
	content_type: 'text' | 'comma_list' | 'semicolon_list';
	enabled?: boolean;
	text?: string;
	items?: string[];
};

export type ExperienceRoleHistoryEntry = {
	position: string;
	start_date?: string;
	end_date?: string;
	date?: string;
	display_date?: string;
};

export type ExperienceEntry = DatedEntry & {
	company: string;
	position: string;
	role_history?: ExperienceRoleHistoryEntry[];
	extra_details?: ExperienceExtraDetail[];
	highlights: string[];
};

export type EducationEntry = DatedEntry & {
	institution: string;
	degree: string;
	area: string;
	highlights?: string[];
};

export type NormalEntry = {
	name: string;
	url?: string;
	date?: string;
	start_date?: string;
	end_date?: string;
	location?: string;
	summary: string;
	highlights?: string[];
};

export type ProjectEntry = NormalEntry;

export type OneLineEntry = {
	label: string;
	details: string;
};

export type BulletEntry = {
	bullet: string;
};

export type NumberedEntry = {
	number: string;
};

export type ReversedNumberedEntry = {
	reversed_number: string;
};

export type PublicationEntry = {
	title: string;
	authors: string[];
	summary?: string;
	doi?: string;
	url?: string;
	journal?: string;
	date?: string;
};

export type CvEntryType =
	| 'TextEntry'
	| 'ExperienceEntry'
	| 'EducationEntry'
	| 'PublicationEntry'
	| 'OneLineEntry'
	| 'BulletEntry'
	| 'NumberedEntry'
	| 'ReversedNumberedEntry'
	| 'NormalEntry';

export type CvEntry =
	| string
	| ExperienceEntry
	| EducationEntry
	| PublicationEntry
	| OneLineEntry
	| BulletEntry
	| NumberedEntry
	| ReversedNumberedEntry
	| NormalEntry;

export type CvSection = {
	id: string;
	title: string;
	entry_type: CvEntryType;
	entries: CvEntry[];
};

export type CvDocument = CvMeta & {
	sections: CvSection[];
};

export type CvSource = {
	cv: CvDocument;
	design?: RenderCvDesign;
	locale?: Record<string, unknown> & { language?: string };
	evidence?: CvEvidence;
	settings?: {
		current_date?: string;
		pdf_title?: string;
		bold_keywords?: string[];
		[key: string]: unknown;
	};
};

export type CvEvidence = {
	stories: CvEvidenceStory[];
	technologies: string[];
	skills: string[];
	answer_method_defaults: Record<string, unknown>;
	[key: string]: unknown;
};

export type CvEvidenceSourceRefs = string[];

export type CvEvidenceStoryEvidence = {
	context?: string;
	problem?: string;
	constraints?: string[];
	actions?: string[];
	results?: string[];
	metrics?: string[];
	lessons?: string[];
	[key: string]: unknown;
};

export type CvEvidenceStoryAnswerVersions = {
	star?: {
		situation?: string;
		task?: string;
		action?: string;
		result?: string;
	};
	carl?: {
		context?: string;
		action?: string;
		result?: string;
		learning?: string;
	};
	digs?: {
		dramatize?: string;
		indicate_alternatives?: string;
		go_through_actions?: string;
		summarize_impact?: string;
	};
	technical_decision?: {
		context?: string;
		constraints?: string[];
		options?: string[];
		decision?: string;
		tradeoffs?: string[];
		outcome?: string;
		learning?: string;
	};
	concise?: {
		thirty_seconds?: string;
		ninety_seconds?: string;
		three_minutes?: string;
	};
	[key: string]: unknown;
};

export type CvEvidenceStory = {
	id: string;
	title: string;
	source_refs: CvEvidenceSourceRefs;
	tags: string[];
	useful_for: string[];
	evidence: CvEvidenceStoryEvidence;
	answer_versions: CvEvidenceStoryAnswerVersions;
	status: 'draft' | 'ready' | 'archived';
	visibility: 'internal' | 'public';
	notes: string;
	[key: string]: unknown;
};

export type RenderCvDesign = {
	theme?: string;
	page?: {
		size?: string;
		top_margin?: string;
		bottom_margin?: string;
		left_margin?: string;
		right_margin?: string;
		show_footer?: boolean;
		show_top_note?: boolean;
		[key: string]: unknown;
	};
	colors?: Record<string, string>;
	typography?: Record<string, unknown>;
	[key: string]: unknown;
};

export type ArtifactInfo = {
	fileId?: string;
	pipeline: 'typst';
	filename: string;
	extension: string;
	size: number;
	mtimeMs: number;
	url: string;
	label: string;
	metadata?: {
		width?: number;
		height?: number;
		mimeType?: string;
		source?: string;
		pixelPerPt?: number;
		size?: number;
	};
};

export type RenderStatus = {
	phase: 'idle' | 'running' | 'error';
	queued: boolean;
	currentCommand: string | null;
	startedAt: string | null;
	finishedAt: string | null;
	version: number;
	lastError: string | null;
	lastOutput: string;
};

export type CvFileBucket = 'cvs' | 'archive' | 'trash';

export type CvFileInfo = {
	id: string;
	title: string;
	sourcePath: string;
	bucket: CvFileBucket;
	createdAt: string;
	updatedAt: string;
	archivedAt?: string;
	trashedAt?: string;
};

export type CvFileIndex = {
	selectedFileId: string;
	evidenceFileId?: string;
	files: CvFileInfo[];
};

export type CvPayload = {
	file?: CvFileInfo;
	files?: CvFileInfo[];
	selectedFileId?: string;
	evidenceFileId?: string;
	yamlText: string;
	data: CvSource;
	schema: Record<string, unknown>;
	artifacts?: ArtifactInfo[];
	render?: RenderStatus;
};
