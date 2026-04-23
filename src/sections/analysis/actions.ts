import { atom } from "jotai";
import { Chess, type Move } from "chess.js";
import {
  ANALYSIS_ROOT_ID,
  createOrReuseChildNode,
  deleteNode,
  getAnalysisChess,
  getLastReachableNodeId,
  getMainlineNodeId,
  getNextNodeId,
  getParentNodeId,
  promoteToMainline,
  setNodeComment,
} from "@/lib/analysisTree";
import { createAnalysisTreeFromPgn } from "@/lib/pgnParser";
import { uciMoveParams } from "@/lib/chess";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import {
  analysisTreeAtom,
  boardAtom,
  currentAnalysisNodeIdAtom,
} from "./states";

export const initializeFromPgnAction = atom(
  null,
  (_get, set, pgn: string) => {
    const tree = createAnalysisTreeFromPgn(pgn);
    set(analysisTreeAtom, tree);
    set(currentAnalysisNodeIdAtom, ANALYSIS_ROOT_ID);
    set(boardAtom, getAnalysisChess(tree, ANALYSIS_ROOT_ID));
  }
);

export const goToNodeAction = atom(null, (get, set, nodeId: string) => {
  const tree = get(analysisTreeAtom);
  set(currentAnalysisNodeIdAtom, nodeId);
  set(boardAtom, getAnalysisChess(tree, nodeId));
});

export const goToMainlineMoveAction = atom(
  null,
  (get, set, moveIdx: number) => {
    const tree = get(analysisTreeAtom);
    const nodeId = getMainlineNodeId(tree, moveIdx);
    set(currentAnalysisNodeIdAtom, nodeId);
    set(boardAtom, getAnalysisChess(tree, nodeId));
  }
);

export const resetBoardAction = atom(null, (get, set) => {
  const tree = get(analysisTreeAtom);
  set(currentAnalysisNodeIdAtom, ANALYSIS_ROOT_ID);
  set(boardAtom, getAnalysisChess(tree, ANALYSIS_ROOT_ID));
});

export const undoBoardMoveAction = atom(null, (get, set) => {
  const tree = get(analysisTreeAtom);
  const currentNodeId = get(currentAnalysisNodeIdAtom);
  const parentId = getParentNodeId(tree, currentNodeId);
  if (parentId === currentNodeId) return;
  set(currentAnalysisNodeIdAtom, parentId);
  set(boardAtom, getAnalysisChess(tree, parentId));
});

export const goToNextMoveAction = atom(null, (get, set) => {
  const tree = get(analysisTreeAtom);
  const currentNodeId = get(currentAnalysisNodeIdAtom);
  const nextNodeId = getNextNodeId(tree, currentNodeId);
  if (!nextNodeId) return;
  set(currentAnalysisNodeIdAtom, nextNodeId);
  set(boardAtom, getAnalysisChess(tree, nextNodeId));
});

export const goToLastPositionAction = atom(null, (get, set) => {
  const tree = get(analysisTreeAtom);
  const currentNodeId = get(currentAnalysisNodeIdAtom);
  const lastNodeId = getLastReachableNodeId(tree, currentNodeId);
  set(currentAnalysisNodeIdAtom, lastNodeId);
  set(boardAtom, getAnalysisChess(tree, lastNodeId));
});

export const playMoveAction = atom(
  null,
  (
    get,
    set,
    params: { from: string; to: string; promotion?: string }
  ): Move | null => {
    const tree = get(analysisTreeAtom);
    const currentNodeId = get(currentAnalysisNodeIdAtom);
    const game = getAnalysisChess(tree, currentNodeId);
    const beforeFen = game.fen();

    try {
      const result = game.move(params);
      const afterFen = game.fen();
      const nodeResult = createOrReuseChildNode(
        tree,
        currentNodeId,
        result,
        beforeFen,
        afterFen
      );

      set(analysisTreeAtom, nodeResult.tree);
      set(currentAnalysisNodeIdAtom, nodeResult.nodeId);
      set(boardAtom, getAnalysisChess(nodeResult.tree, nodeResult.nodeId));
      playSoundFromMove(result);
      return result;
    } catch {
      playIllegalMoveSound();
      return null;
    }
  }
);

export const addMovesAction = atom(null, (get, set, moves: string[]) => {
  let nextTree = get(analysisTreeAtom);
  let nextCurrentNodeId = get(currentAnalysisNodeIdAtom);
  const game = new Chess(
    nextTree.nodes[nextCurrentNodeId]?.afterFen ?? nextTree.rootFen
  );
  let lastMove: Move | null = null;

  for (const move of moves) {
    const beforeFen = game.fen();
    try {
      lastMove = game.move(uciMoveParams(move));
    } catch {
      break;
    }
    const afterFen = game.fen();
    const result = createOrReuseChildNode(
      nextTree,
      nextCurrentNodeId,
      lastMove,
      beforeFen,
      afterFen
    );

    nextTree = result.tree;
    nextCurrentNodeId = result.nodeId;
  }

  set(analysisTreeAtom, nextTree);
  set(currentAnalysisNodeIdAtom, nextCurrentNodeId);
  set(boardAtom, getAnalysisChess(nextTree, nextCurrentNodeId));
  if (lastMove) playSoundFromMove(lastMove);
});

export const setCommentAction = atom(
  null,
  (get, set, params: { nodeId: string; comment: string }) => {
    const tree = get(analysisTreeAtom);
    const next = setNodeComment(tree, params.nodeId, params.comment);
    if (next === tree) return;
    set(analysisTreeAtom, next);
  }
);

export const removeNodeAction = atom(null, (get, set, nodeId: string) => {
  const tree = get(analysisTreeAtom);
  const { tree: next, newCurrentId } = deleteNode(tree, nodeId);
  if (next === tree) return;
  set(analysisTreeAtom, next);
  set(currentAnalysisNodeIdAtom, newCurrentId);
  set(boardAtom, getAnalysisChess(next, newCurrentId));
});

export const promoteVariationAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(analysisTreeAtom);
    const next = promoteToMainline(tree, nodeId);
    if (next === tree) return;
    set(analysisTreeAtom, next);
  }
);
