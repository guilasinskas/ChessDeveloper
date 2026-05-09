import LoadGameButton from "../../loadGame/loadGameButton";
import { useCallback, useEffect, useMemo } from "react";
import { useChessActions } from "@/hooks/useChessActions";
import {
  boardAtom,
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useAtomValue, useSetAtom } from "jotai";
import { Chess } from "chess.js";
import { useRouter } from "next/router";
import { GameEval } from "@/types/eval";
import { fetchLichessGame } from "@/lib/lichess";
import { useAnalysisActions } from "@/hooks/useAnalysisActions";
import { normalizeCastling, stripPgnVariations } from "@/lib/chess";

export default function LoadGame() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition: resetBoard } = useChessActions(boardAtom);
  const { gameFromUrl } = useGameDatabase();
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const { initializeFromPgn } = useAnalysisActions();

  const joinedGameHistory = useMemo(() => game.history().join(), [game]);

  const resetAndSetGamePgn = useCallback(
    (pgn: string, orientation?: boolean, gameEval?: GameEval) => {
      const mainlinePgn = normalizeCastling(stripPgnVariations(pgn));
      const gameFromPgn = new Chess();
      try {
        gameFromPgn.loadPgn(mainlinePgn);
      } catch {
        return;
      }
      if (
        joinedGameHistory === gameFromPgn.history().join() &&
        joinedGameHistory.length > 0
      ) {
        return;
      }

      setEval(gameEval);
      setGamePgn(mainlinePgn);
      initializeFromPgn(pgn);
      resetBoard(mainlinePgn);
      setBoardOrientation(orientation ?? true);
    },
    [
      initializeFromPgn,
      joinedGameHistory,
      resetBoard,
      setGamePgn,
      setEval,
      setBoardOrientation,
    ]
  );

  const setGameFromDialog = useCallback(
    async (game: Chess, originalPgn?: string) => {
      await router.replace(
        {
          query: {},
          pathname: router.pathname,
        },
        undefined,
        { shallow: true, scroll: false }
      );
      resetAndSetGamePgn(originalPgn ?? game.pgn());
    },
    [router, resetAndSetGamePgn]
  );

  const { lichessGameId, orientation: orientationParam } = router.query;

  useEffect(() => {
    const handleLichess = async (id: string) => {
      const res = await fetchLichessGame(id);
      if (typeof res === "string") {
        resetAndSetGamePgn(res, orientationParam !== "black");
      }
    };

    if (gameFromUrl) {
      const orientation = !(
        gameFromUrl.site === "Chesskit" && gameFromUrl.black.name === "You"
      );
      resetAndSetGamePgn(gameFromUrl.pgn, orientation, gameFromUrl.eval);
    } else if (typeof lichessGameId === "string" && !!lichessGameId) {
      handleLichess(lichessGameId);
    }
  }, [gameFromUrl, lichessGameId, orientationParam, resetAndSetGamePgn]);

  useEffect(() => {
    const pendingPgn = sessionStorage.getItem("pendingOpeningPgn");
    if (pendingPgn) {
      sessionStorage.removeItem("pendingOpeningPgn");
      resetAndSetGamePgn(pendingPgn, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const eventHandler = (event: MessageEvent) => {
      try {
        if (!event?.data?.pgn) return;
        const { pgn, orientation } = event.data as {
          pgn: string;
          orientation?: "white" | "black";
        };
        resetAndSetGamePgn(pgn, orientation !== "black");
      } catch (error) {
        console.error("Error processing message event:", error);
      }
    };
    window.addEventListener("message", eventHandler);

    return () => {
      window.removeEventListener("message", eventHandler);
    };
  }, [resetAndSetGamePgn]);

  const isGameLoaded =
    gameFromUrl !== undefined ||
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;

  if (evaluationProgress) return null;

  return (
    <LoadGameButton
      label={isGameLoaded ? "Load another game" : "Load game"}
      size="small"
      setGame={setGameFromDialog}
    />
  );
}
