import type {
  AnyBasesView,
  BasesDocument,
  CardsView,
  Filters,
  TableView,
} from "./models";

function emptyFilter(): Filters {
  return { and: [] };
}

function defaultTableView(): TableView {
  return {
    type: "table",
    name: "Table",
    layout: "table",
    order: [],
    sort: [],
    filter: emptyFilter(),
    limit: 0,
    columnSize: {},
    imageAspectRatio: 1,
  };
}

function defaultCardsView(): CardsView {
  return {
    type: "cards",
    name: "Cards",
    order: [],
    sort: [],
    filter: emptyFilter(),
    limit: 0,
    image: "",
    imageFit: "contain",
    imageAspectRatio: 1,
    cardSize: 200,
  };
}

function defaultCustomView(type: string): AnyBasesView {
  return {
    type,
    name: type,
    order: [],
    sort: [],
    filter: emptyFilter(),
    limit: 0,
  };
}

function normalizeView(
  view: unknown,
  fallbackName: string,
): AnyBasesView | null {
  if (!view || typeof view !== "object") return null;

  const candidate = view as Partial<AnyBasesView> & Record<string, unknown>;
  if (candidate.type === "table") {
    return {
      ...defaultTableView(),
      ...candidate,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter:
        candidate.filter && typeof candidate.filter === "object"
          ? (candidate.filter as Filters)
          : emptyFilter(),
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      columnSize:
        candidate.columnSize && typeof candidate.columnSize === "object"
          ? (candidate.columnSize as Record<string, number>)
          : {},
      imageAspectRatio:
        typeof candidate.imageAspectRatio === "number"
          ? candidate.imageAspectRatio
          : 1,
    };
  }

  if (candidate.type === "cards") {
    return {
      ...defaultCardsView(),
      ...candidate,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter:
        candidate.filter && typeof candidate.filter === "object"
          ? (candidate.filter as Filters)
          : emptyFilter(),
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
      image: typeof candidate.image === "string" ? candidate.image : "",
      imageFit:
        candidate.imageFit === "cover" || candidate.imageFit === "contain"
          ? candidate.imageFit
          : "contain",
      imageAspectRatio:
        typeof candidate.imageAspectRatio === "number"
          ? candidate.imageAspectRatio
          : 1,
      cardSize:
        typeof candidate.cardSize === "number" ? candidate.cardSize : 200,
    };
  }

  if (candidate.type === "list" || candidate.type === "map") {
    return {
      type: candidate.type,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter:
        candidate.filter && typeof candidate.filter === "object"
          ? (candidate.filter as Filters)
          : emptyFilter(),
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
    } as AnyBasesView;
  }

  if (typeof candidate.type === "string" && candidate.type.length > 0) {
    return {
      ...defaultCustomView(candidate.type),
      ...candidate,
      name: typeof candidate.name === "string" ? candidate.name : fallbackName,
      order: Array.isArray(candidate.order)
        ? candidate.order.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      sort: Array.isArray(candidate.sort) ? candidate.sort : [],
      filter:
        candidate.filter && typeof candidate.filter === "object"
          ? (candidate.filter as Filters)
          : emptyFilter(),
      limit: typeof candidate.limit === "number" ? candidate.limit : 0,
      summaries:
        candidate.summaries && typeof candidate.summaries === "object"
          ? (candidate.summaries as Record<string, string>)
          : undefined,
      groupBy:
        candidate.groupBy && typeof candidate.groupBy === "object"
          ? candidate.groupBy
          : undefined,
    };
  }

  return null;
}

export function normalizeBasesDocument(input: unknown): BasesDocument {
  const candidate =
    input && typeof input === "object" ? (input as Partial<BasesDocument>) : {};
  const views = Array.isArray(candidate.views)
    ? candidate.views
        .map((view, index) => normalizeView(view, `View ${index + 1}`))
        .filter((view): view is AnyBasesView => !!view)
    : [];
  const normalizedViews = views.length ? views : [defaultTableView()];
  const activeView =
    typeof candidate.activeView === "string" &&
    normalizedViews.some((view) => view.name === candidate.activeView)
      ? candidate.activeView
      : normalizedViews[0].name;

  return {
    filters:
      candidate.filters && typeof candidate.filters === "object"
        ? (candidate.filters as Filters)
        : emptyFilter(),
    properties:
      candidate.properties && typeof candidate.properties === "object"
        ? candidate.properties
        : {},
    formulas:
      candidate.formulas && typeof candidate.formulas === "object"
        ? candidate.formulas
        : {},
    summaries:
      candidate.summaries && typeof candidate.summaries === "object"
        ? candidate.summaries
        : {},
    activeView,
    views: normalizedViews,
  };
}
