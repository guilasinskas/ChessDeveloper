import { Color } from "./enums";

export interface RepertoireNode {
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
  comment?: string;
  important?: boolean;
}

export interface RepertoireTree {
  rootId: string;
  rootFen: string;
  nextId: number;
  nodes: Record<string, RepertoireNode>;
  mainlineNodeIds: string[];
}

export interface Repertoire {
  id: number;
  name: string;
  description?: string;
  color: Color;
  tree: RepertoireTree;
  startingFen?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewRepertoire = Omit<Repertoire, "id" | "createdAt" | "updatedAt">;

export interface RepertoireUpdate {
  name?: string;
  description?: string;
  color?: Color;
  tree?: RepertoireTree;
  startingFen?: string;
}

export interface TrainingResult {
  total: number;
  correct: number;
  mistakes: { fen: string; expected: string[]; played: string }[];
}
