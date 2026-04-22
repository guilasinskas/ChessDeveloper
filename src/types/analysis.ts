export interface AnalysisNode {
  id: string;
  parentId: string | null;
  children: string[];
  san?: string;
  uci?: string;
  beforeFen: string;
  afterFen: string;
  ply: number;
  color?: "w" | "b";
  isMainline: boolean;
}

export interface AnalysisTree {
  rootId: string;
  rootFen: string;
  nextId: number;
  nodes: Record<string, AnalysisNode>;
  mainlineNodeIds: string[];
}
