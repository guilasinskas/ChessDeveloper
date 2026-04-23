import Board from "@/components/board";
import { useScreenSize } from "@/hooks/useScreenSize";
import {
  addMoveToTree,
  getRepertoireChess,
} from "@/lib/repertoireTree";
import { Color } from "@/types/enums";
import { Repertoire } from "@/types/openings";
import { Move } from "chess.js";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import {
  currentNodeIdAtom,
  repertoireBoardAtom,
  repertoireBoardOrientationAtom,
  repertoireTreeAtom,
  trainingActiveAtom,
} from "./states";
import { useTrainingActions } from "./useTrainingActions";

interface Props {
  repertoire: Repertoire;
  onTreeChange: () => void;
}

export default function RepertoireBoard({ repertoire, onTreeChange }: Props) {
  const screenSize = useScreenSize();
  const setBoard = useSetAtom(repertoireBoardAtom);
  const [tree, setTree] = useAtom(repertoireTreeAtom);
  const [currentNodeId, setCurrentNodeId] = useAtom(currentNodeIdAtom);
  const orientation = useAtomValue(repertoireBoardOrientationAtom);
  const trainingActive = useAtomValue(trainingActiveAtom);
  const { handleTrainingMove } = useTrainingActions();

  useEffect(() => {
    const board = getRepertoireChess(tree, currentNodeId);
    setBoard(board);
  }, [tree, currentNodeId, setBoard]);

  const onPlayMove = useCallback(
    (params: { from: string; to: string; promotion?: string }): Move | null => {
      const board = getRepertoireChess(tree, currentNodeId);
      let result: Move | null = null;
      try {
        result = board.move(params);
      } catch {
        return null;
      }
      if (!result) return null;

      if (trainingActive) {
        handleTrainingMove(result);
        return result;
      }

      const { tree: newTree, nodeId } = addMoveToTree(
        tree,
        currentNodeId,
        result
      );
      setTree(newTree);
      setCurrentNodeId(nodeId);
      onTreeChange();
      return result;
    },
    [
      tree,
      currentNodeId,
      setTree,
      setCurrentNodeId,
      onTreeChange,
      trainingActive,
      handleTrainingMove,
    ]
  );

  const boardSize = useMemo(() => {
    const w = screenSize.width;
    const h = screenSize.height;
    if (typeof window === "undefined") return Math.min(w, h - 80);
    if (window.innerWidth < 900) return Math.min(w, h - 80);
    return Math.min(w * 0.62, h * 0.95, 820);
  }, [screenSize]);

  const playerLabel = useMemo(
    () => ({
      white: {
        name:
          repertoire.color === Color.White
            ? `${repertoire.name} (You)`
            : "Opponent",
      },
      black: {
        name:
          repertoire.color === Color.Black
            ? `${repertoire.name} (You)`
            : "Opponent",
      },
    }),
    [repertoire]
  );

  return (
    <Board
      id="RepertoireBoard"
      canPlay={true}
      gameAtom={repertoireBoardAtom}
      boardSize={boardSize}
      whitePlayer={playerLabel.white}
      blackPlayer={playerLabel.black}
      boardOrientation={orientation}
      onPlayMove={onPlayMove}
    />
  );
}
