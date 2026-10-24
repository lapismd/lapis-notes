import { describe, expect, it } from "vitest";
import { connect } from "@tursodatabase/database";
import fixture from "./fixtures/projection-values.json";
import {
  indexedValuesForRow,
  type IndexFieldDefinition,
} from "../storage/index-projection";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";

describe("retained native/browser projection value contract", () => {
  it("persists the same typed scalar fixture through the existing Turso provider", async () => {
    const connection = (await connect(":memory:", {
      experimental: ["index_method"],
    })) as TursoConnection;
    const db = new TursoAppDatabase("projection-conformance", {
      kind: "turso-native",
      transport: "native",
      connectionFactory: async () => connection,
    });
    await db.open();
    try {
      await db.registerProjectionDefinition({
        projectionId: "fixture/row",
        ownerPluginId: "fixture",
        schemaVersion: 2,
        configHash: "v2",
        visibility: "public",
        fields: fixture.fields as Record<string, IndexFieldDefinition>,
        active: true,
        updatedAt: 1,
      });
      await db.replaceProjectionSource({
        projectionId: "fixture/row",
        sourcePath: "fixture.md",
        sourceHash: "hash",
        rows: [{ id: "row", kind: "fixture", data: fixture.data }],
      });
      const rows = await connection.all<Record<string, unknown>>(
        "SELECT field,ordinal,value_type,text_value,number_value,boolean_value,date_value,datetime_value FROM index_projection_values ORDER BY field,ordinal",
      );
      const actual = rows.map((row) => [
        row.field,
        row.ordinal,
        row.value_type,
        row.text_value,
        row.number_value,
        row.boolean_value == null ? null : Boolean(row.boolean_value),
        row.date_value,
        row.datetime_value,
      ]);
      const expected = [...fixture.expected].sort((a, b) =>
        String(a[0]) < String(b[0])
          ? -1
          : String(a[0]) > String(b[0])
            ? 1
            : Number(a[1]) - Number(b[1]),
      );
      expect(actual).toEqual(expected);
    } finally {
      await db.close();
    }
  });
  it("retains JavaScript scalar coercion and cardinality in the shared fixture", () => {
    const values = indexedValuesForRow(
      "fixture/row",
      { id: "row", kind: "fixture", data: fixture.data },
      fixture.fields as Record<string, IndexFieldDefinition>,
    );
    const actual = values.map((v) => [
      v.field,
      v.ordinal,
      v.valueType,
      v.textValue ?? null,
      v.numberValue ?? null,
      v.booleanValue ?? null,
      v.dateValue ?? null,
      v.datetimeValue ?? null,
    ]);
    // JSON has no NaN; the SQL boundary persists these non-finite values as null.
    expect(JSON.parse(JSON.stringify(actual))).toEqual(fixture.expected);
  });
  it("caps indexed fields in JavaScript property order and text in UTF-16 units", () => {
    const fields: Record<string, IndexFieldDefinition> = {};
    for (let i = 0; i < 70; i++)
      fields[`field${i}`] = { type: "string", indexed: true };
    fields["2"] = { type: "string", indexed: true };
    fields["1"] = { type: "string", indexed: true };
    const title = "a".repeat(4094) + "🪨" + "tail";
    const data = Object.fromEntries(
      Object.keys(fields).map((field) => [field, title]),
    );
    const values = indexedValuesForRow(
      "fixture/row",
      { id: "row", kind: "fixture", data },
      fields,
    );
    expect(values).toHaveLength(64);
    expect(values.slice(0, 3).map((v) => v.field)).toEqual([
      "1",
      "2",
      "field0",
    ]);
    expect(values.at(-1)?.field).toBe("field61");
    expect(values.every((v) => v.textValue === "a".repeat(4094) + "🪨")).toBe(
      true,
    );
  });
});
