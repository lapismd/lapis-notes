import {
  AttributeGetter,
  Context,
  EvalNode,
  getValueByDotNotation,
  Structure,
  Table,
  typedTupleToColumns,
  type DType,
  type MutableTableProperties,
  TimeStamp,
  parseDateTime,
  EvalColumn,
} from "peaql";
import type { VaultRecord } from ".";
import { TFile, type App } from "@lapis-notes/api";
import { DateTime } from "luxon";
import { SQLDialect } from "@codemirror/lang-sql";
import type { QueryController } from "./bases.svelte";
import { deriveFileMetadata } from "./file-fields-core";

function defineStructureName<T extends typeof Structure>(
  structure: T,
  name: string,
): T {
  Object.defineProperty(structure, "name", {
    configurable: true,
    value: name,
  });
  return structure;
}

export class TFileExt extends TFile {
  readonly tags: string[] = [];
  readonly links: string[] = [];
  readonly embeds: string[] = [];
  readonly backlinks: string[] = [];
  properties: Record<string, unknown> = {};
  public checksum: string = "";
}

export class VaultFile extends Structure {
  public static columns = typedTupleToColumns(
    {
      name: String,
      baseName: String,
      path: String,
      checksum: String,
    },
    [
      new AttributeGetter("ext", String, (context: TFile) => {
        return context.extension;
      }),
      new AttributeGetter("ctime", DateTime, (context: TFile) => {
        return DateTime.fromMillis(context.stat.ctime);
      }),
      new AttributeGetter("mtime", DateTime, (context: TFile) => {
        return DateTime.fromMillis(context.stat.mtime);
      }),
      new AttributeGetter("size", Number, (context: TFile) => {
        return context.stat.size;
      }),
      new AttributeGetter("folder", String, (context: TFile) => {
        return context.parent?.path || "/";
      }),
      new AttributeGetter("fullname", String, (context: TFile) => {
        return context.name;
      }),
      new AttributeGetter("basename", String, (context: TFile) => {
        return context.baseName;
      }),
      new AttributeGetter("name", String, (context: TFile) => {
        return context.name;
      }),
      new AttributeGetter("file", TFile, (context: TFileExt) => {
        return context;
      }),
      new AttributeGetter("tags", String, (context: TFileExt) => {
        return context.tags;
      }),
      new AttributeGetter("links", String, (context: TFileExt) => {
        return context.links;
      }),
      new AttributeGetter("embeds", String, (context: TFileExt) => {
        return context.embeds;
      }),
      new AttributeGetter("backlinks", String, (context: TFileExt) => {
        return context.backlinks;
      }),
      new AttributeGetter("properties", Object, (context: TFileExt) => {
        return context.properties;
      }),
    ],
  );
}

defineStructureName(VaultFile, "TFile");

export class BasesTable extends Table {
  public context!: Context;
  private app: App | null = null;

  withApp(app: App): this {
    this.app = app;
    return this;
  }

  constructor(...args: ConstructorParameters<typeof Table>) {
    super(...args);
    this.columns.set(
      "file",
      new AttributeGetter("file", VaultFile, (entry: VaultRecord) =>
        this.file(entry),
      ),
    );
    this.columns.set(
      "rowId",
      new AttributeGetter("rowId", VaultFile, (entry: VaultRecord) =>
        this.rowId(entry),
      ),
    );
  }

  copy(props: Partial<MutableTableProperties> = {}): BasesTable {
    const table = new BasesTable(
      props.name ?? this.name,
      props.columns ?? this.columns,
      props.constraints ?? this.constraints,
      props.wildcardColumns ?? this.wildcardColumns,
      props.props ? { ...this.props, ...props.props } : this.props,
    );
    table.app = this.app;
    const entries = props.joins ? props.joins.entries() : this.joins.entries();
    for (const [k, v] of entries) {
      table.joins.set(k, v.copy());
    }
    table.setContext(props.context ?? this.context);
    return table;
  }

  withPropertyColumns(columns: Record<string, DType>): this {
    const map: Map<string, EvalColumn> = new Map();
    for (const [id, type] of Object.entries(columns)) {
      const name = id.replace("note.", "");
      const column = new AttributeGetter(
        name,
        type,
        (context: Record<string, any>) => {
          let value = null;
          if (context.cache?.frontmatter) {
            value = context.cache.frontmatter[name];
          } else {
            value = context[name];
          }
          if (type === TimeStamp && typeof value === "string") {
            value = parseDateTime(value) ?? value;
          }
          return value;
        },
      );
      if (this.columns.has(name)) continue;
      map.set(name, column);
      this.columns.set(name, column);
    }
    const PropStructure = defineStructureName(
      class extends Structure {
        public static type: "default" | "join" = "default";
        public static columns = map;
      },
      "note",
    );
    this.columns.set(
      "note",
      new AttributeGetter("note", PropStructure, (context: VaultRecord) => {
        return context.cache?.frontmatter || {};
      }),
    );
    return this;
  }

  getColumn(name: string, fullScan: boolean = true): EvalNode {
    const col = super.getColumn(name, fullScan);
    if (!col) {
      return new AttributeGetter(name, Object, (context: VaultRecord) => {
        const props = context.cache?.frontmatter || {};
        return (
          getValueByDotNotation(props, name) ??
          getValueByDotNotation(context, name)
        );
      });
    }
    return col;
  }

  file(entry: VaultRecord) {
    const file = new TFileExt(
      entry.file.path,
      entry.file.stat,
      entry.file.parent,
    );
    const metadata = deriveFileMetadata(
      entry.file.path,
      entry.cache,
      entry.backlinks ?? [],
    );
    file.tags.push(...metadata.tags);
    file.links.push(...metadata.links);
    file.embeds.push(...metadata.embeds);
    file.backlinks.push(...metadata.backlinks);
    file.properties = metadata.properties;
    file.checksum = entry.checksum ?? entry.id;
    return file;
  }

  rowId(entry: VaultRecord) {
    return entry;
  }

  setContext(context: Context) {
    this.context = context;
  }
}

export const SQLTypes =
  "array binary bit boolean char character clob date decimal double float int integer interval large national nchar nclob numeric object precision real smallint time timestamp varchar varying ";
export const SQLKeywords =
  "file note absolute action add after all allocate alter and any are as asc assertion at authorization before begin between both breadth by call cascade cascaded case cast catalog check close collate collation column commit condition connect connection constraint constraints constructor continue corresponding count create cross cube current current_date current_default_transform_group current_transform_group_for_type current_path current_role current_time current_timestamp current_user cursor cycle data day deallocate declare default deferrable deferred delete depth deref desc describe descriptor deterministic diagnostics disconnect distinct do domain drop dynamic each else elseif end end-exec equals escape except exception exec execute exists exit external fetch first for foreign found from free full function general get global go goto grant group grouping handle having hold hour identity if immediate in indicator initially inner inout input insert intersect into is isolation join key language last lateral leading leave left level like limit local localtime localtimestamp locator loop map match method minute modifies module month names natural nesting new next no none not of old on only open option or order ordinality out outer output overlaps pad parameter partial path prepare preserve primary prior privileges procedure public read reads recursive redo ref references referencing relative release repeat resignal restrict result return returns revoke right role rollback rollup routine row rows savepoint schema scroll search second section select session session_user set sets signal similar size some space specific specifictype sql sqlexception sqlstate sqlwarning start state static system_user table temporary then timezone_hour timezone_minute to trailing transaction translation treat trigger under undo union unique unnest until update usage user using value values view when whenever where while with without work write year zone ";

export function basesDialect(table: QueryController) {
  const columns = [
    ...table.getAllColumns().map((it) => it.id),
    ...table.getAllColumns().filter((it) => it.id.startsWith("note.")),
  ];
  return SQLDialect.define({
    charSetCasts: true,
    doubleDollarQuotedStrings: true,
    operatorChars: "+-*/<>=~!@#%^&|`?",
    specialVar: "",
    keywords:
      SQLKeywords +
      " note file " +
      columns.join(" ") +
      " abort abs absent access according ada admin aggregate alias also always analyse analyze array_agg array_max_cardinality asensitive assert assignment asymmetric atomic attach attribute attributes avg backward base64 begin_frame begin_partition bernoulli bit_length blocked bom cache called cardinality catalog_name ceil ceiling chain char_length character_length character_set_catalog character_set_name character_set_schema characteristics characters checkpoint class class_origin cluster coalesce cobol collation_catalog collation_name collation_schema collect column_name columns command_function command_function_code comment comments committed concurrently condition_number configuration conflict connection_name constant constraint_catalog constraint_name constraint_schema contains content control conversion convert copy corr cost covar_pop covar_samp csv cume_dist current_catalog current_row current_schema cursor_name database datalink datatype datetime_interval_code datetime_interval_precision db debug defaults defined definer degree delimiter delimiters dense_rank depends derived detach detail dictionary disable discard dispatch dlnewcopy dlpreviouscopy dlurlcomplete dlurlcompleteonly dlurlcompletewrite dlurlpath dlurlpathonly dlurlpathwrite dlurlscheme dlurlserver dlvalue document dump dynamic_function dynamic_function_code element elsif empty enable encoding encrypted end_frame end_partition endexec enforced enum errcode error event every exclude excluding exclusive exp explain expression extension extract family file filter final first_value flag floor following force foreach fortran forward frame_row freeze fs functions fusion generated granted greatest groups handler header hex hierarchy hint id ignore ilike immediately immutable implementation implicit import include including increment indent index indexes info inherit inherits inline insensitive instance instantiable instead integrity intersection invoker isnull key_member key_type label lag last_value lead leakproof least length library like_regex link listen ln load location lock locked log logged lower mapping matched materialized max max_cardinality maxvalue member merge message message_length message_octet_length message_text min minvalue mod mode more move multiset mumps name namespace nfc nfd nfkc nfkd nil normalize normalized nothing notice notify notnull nowait nth_value ntile nullable nullif nulls number occurrences_regex octet_length octets off offset oids operator options ordering others over overlay overriding owned owner parallel parameter_mode parameter_name parameter_ordinal_position parameter_specific_catalog parameter_specific_name parameter_specific_schema parser partition pascal passing passthrough password percent percent_rank percentile_cont percentile_disc perform period permission pg_context pg_datatype_name pg_exception_context pg_exception_detail pg_exception_hint placing plans pli policy portion position position_regex power precedes preceding prepared print_strict_params procedural procedures program publication query quote raise range rank reassign recheck recovery refresh regr_avgx regr_avgy regr_count regr_intercept regr_r2 regr_slope regr_sxx regr_sxy regr_syy reindex rename repeatable replace replica requiring reset respect restart restore result_oid returned_cardinality returned_length returned_octet_length returned_sqlstate returning reverse routine_catalog routine_name routine_schema routines row_count row_number rowtype rule scale schema_name schemas scope scope_catalog scope_name scope_schema security selective self sensitive sequence sequences serializable server server_name setof share show simple skip slice snapshot source specific_name sqlcode sqlerror sqrt stable stacked standalone statement statistics stddev_pop stddev_samp stdin stdout storage strict strip structure style subclass_origin submultiset subscription substring substring_regex succeeds sum symmetric sysid system system_time table_name tables tablesample tablespace temp template ties token top_level_count transaction_active transactions_committed transactions_rolled_back transform transforms translate translate_regex trigger_catalog trigger_name trigger_schema trim trim_array truncate trusted type types uescape unbounded uncommitted unencrypted unlink unlisten unlogged unnamed untyped upper uri use_column use_variable user_defined_type_catalog user_defined_type_code user_defined_type_name user_defined_type_schema vacuum valid validate validator value_of var_pop var_samp varbinary variable_conflict variadic verbose version versioning views volatile warning whitespace width_bucket window within wrapper xmlagg xmlattributes xmlbinary xmlcast xmlcomment xmlconcat xmldeclaration xmldocument xmlelement xmlexists xmlforest xmliterate xmlnamespaces xmlparse xmlpi xmlquery xmlroot xmlschema xmlserialize xmltable xmltext xmlvalidate yes",
    types:
      SQLTypes +
      "bigint int8 bigserial serial8 varbit bool box bytea cidr circle precision float8 inet int4 json jsonb line lseg macaddr macaddr8 money numeric pg_lsn point polygon float4 int2 smallserial serial2 serial serial4 text timetz timestamptz tsquery tsvector txid_snapshot uuid xml",
  });
}
