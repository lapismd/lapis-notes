export const CV_ENTRY_TYPES = [
  "TextEntry",
  "ExperienceEntry",
  "EducationEntry",
  "PublicationEntry",
  "OneLineEntry",
  "BulletEntry",
  "NumberedEntry",
  "ReversedNumberedEntry",
  "NormalEntry",
] as const;

export type CvEntryType = (typeof CV_ENTRY_TYPES)[number];
export type CvStoryTab = "cv" | "design" | "locale" | "settings";
export type PathPart = string | number;
export type StoryRecord = Record<string, unknown>;

export type DatedEntry = {
  date?: string;
  start_date?: string;
  end_date?: string;
  display_date?: string;
};

export type ExperienceRoleHistoryEntry = DatedEntry & {
  position?: string;
};

export type ExperienceExtraDetail = {
  id?: string;
  title?: string;
  content_type?: "text" | "comma_list" | "semicolon_list";
  enabled?: boolean;
  text?: string;
  items?: string[];
};

export type ExperienceEntry = DatedEntry & {
  company?: string;
  position?: string;
  location?: string;
  summary?: string;
  highlights?: string[];
  role_history?: ExperienceRoleHistoryEntry[];
  extra_details?: ExperienceExtraDetail[];
};

export type EducationEntry = DatedEntry & {
  institution?: string;
  area?: string;
  degree?: string;
  location?: string;
  summary?: string;
  highlights?: string[];
};

export type PublicationEntry = {
  title?: string;
  journal?: string;
  date?: string;
  doi?: string;
  url?: string;
  summary?: string;
  authors?: string[];
};

export type OneLineEntry = { label?: string; details?: string };
export type BulletEntry = { bullet?: string };
export type NumberedEntry = { number?: string };
export type ReversedNumberedEntry = { reversed_number?: string };

export type NormalEntry = DatedEntry & {
  name?: string;
  url?: string;
  location?: string;
  summary?: string;
  highlights?: string[];
};

export type CvEntryByType = {
  TextEntry: string;
  ExperienceEntry: ExperienceEntry;
  EducationEntry: EducationEntry;
  PublicationEntry: PublicationEntry;
  OneLineEntry: OneLineEntry;
  BulletEntry: BulletEntry;
  NumberedEntry: NumberedEntry;
  ReversedNumberedEntry: ReversedNumberedEntry;
  NormalEntry: NormalEntry;
};

export type CvEntry = CvEntryByType[CvEntryType];
export type CvSectionOf<TType extends CvEntryType> = {
  id: string;
  title: string;
  entry_type: TType;
  entries: CvEntryByType[TType][];
};
export type CvSection = {
  [TType in CvEntryType]: CvSectionOf<TType>;
}[CvEntryType];

export type SocialNetwork = { network?: string; username?: string };

export type CvFragment = {
  [key: string]: unknown;
  name?: string;
  headline?: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  last_updated?: string;
  target_roles?: string[];
  social_networks?: SocialNetwork[];
  sections?: CvSection[];
};

type OptionalStrings<TKey extends string> = Partial<Record<TKey, string>>;
type OptionalBooleans<TKey extends string> = Partial<Record<TKey, boolean>>;

export type DesignFragment = {
  [key: string]: unknown;
  theme?: string;
  page?: OptionalStrings<
    "size" | "top_margin" | "bottom_margin" | "left_margin" | "right_margin"
  > &
    OptionalBooleans<"show_footer" | "show_top_note">;
  colors?: OptionalStrings<
    | "body"
    | "name"
    | "headline"
    | "connections"
    | "section_titles"
    | "links"
    | "footer"
    | "top_note"
  >;
  typography?: OptionalStrings<
    "line_spacing" | "alignment" | "date_and_location_column_alignment"
  > & {
    font_family?: OptionalStrings<
      "body" | "name" | "headline" | "connections" | "section_titles"
    >;
    font_size?: OptionalStrings<
      "body" | "name" | "headline" | "connections" | "section_titles"
    >;
    small_caps?: OptionalBooleans<
      "name" | "headline" | "connections" | "section_titles"
    >;
    bold?: OptionalBooleans<
      "name" | "headline" | "connections" | "section_titles" | "links"
    >;
  };
  links?: OptionalBooleans<"underline" | "show_external_link_icon">;
  header?: OptionalStrings<
    | "alignment"
    | "photo_position"
    | "photo_width"
    | "photo_space_left"
    | "photo_space_right"
    | "space_below_name"
    | "space_below_headline"
    | "space_below_connections"
  > & {
    connections?: OptionalStrings<
      "phone_number_format" | "separator" | "space_between_connections"
    > &
      OptionalBooleans<
        "hyperlink" | "show_icons" | "display_urls_instead_of_usernames"
      >;
  };
  section_titles?: OptionalStrings<
    "type" | "line_thickness" | "space_above" | "space_below"
  >;
  sections?: OptionalStrings<
    "space_between_regular_entries" | "space_between_text_based_entries"
  > & {
    allow_page_break?: boolean;
    show_time_spans_in?: string[];
  };
  entries?: OptionalStrings<
    | "date_and_location_width"
    | "side_space"
    | "space_between_columns"
    | "degree_width"
  > &
    OptionalBooleans<"allow_page_break" | "short_second_row"> & {
      summary?: OptionalStrings<"space_above" | "space_left">;
      highlights?: OptionalStrings<
        | "bullet"
        | "nested_bullet"
        | "space_left"
        | "space_above"
        | "space_between_items"
        | "space_between_bullet_and_text"
      >;
    };
  templates?: OptionalStrings<
    "footer" | "top_note" | "single_date" | "date_range" | "time_span"
  > & {
    one_line_entry?: OptionalStrings<"main_column">;
    education_entry?: OptionalStrings<
      "main_column" | "degree_column" | "date_and_location_column"
    >;
    normal_entry?: OptionalStrings<"main_column" | "date_and_location_column">;
    experience_entry?: OptionalStrings<
      "main_column" | "date_and_location_column"
    >;
    publication_entry?: OptionalStrings<
      "main_column" | "date_and_location_column"
    >;
  };
};

export type LocaleFragment = {
  [key: string]: unknown;
  language?: string;
  last_updated?: string;
  present?: string;
  month?: string;
  months?: string;
  year?: string;
  years?: string;
  phrases?: { degree_with_area?: string };
  month_abbreviations?: string[];
  month_names?: string[];
};

export type SettingsFragment = {
  [key: string]: unknown;
  current_date?: string;
  pdf_title?: string;
  bold_keywords?: string[];
};

export type CompleteCvSource = {
  cv: CvFragment;
  design?: DesignFragment;
  locale?: LocaleFragment;
  settings?: SettingsFragment;
  evidence?: import("../cv/types").CvEvidence;
};

export type FragmentValue =
  | CvFragment
  | DesignFragment
  | LocaleFragment
  | SettingsFragment;

export type ParsedFragment =
  | { ok: true; value: FragmentValue }
  | { ok: false; error: string };

export type AppliedYamlEdit = {
  source: CompleteCvSource;
  text: string;
  error: string | null;
  applied: boolean;
};
