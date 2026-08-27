import type { TFile } from "@lapis-notes/api";

export type GraphNodeType = "note" | "unresolved" | "tag" | "attachment";

export type GraphLinkType = "internal-link" | "embed" | "tag";

export interface GraphNode {
  id: string;
  label: string;
  path: string | null;
  type: GraphNodeType;
  exists: boolean;
  refCount: number;
  outgoingCount: number;
  tags: string[];
  groupIds: string[];
  primaryColor?: string;
  ctime?: number;
  mtime?: number;
  extension?: string;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  count: number;
  type: GraphLinkType;
  directed: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  centerNodeId?: string | null;
}

export interface GraphGroupRule {
  id: string;
  query: string;
  color: string;
}

export interface GraphSettings {
  filters: {
    searchQuery: string;
    showTags: boolean;
    showAttachments: boolean;
    existingFilesOnly: boolean;
    showOrphans: boolean;
  };
  display: {
    showArrows: boolean;
    textFadeThreshold: number;
    nodeSize: number;
    linkThickness: number;
    wheelZoomSensitivity: number;
    hoverActivationDelayMs: number;
    hoverReleaseDelayMs: number;
  };
  forces: {
    centerForce: number;
    repelForce: number;
    linkForce: number;
    linkDistance: number;
  };
  localGraph: {
    depth: number;
  };
  groups: GraphGroupRule[];
}

export interface GraphSettingsPatch {
  filters?: Partial<GraphSettings["filters"]>;
  display?: Partial<GraphSettings["display"]>;
  forces?: Partial<GraphSettings["forces"]>;
  localGraph?: Partial<GraphSettings["localGraph"]>;
  groups?: GraphGroupRule[];
}

export interface GraphSearchAdapter {
  matchesNode(
    query: string,
    node: GraphNode,
    file?: TFile | null,
  ): boolean | Promise<boolean>;
}
