import {
  analysisTreeAtom,
  boardAtom,
  currentAnalysisNodeIdAtom,
} from "@/sections/analysis/states";
import {
  ANALYSIS_ROOT_ID,
  createAnalysisTreeFromGame,
  createOrReuseChildNode,
  getAnalysisChess,
  getLastReachableNodeId,
  getMainlineNodeId,
  getNextNodeId,
  getParentNodeId,
} from "@/lib/analysisTree";
import { uciMoveParams } from "@/lib/chess";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import { Chess, Move } from "chess.js";
import { useAtom } from "jotai";
import { useCallback } from "react";

export const useAnalysisActions = () => {
  const [tree, setTree] = useAtom(analysisTreeAtom);
  const [currentNodeId, setCurrentNodeId] = useAtom(currentAnalysisNodeIdAtom);
  const [, setBoard] = useAtom(boardAtom);

  const syncBoardToNode = useCallback(
    (nextTree: typeof tree, nodeId: string) => {
      setCurrentNodeId(nodeId);
      setBoard(getAnalysisChess(nextTree, nodeId));
    },
    [setBoard, setCurrentNodeId]
  );

  const initializeFromGame = useCallback(
    (game: Chess) => {
      const nextTree = createAnalysisTreeFromGame(game);
      setTree(nextTree);
      syncBoardToNode(nextTree, ANALYSIS_ROOT_ID);
    },
    [setTree, syncBoardToNode]
  );

  const goToNode = useCallback(
    (nodeId: string) => {
      syncBoardToNode(tree, nodeId);
    },
    [syncBoardToNode, tree]
  );

  const goToMainlineMove = useCallback(
    (moveIdx: number) => {
      const nodeId = getMainlineNodeId(tree, moveIdx);
      syncBoardToNode(tree, nodeId);
    },
    [syncBoardToNode, tree]
  );

  const resetBoard = useCallback(() => {
    syncBoardToNode(tree, ANALYSIS_ROOT_ID);
  }, [syncBoardToNode, tree]);

  const undoBoardMove = useCallback(() => {
    const parentId = getParentNodeId(tree, currentNodeId);
    if (parentId === currentNodeId) return;
    syncBoardToNode(tree, parentId);
  }, [currentNodeId, syncBoardToNode, tree]);

  const goToNextMove = useCallback(() => {
    const nextNodeId = getNextNodeId(tree, currentNodeId);
    if (!nextNodeId) return;
    syncBoardToNode(tree, nextNodeId);
  }, [currentNodeId, syncBoardToNode, tree]);

  const goToLastPosition = useCallback(() => {
    const lastNodeId = getLastReachableNodeId(tree, currentNodeId);
    syncBoardToNode(tree, lastNodeId);
  }, [currentNodeId, syncBoardToNode, tree]);

  const playMove = useCallback(
    (params: { from: string; to: string; promotion?: string }): Move | null => {
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

        setTree(nodeResult.tree);
        syncBoardToNode(nodeResult.tree, nodeResult.nodeId);
        playSoundFromMove(result);
        return result;
      } catch {
        playIllegalMoveSound();
        return null;
      }
    },
    [currentNodeId, setTree, syncBoardToNode, tree]
  );

  const addMoves = useCallback(
    (moves: string[]) => {
      let nextTree = tree;
      let nextCurrentNodeId = currentNodeId;
      let game = getAnalysisChess(nextTree, nextCurrentNodeId);
      let lastMove: Move | null = null;

      for (const move of moves) {
        const beforeFen = game.fen();
        lastMove = game.move(uciMoveParams(move));
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
        game = getAnalysisChess(nextTree, nextCurrentNodeId);
      }

      setTree(nextTree);
      syncBoardToNode(nextTree, nextCurrentNodeId);
      if (lastMove) playSoundFromMove(lastMove);
    },
    [currentNodeId, setTree, syncBoardToNode, tree]
  );

  return {
    addMoves,
    goToLastPosition,
    goToMainlineMove,
    goToNextMove,
    goToNode,
    initializeFromGame,
    playMove,
    resetBoard,
    undoBoardMove,
  };
};
