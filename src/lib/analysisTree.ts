import { AnalysisNode, AnalysisTree } from "@/types/analysis";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";
import { uciMoveParams } from "./chess";

export const ANALYSIS_ROOT_ID = "root";

export const createAnalysisTreeFromGame = (game: Chess): AnalysisTree => {
  const rootFen = game.getHeaders().FEN || DEFAULT_POSITION;
  const rootNode: AnalysisNode = {
    id: ANALYSIS_ROOT_ID,
    parentId: null,
    children: [],
    beforeFen: rootFen,
    afterFen: rootFen,
    ply: 0,
    isMainline: true,
  };

  const tree: AnalysisTree = {
    rootId: ANALYSIS_ROOT_ID,
    rootFen,
    nextId: 1,
    nodes: { [ANALYSIS_ROOT_ID]: rootNode },
    mainlineNodeIds: [],
  };

  const history = game.history({ verbose: true });
  let parentId = ANALYSIS_ROOT_ID;

  for (const move of history) {
    const nodeId = `node-${tree.nextId++}`;
    tree.nodes[nodeId] = {
      id: nodeId,
      parentId,
      children: [],
      san: move.san,
      uci: move.from + move.to + (move.promotion || ""),
      beforeFen: move.before,
      afterFen: move.after,
      ply: tree.nodes[parentId].ply + 1,
      color: move.color,
      isMainline: true,
    };
    tree.nodes[parentId].children.push(nodeId);
    tree.mainlineNodeIds.push(nodeId);
    parentId = nodeId;
  }

  return tree;
};

export const getAnalysisPath = (
  tree: AnalysisTree,
  nodeId: string
): AnalysisNode[] => {
  const path: AnalysisNode[] = [];
  let currentId: string | null = nodeId;

  while (currentId) {
    const node: AnalysisNode | undefined = tree.nodes[currentId];
    if (!node) break;
    path.push(node);
    currentId = node.parentId;
  }

  return path.reverse();
};

export const getAnalysisChess = (
  tree: AnalysisTree,
  nodeId: string = ANALYSIS_ROOT_ID
): Chess => {
  const game = new Chess(tree.rootFen);
  const path = getAnalysisPath(tree, nodeId).slice(1);

  for (const node of path) {
    if (!node.uci) continue;
    game.move(uciMoveParams(node.uci));
  }

  return game;
};

export const findChildByUci = (
  tree: AnalysisTree,
  parentId: string,
  uci: string
): string | undefined =>
  tree.nodes[parentId]?.children.find(
    (childId) => tree.nodes[childId]?.uci === uci
  );

export const createOrReuseChildNode = (
  tree: AnalysisTree,
  parentId: string,
  move: Move,
  beforeFen: string,
  afterFen: string
): { tree: AnalysisTree; nodeId: string } => {
  const uci = move.from + move.to + (move.promotion || "");
  const existingId = findChildByUci(tree, parentId, uci);

  if (existingId) {
    return { tree, nodeId: existingId };
  }

  const nodeId = `node-${tree.nextId}`;
  const newNode: AnalysisNode = {
    id: nodeId,
    parentId,
    children: [],
    san: move.san,
    uci,
    beforeFen,
    afterFen,
    ply: tree.nodes[parentId].ply + 1,
    color: move.color,
    isMainline: false,
  };

  return {
    tree: {
      ...tree,
      nextId: tree.nextId + 1,
      nodes: {
        ...tree.nodes,
        [parentId]: {
          ...tree.nodes[parentId],
          children: [...tree.nodes[parentId].children, nodeId],
        },
        [nodeId]: newNode,
      },
    },
    nodeId,
  };
};

export const getMainlineNodeId = (
  tree: AnalysisTree,
  moveIdx: number
): string => {
  if (moveIdx <= 0) return tree.rootId;
  return tree.mainlineNodeIds[moveIdx - 1] ?? tree.rootId;
};

export const getNextNodeId = (
  tree: AnalysisTree,
  currentNodeId: string
): string | undefined => tree.nodes[currentNodeId]?.children[0];

export const getParentNodeId = (
  tree: AnalysisTree,
  currentNodeId: string
): string => tree.nodes[currentNodeId]?.parentId ?? tree.rootId;

export const getLastReachableNodeId = (
  tree: AnalysisTree,
  currentNodeId: string
): string => {
  let nodeId = currentNodeId;

  while (tree.nodes[nodeId]?.children[0]) {
    nodeId = tree.nodes[nodeId].children[0];
  }

  return nodeId;
};

export const isNodeInMainline = (tree: AnalysisTree, nodeId: string): boolean =>
  tree.mainlineNodeIds.includes(nodeId);
