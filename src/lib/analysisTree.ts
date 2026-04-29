import { AnalysisNode, AnalysisTree } from "@/types/analysis";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";

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
  const chess = new Chess(tree.rootFen);

  const path: AnalysisNode[] = [];
  let currentId: string | null = nodeId;
  while (currentId && currentId !== tree.rootId) {
    const node: AnalysisNode | undefined = tree.nodes[currentId];
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
  nodeId === tree.rootId || !!tree.nodes[nodeId]?.isMainline;

export const setNodeComment = (
  tree: AnalysisTree,
  nodeId: string,
  comment: string
): AnalysisTree => {
  if (nodeId === tree.rootId) {
    const trimmed = comment.trim();
    return { ...tree, rootComment: trimmed || undefined };
  }
  const node: AnalysisNode | undefined = tree.nodes[nodeId];
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

export const deleteNode = (
  tree: AnalysisTree,
  nodeId: string
): { tree: AnalysisTree; newCurrentId: string } => {
  if (nodeId === tree.rootId) return { tree, newCurrentId: nodeId };
  const node: AnalysisNode | undefined = tree.nodes[nodeId];
  if (!node || node.parentId === null) return { tree, newCurrentId: nodeId };

  const toDelete = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const id = stack.pop()!;
    if (toDelete.has(id)) continue;
    toDelete.add(id);
    const n: AnalysisNode | undefined = tree.nodes[id];
    if (n) stack.push(...n.children);
  }

  const newNodes: Record<string, AnalysisNode> = {};
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

  const wasMainline = tree.mainlineNodeIds.includes(nodeId);
  const newMainlineNodeIds = wasMainline
    ? tree.mainlineNodeIds.filter((id) => !toDelete.has(id))
    : tree.mainlineNodeIds;

  return {
    tree: {
      ...tree,
      nodes: newNodes,
      mainlineNodeIds: newMainlineNodeIds,
    },
    newCurrentId: node.parentId,
  };
};

export const exportTreeToPgn = (
  tree: AnalysisTree,
  headers: Record<string, string | undefined> = {}
): string => {
  const headerLines: string[] = [];
  const headerKeysOrder = [
    "Event",
    "Site",
    "Date",
    "Round",
    "White",
    "Black",
    "Result",
    "WhiteElo",
    "BlackElo",
    "TimeControl",
    "Termination",
    "FEN",
  ];
  for (const key of headerKeysOrder) {
    const v = headers[key];
    if (v) headerLines.push(`[${key} "${v.replace(/"/g, '\\"')}"]`);
  }
  for (const [k, v] of Object.entries(headers)) {
    if (headerKeysOrder.includes(k) || !v) continue;
    headerLines.push(`[${k} "${v.replace(/"/g, '\\"')}"]`);
  }

  const result = headers.Result ?? "*";
  const root = tree.nodes[tree.rootId];
  if (!root) {
    return [...headerLines, "", result].join("\n");
  }

  const renderNode = (
    nodeId: string,
    needsMoveNumber: boolean
  ): { text: string; needsMoveNumber: boolean } => {
    const node: AnalysisNode | undefined = tree.nodes[nodeId];
    if (!node || !node.san) return { text: "", needsMoveNumber };

    const isWhite = node.color === "w";
    const fullMove = Math.ceil(node.ply / 2);
    const moveNumber = isWhite
      ? `${fullMove}.`
      : needsMoveNumber
        ? `${fullMove}...`
        : "";

    const parts: string[] = [];
    if (moveNumber) parts.push(moveNumber);
    parts.push(node.san);
    if (node.nags && node.nags.length) {
      for (const nag of node.nags) parts.push(`$${nag}`);
    }
    if (node.comment) parts.push(`{${node.comment}}`);

    let text = parts.join(" ");
    let nextNeedsMoveNumber = !isWhite ? false : true;

    if (node.children.length > 1) {
      for (let i = 1; i < node.children.length; i++) {
        const branch = renderBranch(node.children[i], true);
        text += ` (${branch})`;
      }
      nextNeedsMoveNumber = true;
    }

    if (node.children.length > 0) {
      const next = renderNode(node.children[0], nextNeedsMoveNumber);
      if (next.text) text += " " + next.text;
    }

    return { text, needsMoveNumber: nextNeedsMoveNumber };
  };

  const renderBranch = (startNodeId: string, forceMoveNumber: boolean): string => {
    const start = tree.nodes[startNodeId];
    if (!start) return "";
    const startsWithBlack = start.color === "b";
    const result = renderNode(startNodeId, forceMoveNumber || startsWithBlack);
    return result.text.trim();
  };

  const rootCommentText = tree.rootComment ? `{${tree.rootComment}} ` : "";

  let body = rootCommentText;
  if (root.children.length > 0) {
    body += renderBranch(root.children[0], true);
    for (let i = 1; i < root.children.length; i++) {
      body += " (" + renderBranch(root.children[i], true) + ")";
    }
  }

  body = (body.trim() + " " + result).trim();

  return [...headerLines, "", body].join("\n");
};

export const promoteToMainline = (
  tree: AnalysisTree,
  nodeId: string
): AnalysisTree => {
  const node: AnalysisNode | undefined = tree.nodes[nodeId];
  if (!node || !node.parentId) return tree;
  const parent = tree.nodes[node.parentId];
  if (!parent) return tree;

  const idx = parent.children.indexOf(nodeId);
  if (idx <= 0) return tree;

  const newChildren = [...parent.children];
  newChildren.splice(idx, 1);
  newChildren.unshift(nodeId);

  const newNodes = {
    ...tree.nodes,
    [node.parentId]: { ...parent, children: newChildren },
  };

  const newMainlineIds: string[] = [];
  let cursor: string | undefined = tree.rootId;
  while (cursor) {
    const n: AnalysisNode | undefined = newNodes[cursor];
    if (!n) break;
    if (cursor !== tree.rootId) newMainlineIds.push(cursor);
    cursor = n.children[0];
  }

  for (const id of Object.keys(newNodes)) {
    const n: AnalysisNode = newNodes[id];
    const inMainline = newMainlineIds.includes(id);
    if (n.isMainline !== inMainline) {
      newNodes[id] = { ...n, isMainline: inMainline };
    }
  }

  return {
    ...tree,
    nodes: newNodes,
    mainlineNodeIds: newMainlineIds,
  };
};
