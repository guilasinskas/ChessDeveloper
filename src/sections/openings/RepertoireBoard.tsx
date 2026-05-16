import Board from "@/components/board";
import { LAYOUT, useScreenSize } from "@/hooks/useScreenSize";
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
    const { width, height } = screenSize;

    if (width < LAYOUT.bpSideBySide) {
      const verticalBudget =
        height -
        (width < LAYOUT.bpSidebar ? LAYOUT.navbarHeight : 0) -
        LAYOUT.titleBarHeight -
        2 * LAYOUT.pagePaddingY -
        2 * LAYOUT.playerHeaderHeight -
        2 * LAYOUT.boardRowGap;
      const horizontalBudget =
        width -
        (width < LAYOUT.bpSidebar ? 0 : LAYOUT.sidebarWidth) -
        2 * LAYOUT.pagePaddingX -
        (engineActive ? LAYOUT.evalBarWidth : 0);
      return Math.min(horizontalBudget, verticalBudget);
    }

    const verticalBudget =
      height -
      LAYOUT.titleBarHeight -
      2 * LAYOUT.pagePaddingY -
      2 * LAYOUT.playerHeaderHeight -
      2 * LAYOUT.boardRowGap;
    const horizontalBudget =
      width -
      LAYOUT.sidebarWidth -
      2 * LAYOUT.pagePaddingX -
      LAYOUT.boardPanelGap -
      LAYOUT.panelMinWidth -
      (engineActive ? LAYOUT.evalBarWidth : 0);
    return Math.min(verticalBudget, horizontalBudget);
  }, [engineActive, screenSize]);

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
