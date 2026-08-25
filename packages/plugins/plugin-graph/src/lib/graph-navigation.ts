import type { Workspace, WorkspaceLeaf } from "@lapis-notes/api";

const GRAPH_VIEW_TYPE = "graph";
const LOCAL_GRAPH_VIEW_TYPE = "graph-local";
const GRAPH_VIEW_TYPES = new Set([
  GRAPH_VIEW_TYPE,
  LOCAL_GRAPH_VIEW_TYPE,
  "empty",
]);

function isRootLeaf(workspace: Workspace, leaf: WorkspaceLeaf): boolean {
  return Boolean(
    workspace.rootSplit.iterateAllLeaves(
      (candidate) => (candidate === leaf ? leaf : undefined) as undefined,
    ),
  );
}

function viewTypeForLeaf(leaf: WorkspaceLeaf): string {
  const view = leaf.view;
  if (view && typeof view.getViewType === "function") {
    return view.getViewType();
  }
  return typeof leaf.state?.type === "string" ? leaf.state.type : "";
}

function isGraphLikeViewType(viewType: string): boolean {
  return GRAPH_VIEW_TYPES.has(viewType);
}

function isDocumentNavigationLeaf(
  leaf: WorkspaceLeaf,
  graphLeaf: WorkspaceLeaf,
): boolean {
  if (leaf === graphLeaf) {
    return false;
  }
  const viewType = viewTypeForLeaf(leaf);
  if (isGraphLikeViewType(viewType)) {
    return false;
  }
  const filePath = leaf.state?.state?.["file"];
  if (typeof filePath === "string" && filePath.length > 0) {
    return true;
  }
  const view = leaf.view;
  if (view && typeof view === "object" && "file" in view) {
    const file = (view as { file?: { path?: string } | null }).file;
    return typeof file?.path === "string" && file.path.length > 0;
  }
  return viewType.length > 0 && !isGraphLikeViewType(viewType);
}

function findRootDocumentLeaf(
  workspace: Workspace,
  graphLeaf: WorkspaceLeaf,
): WorkspaceLeaf | null {
  const selectedInTab = workspace.rootSplit.iterateAllTabs((tabs) => {
    const leaf = tabs.selectedLeaf;
    if (leaf && isDocumentNavigationLeaf(leaf, graphLeaf)) {
      return leaf;
    }
    return undefined;
  });
  if (selectedInTab) {
    return selectedInTab;
  }

  let fallback: WorkspaceLeaf | null = null;
  workspace.rootSplit.iterateAllLeaves((leaf) => {
    if (isDocumentNavigationLeaf(leaf, graphLeaf)) {
      fallback ??= leaf;
    }
  });

  return fallback;
}

export function resolveGraphNavigationLeaf(options: {
  workspace: Workspace;
  graphLeaf: WorkspaceLeaf;
  isLocal: boolean;
  openInNewPane: boolean;
}): WorkspaceLeaf {
  const { workspace, graphLeaf, isLocal, openInNewPane } = options;

  if (isLocal || !isRootLeaf(workspace, graphLeaf)) {
    return workspace.getLeaf(openInNewPane ? true : undefined);
  }

  const activeRoot = workspace.activeRootLeaf;
  if (
    activeRoot &&
    activeRoot !== graphLeaf &&
    isDocumentNavigationLeaf(activeRoot, graphLeaf)
  ) {
    return activeRoot;
  }

  const rootDocumentLeaf = findRootDocumentLeaf(workspace, graphLeaf);
  if (rootDocumentLeaf) {
    return rootDocumentLeaf;
  }

  if (openInNewPane) {
    return workspace.getLeaf(true);
  }

  return graphLeaf;
}
