import Board from "@/components/board";
import { useScreenSize } from "@/hooks/useScreenSize";
import { useRepertoireEngine } from "@/hooks/useRepertoireEngine";
import { UciEngine } from "@/lib/engine/uciEngine";
import { Color } from "@/types/enums";
import { Repertoire } from "@/types/openings";
import { Move } from "chess.js";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef } from "react";
import {
  repertoireBoardAtom,
  repertoireBoardOrientationAtom,
  repertoireCurrentPositionAtom,
  repertoireEngineActiveAtom,
  trainingActiveAtom,
} from "./states";
import {
  playRepertoireMoveAction,
  playTrainingMoveAction,
} from "./actions";

interface Props {
  repertoire: Repertoire;
  engine: UciEngine | null;
}

export default function RepertoireBoard({ repertoire, engine }: Props) {
  const screenSize = useScreenSize();
  const orientation = useAtomValue(repertoireBoardOrientationAtom);
  const trainingActive = useAtomValue(trainingActiveAtom);
  const engineActive = useAtomValue(repertoireEngineActiveAtom);
  const playMove = useSetAtom(playRepertoireMoveAction);
  const playTraining = useSetAtom(playTrainingMoveAction);

  const trainingActiveRef = useRef(trainingActive);
  trainingActiveRef.current = trainingActive;

  useRepertoireEngine(engineActive ? engine : null);

  const onPlayMove = useCallback(
    (params: { from: string; to: string; promotion?: string }): Move | null => {
      if (trainingActiveRef.current) return playTraining(params);
      return playMove(params);
    },
    [playMove, playTraining]
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
      currentPositionAtom={repertoireCurrentPositionAtom}
      showEvaluationBar={engineActive}
      onPlayMove={onPlayMove}
    />
  );
}
