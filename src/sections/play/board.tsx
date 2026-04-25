import { useAtom, useAtomValue } from "jotai";
import {
  clockBlackAtom,
  clockWhiteAtom,
  engineEloAtom,
  gameAtom,
  isGameInProgressAtom,
  playerColorAtom,
  timeControlAtom,
  gameDataAtom,
  enginePlayNameAtom,
} from "./states";
import { useChessActions } from "@/hooks/useChessActions";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { useEngine } from "@/hooks/useEngine";
import { uciMoveParams } from "@/lib/chess";
import Board from "@/components/board";
import { useGameData } from "@/hooks/useGameData";
import { usePlayersData } from "@/hooks/usePlayersData";
import { sleep } from "@/lib/helpers";
import { formatClkAnnotation } from "./ChessClocks";
import { Color } from "@/types/enums";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const engineName = useAtomValue(enginePlayNameAtom);
  const engine = useEngine(engineName);
  const game = useAtomValue(gameAtom);
  const { white, black } = usePlayersData(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const { playMove } = useChessActions(gameAtom);
  const engineElo = useAtomValue(engineEloAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const timeControl = useAtomValue(timeControlAtom);
  const [clockWhite, setClockWhite] = useAtom(clockWhiteAtom);
  const [clockBlack, setClockBlack] = useAtom(clockBlackAtom);

  // Refs to get current clock values inside callbacks without stale closures
  const clockWhiteRef = useRef(clockWhite);
  clockWhiteRef.current = clockWhite;
  const clockBlackRef = useRef(clockBlack);
  clockBlackRef.current = clockBlack;
  const timeControlRef = useRef(timeControl);
  timeControlRef.current = timeControl;

  const gameFen = game.fen();
  const isGameFinished = game.isGameOver();

  // Human move handler — adds %clk annotation and switches clock
  const onPlayMove = useCallback(
    (params: { from: string; to: string; promotion?: string }) => {
      const tc = timeControlRef.current;
      const isPlayerWhite = playerColor === Color.White;
      let comment: string | undefined;

      if (tc) {
        const mySeconds = isPlayerWhite
          ? clockWhiteRef.current
          : clockBlackRef.current;
        if (mySeconds !== null) comment = formatClkAnnotation(mySeconds);
      }

      const result = playMove({ ...params, comment });

      if (result && tc) {
        const isPlayerWhite = playerColor === Color.White;
        if (isPlayerWhite) {
          setClockWhite((prev) => (prev ?? 0) + tc.increment);
        } else {
          setClockBlack((prev) => (prev ?? 0) + tc.increment);
        }
      }

      return result;
    },
    [playerColor, playMove, setClockWhite, setClockBlack]
  );

  // Engine move handler — also adds %clk and switches clock
  useEffect(() => {
    const playEngineMove = async () => {
      if (
        !engine?.getIsReady() ||
        game.turn() === playerColor ||
        isGameFinished ||
        !isGameInProgress
      ) {
        return;
      }

      const timePromise = sleep(1000);
      const move = await engine.getEngineNextMove(gameFen, engineElo);
      await timePromise;

      if (!move) return;

      const tc = timeControlRef.current;
      const engineIsWhite = playerColor !== Color.White;
      let comment: string | undefined;

      if (tc) {
        const engineSeconds = engineIsWhite
          ? clockWhiteRef.current
          : clockBlackRef.current;
        if (engineSeconds !== null)
          comment = formatClkAnnotation(engineSeconds);
      }

      const result = playMove({ ...uciMoveParams(move), comment });

      if (result && tc) {
        if (engineIsWhite) {
          setClockWhite((prev) => (prev ?? 0) + tc.increment);
        } else {
          setClockBlack((prev) => (prev ?? 0) + tc.increment);
        }
      }
    };

    playEngineMove();

    return () => {
      engine?.stopAllCurrentJobs();
    };
  }, [gameFen, isGameInProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;

    if (window?.innerWidth < 900) {
      return Math.min(width, height - 80);
    }

    return Math.min(width - 230, height * 0.95);
  }, [screenSize]);

  useGameData(gameAtom, gameDataAtom);

  return (
    <Board
      id="PlayBoard"
      canPlay={isGameInProgress ? playerColor : false}
      gameAtom={gameAtom}
      boardSize={boardSize}
      whitePlayer={white}
      blackPlayer={black}
      boardOrientation={playerColor}
      currentPositionAtom={gameDataAtom}
      onPlayMove={onPlayMove}
    />
  );
}
