import { useSetAtom } from "jotai";
import {
  addMovesAction,
  goToLastPositionAction,
  goToMainlineMoveAction,
  goToNextMoveAction,
  goToNodeAction,
  initializeFromPgnAction,
  playMoveAction,
  promoteVariationAction,
  removeNodeAction,
  resetBoardAction,
  setCommentAction,
  undoBoardMoveAction,
} from "@/sections/analysis/actions";
import { useCallback } from "react";

export const useAnalysisActions = () => {
  const initializeFromPgn = useSetAtom(initializeFromPgnAction);
  const goToNode = useSetAtom(goToNodeAction);
  const goToMainlineMove = useSetAtom(goToMainlineMoveAction);
  const resetBoard = useSetAtom(resetBoardAction);
  const undoBoardMove = useSetAtom(undoBoardMoveAction);
  const goToNextMove = useSetAtom(goToNextMoveAction);
  const goToLastPosition = useSetAtom(goToLastPositionAction);
  const playMove = useSetAtom(playMoveAction);
  const addMoves = useSetAtom(addMovesAction);
  const setCommentRaw = useSetAtom(setCommentAction);
  const removeNode = useSetAtom(removeNodeAction);
  const promoteVariation = useSetAtom(promoteVariationAction);

  const setComment = useCallback(
    (nodeId: string, comment: string) => {
      setCommentRaw({ nodeId, comment });
    },
    [setCommentRaw]
  );

  return {
    addMoves,
    goToLastPosition,
    goToMainlineMove,
    goToNextMove,
    goToNode,
    initializeFromPgn,
    playMove,
    promoteVariation,
    removeNode,
    resetBoard,
    setComment,
    undoBoardMove,
  };
};
