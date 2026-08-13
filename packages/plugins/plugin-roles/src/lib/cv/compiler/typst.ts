import { sourceWithoutSourceReferenceMarkers } from '../source-references';
import type { CvSource } from '../types';
import { childRecord, resolvedDesign } from './shared';
import { buildRenderCvDocument } from './rendercv-yaml';
import {
	FONT_AWESOME_ICONS,
	LOCALE_LANGUAGE_CODES,
	RTL_LANGUAGES,
	SOCIAL_URL_PREFIXES,
	arrayValue,
	booleanValue,
	buildDatePlaceholders,
	cleanUrl,
	dateObjectToString,
	makeKeywordsBold,
	markdownToTypst,
	processString,
	processedSections,
	resolveLocale,
	resolveSettings,
	resolvedCurrentDate,
	stringValue,
	substitutePlaceholders,
	typstStringContent,
	type RenderCvLocale,
	type RenderCvSectionModel,
	type RenderCvSettings
} from './typst-processing';

function colorAsRgb(value: unknown) {
	if (typeof value !== 'string') return 'rgb(0, 0, 0)';
	const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(value.trim());
	if (rgb) return `rgb(${Number(rgb[1])}, ${Number(rgb[2])}, ${Number(rgb[3])})`;
	const hex = /^#?([0-9a-f]{6})$/i.exec(value.trim());
	if (!hex) return value;
	const raw = hex[1];
	return `rgb(${parseInt(raw.slice(0, 2), 16)}, ${parseInt(raw.slice(2, 4), 16)}, ${parseInt(raw.slice(4, 6), 16)})`;
}

function typstBullet(value: unknown) {
	const bullet = String(value ?? '•');
	return bullet === '●'
		? ' text(13pt, [•], baseline: -0.6pt) '
		: ` "${typstStringContent(bullet)}" `;
}

function boolTypst(value: unknown) {
	return String(Boolean(value)).toLowerCase();
}

function renderPdfTitle(
	template: string,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	name: string,
	design: Record<string, unknown>
) {
	const currentDate = resolvedCurrentDate(settings);
	const templates = childRecord(design, 'templates');
	const currentDateText = dateObjectToString(
		currentDate,
		locale,
		stringValue(templates.single_date, 'MONTH_ABBREVIATION YEAR')
	);
	return substitutePlaceholders(template, {
		CURRENT_DATE: currentDateText,
		NAME: name,
		...buildDatePlaceholders(currentDate, locale)
	});
}

function renderTopNote(
	template: string,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	name: string,
	design: Record<string, unknown>
) {
	const currentDate = resolvedCurrentDate(settings);
	const templates = childRecord(design, 'templates');
	return markdownToTypst(
		substitutePlaceholders(template, {
			CURRENT_DATE: dateObjectToString(
				currentDate,
				locale,
				stringValue(templates.single_date, 'MONTH_ABBREVIATION YEAR')
			),
			LAST_UPDATED: locale.last_updated,
			NAME: name,
			...buildDatePlaceholders(currentDate, locale)
		})
	);
}

function renderFooter(
	template: string,
	locale: RenderCvLocale,
	settings: RenderCvSettings,
	name: string,
	design: Record<string, unknown>
) {
	const currentDate = resolvedCurrentDate(settings);
	const templates = childRecord(design, 'templates');
	return `context { [${markdownToTypst(
		substitutePlaceholders(template, {
			CURRENT_DATE: dateObjectToString(
				currentDate,
				locale,
				stringValue(templates.single_date, 'MONTH_ABBREVIATION YEAR')
			),
			NAME: name,
			PAGE_NUMBER: '#str(here().page())',
			TOTAL_PAGES: '#str(counter(page).final().first())',
			...buildDatePlaceholders(currentDate, locale)
		})
	)}] }`;
}

function formatPhone(phone: string) {
	const digits = phone.replace(/[^\d]/g, '');
	if (phone.trim().startsWith('+44') && digits.startsWith('44') && digits.length >= 12) {
		const local = digits.slice(2);
		return {
			url: `tel:+44-${local.slice(0, 4)}-${local.slice(4)}`,
			body: `0${local.slice(0, 4)} ${local.slice(4)}`
		};
	}
	return {
		url: `tel:${phone.trim().replace(/\s+/g, '-')}`,
		body: phone.trim()
	};
}

function socialUrl(network: string, username: string) {
	if (network === 'Mastodon') {
		const [, user, domain] = username.split('@');
		return user && domain ? `https://${domain}/@${user}` : '';
	}
	return `${SOCIAL_URL_PREFIXES[network] ?? ''}${username}`;
}

function computeConnections(
	cv: Record<string, unknown>,
	design: Record<string, unknown>,
	settings: RenderCvSettings
) {
	const header = childRecord(design, 'header');
	const connectionsConfig = childRecord(header, 'connections');
	const showIcons = booleanValue(connectionsConfig.show_icons, true);
	const hyperlink = booleanValue(connectionsConfig.hyperlink, true);
	const displayUrls = booleanValue(connectionsConfig.display_urls_instead_of_usernames, false);
	const connections: Array<{ icon: string; url?: string; body: string }> = [];
	for (const key of Object.keys(cv)) {
		if (key === 'location' && cv.location) {
			connections.push({ icon: FONT_AWESOME_ICONS.location, body: String(cv.location) });
		}
		if (key === 'email' && cv.email) {
			for (const email of Array.isArray(cv.email) ? cv.email : [cv.email]) {
				connections.push({
					icon: FONT_AWESOME_ICONS.email,
					url: `mailto:${email}`,
					body: String(email)
				});
			}
		}
		if (key === 'phone' && cv.phone) {
			for (const phone of Array.isArray(cv.phone) ? cv.phone : [cv.phone]) {
				const formatted = formatPhone(String(phone));
				connections.push({ icon: FONT_AWESOME_ICONS.phone, ...formatted });
			}
		}
		if (key === 'website' && cv.website) {
			for (const website of Array.isArray(cv.website) ? cv.website : [cv.website]) {
				connections.push({
					icon: FONT_AWESOME_ICONS.website,
					url: String(website),
					body: cleanUrl(website)
				});
			}
		}
		if (key === 'social_networks') {
			for (const social of arrayValue<Record<string, unknown>>(cv.social_networks)) {
				const network = String(social.network ?? '');
				const username = String(social.username ?? '');
				if (!network || !username) continue;
				const url = socialUrl(network, username);
				const body = displayUrls
					? cleanUrl(url)
					: network === 'Google Scholar'
						? 'Google Scholar'
						: username;
				connections.push({ icon: FONT_AWESOME_ICONS[network] ?? 'link', url, body });
			}
		}
	}
	return connections.map((connection) => {
		const body = markdownToTypst(makeKeywordsBold(connection.body, settings.bold_keywords));
		const placeholder = showIcons ? `#connection-with-icon("${connection.icon}")[${body}]` : body;
		return connection.url && hyperlink
			? `#link("${typstStringContent(connection.url)}", icon: false, if-underline: false, if-color: false)[${placeholder}]`
			: placeholder;
	});
}

function renderPreamble(
	source: CvSource,
	design: Record<string, unknown>,
	locale: RenderCvLocale,
	settings: RenderCvSettings
) {
	const cv = buildRenderCvDocument(source).cv as Record<string, unknown>;
	const plainName = String(cv.name ?? '');
	const currentDate = resolvedCurrentDate(settings);
	const page = childRecord(design, 'page');
	const colors = childRecord(design, 'colors');
	const typography = childRecord(design, 'typography');
	const fontFamily = childRecord(typography, 'font_family');
	const fontSize = childRecord(typography, 'font_size');
	const smallCaps = childRecord(typography, 'small_caps');
	const bold = childRecord(typography, 'bold');
	const links = childRecord(design, 'links');
	const header = childRecord(design, 'header');
	const headerConnections = childRecord(header, 'connections');
	const sectionTitles = childRecord(design, 'section_titles');
	const sections = childRecord(design, 'sections');
	const entries = childRecord(design, 'entries');
	const entrySummary = childRecord(entries, 'summary');
	const entryHighlights = childRecord(entries, 'highlights');
	const templates = childRecord(design, 'templates');
	return [
		'// Import the rendercv function and all the refactored components',
		'#import "@preview/rendercv:0.3.0": *',
		'',
		'// Apply the rendercv template with custom configuration',
		'#show: rendercv.with(',
		`  name: "${typstStringContent(plainName)}",`,
		`  title: "${typstStringContent(renderPdfTitle(settings.pdf_title, locale, settings, plainName, design))}",`,
		`  footer: ${renderFooter(stringValue(templates.footer, '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'), locale, settings, plainName, design)},`,
		`  top-note: [ ${renderTopNote(stringValue(templates.top_note, '*LAST_UPDATED CURRENT_DATE*'), locale, settings, plainName, design)} ],`,
		`  locale-catalog-language: "${LOCALE_LANGUAGE_CODES[locale.language] ?? 'en'}",`,
		`  text-direction: ${RTL_LANGUAGES.has(locale.language) ? 'rtl' : 'ltr'},`,
		`  page-size: "${stringValue(page.size, 'us-letter')}",`,
		`  page-top-margin: ${page.top_margin},`,
		`  page-bottom-margin: ${page.bottom_margin},`,
		`  page-left-margin: ${page.left_margin},`,
		`  page-right-margin: ${page.right_margin},`,
		`  page-show-footer: ${boolTypst(page.show_footer)},`,
		`  page-show-top-note: ${boolTypst(page.show_top_note)},`,
		`  colors-body: ${colorAsRgb(colors.body)},`,
		`  colors-name: ${colorAsRgb(colors.name)},`,
		`  colors-headline: ${colorAsRgb(colors.headline)},`,
		`  colors-connections: ${colorAsRgb(colors.connections)},`,
		`  colors-section-titles: ${colorAsRgb(colors.section_titles)},`,
		`  colors-links: ${colorAsRgb(colors.links)},`,
		`  colors-footer: ${colorAsRgb(colors.footer)},`,
		`  colors-top-note: ${colorAsRgb(colors.top_note)},`,
		`  typography-line-spacing: ${typography.line_spacing},`,
		`  typography-alignment: "${typography.alignment}",`,
		`  typography-date-and-location-column-alignment: ${typography.date_and_location_column_alignment},`,
		`  typography-font-family-body: "${typstStringContent(String(fontFamily.body))}",`,
		`  typography-font-family-name: "${typstStringContent(String(fontFamily.name))}",`,
		`  typography-font-family-headline: "${typstStringContent(String(fontFamily.headline))}",`,
		`  typography-font-family-connections: "${typstStringContent(String(fontFamily.connections))}",`,
		`  typography-font-family-section-titles: "${typstStringContent(String(fontFamily.section_titles))}",`,
		`  typography-font-size-body: ${fontSize.body},`,
		`  typography-font-size-name: ${fontSize.name},`,
		`  typography-font-size-headline: ${fontSize.headline},`,
		`  typography-font-size-connections: ${fontSize.connections},`,
		`  typography-font-size-section-titles: ${fontSize.section_titles},`,
		`  typography-small-caps-name: ${boolTypst(smallCaps.name)},`,
		`  typography-small-caps-headline: ${boolTypst(smallCaps.headline)},`,
		`  typography-small-caps-connections: ${boolTypst(smallCaps.connections)},`,
		`  typography-small-caps-section-titles: ${boolTypst(smallCaps.section_titles)},`,
		`  typography-bold-name: ${boolTypst(bold.name)},`,
		`  typography-bold-headline: ${boolTypst(bold.headline)},`,
		`  typography-bold-connections: ${boolTypst(bold.connections)},`,
		`  typography-bold-section-titles: ${boolTypst(bold.section_titles)},`,
		`  links-underline: ${boolTypst(links.underline)},`,
		`  links-show-external-link-icon: ${boolTypst(links.show_external_link_icon)},`,
		`  header-alignment: ${header.alignment},`,
		`  header-photo-width: ${header.photo_width},`,
		`  header-space-below-name: ${header.space_below_name},`,
		`  header-space-below-headline: ${header.space_below_headline},`,
		`  header-space-below-connections: ${header.space_below_connections},`,
		`  header-connections-hyperlink: ${boolTypst(headerConnections.hyperlink)},`,
		`  header-connections-show-icons: ${boolTypst(headerConnections.show_icons)},`,
		`  header-connections-display-urls-instead-of-usernames: ${boolTypst(headerConnections.display_urls_instead_of_usernames)},`,
		`  header-connections-separator: "${typstStringContent(String(headerConnections.separator ?? ''))}",`,
		`  header-connections-space-between-connections: ${headerConnections.space_between_connections},`,
		`  section-titles-type: "${sectionTitles.type}",`,
		`  section-titles-line-thickness: ${sectionTitles.line_thickness},`,
		`  section-titles-space-above: ${sectionTitles.space_above},`,
		`  section-titles-space-below: ${sectionTitles.space_below},`,
		`  sections-allow-page-break: ${boolTypst(sections.allow_page_break)},`,
		`  sections-space-between-text-based-entries: ${sections.space_between_text_based_entries},`,
		`  sections-space-between-regular-entries: ${sections.space_between_regular_entries},`,
		`  entries-date-and-location-width: ${entries.date_and_location_width},`,
		`  entries-side-space: ${entries.side_space},`,
		`  entries-space-between-columns: ${entries.space_between_columns},`,
		`  entries-allow-page-break: ${boolTypst(entries.allow_page_break)},`,
		`  entries-short-second-row: ${boolTypst(entries.short_second_row)},`,
		`  entries-degree-width: ${entries.degree_width},`,
		`  entries-summary-space-left: ${entrySummary.space_left},`,
		`  entries-summary-space-above: ${entrySummary.space_above},`,
		`  entries-highlights-bullet: ${typstBullet(entryHighlights.bullet)},`,
		`  entries-highlights-nested-bullet: ${typstBullet(entryHighlights.nested_bullet)},`,
		`  entries-highlights-space-left: ${entryHighlights.space_left},`,
		`  entries-highlights-space-above: ${entryHighlights.space_above},`,
		`  entries-highlights-space-between-items: ${entryHighlights.space_between_items},`,
		`  entries-highlights-space-between-bullet-and-text: ${entryHighlights.space_between_bullet_and_text},`,
		'  date: datetime(',
		`    year: ${currentDate.getFullYear()},`,
		`    month: ${currentDate.getMonth() + 1},`,
		`    day: ${currentDate.getDate()},`,
		'  ),',
		')'
	].join('\n');
}

function renderHeader(
	source: CvSource,
	design: Record<string, unknown>,
	settings: RenderCvSettings
) {
	const cv = buildRenderCvDocument(source).cv as Record<string, unknown>;
	const lines: string[] = [];
	if (cv.name) lines.push(`= ${processString(String(cv.name), settings)}`);
	lines.push('');
	if (cv.headline) {
		lines.push(`  #headline([${processString(String(cv.headline), settings)}])`);
		lines.push('');
	}
	lines.push('#connections(');
	for (const connection of computeConnections(cv, design, settings)) {
		lines.push(`  [${connection}],`);
	}
	lines.push(')');
	return lines.join('\n');
}

function splitLines(value: unknown) {
	const text = String(value ?? '');
	return text ? text.split('\n') : [];
}

function renderIndentedLines(value: unknown) {
	return splitLines(value)
		.map((line) => `    ${line}\n\n`)
		.join('');
}

function renderPlainIndentedLines(value: unknown) {
	return splitLines(value)
		.map((line) => `    ${line}`)
		.join('\n');
}

function renderRegularEntry(entry: Record<string, unknown>, design: Record<string, unknown>) {
	const entries = childRecord(design, 'entries');
	const shortSecondRow = booleanValue(entries.short_second_row, true);
	const mainLines = splitLines(entry.main_column);
	const sideLines = splitLines(entry.date_and_location_column);
	const firstRowLines = shortSecondRow ? mainLines.length : Math.max(sideLines.length, 1);
	const firstRow = mainLines.slice(0, firstRowLines).join('\n');
	const secondRow = mainLines.slice(firstRowLines).join('\n');
	const lines = [
		'#regular-entry(',
		'  [',
		renderIndentedLines(firstRow).replace(/\n$/, ''),
		'  ],',
		'  [',
		renderIndentedLines(sideLines.join('\n')).replace(/\n$/, ''),
		'  ],'
	];
	if (!shortSecondRow) {
		lines.push('  main-column-second-row: [');
		lines.push(renderIndentedLines(secondRow).replace(/\n$/, ''));
		lines.push('  ],');
	}
	lines.push(')');
	return lines.filter((line) => line !== '').join('\n');
}

function renderEducationEntry(entry: Record<string, unknown>, design: Record<string, unknown>) {
	const regular = renderRegularEntry(entry, design).replace('#regular-entry(', '#education-entry(');
	const educationTemplate = childRecord(childRecord(design, 'templates'), 'education_entry');
	if (!educationTemplate.degree_column) return regular;
	return regular.replace(
		/\n\)$/,
		`\n  degree-column: [\n${renderPlainIndentedLines(entry.degree_column)}\n  ],\n)`
	);
}

function renderProcessedEntry(
	section: RenderCvSectionModel,
	entry: string | Record<string, unknown>,
	design: Record<string, unknown>
) {
	if (typeof entry === 'string') return entry;
	if (section.entryType === 'OneLineEntry') return String(entry.main_column ?? '');
	if (section.entryType === 'BulletEntry') return `- ${entry.bullet ?? ''}`;
	if (section.entryType === 'NumberedEntry') return `+ ${entry.number ?? ''}`;
	if (section.entryType === 'ReversedNumberedEntry') return `+ ${entry.reversed_number ?? ''}`;
	if (section.entryType === 'EducationEntry') return renderEducationEntry(entry, design);
	if (
		section.entryType === 'ExperienceEntry' ||
		section.entryType === 'NormalEntry' ||
		section.entryType === 'PublicationEntry'
	) {
		return renderRegularEntry(entry, design);
	}
	return String(entry);
}

function renderSection(section: RenderCvSectionModel, design: Record<string, unknown>) {
	const beginning =
		section.entryType === 'ReversedNumberedEntry'
			? `== ${section.title}\n\n#reversed-numbered-entries(\n  [\n`
			: `== ${section.title}\n`;
	const entries = section.entries
		.map((entry) => renderProcessedEntry(section, entry, design))
		.join('\n\n');
	const ending = section.entryType === 'ReversedNumberedEntry' ? '  ],\n)\n' : '';
	return `${beginning}\n${entries}\n${ending}`;
}

export function renderTypst(source: CvSource) {
	source = sourceWithoutSourceReferenceMarkers(source);
	const design = resolvedDesign(source);
	const locale = resolveLocale(source);
	const settings = resolveSettings(source);
	const preamble = renderPreamble(source, design, locale, settings);
	const header = renderHeader(source, design, settings);
	let code = `${preamble}\n\n\n${header}\n\n`;
	for (const section of processedSections(source, design, locale, settings)) {
		code += `\n${renderSection(section, design)}`;
	}
	return code;
}
