import {
  defineFormConfig,
  type RuntimePathFormConfig,
} from "@lapismd/design-core/forms/core";
import {
  addEntryLabel,
  defaultEntry,
  defaultSection,
  entryTitle,
  simpleListEntryMarker,
} from "./complete-cv-form.model";
import type {
  BulletEntry,
  CvFragment,
  CvSectionOf,
  DesignFragment,
  EducationEntry,
  ExperienceEntry,
  ExperienceExtraDetail,
  ExperienceRoleHistoryEntry,
  LocaleFragment,
  NormalEntry,
  NumberedEntry,
  OneLineEntry,
  PublicationEntry,
  ReversedNumberedEntry,
  SettingsFragment,
  SocialNetwork,
} from "./complete-cv-form.types";

const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }));

export const themeOptions = [
  { value: "classic", label: "Classic" },
  { value: "ember", label: "Ember" },
  { value: "engineeringclassic", label: "Engineering Classic" },
  { value: "engineeringresumes", label: "Engineering Resumes" },
  { value: "harvard", label: "Harvard" },
  { value: "ink", label: "Ink" },
  { value: "moderncv", label: "ModernCV" },
  { value: "opal", label: "Opal" },
  { value: "sb2nov", label: "SB2Nov" },
];

const fontFamilyOptions = options([
  "DejaVu Sans Mono",
  "EB Garamond",
  "Fontin",
  "Gentium Book Plus",
  "Lato",
  "Libertinus Serif",
  "Mukta",
  "New Computer Modern",
  "Noto Sans",
  "Open Sans",
  "Open Sauce Sans",
  "Poppins",
  "Raleway",
  "Roboto",
  "Source Sans 3",
  "Ubuntu",
  "XCharter",
]);

const socialNetworkConfig = defineFormConfig<SocialNetwork>()({
  id: "complete-cv-social-network",
  fields: {
    network: {
      kind: "options",
      label: "Network",
      options: options([
        "LinkedIn",
        "GitHub",
        "GitLab",
        "IMDB",
        "Instagram",
        "ORCID",
        "Mastodon",
        "StackOverflow",
        "ResearchGate",
        "YouTube",
        "Google Scholar",
        "Telegram",
        "WhatsApp",
        "Leetcode",
        "X",
        "Bluesky",
        "Reddit",
      ]),
    },
    username: { kind: "text", label: "Username" },
  },
});

const roleHistoryConfig = defineFormConfig<ExperienceRoleHistoryEntry>()({
  id: "complete-cv-role-history",
  fields: {
    position: { kind: "text", label: "Position" },
    date: { kind: "text", label: "Date" },
    start_date: { kind: "text", label: "Start date" },
    end_date: { kind: "text", label: "End date" },
    display_date: { kind: "text", label: "Display date" },
  },
});

const extraDetailConfig = defineFormConfig<ExperienceExtraDetail>()({
  id: "complete-cv-extra-detail",
  defaults: { content_type: "text", enabled: true, items: [] },
  fields: {
    id: { kind: "text", label: "ID" },
    title: { kind: "text", label: "Title" },
    content_type: {
      kind: "segmented",
      label: "Content type",
      options: [
        { value: "text", label: "Text" },
        { value: "comma_list", label: "Comma list" },
        { value: "semicolon_list", label: "Semicolon list" },
      ],
    },
    enabled: { kind: "boolean", label: "Enabled" },
    text: { kind: "textarea", label: "Text" },
    items: {
      kind: "ordered-string-list",
      label: "Items",
      addLabel: "detail",
    },
  },
});

const experienceEntryConfig = defineFormConfig<ExperienceEntry>()({
  id: "complete-cv-experience-entry",
  fields: {
    company: { kind: "text", label: "Company" },
    position: { kind: "text", label: "Position" },
    location: { kind: "text", label: "Location" },
    date: { kind: "text", label: "Date" },
    start_date: { kind: "text", label: "Start date" },
    end_date: { kind: "text", label: "End date" },
    display_date: { kind: "text", label: "Display date" },
    summary: { kind: "textarea", label: "Summary" },
    highlights: {
      kind: "ordered-string-list",
      label: "Highlights",
      addLabel: "Add",
    },
    role_history: {
      kind: "array",
      label: "Role History",
      presentation: "sections",
      appearance: "subsection",
      createItem: () => ({
        position: "Role",
        start_date: "",
        end_date: "",
        display_date: "",
      }),
      itemConfig: roleHistoryConfig,
      itemTitle: ({ item, index }) => item.position || `Role ${index + 1}`,
      itemTestId: ({ index }) => `role_history-${index}`,
      addLabel: "Add role history",
      addButtonPresentation: "panel",
      testId: "role-history",
    },
    extra_details: {
      kind: "array",
      label: "Extra Details",
      presentation: "sections",
      appearance: "subsection",
      createItem: () => ({
        id: "detail",
        title: "Extra detail",
        content_type: "text",
        enabled: true,
        items: [""],
      }),
      itemConfig: extraDetailConfig,
      itemTitle: ({ item, index }) => item.title || `Detail ${index + 1}`,
      itemTestId: ({ index }) => `extra_details-${index}`,
      addLabel: "Add extra detail",
      addButtonPresentation: "panel",
      testId: "extra-details",
    },
  },
});

const educationEntryConfig = defineFormConfig<EducationEntry>()({
  id: "complete-cv-education-entry",
  fields: {
    institution: { kind: "text", label: "Institution" },
    area: { kind: "text", label: "Area" },
    degree: { kind: "text", label: "Degree" },
    location: { kind: "text", label: "Location" },
    date: { kind: "text", label: "Date" },
    start_date: { kind: "text", label: "Start date" },
    end_date: { kind: "text", label: "End date" },
    display_date: { kind: "text", label: "Display date" },
    summary: { kind: "textarea", label: "Summary" },
    highlights: {
      kind: "ordered-string-list",
      label: "Highlights",
      addLabel: "Add",
    },
  },
});

const publicationEntryConfig = defineFormConfig<PublicationEntry>()({
  id: "complete-cv-publication-entry",
  fields: {
    title: { kind: "text", label: "Title" },
    journal: { kind: "text", label: "Journal" },
    date: { kind: "text", label: "Date" },
    doi: { kind: "text", label: "DOI" },
    url: { kind: "text", label: "URL", inputType: "url" },
    summary: { kind: "textarea", label: "Summary" },
    authors: {
      kind: "ordered-string-list",
      label: "Authors",
      addLabel: "author",
    },
  },
});

const oneLineEntryConfig = defineFormConfig<OneLineEntry>()({
  id: "complete-cv-one-line-entry",
  fields: {
    label: { kind: "text", label: "Label" },
    details: { kind: "textarea", label: "Details" },
  },
});

const bulletEntryConfig = defineFormConfig<BulletEntry>()({
  id: "complete-cv-bullet-entry",
  fields: { bullet: { kind: "textarea", label: "Bullet" } },
});

const numberedEntryConfig = defineFormConfig<NumberedEntry>()({
  id: "complete-cv-numbered-entry",
  fields: { number: { kind: "textarea", label: "Numbered item" } },
});

const reversedNumberedEntryConfig = defineFormConfig<ReversedNumberedEntry>()({
  id: "complete-cv-reversed-numbered-entry",
  fields: {
    reversed_number: {
      kind: "textarea",
      label: "Reversed numbered item",
    },
  },
});

const normalEntryConfig = defineFormConfig<NormalEntry>()({
  id: "complete-cv-normal-entry",
  fields: {
    name: { kind: "text", label: "Name" },
    url: { kind: "text", label: "URL", inputType: "url" },
    date: { kind: "text", label: "Date" },
    start_date: { kind: "text", label: "Start date" },
    end_date: { kind: "text", label: "End date" },
    display_date: { kind: "text", label: "Display date" },
    location: { kind: "text", label: "Location" },
    summary: { kind: "textarea", label: "Summary" },
    highlights: {
      kind: "ordered-string-list",
      label: "Highlights",
      addLabel: "Add",
    },
  },
});

const experienceSectionConfig = defineFormConfig<
  CvSectionOf<"ExperienceEntry">
>()({
  id: "complete-cv-section-ExperienceEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      presentation: "sections",
      createItem: () => defaultEntry("ExperienceEntry"),
      itemConfig: experienceEntryConfig,
      itemTitle: ({ item, index }) =>
        entryTitle("ExperienceEntry", item, index),
      addLabel: `Add ${addEntryLabel("ExperienceEntry")}`,
      itemTestId: ({ index }) => `entry-ExperienceEntry-${index}`,
    },
  },
});

const educationSectionConfig = defineFormConfig<
  CvSectionOf<"EducationEntry">
>()({
  id: "complete-cv-section-EducationEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      presentation: "sections",
      createItem: () => defaultEntry("EducationEntry"),
      itemConfig: educationEntryConfig,
      itemTitle: ({ item, index }) => entryTitle("EducationEntry", item, index),
      addLabel: `Add ${addEntryLabel("EducationEntry")}`,
      itemTestId: ({ index }) => `entry-EducationEntry-${index}`,
    },
  },
});

const publicationSectionConfig = defineFormConfig<
  CvSectionOf<"PublicationEntry">
>()({
  id: "complete-cv-section-PublicationEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      presentation: "sections",
      createItem: () => defaultEntry("PublicationEntry"),
      itemConfig: publicationEntryConfig,
      itemTitle: ({ item, index }) =>
        entryTitle("PublicationEntry", item, index),
      addLabel: `Add ${addEntryLabel("PublicationEntry")}`,
      itemTestId: ({ index }) => `entry-PublicationEntry-${index}`,
    },
  },
});

const normalSectionConfig = defineFormConfig<CvSectionOf<"NormalEntry">>()({
  id: "complete-cv-section-NormalEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      presentation: "sections",
      createItem: () => defaultEntry("NormalEntry"),
      itemConfig: normalEntryConfig,
      itemTitle: ({ item, index }) => entryTitle("NormalEntry", item, index),
      addLabel: `Add ${addEntryLabel("NormalEntry")}`,
      itemTestId: ({ index }) => `entry-NormalEntry-${index}`,
    },
  },
});

const textSectionConfig = defineFormConfig<CvSectionOf<"TextEntry">>()({
  id: "complete-cv-section-TextEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Text",
      showLabel: false,
      presentation: "rows",
      createItem: () => defaultEntry("TextEntry"),
      itemField: { kind: "textarea", label: "Text", hideLabel: true },
      itemTitle: ({ item, index }) => entryTitle("TextEntry", item, index),
      addLabel: "Add",
    },
  },
});

const oneLineSectionConfig = defineFormConfig<CvSectionOf<"OneLineEntry">>()({
  id: "complete-cv-section-OneLineEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      presentation: "rows",
      createItem: () => defaultEntry("OneLineEntry"),
      itemConfig: oneLineEntryConfig,
      itemTitle: ({ item, index }) => entryTitle("OneLineEntry", item, index),
      addLabel: `Add ${addEntryLabel("OneLineEntry")}`,
    },
  },
});

const bulletSectionConfig = defineFormConfig<CvSectionOf<"BulletEntry">>()({
  id: "complete-cv-section-BulletEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      hideItemLabels: true,
      presentation: "rows",
      createItem: () => defaultEntry("BulletEntry"),
      itemConfig: bulletEntryConfig,
      itemTitle: ({ item, index }) => entryTitle("BulletEntry", item, index),
      marker: ({ index, total }) =>
        simpleListEntryMarker("BulletEntry", index, total),
      markerSpacing: "wide",
      addLabel: `Add ${addEntryLabel("BulletEntry")}`,
    },
  },
});

const numberedSectionConfig = defineFormConfig<CvSectionOf<"NumberedEntry">>()({
  id: "complete-cv-section-NumberedEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      hideItemLabels: true,
      presentation: "rows",
      createItem: () => defaultEntry("NumberedEntry"),
      itemConfig: numberedEntryConfig,
      itemTitle: ({ item, index }) => entryTitle("NumberedEntry", item, index),
      marker: ({ index, total }) =>
        simpleListEntryMarker("NumberedEntry", index, total),
      addLabel: `Add ${addEntryLabel("NumberedEntry")}`,
    },
  },
});

const reversedNumberedSectionConfig = defineFormConfig<
  CvSectionOf<"ReversedNumberedEntry">
>()({
  id: "complete-cv-section-ReversedNumberedEntry",
  fields: {
    entries: {
      kind: "array",
      label: "Entries",
      showLabel: false,
      hideItemLabels: true,
      presentation: "rows",
      createItem: () => defaultEntry("ReversedNumberedEntry"),
      itemConfig: reversedNumberedEntryConfig,
      itemTitle: ({ item, index }) =>
        entryTitle("ReversedNumberedEntry", item, index),
      marker: ({ index, total }) =>
        simpleListEntryMarker("ReversedNumberedEntry", index, total),
      addLabel: `Add ${addEntryLabel("ReversedNumberedEntry")}`,
    },
  },
});

export const completeCvConfig: RuntimePathFormConfig<CvFragment> =
  defineFormConfig<CvFragment>()({
  id: "complete-cv",
  layout: "stacked",
  validationMode: "onTouched",
  groups: {
    profile: { title: "Profile", collapsible: true, hiddenHeader: true },
    sections: { title: "Sections", collapsible: true, hiddenHeader: true },
  },
  fields: {
    name: { kind: "text", label: "Name", group: "profile" },
    headline: { kind: "text", label: "Headline", group: "profile" },
    location: { kind: "text", label: "Location", group: "profile" },
    email: {
      kind: "text",
      label: "Email",
      inputType: "email",
      group: "profile",
    },
    phone: {
      kind: "text",
      label: "Phone",
      inputType: "tel",
      group: "profile",
    },
    website: {
      kind: "text",
      label: "Website",
      inputType: "url",
      group: "profile",
    },
    last_updated: {
      kind: "text",
      label: "Last updated",
      group: "profile",
    },
    social_networks: {
      kind: "array",
      label: "Social Networks",
      group: "profile",
      presentation: "rows",
      addPlacement: "header",
      addLabel: "Add",
      createItem: () => ({ network: "LinkedIn", username: "" }),
      itemConfig: socialNetworkConfig,
      itemTitle: ({ item, index }) =>
        item.network || `Social network ${index + 1}`,
      testId: "social-networks",
    },
    target_roles: {
      kind: "ordered-string-list",
      label: "Target Roles",
      group: "profile",
      addLabel: "Add",
    },
    sections: {
      kind: "variant-array",
      label: "Sections",
      group: "sections",
      showLabel: false,
      presentation: "sections",
      discriminator: "entry_type",
      editableTitlePath: "title",
      itemTitle: "title",
      getKey: (section) => section.id,
      itemTestId: ({ item }) => `cv-section-${item.entry_type}`,
      addLabel: "Add New Section",
      variants: {
        TextEntry: {
          label: "Text",
          createItem: () => defaultSection("TextEntry"),
          itemConfig: textSectionConfig,
        },
        ExperienceEntry: {
          label: "Experience Entry",
          createItem: () => defaultSection("ExperienceEntry"),
          itemConfig: experienceSectionConfig,
        },
        EducationEntry: {
          label: "Education Entry",
          createItem: () => defaultSection("EducationEntry"),
          itemConfig: educationSectionConfig,
        },
        PublicationEntry: {
          label: "Publication Entry",
          createItem: () => defaultSection("PublicationEntry"),
          itemConfig: publicationSectionConfig,
        },
        OneLineEntry: {
          label: "One-Line Entry",
          createItem: () => defaultSection("OneLineEntry"),
          itemConfig: oneLineSectionConfig,
        },
        BulletEntry: {
          label: "Bullet Entry",
          createItem: () => defaultSection("BulletEntry"),
          itemConfig: bulletSectionConfig,
        },
        NumberedEntry: {
          label: "Numbered Entry",
          createItem: () => defaultSection("NumberedEntry"),
          itemConfig: numberedSectionConfig,
        },
        ReversedNumberedEntry: {
          label: "Reversed Numbered Entry",
          createItem: () => defaultSection("ReversedNumberedEntry"),
          itemConfig: reversedNumberedSectionConfig,
        },
        NormalEntry: {
          label: "Normal Entry",
          createItem: () => defaultSection("NormalEntry"),
          itemConfig: normalSectionConfig,
        },
      },
    },
  },
});

export const completeDesignConfig: RuntimePathFormConfig<DesignFragment> =
  defineFormConfig<DesignFragment>()({
  id: "complete-cv-design",
  layout: "stacked",
  groups: {
    "design-theme": {
      title: "Theme",
      collapsible: true,
    },
    "design-page": {
      title: "Page",
      collapsible: true,
    },
    "design-colors": {
      title: "Colors",
      collapsible: true,
    },
    "design-typography": {
      title: "Typography",
      collapsible: true,
    },
    "design-font-family": {
      title: "Font Family",
      collapsible: true,
    },
    "design-font-size": {
      title: "Font Size",
      collapsible: true,
    },
    "design-small-caps": {
      title: "Small Caps",
      collapsible: true,
    },
    "design-bold": {
      title: "Bold",
      collapsible: true,
    },
    "design-links": {
      title: "Links",
      collapsible: true,
    },
    "design-header": {
      title: "Header",
      collapsible: true,
    },
    "design-header-connections": {
      title: "Header Connections",
      collapsible: true,
    },
    "design-section-titles": {
      title: "Section Titles",
      collapsible: true,
    },
    "design-sections": {
      title: "Sections",
      collapsible: true,
    },
    "design-entries": {
      title: "Entries",
      collapsible: true,
    },
    "design-entry-summary": {
      title: "Entry Summary",
      collapsible: true,
    },
    "design-entry-highlights": {
      title: "Entry Highlights",
      collapsible: true,
    },
    "design-templates": {
      title: "Templates",
      collapsible: true,
    },
    "design-one_line_entry": {
      title: "One-Line Entry Template",
      collapsible: true,
    },
    "design-education_entry": {
      title: "Education Entry Template",
      collapsible: true,
    },
    "design-normal_entry": {
      title: "Normal Entry Template",
      collapsible: true,
    },
    "design-experience_entry": {
      title: "Experience Entry Template",
      collapsible: true,
    },
    "design-publication_entry": {
      title: "Publication Entry Template",
      collapsible: true,
    },
  },
  fields: {
    theme: {
      kind: "options",
      label: "Theme",
      group: "design-theme",
      defaultValue: "moderncv",
      presentation: "cycle",
      options: themeOptions,
    },
    "page.size": {
      kind: "options",
      label: "Page size",
      group: "design-page",
      defaultValue: "a4",
      options: [
        {
          value: "a4",
          label: "A4",
        },
        {
          value: "a5",
          label: "A5",
        },
        {
          value: "us-letter",
          label: "US Letter",
        },
        {
          value: "us-executive",
          label: "US Executive",
        },
      ],
    },
    "page.top_margin": {
      kind: "text",
      label: "Top margin",
      group: "design-page",
    },
    "page.bottom_margin": {
      kind: "text",
      label: "Bottom margin",
      group: "design-page",
    },
    "page.left_margin": {
      kind: "text",
      label: "Left margin",
      group: "design-page",
    },
    "page.right_margin": {
      kind: "text",
      label: "Right margin",
      group: "design-page",
    },
    "page.show_footer": {
      kind: "boolean",
      label: "Show footer",
      group: "design-page",
      defaultValue: true,
    },
    "page.show_top_note": {
      kind: "boolean",
      label: "Show top note",
      group: "design-page",
      defaultValue: true,
    },
    "colors.body": {
      kind: "color",
      label: "Body",
      group: "design-colors",
      placeholder: "rgb(0, 0, 0)",
      colorFormat: "hex-without-hash",
    },
    "colors.name": {
      kind: "color",
      label: "Name",
      group: "design-colors",
      placeholder: "rgb(0, 79, 144)",
      colorFormat: "hex-without-hash",
    },
    "colors.headline": {
      kind: "color",
      label: "Headline",
      group: "design-colors",
      placeholder: "rgb(0, 79, 144)",
      colorFormat: "hex-without-hash",
    },
    "colors.connections": {
      kind: "color",
      label: "Connections",
      group: "design-colors",
      placeholder: "rgb(0, 79, 144)",
      colorFormat: "hex-without-hash",
    },
    "colors.section_titles": {
      kind: "color",
      label: "Section titles",
      group: "design-colors",
      placeholder: "rgb(0, 79, 144)",
      colorFormat: "hex-without-hash",
    },
    "colors.links": {
      kind: "color",
      label: "Links",
      group: "design-colors",
      placeholder: "rgb(0, 79, 144)",
      colorFormat: "hex-without-hash",
    },
    "colors.footer": {
      kind: "color",
      label: "Footer",
      group: "design-colors",
      placeholder: "rgb(128, 128, 128)",
      colorFormat: "hex-without-hash",
    },
    "colors.top_note": {
      kind: "color",
      label: "Top note",
      group: "design-colors",
      placeholder: "rgb(128, 128, 128)",
      colorFormat: "hex-without-hash",
    },
    "typography.line_spacing": {
      kind: "text",
      label: "Line spacing",
      group: "design-typography",
    },
    "typography.alignment": {
      kind: "segmented",
      label: "Alignment",
      group: "design-typography",
      defaultValue: "left",
      options: [
        {
          value: "left",
          label: "left",
        },
        {
          value: "justified",
          label: "justified",
        },
        {
          value: "justified-with-no-hyphenation",
          label: "justified-with-no-hyphenation",
        },
      ],
    },
    "typography.date_and_location_column_alignment": {
      kind: "segmented",
      label: "Date/location",
      group: "design-typography",
      defaultValue: "right",
      options: [
        {
          value: "left",
          label: "left",
        },
        {
          value: "center",
          label: "center",
        },
        {
          value: "right",
          label: "right",
        },
      ],
    },
    "typography.font_family.body": {
      kind: "options",
      label: "Body",
      group: "design-font-family",
      defaultValue: "Fontin",
      presentation: "cycle",
      optionPreview: "font",
      options: fontFamilyOptions,
    },
    "typography.font_family.name": {
      kind: "options",
      label: "Name",
      group: "design-font-family",
      defaultValue: "Fontin",
      presentation: "cycle",
      optionPreview: "font",
      options: fontFamilyOptions,
    },
    "typography.font_family.headline": {
      kind: "options",
      label: "Headline",
      group: "design-font-family",
      defaultValue: "Fontin",
      presentation: "cycle",
      optionPreview: "font",
      options: fontFamilyOptions,
    },
    "typography.font_family.connections": {
      kind: "options",
      label: "Connections",
      group: "design-font-family",
      defaultValue: "Fontin",
      presentation: "cycle",
      optionPreview: "font",
      options: fontFamilyOptions,
    },
    "typography.font_family.section_titles": {
      kind: "options",
      label: "Section titles",
      group: "design-font-family",
      defaultValue: "Fontin",
      presentation: "cycle",
      optionPreview: "font",
      options: fontFamilyOptions,
    },
    "typography.font_size.body": {
      kind: "text",
      label: "Body",
      group: "design-font-size",
    },
    "typography.font_size.name": {
      kind: "text",
      label: "Name",
      group: "design-font-size",
    },
    "typography.font_size.headline": {
      kind: "text",
      label: "Headline",
      group: "design-font-size",
    },
    "typography.font_size.connections": {
      kind: "text",
      label: "Connections",
      group: "design-font-size",
    },
    "typography.font_size.section_titles": {
      kind: "text",
      label: "Section titles",
      group: "design-font-size",
    },
    "typography.small_caps.name": {
      kind: "boolean",
      label: "Name",
      group: "design-small-caps",
      defaultValue: false,
    },
    "typography.small_caps.headline": {
      kind: "boolean",
      label: "Headline",
      group: "design-small-caps",
      defaultValue: false,
    },
    "typography.small_caps.connections": {
      kind: "boolean",
      label: "Connections",
      group: "design-small-caps",
      defaultValue: false,
    },
    "typography.small_caps.section_titles": {
      kind: "boolean",
      label: "Section titles",
      group: "design-small-caps",
      defaultValue: false,
    },
    "typography.bold.name": {
      kind: "boolean",
      label: "Name",
      group: "design-bold",
      defaultValue: false,
    },
    "typography.bold.headline": {
      kind: "boolean",
      label: "Headline",
      group: "design-bold",
      defaultValue: false,
    },
    "typography.bold.connections": {
      kind: "boolean",
      label: "Connections",
      group: "design-bold",
      defaultValue: false,
    },
    "typography.bold.section_titles": {
      kind: "boolean",
      label: "Section titles",
      group: "design-bold",
      defaultValue: false,
    },
    "typography.bold.links": {
      kind: "boolean",
      label: "Links",
      group: "design-bold",
      defaultValue: false,
    },
    "links.underline": {
      kind: "boolean",
      label: "Underline",
      group: "design-links",
      defaultValue: false,
    },
    "links.show_external_link_icon": {
      kind: "boolean",
      label: "Show external link icon",
      group: "design-links",
      defaultValue: true,
    },
    "header.alignment": {
      kind: "segmented",
      label: "Alignment",
      group: "design-header",
      defaultValue: "center",
      options: [
        {
          value: "left",
          label: "left",
        },
        {
          value: "center",
          label: "center",
        },
        {
          value: "right",
          label: "right",
        },
      ],
    },
    "header.photo_position": {
      kind: "segmented",
      label: "Photo position",
      group: "design-header",
      defaultValue: "right",
      options: [
        {
          value: "left",
          label: "left",
        },
        {
          value: "right",
          label: "right",
        },
      ],
    },
    "header.photo_width": {
      kind: "text",
      label: "Photo width",
      group: "design-header",
    },
    "header.photo_space_left": {
      kind: "text",
      label: "Photo space left",
      group: "design-header",
    },
    "header.photo_space_right": {
      kind: "text",
      label: "Photo space right",
      group: "design-header",
    },
    "header.space_below_name": {
      kind: "text",
      label: "Space below name",
      group: "design-header",
    },
    "header.space_below_headline": {
      kind: "text",
      label: "Space below headline",
      group: "design-header",
    },
    "header.space_below_connections": {
      kind: "text",
      label: "Space below connections",
      group: "design-header",
    },
    "header.connections.phone_number_format": {
      kind: "options",
      label: "Phone number format",
      group: "design-header-connections",
      defaultValue: "national",
      options: [
        {
          value: "national",
          label: "national",
        },
        {
          value: "international",
          label: "international",
        },
        {
          value: "E164",
          label: "E164",
        },
      ],
    },
    "header.connections.hyperlink": {
      kind: "boolean",
      label: "Hyperlink",
      group: "design-header-connections",
      defaultValue: true,
    },
    "header.connections.show_icons": {
      kind: "boolean",
      label: "Show icons",
      group: "design-header-connections",
      defaultValue: true,
    },
    "header.connections.display_urls_instead_of_usernames": {
      kind: "boolean",
      label: "Display urls instead of usernames",
      group: "design-header-connections",
      defaultValue: false,
    },
    "header.connections.separator": {
      kind: "text",
      label: "Separator",
      group: "design-header-connections",
    },
    "header.connections.space_between_connections": {
      kind: "text",
      label: "Space between connections",
      group: "design-header-connections",
    },
    "section_titles.type": {
      kind: "options",
      label: "Type",
      group: "design-section-titles",
      defaultValue: "with_partial_line",
      options: [
        {
          value: "with_partial_line",
          label: "with_partial_line",
        },
        {
          value: "with_full_line",
          label: "with_full_line",
        },
        {
          value: "without_line",
          label: "without_line",
        },
        {
          value: "moderncv",
          label: "moderncv",
        },
        {
          value: "centered_without_line",
          label: "centered_without_line",
        },
        {
          value: "centered_with_partial_line",
          label: "centered_with_partial_line",
        },
        {
          value: "centered_with_centered_partial_line",
          label: "centered_with_centered_partial_line",
        },
        {
          value: "centered_with_full_line",
          label: "centered_with_full_line",
        },
      ],
    },
    "section_titles.line_thickness": {
      kind: "text",
      label: "Line thickness",
      group: "design-section-titles",
    },
    "section_titles.space_above": {
      kind: "text",
      label: "Space above",
      group: "design-section-titles",
    },
    "section_titles.space_below": {
      kind: "text",
      label: "Space below",
      group: "design-section-titles",
    },
    "sections.allow_page_break": {
      kind: "boolean",
      label: "Allow page break",
      group: "design-sections",
      defaultValue: true,
    },
    "sections.space_between_regular_entries": {
      kind: "text",
      label: "Space between regular entries",
      group: "design-sections",
    },
    "sections.space_between_text_based_entries": {
      kind: "text",
      label: "Space between text based entries",
      group: "design-sections",
    },
    "sections.show_time_spans_in": {
      kind: "ordered-string-list",
      label: "Show time spans in",
      group: "design-sections",
      addLabel: "section",
    },
    "entries.date_and_location_width": {
      kind: "text",
      label: "Date and location width",
      group: "design-entries",
    },
    "entries.side_space": {
      kind: "text",
      label: "Side space",
      group: "design-entries",
    },
    "entries.space_between_columns": {
      kind: "text",
      label: "Space between columns",
      group: "design-entries",
    },
    "entries.degree_width": {
      kind: "text",
      label: "Degree width",
      group: "design-entries",
    },
    "entries.allow_page_break": {
      kind: "boolean",
      label: "Allow page break",
      group: "design-entries",
      defaultValue: true,
    },
    "entries.short_second_row": {
      kind: "boolean",
      label: "Short second row",
      group: "design-entries",
      defaultValue: false,
    },
    "entries.summary.space_above": {
      kind: "text",
      label: "Space above",
      group: "design-entry-summary",
    },
    "entries.summary.space_left": {
      kind: "text",
      label: "Space left",
      group: "design-entry-summary",
    },
    "entries.highlights.bullet": {
      kind: "options",
      label: "Bullet",
      group: "design-entry-highlights",
      defaultValue: "•",
      options: [
        {
          value: "●",
          label: "●",
        },
        {
          value: "•",
          label: "•",
        },
        {
          value: "◦",
          label: "◦",
        },
        {
          value: "-",
          label: "-",
        },
        {
          value: "◆",
          label: "◆",
        },
        {
          value: "★",
          label: "★",
        },
        {
          value: "■",
          label: "■",
        },
        {
          value: "—",
          label: "—",
        },
        {
          value: "○",
          label: "○",
        },
      ],
    },
    "entries.highlights.nested_bullet": {
      kind: "options",
      label: "Nested bullet",
      group: "design-entry-highlights",
      defaultValue: "•",
      options: [
        {
          value: "●",
          label: "●",
        },
        {
          value: "•",
          label: "•",
        },
        {
          value: "◦",
          label: "◦",
        },
        {
          value: "-",
          label: "-",
        },
        {
          value: "◆",
          label: "◆",
        },
        {
          value: "★",
          label: "★",
        },
        {
          value: "■",
          label: "■",
        },
        {
          value: "—",
          label: "—",
        },
        {
          value: "○",
          label: "○",
        },
      ],
    },
    "entries.highlights.space_left": {
      kind: "text",
      label: "Space left",
      group: "design-entry-highlights",
    },
    "entries.highlights.space_above": {
      kind: "text",
      label: "Space above",
      group: "design-entry-highlights",
    },
    "entries.highlights.space_between_items": {
      kind: "text",
      label: "Space between items",
      group: "design-entry-highlights",
    },
    "entries.highlights.space_between_bullet_and_text": {
      kind: "text",
      label: "Space between bullet and text",
      group: "design-entry-highlights",
    },
    "templates.footer": {
      kind: "textarea",
      label: "Footer",
      group: "design-templates",
    },
    "templates.top_note": {
      kind: "textarea",
      label: "Top note",
      group: "design-templates",
    },
    "templates.single_date": {
      kind: "textarea",
      label: "Single date",
      group: "design-templates",
    },
    "templates.date_range": {
      kind: "textarea",
      label: "Date range",
      group: "design-templates",
    },
    "templates.time_span": {
      kind: "textarea",
      label: "Time span",
      group: "design-templates",
    },
    "templates.one_line_entry.main_column": {
      kind: "textarea",
      label: "Main column",
      group: "design-one_line_entry",
    },
    "templates.education_entry.main_column": {
      kind: "textarea",
      label: "Main column",
      group: "design-education_entry",
    },
    "templates.education_entry.degree_column": {
      kind: "textarea",
      label: "Degree column",
      group: "design-education_entry",
    },
    "templates.education_entry.date_and_location_column": {
      kind: "textarea",
      label: "Date and location column",
      group: "design-education_entry",
    },
    "templates.normal_entry.main_column": {
      kind: "textarea",
      label: "Main column",
      group: "design-normal_entry",
    },
    "templates.normal_entry.date_and_location_column": {
      kind: "textarea",
      label: "Date and location column",
      group: "design-normal_entry",
    },
    "templates.experience_entry.main_column": {
      kind: "textarea",
      label: "Main column",
      group: "design-experience_entry",
    },
    "templates.experience_entry.date_and_location_column": {
      kind: "textarea",
      label: "Date and location column",
      group: "design-experience_entry",
    },
    "templates.publication_entry.main_column": {
      kind: "textarea",
      label: "Main column",
      group: "design-publication_entry",
    },
    "templates.publication_entry.date_and_location_column": {
      kind: "textarea",
      label: "Date and location column",
      group: "design-publication_entry",
    },
  },
});

export const completeLocaleConfig: RuntimePathFormConfig<LocaleFragment> =
  defineFormConfig<LocaleFragment>()({
  id: "complete-cv-locale",
  layout: "stacked",
  defaults: {
    language: "english",
    last_updated: "Last updated in",
    present: "present",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
    phrases: { degree_with_area: "DEGREE in AREA" },
    month_abbreviations: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ],
    month_names: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  groups: {
    "locale-language": {
      title: "Language",
      collapsible: true,
    },
    "locale-last-updated": {
      title: "Last Updated",
      collapsible: true,
    },
    "locale-phrases": {
      title: "Phrases",
      collapsible: true,
    },
    "locale-month-abbreviations": {
      title: "Month Abbreviations",
      collapsible: true,
    },
    "locale-month-names": {
      title: "Month Names",
      collapsible: true,
    },
  },
  fields: {
    language: {
      kind: "options",
      label: "Language",
      group: "locale-language",
      defaultValue: "english",
      options: [
        {
          value: "english",
          label: "english",
        },
        {
          value: "arabic",
          label: "arabic",
        },
        {
          value: "danish",
          label: "danish",
        },
        {
          value: "dutch",
          label: "dutch",
        },
        {
          value: "french",
          label: "french",
        },
        {
          value: "german",
          label: "german",
        },
        {
          value: "hebrew",
          label: "hebrew",
        },
        {
          value: "hindi",
          label: "hindi",
        },
        {
          value: "hungarian",
          label: "hungarian",
        },
        {
          value: "indonesian",
          label: "indonesian",
        },
        {
          value: "italian",
          label: "italian",
        },
        {
          value: "japanese",
          label: "japanese",
        },
        {
          value: "korean",
          label: "korean",
        },
        {
          value: "mandarin_chinese",
          label: "mandarin_chinese",
        },
        {
          value: "norwegian_bokmål",
          label: "norwegian_bokmål",
        },
        {
          value: "norwegian_nynorsk",
          label: "norwegian_nynorsk",
        },
        {
          value: "persian",
          label: "persian",
        },
        {
          value: "portuguese",
          label: "portuguese",
        },
        {
          value: "russian",
          label: "russian",
        },
        {
          value: "spanish",
          label: "spanish",
        },
        {
          value: "turkish",
          label: "turkish",
        },
        {
          value: "vietnamese",
          label: "vietnamese",
        },
      ],
    },
    last_updated: {
      kind: "text",
      label: "Last updated in",
      group: "locale-last-updated",
      defaultValue: "Last updated in",
    },
    present: {
      kind: "text",
      label: "Present",
      group: "locale-last-updated",
      defaultValue: "present",
    },
    month: {
      kind: "text",
      label: "Month",
      group: "locale-last-updated",
      defaultValue: "month",
    },
    months: {
      kind: "text",
      label: "Months",
      group: "locale-last-updated",
      defaultValue: "months",
    },
    year: {
      kind: "text",
      label: "Year",
      group: "locale-last-updated",
      defaultValue: "year",
    },
    years: {
      kind: "text",
      label: "Years",
      group: "locale-last-updated",
      defaultValue: "years",
    },
    "phrases.degree_with_area": {
      kind: "text",
      label: "Degree with area",
      group: "locale-phrases",
      defaultValue: "DEGREE in AREA",
    },
    "month_abbreviations.0": {
      kind: "text",
      label: "January",
      group: "locale-month-abbreviations",
      defaultValue: "Jan",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.1": {
      kind: "text",
      label: "February",
      group: "locale-month-abbreviations",
      defaultValue: "Feb",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.2": {
      kind: "text",
      label: "March",
      group: "locale-month-abbreviations",
      defaultValue: "Mar",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.3": {
      kind: "text",
      label: "April",
      group: "locale-month-abbreviations",
      defaultValue: "Apr",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.4": {
      kind: "text",
      label: "May",
      group: "locale-month-abbreviations",
      defaultValue: "May",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.5": {
      kind: "text",
      label: "June",
      group: "locale-month-abbreviations",
      defaultValue: "June",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.6": {
      kind: "text",
      label: "July",
      group: "locale-month-abbreviations",
      defaultValue: "July",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.7": {
      kind: "text",
      label: "August",
      group: "locale-month-abbreviations",
      defaultValue: "Aug",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.8": {
      kind: "text",
      label: "September",
      group: "locale-month-abbreviations",
      defaultValue: "Sept",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.9": {
      kind: "text",
      label: "October",
      group: "locale-month-abbreviations",
      defaultValue: "Oct",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.10": {
      kind: "text",
      label: "November",
      group: "locale-month-abbreviations",
      defaultValue: "Nov",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_abbreviations.11": {
      kind: "text",
      label: "December",
      group: "locale-month-abbreviations",
      defaultValue: "Dec",
      materializeDefaultFrom: "month_abbreviations",
    },
    "month_names.0": {
      kind: "text",
      label: "January",
      group: "locale-month-names",
      defaultValue: "January",
      materializeDefaultFrom: "month_names",
    },
    "month_names.1": {
      kind: "text",
      label: "February",
      group: "locale-month-names",
      defaultValue: "February",
      materializeDefaultFrom: "month_names",
    },
    "month_names.2": {
      kind: "text",
      label: "March",
      group: "locale-month-names",
      defaultValue: "March",
      materializeDefaultFrom: "month_names",
    },
    "month_names.3": {
      kind: "text",
      label: "April",
      group: "locale-month-names",
      defaultValue: "April",
      materializeDefaultFrom: "month_names",
    },
    "month_names.4": {
      kind: "text",
      label: "May",
      group: "locale-month-names",
      defaultValue: "May",
      materializeDefaultFrom: "month_names",
    },
    "month_names.5": {
      kind: "text",
      label: "June",
      group: "locale-month-names",
      defaultValue: "June",
      materializeDefaultFrom: "month_names",
    },
    "month_names.6": {
      kind: "text",
      label: "July",
      group: "locale-month-names",
      defaultValue: "July",
      materializeDefaultFrom: "month_names",
    },
    "month_names.7": {
      kind: "text",
      label: "August",
      group: "locale-month-names",
      defaultValue: "August",
      materializeDefaultFrom: "month_names",
    },
    "month_names.8": {
      kind: "text",
      label: "September",
      group: "locale-month-names",
      defaultValue: "September",
      materializeDefaultFrom: "month_names",
    },
    "month_names.9": {
      kind: "text",
      label: "October",
      group: "locale-month-names",
      defaultValue: "October",
      materializeDefaultFrom: "month_names",
    },
    "month_names.10": {
      kind: "text",
      label: "November",
      group: "locale-month-names",
      defaultValue: "November",
      materializeDefaultFrom: "month_names",
    },
    "month_names.11": {
      kind: "text",
      label: "December",
      group: "locale-month-names",
      defaultValue: "December",
      materializeDefaultFrom: "month_names",
    },
  },
});

export const completeSettingsConfig: RuntimePathFormConfig<SettingsFragment> =
  defineFormConfig<SettingsFragment>()({
  id: "complete-cv-settings",
  layout: "stacked",
  defaults: {
    current_date: "today",
    pdf_title: "NAME - CV",
    bold_keywords: [],
  },
  groups: {
    document: {
      title: "Document Settings",
      collapsible: true,
      appearance: "subtle",
    },
  },
  fields: {
    current_date: {
      kind: "text",
      label: "Current date",
      group: "document",
    },
    pdf_title: { kind: "text", label: "PDF title", group: "document" },
    bold_keywords: {
      kind: "ordered-string-list",
      label: "Bold keywords",
      addLabel: "keyword",
      group: "document",
    },
  },
});
