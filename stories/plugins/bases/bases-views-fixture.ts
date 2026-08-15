import type { BasesDocument } from "@lapis-notes/bases";

export type BasesViewScenario =
  | "table"
  | "editable-cells"
  | "cards"
  | "grouped-list"
  | "map"
  | "unknown";

const projectNotes = {
  "Projects/Aurora.md": `---
status: Active
owner: Maya Chen
score: 94
due: 2026-09-18
featured: true
cover: "[[Assets/aurora.svg]]"
tags:
  - product
  - launch
---
# Aurora

A focused writing environment for connected research.
`,
  "Projects/Harbor.md": `---
status: Planning
owner: Leo Martins
score: 82
due: 2026-10-04
featured: false
cover: "[[Assets/harbor.svg]]"
tags:
  - platform
---
# Harbor

A dependable home for reusable knowledge services.
`,
  "Projects/Juniper.md": `---
status: Active
owner: Priya Shah
score: 88
due: 2026-09-27
featured: true
cover: "[[Assets/juniper.svg]]"
tags:
  - mobile
  - research
---
# Juniper

A calm mobile capture workflow for field notes.
`,
};

export const BASES_SAMPLE_ARTWORK = {
  "Assets/aurora.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#351c75"/><stop offset="1" stop-color="#45d4c4"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="480" cy="98" r="112" fill="#fff" opacity=".16"/><path d="M0 284C132 220 220 330 360 258s202-24 280 16v86H0z" fill="#fff" opacity=".2"/></svg>`,
  "Assets/harbor.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#153b57"/><path d="M0 205c105-38 162 35 266 0s177 29 374-12v167H0z" fill="#3da4ab"/><path d="M0 258c117-33 209 37 328 1s177 24 312-4v105H0z" fill="#82d1c9"/><circle cx="118" cy="88" r="42" fill="#f5d77f"/></svg>`,
  "Assets/juniper.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#183f35"/><path d="M84 360 226 65l62 127 60-104 156 272z" fill="#6daa79"/><path d="m211 360 105-219 44 92 34-59 103 186z" fill="#a8c686"/><circle cx="514" cy="74" r="34" fill="#f4e8b4"/></svg>`,
};

export const BASES_SAMPLE_TYPES = {
  types: {
    status: "text",
    owner: "text",
    score: "number",
    due: "date",
    featured: "checkbox",
    tags: "tags",
  },
};

const views: BasesDocument["views"] = [
  {
    type: "table",
    name: "Portfolio table",
    layout: "table",
    order: ["file.name", "note.status", "note.owner", "note.score", "note.due"],
    sort: [{ property: "note.score", direction: "DESC" }],
    filter: { and: [] },
    limit: 0,
    columnSize: {},
    imageAspectRatio: 1,
  },
  {
    type: "cards",
    name: "Project cards",
    order: ["file.name", "note.owner", "note.status", "note.score"],
    sort: [{ property: "note.score", direction: "DESC" }],
    filter: { and: [] },
    limit: 0,
    cardSize: 230,
    image: "note.cover",
    imageFit: "cover",
    imageAspectRatio: 1.65,
  },
  {
    type: "table",
    name: "Editable fields",
    layout: "table",
    order: [
      "file.name",
      "file.folder",
      "note.status",
      "note.owner",
      "note.score",
      "note.due",
      "note.featured",
      "note.tags",
    ],
    sort: [{ property: "note.score", direction: "DESC" }],
    filter: { and: [] },
    limit: 0,
    columnSize: {},
    imageAspectRatio: 1,
  },
  {
    type: "list",
    name: "Projects by status",
    order: ["file.name", "note.owner", "note.score"],
    sort: [{ property: "file.name", direction: "ASC" }],
    groupBy: { property: "note.status", direction: "ASC" },
    filter: { and: [] },
    limit: 0,
  },
  {
    type: "map",
    name: "Project map",
    order: ["file.name", "note.owner"],
    sort: [],
    filter: { and: [] },
    limit: 0,
  },
  {
    type: "timeline",
    name: "Timeline experiment",
    order: ["file.name", "note.due"],
    sort: [],
    filter: { and: [] },
    limit: 0,
  },
];

const activeViewNames: Record<BasesViewScenario, string> = {
  table: "Portfolio table",
  "editable-cells": "Editable fields",
  cards: "Project cards",
  "grouped-list": "Projects by status",
  map: "Project map",
  unknown: "Timeline experiment",
};

export function createBasesViewsDocument(
  scenario: BasesViewScenario,
): BasesDocument {
  return {
    filters: { and: [] },
    properties: {
      "file.name": { displayName: "Project" },
      "note.status": { displayName: "Status" },
      "note.owner": { displayName: "Owner" },
      "note.score": { displayName: "Score" },
      "note.due": { displayName: "Due" },
      "note.featured": { displayName: "Featured" },
      "note.tags": { displayName: "Tags" },
      "note.cover": { displayName: "Cover" },
    },
    formulas: {},
    summaries: {},
    activeView: activeViewNames[scenario],
    views: structuredClone(views),
  };
}

export function createBasesViewsSeed(): Record<string, string | ArrayBuffer> {
  return {
    ".obsidian/app.json": "{}",
    ".obsidian/types.json": JSON.stringify(BASES_SAMPLE_TYPES, null, 2),
    "Bases/Projects.base": JSON.stringify(
      createBasesViewsDocument("table"),
      null,
      2,
    ),
    ...projectNotes,
    ...BASES_SAMPLE_ARTWORK,
  };
}

export const BASES_SAMPLE_NOTES = projectNotes;
