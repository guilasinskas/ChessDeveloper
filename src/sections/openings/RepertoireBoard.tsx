import Board from "@/components/board";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Color } from "@/types/enums";
import { Repertoire } from "@/types/openings";
import { Move } from "chess.js";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import {
  repertoireBoardAtom,
  repertoireBoardOrientationAtom,
  trainingActiveAtom,
} from "./states";
import { useTrainingActions } from "./useTrainingActions";
import { playRepertoireMoveAction } from "./actions";

interface Props {
  repertoire: Repertoire;
}

export default function RepertoireBoard({ repertoire }: Props) {
  const screenSize = useScreenSize();
  const orientation = useAtomValue(repertoireBoardOrientationAtom);
  const trainingActive = useAtomValue(trainingActiveAtom);
  const playMove = useSetAtom(playRepertoireMoveAction);
  const { handleTrainingMove } = useTrainingActions();

  const onPlayMove = useCallback(
    (params: { from: string; to: string; promotion?: string }): Move | null => {
      if (trainingActive) {
        return handleTrainingMove(params);
      }
      return playMove(params);
    },
    [trainingActive, handleTrainingMove, playMove]
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
