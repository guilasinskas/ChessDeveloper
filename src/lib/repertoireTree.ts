import {
  Repertoire,
  RepertoireNode,
  RepertoireTree,
} from "@/types/openings";
import { Color } from "@/types/enums";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";

export const REPERTOIRE_ROOT_ID = "root";

export const createEmptyRepertoireTree = (
  startingFen: string = DEFAULT_POSITION
): RepertoireTree => {
  const rootNode: RepertoireNode = {
    id: REPERTOIRE_ROOT_ID,
    parentId: null,
    children: [],
    beforeFen: startingFen,
    afterFen: startingFen,
    ply: 0,
    isMainline: true,
  };

  return {
    rootId: REPERTOIRE_ROOT_ID,
    rootFen: startingFen,
    nextId: 1,
    nodes: { [REPERTOIRE_ROOT_ID]: rootNode },
    mainlineNodeIds: [],
  };
};

export const createRepertoireTreeFromPgn = (pgn: string): RepertoireTree => {
  const game = new Chess();
  game.loadPgn(pgn);

  const rootFen = game.getHeaders().FEN || DEFAULT_POSITION;
  const tree = createEmptyRepertoireTree(rootFen);

  const history = game.history({ verbose: true });
  let parentId = REPERTOIRE_ROOT_ID;

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

export const getRepertoirePath = (
  tree: RepertoireTree,
  nodeId: string
): RepertoireNode[] => {
  const path: RepertoireNode[] = [];
  let currentId: string | null = nodeId;

  while (currentId) {
    const node: RepertoireNode | undefined = tree.nodes[currentId];
    if (!node) break;
    path.push(node);
    currentId = node.parentId;
  }

  return path.reverse();
};

export const getRepertoireChess = (
  tree: RepertoireTree,
  nodeId: string = REPERTOIRE_ROOT_ID
): Chess => {
  const chess = new Chess(tree.rootFen);

  const path: RepertoireNode[] = [];
  let currentId: string | null = nodeId;
  while (currentId && currentId !== tree.rootId) {
    const node: RepertoireNode | undefined = tree.nodes[currentId];
    if (!node) break;
    path.unshift(node);
    currentId = node.parentId;
  }

  for (const node of path) {
    if (!node.san) continue;
    try {
      chess.move(node.san);
    } catch {
      return chess;
    }
  }

  return chess;
};

export const findChildByUci = (
  tree: RepertoireTree,
  parentId: string,
  uci: string
): string | undefined =>
  tree.nodes[parentId]?.children.find(
    (childId) => tree.nodes[childId]?.uci === uci
  );

export const addMoveToTree = (
  tree: RepertoireTree,
  parentId: string,
  move: Move
): { tree: RepertoireTree; nodeId: string; created: boolean } => {
  const uci = move.from + move.to + (move.promotion || "");
  const existingId = findChildByUci(tree, parentId, uci);

  if (existingId) {
    return { tree, nodeId: existingId, created: false };
  }

  const nodeId = `node-${tree.nextId}`;
  const parent = tree.nodes[parentId];
  const isFirstChild = parent.children.length === 0;
  const newNode: RepertoireNode = {
    id: nodeId,
    parentId,
    children: [],
    san: move.san,
    uci,
    beforeFen: move.before,
    afterFen: move.after,
    ply: parent.ply + 1,
    color: move.color,
    isMainline: parent.isMainline && isFirstChild,
  };

  const newTree: RepertoireTree = {
    ...tree,
    nextId: tree.nextId + 1,
    nodes: {
      ...tree.nodes,
      [parentId]: {
        ...parent,
        children: [...parent.children, nodeId],
      },
      [nodeId]: newNode,
    },
    mainlineNodeIds:
      parent.isMainline && isFirstChild
        ? [...tree.mainlineNodeIds, nodeId]
        : tree.mainlineNodeIds,
  };

  return { tree: newTree, nodeId, created: true };
};

export const deleteSubtree = (
  tree: RepertoireTree,
  nodeId: string
): { tree: RepertoireTree; newCurrentId: string } => {
  if (nodeId === REPERTOIRE_ROOT_ID) return { tree, newCurrentId: nodeId };

  const node: RepertoireNode | undefined = tree.nodes[nodeId];
  if (!node || !node.parentId) return { tree, newCurrentId: nodeId };

  const toDelete = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const id = stack.pop()!;
    if (toDelete.has(id)) continue;
    toDelete.add(id);
    const n: RepertoireNode | undefined = tree.nodes[id];
    if (n) stack.push(...n.children);
  }

  const newNodes: Record<string, RepertoireNode> = {};
  for (const [id, n] of Object.entries(tree.nodes)) {
    if (toDelete.has(id)) continue;
    newNodes[id] = n;
  }

  const parent = newNodes[node.parentId];
  if (parent) {
    newNodes[node.parentId] = {
      ...parent,
      children: parent.children.filter((c) => !toDelete.has(c)),
    };
  }

  return {
    tree: {
      ...tree,
      nodes: newNodes,
      mainlineNodeIds: tree.mainlineNodeIds.filter((id) => !toDelete.has(id)),
    },
    newCurrentId: node.parentId,
  };
};

export const setNodeComment = (
  tree: RepertoireTree,
  nodeId: string,
  comment: string
): RepertoireTree => {
  const node: RepertoireNode | undefined = tree.nodes[nodeId];
  if (!node) return tree;

  const trimmed = comment.trim();
  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [nodeId]: { ...node, comment: trimmed || undefined },
    },
  };
};

export const toggleNodeImportant = (
  tree: RepertoireTree,
  nodeId: string
): RepertoireTree => {
  const node: RepertoireNode | undefined = tree.nodes[nodeId];
  if (!node) return tree;

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [nodeId]: { ...node, important: !node.important },
    },
  };
};

export const promoteNodeToMainline = (
  tree: RepertoireTree,
  nodeId: string
): RepertoireTree => {
  const node: RepertoireNode | undefined = tree.nodes[nodeId];
  if (!node || !node.parentId) return tree;

  const parent = tree.nodes[node.parentId];
  if (!parent) return tree;

  const idx = parent.children.indexOf(nodeId);
  if (idx <= 0) return tree;

  const newChildren = [...parent.children];
  newChildren.splice(idx, 1);
  newChildren.unshift(nodeId);

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [node.parentId]: { ...parent, children: newChildren },
    },
  };
};

export const getNextNodeId = (
  tree: RepertoireTree,
  currentNodeId: string
): string | undefined => tree.nodes[currentNodeId]?.children[0];

export const getParentNodeId = (
  tree: RepertoireTree,
  currentNodeId: string
): string => tree.nodes[currentNodeId]?.parentId ?? tree.rootId;

export const getLastReachableNodeId = (
  tree: RepertoireTree,
  currentNodeId: string
): string => {
  let nodeId = currentNodeId;

  while (tree.nodes[nodeId]?.children[0]) {
    nodeId = tree.nodes[nodeId].children[0];
  }

  return nodeId;
};

export const findFirstNodeForFen = (
  tree: RepertoireTree,
  fen: string
): string | undefined => {
  const positionPart = fen.split(" ").slice(0, 4).join(" ");
  for (const [id, n] of Object.entries(tree.nodes)) {
    const candidate = n.afterFen.split(" ").slice(0, 4).join(" ");
    if (candidate === positionPart) return id;
  }
  return undefined;
};

export const repertoireToPgnVariations = (
  repertoire: Repertoire
): string => {
  const headers = [
    `[Event "${repertoire.name}"]`,
    `[Site "White to Move"]`,
    `[Date "${repertoire.createdAt.split("T")[0].replace(/-/g, ".")}"]`,
    `[White "${repertoire.color === Color.White ? "Repertoire" : "?"}"]`,
    `[Black "${repertoire.color === Color.Black ? "Repertoire" : "?"}"]`,
    `[Result "*"]`,
  ];
  if (repertoire.startingFen) {
    headers.push(`[FEN "${repertoire.startingFen}"]`, `[SetUp "1"]`);
  }

  const tree = repertoire.tree;
  const writeNode = (nodeId: string, isFirstOfTurn: boolean): string => {
    const node: RepertoireNode | undefined = tree.nodes[nodeId];
    if (!node || !node.san || !node.color) return "";

    const moveNumber = Math.floor((node.ply - 1) / 2) + 1;
    const isWhiteMove = node.color === "w";
    const prefix = isWhiteMove
      ? `${moveNumber}. `
      : isFirstOfTurn
        ? `${moveNumber}... `
        : "";

    let body = `${prefix}${node.san}`;
    if (node.comment) body += ` { ${node.comment} }`;

    const [first, ...rest] = node.children;
    for (const variantId of rest) {
      body += ` (${writeNode(variantId, true)})`;
    }
    if (first) {
      body += ` ${writeNode(first, !isWhiteMove)}`;
    }
    return body.trim();
  };

  const root = tree.nodes[tree.rootId];
  const moves =
    root.children.length > 0 ? writeNode(root.children[0], true) : "";

  const otherFirstMoves = root.children
    .slice(1)
    .map((id) => `(${writeNode(id, true)})`)
    .join(" ");

  return `${headers.join("\n")}\n\n${moves} ${otherFirstMoves} *`.trim();
};

export const getAllNodesForTraining = (
  tree: RepertoireTree,
  studyColor: Color
): RepertoireNode[] => {
  const nodes: RepertoireNode[] = [];
  for (const node of Object.values(tree.nodes)) {
    if (node.id === tree.rootId) continue;
    const turnInBefore = node.beforeFen.split(" ")[1];
    const isMyMove =
      (studyColor === Color.White && turnInBefore === "w") ||
      (studyColor === Color.Black && turnInBefore === "b");
    if (isMyMove) nodes.push(node);
  }
  return nodes;
};

export const getExpectedRepliesAt = (
  tree: RepertoireTree,
  parentId: string
): RepertoireNode[] => {
  const parent = tree.nodes[parentId];
  if (!parent) return [];
  return parent.children
    .map((id) => tree.nodes[id])
    .filter((n): n is RepertoireNode => !!n);
};
